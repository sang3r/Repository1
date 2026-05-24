import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyPair } from './crypto';

const KEY_PAIR_KEY = 'e2ee_keypair';
const USERNAME_KEY = 'username';

export async function saveKeyPair(kp: KeyPair): Promise<void> {
  await AsyncStorage.setItem(KEY_PAIR_KEY, JSON.stringify(kp));
}

export async function loadKeyPair(): Promise<KeyPair | null> {
  const raw = await AsyncStorage.getItem(KEY_PAIR_KEY);
  return raw ? (JSON.parse(raw) as KeyPair) : null;
}

export async function saveUsername(username: string): Promise<void> {
  await AsyncStorage.setItem(USERNAME_KEY, username);
}

export async function loadUsername(): Promise<string | null> {
  return AsyncStorage.getItem(USERNAME_KEY);
}
