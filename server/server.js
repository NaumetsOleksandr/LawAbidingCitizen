const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request Body:', req.body);
  }
  next();
});

app.use(cors());
app.use(bodyParser.json());

const USERS_FILE = path.join(__dirname, 'users.json');

function logError(error, context = '') {
  console.error(`[ERROR][${new Date().toISOString()}] ${context}:`, error);
}

const readUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '[]');
      return [];
    }
    return JSON.parse(fs.readFileSync(USERS_FILE));
  } catch (error) {
    logError(error, 'readUsers');
    throw error;
  }
};

const writeUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`Users database updated. Total users: ${users.length}`);
  } catch (error) {
    logError(error, 'writeUsers');
    throw error;
  }
};

app.post('/api/register', async (req, res) => {
  console.log('Registration attempt:', req.body.email);
  try {
    const { firstName, lastName, email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const users = readUsers();
    const existingUser = users.find(user => user.email === email);
    
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      password: hashedPassword
    };

    users.push(newUser);
    writeUsers(users);

    console.log('User registered successfully:', email);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    logError(error, 'Registration failed');
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  console.log('Login attempt:', req.body.email);
  try {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      'your_secret_key',
      { expiresIn: '1h' }
    );

    console.log('User logged in successfully:', email);
    res.json({ 
      message: 'Authentication successful',
      token,
      userId: user.id
    });
  } catch (error) {
    logError(error, 'Login failed');
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.post('/api/logout', (req, res) => {
    console.log('Logout attempt for user:', req.body.userId);
    try {
      console.log(`User ${req.body.userId} successfully logged out`);
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      logError(error, 'Logout failed');
      res.status(500).json({ message: 'Logout failed', error: error.message });
    }
  });

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});