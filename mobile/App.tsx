import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/services/authContext';
import { getAppPreferences } from './src/services/appPreferences';

import HomeScreen from './src/screens/HomeScreen';
import PatternLibraryScreen from './src/screens/PatternLibraryScreen';
import ImagePickerScreen from './src/screens/ImagePickerScreen';
import PatternEditorScreen from './src/screens/PatternEditorScreen';
import LoginScreen from './src/screens/LoginScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import TokenPurchaseScreen from './src/screens/TokenPurchaseScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import FAQScreen from './src/screens/FAQScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsWizardScreen from './src/screens/SettingsWizardScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';

export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  ImagePicker: undefined;
  PatternEditor: { patternId: string; pattern?: any };
  Export: { patternId: string };
  Login: undefined;
  Marketplace: undefined;
  TokenPurchase: undefined;
  PatternDetail: { patternId: string };
  Inventory: undefined;
  FAQ: undefined;
  Profile: undefined;
  Settings: undefined;
  Onboarding: undefined;
};

import MuAlinaTabBar from './src/components/MuAlinaTabBar';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="WorkshopTab"
      tabBar={(props) => <MuAlinaTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="WorkshopTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Pracownia',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18 }}>🧵</Text>
          ),
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={PatternLibraryScreen}
        options={{
          tabBarLabel: 'Wzory',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18 }}>📁</Text>
          ),
        }}
      />
      <Tab.Screen
        name="CreateTab"
        component={ImagePickerScreen}
        options={{
          tabBarLabel: 'Nowy',
          tabBarIcon: () => (
            <Text style={{ fontSize: 20 }}>📸</Text>
          ),
        }}
      />
      <Tab.Screen
        name="StashTab"
        component={InventoryScreen}
        options={{
          tabBarLabel: 'Zapas nici',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18 }}>🧶</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceScreen}
        options={{
          tabBarLabel: 'Sklep',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18 }}>🎨</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function SplashGate() {
  const { theme } = useTheme();

  return (
    <View style={[styles.splashContainer, { backgroundColor: theme.background }]}>
      <Image
        source={require('./assets/mualina_logo.png')}
        style={styles.splashLogo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={theme.primary} style={styles.splashSpinner} />
    </View>
  );
}

function MainNavigator() {
  const { theme, themeMode } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('MainTabs');

  useEffect(() => {
    let isMounted = true;

    async function checkPreferences() {
      try {
        const prefs = await getAppPreferences();
        if (isMounted) {
          if (!prefs.hasCompletedOnboarding) {
            setInitialRoute('Onboarding');
          } else {
            setInitialRoute('MainTabs');
          }
        }
      } catch (e) {
        console.warn('Failed to load app preferences for onboarding check:', e);
        if (isMounted) {
          setInitialRoute('MainTabs');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkPreferences();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (isLoading || authLoading) {
    return <SplashGate />;
  }

  const isAuthenticated = Boolean(user && !user.isAnonymous);

  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <StatusBar style={themeMode === 'cozy' ? 'dark' : 'light'} />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: theme.background,
            },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={themeMode === 'cozy' ? 'dark' : 'light'} />
      <Stack.Navigator
        initialRouteName={initialRoute}
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
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        {/* Alias for Home -> MainTabs */}
        <Stack.Screen
          name="Home"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PatternEditor"
          component={PatternEditorScreen}
          options={{ title: 'Tamborek & Edytor', headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Mój Profil & Grywalizacja' }}
        />
        <Stack.Screen
          name="ImagePicker"
          component={ImagePickerScreen}
          options={{ title: 'Nowy Wzór (AI Photo Converter)' }}
        />
        <Stack.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{ title: 'Zapas Nici & Skaner' }}
        />
        <Stack.Screen
          name="Marketplace"
          component={MarketplaceScreen}
          options={{ title: 'Marketplace Wzorów' }}
        />
        <Stack.Screen
          name="TokenPurchase"
          component={TokenPurchaseScreen}
          options={{ title: 'Kup Tokeny' }}
        />
        <Stack.Screen
          name="FAQ"
          component={FAQScreen}
          options={{ title: 'Poradnik & Gesty' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Logowanie Firebase' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsWizardScreen}
          options={{ title: 'Kreator Ustawień Pracowni' }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ title: 'Samouczek & Przewodnik', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <MainNavigator />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 140,
    height: 140,
  },
  splashSpinner: {
    marginTop: 24,
  },
});
