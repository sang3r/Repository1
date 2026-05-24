import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useApp } from '../context/AppContext';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a username.');
      return;
    }
    setLoading(true);
    try {
      await login(trimmed);
      navigation.replace('ChatList');
    } catch {
      Alert.alert('Connection failed', 'Could not reach the server. Check your .env URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.lock}>🔒</Text>
        <Text style={styles.title}>SecureChat</Text>
        <Text style={styles.subtitle}>End-to-end encrypted messaging</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Choose a username"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={handleLogin}
          editable={!loading}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Connect</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        A keypair is generated once and stored on your device.{' '}\nYour private key never leaves this device.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f0f1a' },
  hero: { alignItems: 'center', marginBottom: 40 },
  lock: { fontSize: 52 },
  title: { fontSize: 34, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  card: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 24, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: '#2a2a3e', borderRadius: 10, padding: 14, fontSize: 16, color: '#fff', marginBottom: 16 },
  button: { backgroundColor: '#4c6ef5', borderRadius: 10, padding: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { textAlign: 'center', color: '#555', fontSize: 12, lineHeight: 18 },
});
