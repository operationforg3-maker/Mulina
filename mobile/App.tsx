import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import ApiTestScreen from './src/screens/ApiTestScreen';
import ImagePickerScreen from './src/screens/ImagePickerScreen';

// Screens (TODO: Create these)
// import PatternEditorScreen from './src/screens/PatternEditorScreen';
// import ExportScreen from './src/screens/ExportScreen';

const Stack = createNativeStackNavigator();

// Placeholder screens
const PlaceholderScreen = ({ route }: any) => {
  const { Text, View, StyleSheet } = require('react-native');
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {route.name || 'Screen'} - Coming Soon
      </Text>
    </View>
  );
};

const styles = require('react-native').StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ImagePicker" 
          component={ImagePickerScreen}
          options={{ title: 'Nowy wzór' }}
        />
        <Stack.Screen 
          name="ApiTest" 
          component={ApiTestScreen}
          options={{ title: 'API Test' }}
        />
        <Stack.Screen 
          name="PatternEditor" 
          component={PlaceholderScreen}
          options={{ title: 'Edit Pattern' }}
        />
        <Stack.Screen 
          name="Export" 
          component={PlaceholderScreen}
          options={{ title: 'Export Pattern' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
