import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { generateKeyPair, encryptMessage, decryptMessage, KeyPair } from '../utils/crypto';
import { saveKeyPair, loadKeyPair, saveUsername } from '../utils/storage';
import { registerUser, getUserPublicKey } from '../services/api';
import { socketService } from '../services/socket';

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: number;
  mine: boolean;
}

interface AppContextValue {
  username: string | null;
  keyPair: KeyPair | null;
  messages: Record<string, Message[]>;
  login: (username: string) => Promise<void>;
  sendMessage: (to: string, text: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const publicKeyCache = useRef<Record<string, string>>({});

  const addMessage = useCallback((conversationWith: string, msg: Message) => {
    setMessages(prev => ({
      ...prev,
      [conversationWith]: [...(prev[conversationWith] ?? []), msg],
    }));
  }, []);

  const getPublicKey = useCallback(async (user: string): Promise<string> => {
    if (publicKeyCache.current[user]) return publicKeyCache.current[user];
    const key = await getUserPublicKey(user);
    publicKeyCache.current[user] = key;
    return key;
  }, []);

  // Single global listener — decrypts and stores all incoming messages
  useEffect(() => {
    if (!username || !keyPair) return;
    return socketService.onMessage(async (from, payload, id, timestamp) => {
      try {
        const theirPublicKey = await getPublicKey(from);
        const text = decryptMessage(payload, theirPublicKey, keyPair.secretKey);
        if (text === null) return; // authentication failure — discard
        addMessage(from, { id, from, to: username, text, timestamp, mine: false });
      } catch {
        // swallow unknown senders
      }
    });
  }, [username, keyPair, getPublicKey, addMessage]);

  const login = useCallback(async (uname: string) => {
    let kp = await loadKeyPair();
    if (!kp) {
      kp = generateKeyPair();
      await saveKeyPair(kp);
    }
    await registerUser(uname, kp.publicKey);
    await socketService.connect(uname);
    await saveUsername(uname);
    setUsername(uname);
    setKeyPair(kp);
  }, []);

  const sendMessage = useCallback(async (to: string, text: string) => {
    if (!keyPair || !username) throw new Error('Not logged in');
    const theirPublicKey = await getPublicKey(to);
    const payload = encryptMessage(text, theirPublicKey, keyPair.secretKey);
    socketService.send(to, payload);
    addMessage(to, {
      id: `${Date.now()}-${Math.random()}`,
      from: username,
      to,
      text,
      timestamp: Date.now(),
      mine: true,
    });
  }, [keyPair, username, getPublicKey, addMessage]);

  return (
    <AppContext.Provider value={{ username, keyPair, messages, login, sendMessage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
