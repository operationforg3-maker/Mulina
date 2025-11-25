import React, { Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/services/authContext';
const HomeScreen = React.lazy(() => import('./src/screens/HomeScreen'));
const ApiTestScreen = React.lazy(() => import('./src/screens/ApiTestScreen'));
const ImagePickerScreen = React.lazy(() => import('./src/screens/ImagePickerScreen'));
const PatternEditorScreen = React.lazy(() => import('./src/screens/PatternEditorScreen'));
const LoginScreen = React.lazy(() => import('./src/screens/LoginScreen'));
const MarketplaceScreen = React.lazy(() => import('./src/screens/MarketplaceScreen'));
const TokenPurchaseScreen = React.lazy(() => import('./src/screens/TokenPurchaseScreen'));
const InventoryScreen = React.lazy(() => import('./src/screens/InventoryScreen'));
const FAQScreen = React.lazy(() => import('./src/screens/FAQScreen'));

// Screens (TODO: Create these)
// import ExportScreen from './src/screens/ExportScreen';

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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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

  export default function App() {
    function LoadingScreen() {
      return (
        <React.Fragment>
          <StatusBar style="auto" />
          <div style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <span style={{ fontSize: 24, color: '#6366f1' }}>Ładowanie…</span>
          </div>
        </React.Fragment>
      );
    }
    return (
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Suspense fallback={<LoadingScreen />}> 
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
                component={PatternEditorScreen}
                options={{ title: 'Edytor wzoru' }}
              />
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ title: 'Logowanie' }}
              />
              <Stack.Screen 
                name="Marketplace" 
                component={MarketplaceScreen}
                options={{ title: 'Marketplace' }}
              />
              <Stack.Screen 
                name="TokenPurchase" 
                component={TokenPurchaseScreen}
                options={{ title: 'Buy Tokens' }}
              />
              <Stack.Screen 
                name="PatternDetail" 
                component={PlaceholderScreen}
                options={{ title: 'Pattern Details' }}
              />
              <Stack.Screen 
                name="Export" 
                component={PlaceholderScreen}
                options={{ title: 'Export Pattern' }}
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
            </Stack.Navigator>
          </Suspense>
        </NavigationContainer>
      </AuthProvider>
    );
  }

