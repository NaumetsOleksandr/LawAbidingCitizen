import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import AuthScreen from './screens/AuthScreen';
import Calendar from './screens/Kalendar/Calendar';
import ProfileScreen from './screens/ProfileScreen';
import ViolationsScreen from './screens/ViolationsScreen';

const API_URL = 'http://192.168.1.108:5000/api';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Calendar') {
          iconName = 'calendar-today';
        } else if (route.name === 'Profile') {
          iconName = 'person';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#6200ee',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Calendar" component={Calendar} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const MainDrawer = () => (
  <Drawer.Navigator>
    <Drawer.Screen name="Main" component={MainTabs} />
    <Tab.Screen name="Calendar" component={Calendar} />
  </Drawer.Navigator>
);

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setIsAuth(!!token);
      setIsReady(true);
    };
    checkAuth();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuth ? (
          <Stack.Screen 
            name="MainDrawer" 
            component={MainDrawer} 
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
            options={{ headerShown: false }}
          />
        )}
        <Stack.Screen 
            name="MainDrawer2" 
            component={MainDrawer} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Auth2" 
            component={AuthScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Violations" 
            component={ViolationsScreen} 
          />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});