import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import LoginScreen from './src/screens/LoginScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';

export type RootStackParamList = {
  Login: undefined;
  ChatList: undefined;
  Chat: { recipient: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerStyle: { backgroundColor: '#1a1a2e' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'SecureChat', headerShown: false }} />
          <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Chats', headerBackVisible: false }} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({ title: route.params.recipient })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
