import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.108:5000/api';
const VIOLATIONS_KEY = '@violations';

export default {
  async createViolation(violationData) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      const response = await fetch(`${API_URL}/violations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...violationData,
          userId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create violation');
      }

      const violations = await this.getLocalViolations();
      violations.push(data);
      await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(violations));
      
      return data;
    } catch (error) {
      const localViolation = {
        ...violationData,
        id: Date.now().toString(),
        userId: await AsyncStorage.getItem('userId'),
        date: new Date().toISOString(),
        synced: false
      };
      
      const violations = await this.getLocalViolations();
      violations.push(localViolation);
      await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(violations));
      
      throw error;
    }
  },

  async getViolations() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      const response = await fetch(`${API_URL}/violations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const serverViolations = await response.json();
        await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(serverViolations));
        return serverViolations;
      }

      return await this.getLocalViolations(userId);
    } catch (error) {
      return await this.getLocalViolations();
    }
  },

  async deleteViolation(id) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      await fetch(`${API_URL}/violations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const violations = await this.getLocalViolations();
      const updatedViolations = violations.filter(v => v.id !== id);
      await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(updatedViolations));
      
      return true;
    } catch (error) {
      const violations = await this.getLocalViolations();
      const updatedViolations = violations.filter(v => v.id !== id);
      await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(updatedViolations));
      
      throw error;
    }
  },

  async getLocalViolations(userId = null) {
    const violationsJson = await AsyncStorage.getItem(VIOLATIONS_KEY);
    const violations = violationsJson ? JSON.parse(violationsJson) : [];
    
    if (userId) {
      return violations.filter(v => v.userId === userId);
    }
    return violations;
  }
};