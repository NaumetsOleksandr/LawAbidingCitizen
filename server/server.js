const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const USERS_FILE = path.join(__dirname, 'users.json');
const VIOLATIONS_FILE = path.join(__dirname, 'violations.json');
const SECRET_KEY = 'your_secret_key';

const logError = (error, context = '') => {
  console.error(`[ERROR][${new Date().toISOString()}] ${context}:`, error);
};

const readData = (file) => {
  try {
    if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
    return JSON.parse(fs.readFileSync(file));
  } catch (error) {
    logError(error, `readData ${file}`);
    return [];
  }
};

const writeData = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (error) {
    logError(error, `writeData ${file}`);
  }
};

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const users = readData(USERS_FILE);
    const existingUser = users.find(user => user.email === email);
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      password: hashedPassword
    };

    users.push(newUser);
    writeData(USERS_FILE, users);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readData(USERS_FILE);
    const user = users.find(u => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Authentication successful',
      token,
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.get('/api/users/:id', authenticate, (req, res) => {
  try {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const { password, ...userData } = user;
    res.json(userData);
    
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
});

app.post('/api/violations', authenticate, (req, res) => {
  try {
    const { description, image, date, latitude, longitude } = req.body;

    if (!description || !image || !latitude || !longitude) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const violations = readData(VIOLATIONS_FILE);
    const newViolation = {
      id: Date.now().toString(),
      description,
      image,
      date: date || new Date().toISOString(),
      latitude,
      longitude,
      createdAt: new Date().toISOString()
    };

    violations.push(newViolation);
    writeData(VIOLATIONS_FILE, violations);

    res.status(201).json(newViolation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create violation', error: error.message });
  }
});

app.get('/api/violations', authenticate, (req, res) => {
  try {
    const { date } = req.query;
    let violations = readData(VIOLATIONS_FILE);

    if (date) {
      violations = violations.filter(v => v.date.startsWith(date));
    }

    res.json(Array.isArray(violations) ? violations : []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get violations', error: error.message });
  }
});

app.get('/api/violations/dates', authenticate, (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: 'Month and year are required' });

    const violations = readData(VIOLATIONS_FILE);
    const filteredViolations = violations.filter(v => 
      new Date(v.date).getMonth() === parseInt(month) - 1 &&
      new Date(v.date).getFullYear() === parseInt(year)
    );

    const dates = [...new Set(filteredViolations.map(v => v.date.split('T')[0]))];
    res.json(dates);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get violation dates', error: error.message });
  }
});

app.get('/api/violations/:id', authenticate, (req, res) => {
  try {
    const violations = readData(VIOLATIONS_FILE);
    const violation = violations.find(v => v.id === req.params.id);
    if (!violation) return res.status(404).json({ message: 'Violation not found' });
    res.json(violation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get violation', error: error.message });
  }
});

app.delete('/api/violations/:id', authenticate, (req, res) => {
  try {
    const violations = readData(VIOLATIONS_FILE);
    const updated = violations.filter(v => v.id !== req.params.id);
    writeData(VIOLATIONS_FILE, updated);
    res.json({ message: 'Violation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete violation', error: error.message });
  }
});

app.get('/api/violations/stats', authenticate, (req, res) => {
  try {
    const violations = readData(VIOLATIONS_FILE);
    const stats = {
      total: violations.length,
      lastMonth: violations.filter(v =>
        new Date(v.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      byMonth: {}
    };

    violations.forEach(v => {
      const d = new Date(v.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      stats.byMonth[key] = (stats.byMonth[key] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stats', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  [USERS_FILE, VIOLATIONS_FILE].forEach(file => {
    if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
  });
});
