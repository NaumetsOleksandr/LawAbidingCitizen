import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.108:5000/api';

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const authHandler = async () => {
    if (!email || !password) {
      Alert.alert('Помилка', 'Електронна пошта та пароль обов\'язкові');
      return;
    }

    if (!isLogin && (!firstName || !lastName)) {
      Alert.alert('Помилка', 'Ім\'я та прізвище обов\'язкові');
      return;
    }

    setIsLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });
      } else {
        response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            password,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Помилка автентифікації');
      }

      if (isLogin) {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userId', data.userId);
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainDrawer2' }],
        });
      } else {
        Alert.alert('Успіх', 'Реєстрація успішна. Будь ласка, увійдіть.');
        setIsLogin(true);
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Помилка', error.message || 'Помилка автентифікації');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Обробка вашого запиту...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Вхід' : 'Реєстрація'}</Text>
      
      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Ім'я"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Прізвище"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Електронна пошта"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <View style={styles.buttonContainer}>
        <Button
          title={isLogin ? 'Увійти' : 'Зареєструватися'}
          onPress={authHandler}
          disabled={isLoading}
        />
      </View>
      
      <View style={styles.switchContainer}>
        <Button
          title={isLogin ? 'Немає акаунта? Зареєструватися' : 'Вже є акаунт? Увійти'}
          onPress={() => setIsLogin(prev => !prev)}
          color="#666"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 5,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 10,
  },
  switchContainer: {
    marginTop: 20,
  },
});

export default AuthScreen;