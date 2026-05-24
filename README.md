# SecureChat — End-to-End Encrypted Chat App

A mobile chat app with true end-to-end encryption (E2EE). Messages are encrypted on the sender's device using X25519 key exchange and XSalsa20-Poly1305 (via [TweetNaCl](https://tweetnacl.js.org/)). The server never sees plaintext.

## How E2EE Works

```
Client A                     Server                    Client B
   |                           |                          |
   |-- POST /register -------->|                          |
   |   (username, publicKey)   |<-- POST /register -------|
   |                           |    (username, publicKey)  |
   |-- GET /users/B/key ------>|                          |
   |<-- { publicKey }          |                          |
   |                           |                          |
   | encrypt(msg,              |                          |
   |   B.pubKey, A.secKey)     |                          |
   |-- WS: send ciphertext --->|--- relay ciphertext ---->|
   |                           |   decrypt(cipher,        |
   |                           |     A.pubKey, B.secKey)  |
```

- **Key exchange**: X25519 Diffie-Hellman (`nacl.box.keyPair()`)
- **Encryption**: XSalsa20-Poly1305 authenticated encryption (`nacl.box()`)
- **Private keys**: Generated on-device, stored in AsyncStorage, never sent to server

## Project Structure

```
├── backend/
│   ├── server.js          # Express + WebSocket relay server
│   └── package.json
└── mobile/
    ├── App.tsx            # Navigation root
    └── src/
        ├── context/
        │   └── AppContext.tsx   # Global state + E2EE orchestration
        ├── utils/
        │   ├── crypto.ts        # TweetNaCl encrypt/decrypt helpers
        │   └── storage.ts       # AsyncStorage for keypair + username
        ├── services/
        │   ├── api.ts           # REST calls (register, fetch public keys)
        │   └── socket.ts        # WebSocket client (message relay)
        └── screens/
            ├── LoginScreen.tsx
            ├── ChatListScreen.tsx
            └── ChatScreen.tsx
```

## Quick Start

### 1. Run the backend

```bash
cd backend
npm install
node server.js
# Listening on http://localhost:3000
```

### 2. Run the mobile app

```bash
cd mobile
npm install
# Create .env with your machine's LAN IP (not localhost — physical devices can't reach it)
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_WS_URL
npx expo start
```

Scan the QR code with **Expo Go** on iOS or Android.

> Use your LAN IP (e.g. `192.168.1.10`), not `localhost`, when testing on a physical device.

## Production Checklist

- Replace in-memory user store with a database (PostgreSQL + Redis)
- Add authentication (JWT / OAuth) — currently any username can be claimed
- Use HTTPS/WSS in production
- Persist message history on-device with SQLite (via expo-sqlite)
- Implement [Signal Protocol](https://signal.org/docs/) (Double Ratchet) for forward secrecy
- Add push notifications (Expo Push Notifications)
