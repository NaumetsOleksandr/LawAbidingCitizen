import React from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import authService from '../services/authService';

const HomeScreen = ({ navigation, route }) => {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const userEmail = route.params?.email || 'User';

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log(`Starting logout for ${userEmail}`);
      
      await authService.logout();
      console.log('Client logout successful');
    
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
      
      console.log(`User ${userEmail} logged out successfully`);
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        { 
          text: 'Logout', 
          onPress: handleLogout,
          style: 'destructive'
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome, {userEmail}!</Text>
      
      {isLoggingOut ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff4444" />
          <Text style={styles.loggingOutText}>Logging out...</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <Button
            title="Logout"
            onPress={confirmLogout}
            color="#ff4444"
            disabled={isLoggingOut}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  buttonContainer: {
    width: '80%',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loggingOutText: {
    marginTop: 10,
    color: '#666',
  },
});

export default HomeScreen;
