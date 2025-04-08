const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const storage = require('./storage');

module.exports = {
  async register(req, res) {
    try {
      const { firstName, lastName, email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
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
      
      await storage.saveUser(newUser);
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Registration failed', error });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication failed' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Authentication failed' });
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        'your_secret_key',
        { expiresIn: '1h' }
      );
      
      res.status(200).json({ 
        message: 'Authentication successful',
        token,
        userId: user.id
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed', error });
    }
  }
};