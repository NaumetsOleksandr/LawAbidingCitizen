import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.108:5000/api';

const logError = (error, context = '') => {
  console.error(`[AUTH SERVICE ERROR] ${context}:`, error);
  return error;
};

export default {
  async register(firstName, lastName, email, password) {
    try {
      console.log(`Attempting to register user: ${email}`);
      
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      console.log(`User ${email} registered successfully`);
      return data;
    } catch (error) {
      throw logError(error, 'Registration');
    }
  },

  async login(email, password) {
    try {
      console.log(`Attempting login for: ${email}`);
      
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userEmail', email);
      
      console.log(`User ${email} logged in successfully`);
      return data;
    } catch (error) {
      throw logError(error, 'Login');
    }
  },

  async logout() {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      console.log(`Logging out: ${email}`);

      await AsyncStorage.removeItem('userToken');
      
      console.log(`Token removed for: ${email}`);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  async getToken() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return token;
    } catch (error) {
      throw logError(error, 'Get Token');
    }
  },

  async getUserEmail() {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      return email;
    } catch (error) {
      throw logError(error, 'Get User Email');
    }
  },

  async isLoggedIn() {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      throw logError(error, 'Check Login Status');
    }
  },
};