import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const API_URL = 'http://192.168.1.108:5000/api';
const VIOLATIONS_KEY = '@violations';
const UNSYNCED_VIOLATIONS_KEY = '@unsynced_violations';

export default {
  async initialize() {
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        await this.syncUnsyncedViolations();
      }
    } catch (error) {
      console.error('Initialization error:', error);
    }
  },

  async createViolation(violationData) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      const state = await NetInfo.fetch();

      const localId = `local_${Date.now()}`;
      const violationWithId = {
        ...violationData,
        localId,
        userId,
        synced: false,
        createdAt: new Date().toISOString()
      };

      const violations = await this.getLocalViolations();
      violations.push(violationWithId);
      await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(violations));

      const unsyncedViolations = await this.getUnsyncedViolations();
      unsyncedViolations.push(violationWithId);
      await AsyncStorage.setItem(UNSYNCED_VIOLATIONS_KEY, JSON.stringify(unsyncedViolations));

      if (state.isConnected) {
        await this.syncUnsyncedViolations();
      }

      return violationWithId;
    } catch (error) {
      console.error('Create violation error:', error);
      throw error;
    }
  },

  async syncUnsyncedViolations() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const unsyncedViolations = await this.getUnsyncedViolations();
      
      if (unsyncedViolations.length === 0) return [];

      const response = await fetch(`${API_URL}/violations/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ violations: unsyncedViolations })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { results } = await response.json();
      const successfulSyncs = results.filter(r => r.status === 'success');

      if (successfulSyncs.length > 0) {
        const violations = await this.getLocalViolations();
        const updatedViolations = violations.map(v => {
          const syncResult = successfulSyncs.find(r => r.localId === v.localId);
          if (syncResult) {
            return { ...v, id: syncResult.serverId, synced: true };
          }
          return v;
        });

        await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(updatedViolations));

        const remainingUnsynced = unsyncedViolations.filter(
          v => !successfulSyncs.some(s => s.localId === v.localId)
        );
        await AsyncStorage.setItem(UNSYNCED_VIOLATIONS_KEY, JSON.stringify(remainingUnsynced));
      }

      return results;
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  },

  async getViolations(date = null, userId = null) {
    try {
      const state = await NetInfo.fetch();
      
      if (state.isConnected) {
        try {
          const token = await AsyncStorage.getItem('userToken');
          const response = await fetch(
            `${API_URL}/violations?${date ? `date=${date}&` : ''}${userId ? `userId=${userId}` : ''}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (response.ok) {
            const serverViolations = await response.json();
            await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(serverViolations));
            return serverViolations;
          }
        } catch (error) {
          console.warn('Failed to fetch from server:', error);
        }
      }

      const localViolations = await this.getLocalViolations();
      return date 
        ? localViolations.filter(v => v.date.startsWith(date))
        : localViolations;
    } catch (error) {
      console.error('Get violations error:', error);
      return [];
    }
  },

  async deleteViolation(id) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const state = await NetInfo.fetch();

      if (state.isConnected) {
        await fetch(`${API_URL}/violations/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      const violations = await this.getLocalViolations();
      const updatedViolations = violations.filter(v => v.id !== id);
      await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(updatedViolations));

      const unsyncedViolations = await this.getUnsyncedViolations();
      const updatedUnsynced = unsyncedViolations.filter(v => v.id !== id);
      await AsyncStorage.setItem(UNSYNCED_VIOLATIONS_KEY, JSON.stringify(updatedUnsynced));

      return true;
    } catch (error) {
      console.error('Delete violation error:', error);
      throw error;
    }
  },

  async getLocalViolations() {
    try {
      const violationsJson = await AsyncStorage.getItem(VIOLATIONS_KEY);
      return violationsJson ? JSON.parse(violationsJson) : [];
    } catch (error) {
      console.error('Get local violations error:', error);
      return [];
    }
  },

  async getUnsyncedViolations() {
    try {
      const violationsJson = await AsyncStorage.getItem(UNSYNCED_VIOLATIONS_KEY);
      return violationsJson ? JSON.parse(violationsJson) : [];
    } catch (error) {
      console.error('Get unsynced violations error:', error);
      return [];
    }
  },

  setupNetworkListener() {
    return NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.syncUnsyncedViolations().catch(error => {
          console.error('Auto-sync error:', error);
        });
      }
    });
  }
};