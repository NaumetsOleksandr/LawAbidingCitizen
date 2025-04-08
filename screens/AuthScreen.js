import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import authService from '../services/authService';

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const authHandler = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    if (!isLogin && (!firstName || !lastName)) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        console.log('Attempting login with:', { email, password });
        const response = await authService.login(email, password);
        console.log('Login response:', response);
        
        navigation.navigate('Home');
      } else {
        console.log('Attempting registration with:', { firstName, lastName, email, password });
        const response = await authService.register(firstName, lastName, email, password);
        console.log('Registration response:', response);
        
        Alert.alert('Success', 'Registration successful. Please login.');
        setIsLogin(true);
        setFirstName('');
        setLastName('');
      }

      setPassword('');
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Processing your request...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      
      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCompleteType="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCompleteType="password"
      />
      
      <View style={styles.buttonContainer}>
        <Button
          title={isLogin ? 'Login' : 'Sign Up'}
          onPress={authHandler}
          disabled={isLoading}
        />
      </View>
      
      <View style={styles.switchContainer}>
        <Button
          title={`Switch to ${isLogin ? 'Sign Up' : 'Login'}`}
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