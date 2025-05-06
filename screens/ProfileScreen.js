import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const API_URL = 'http://192.168.1.108:5000/api';

const ProfileScreen = () => {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userId = await AsyncStorage.getItem('userId');
        const email = await AsyncStorage.getItem('userEmail');
        const firstName = await AsyncStorage.getItem('userFirstName');
        const lastName = await AsyncStorage.getItem('userLastName');
        
        if (email && firstName && lastName) {
          setUserData({ firstName, lastName, email });
          setIsLoading(false);
          return;
        }
  
        const response = await fetch(`${API_URL}/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        console.log('Response status:', response.status);
        console.log('Response headers:', JSON.stringify(response.headers));
        const responseText = await response.text();
        console.log('Response text:', responseText);
  
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Сервер повернув не JSON відповідь');
        }
  
        const data = JSON.parse(responseText);
        
        if (!response.ok) {
          throw new Error(data.message || 'Помилка отримання даних');
        }
  
        setUserData({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        });
  
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Помилка', 'Не вдалося завантажити дані користувача');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userId', 'userEmail', 'userFirstName', 'userLastName']);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth2' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Помилка', 'Не вдалося вийти з акаунту');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Завантаження...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileInfo}>
        <Text style={styles.label}>Ім'я:</Text>
        <Text style={styles.value}>{userData.firstName}</Text>
        
        <Text style={styles.label}>Прізвище:</Text>
        <Text style={styles.value}>{userData.lastName}</Text>
        
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{userData.email}</Text>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color="white" style={styles.logoutIcon} />
        <Text style={styles.logoutButtonText}>Вийти</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  profileInfo: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#333',
  },
  value: {
    fontSize: 18,
    marginTop: 5,
    color: '#555',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;