// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Import des screens
import Activities from './Activities';
import Appointments from './Appointments';
import BabyDevelopment from './BabyDevelopment';
import BabyTracking from './BabyTracking';
import Community from './Community';
import Home from './home';
import Journal from './Journal';
import MyHealth from './MyHealth';

const Stack = createNativeStackNavigator();

export default function App() {
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
