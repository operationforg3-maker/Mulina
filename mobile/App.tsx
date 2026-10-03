import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/services/authContext';

import HomeScreen from './src/screens/HomeScreen';
import ApiTestScreen from './src/screens/ApiTestScreen';
import ImagePickerScreen from './src/screens/ImagePickerScreen';
import PatternEditorScreen from './src/screens/PatternEditorScreen';
import LoginScreen from './src/screens/LoginScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import TokenPurchaseScreen from './src/screens/TokenPurchaseScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import FAQScreen from './src/screens/FAQScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

export type RootStackParamList = {
  Home: undefined;
  ImagePicker: undefined;
  ApiTest: undefined;
  PatternEditor: { patternId: string; pattern?: any };
  Export: { patternId: string };
  Login: undefined;
  Marketplace: undefined;
  TokenPurchase: undefined;
  PatternDetail: { patternId: string };
  Inventory: undefined;
  FAQ: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Placeholder screens
const PlaceholderScreen = ({ route }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {route?.name || 'Screen'} - Wkrótce dostępne
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    color: '#6366f1',
    fontWeight: 'bold',
  },
});

function MainNavigator() {
  const { theme, themeMode } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar style={themeMode === 'cozy' ? 'dark' : 'light'} />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: theme.background,
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
            options={{ title: 'API & Firebase Test' }}
          />
          <Stack.Screen 
            name="PatternEditor" 
            component={PatternEditorScreen}
            options={{ title: 'Edytor wzoru' }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ title: 'Logowanie Firebase' }}
          />
          <Stack.Screen 
            name="Marketplace" 
            component={MarketplaceScreen}
            options={{ title: 'Marketplace' }}
          />
          <Stack.Screen 
            name="TokenPurchase" 
            component={TokenPurchaseScreen}
            options={{ title: 'Kup Tokeny' }}
          />
          <Stack.Screen 
            name="PatternDetail" 
            component={PlaceholderScreen}
            options={{ title: 'Szczegóły wzoru' }}
          />
          <Stack.Screen 
            name="Export" 
            component={PlaceholderScreen}
            options={{ title: 'Eksport wzoru' }}
          />
          <Stack.Screen 
            name="Inventory" 
            component={InventoryScreen}
            options={{ title: 'Inwentarz nici' }}
          />
          <Stack.Screen 
            name="FAQ" 
            component={FAQScreen}
            options={{ title: 'FAQ' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: 'Mój Profil & Postępy' }}
          />
        </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
