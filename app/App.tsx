import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import '../i18n';
import { loadSavedLanguage } from '../i18n';

import Activities from './Activities';
import Appointments from './Appointments';
import BabyDevelopment from './BabyDevelopment';
import BabyTracking from './BabyTracking';
import Community from './Community';
import Home from './home';
import Journal from './Journal';
import MyHealth from './MyHealth';
import Profile from './Profile';
import ShoppingList from './ShoppingList';
import WeightTracking from './WeightTracking';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="BabyTracking" component={BabyTracking} />
        <Stack.Screen name="MyHealth" component={MyHealth} />
        <Stack.Screen name="Appointments" component={Appointments} />
        <Stack.Screen name="Activities" component={Activities} />
        <Stack.Screen name="Journal" component={Journal} />
        <Stack.Screen name="Community" component={Community} />
        <Stack.Screen name="BabyDevelopment" component={BabyDevelopment} />
        <Stack.Screen name="WeightTracking" component={WeightTracking} />
        <Stack.Screen name="ShoppingList" component={ShoppingList} />
        <Stack.Screen name="Profile" component={Profile} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}