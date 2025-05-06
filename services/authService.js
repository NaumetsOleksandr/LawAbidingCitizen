import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.108:5000/api';

const logError = (error, context = '') => {
  console.error(`[AUTH SERVICE ERROR] ${context}:`, error);
  return error;
};

export default {
  async register(firstName, lastName, email, password) {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      throw logError(error, 'Registration');
    }
  },

  async login(email, password) {
    try {
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
      await AsyncStorage.setItem('userId', data.userId);
      await AsyncStorage.setItem('userEmail', data.email);
      await AsyncStorage.setItem('userFirstName', data.firstName);
      await AsyncStorage.setItem('userLastName', data.lastName);
      
      return data;
    } catch (error) {
      throw logError(error, 'Login');
    }
  },

  async logout() {
    try {
      const token = await this.getToken();
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      await AsyncStorage.multiRemove([
        'userToken',
        'userId',
        'userEmail',
        'userFirstName',
        'userLastName'
      ]);
      
      return true;
    } catch (error) {
      throw logError(error, 'Logout');
    }
  },

  async getToken() {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      throw logError(error, 'Get Token');
    }
  },

  async getUserInfo() {
    try {
      const [userId, email, firstName, lastName] = await AsyncStorage.multiGet([
        'userId', 'userEmail', 'userFirstName', 'userLastName'
      ]);

      return {
        userId: userId[1],
        email: email[1],
        firstName: firstName[1],
        lastName: lastName[1]
      };
    } catch (error) {
      throw logError(error, 'Get User Info');
    }
  },

  async isLoggedIn() {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      throw logError(error, 'Check Login Status');
    }
  }
};