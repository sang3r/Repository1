const express = require('express');
const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// In-memory store — replace with a DB for production
// { username -> { publicKey: string, ws: WebSocket | null } }
const users = new Map();

// Register or update a user's public key
app.post('/register', (req, res) => {
  const { username, publicKey } = req.body;
  if (!username || !publicKey) {
    return res.status(400).json({ error: 'username and publicKey required' });
  }
  const existing = users.get(username) || {};
  users.set(username, { ...existing, publicKey });
  res.json({ ok: true });
});

// Fetch a user's public key (used by clients to derive shared secret)
app.get('/users/:username/key', (req, res) => {
  const user = users.get(req.params.username);
  if (!user || !user.publicKey) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ publicKey: user.publicKey });
});

// List currently connected users
app.get('/users', (req, res) => {
  const online = [];
  users.forEach((user, username) => {
    if (user.ws && user.ws.readyState === 1 /* OPEN */) {
      online.push(username);
    }
  });
  res.json({ users: online });
});

// WebSocket: real-time encrypted message relay
wss.on('connection', (ws) => {
  let currentUser = null;

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case 'auth': {
        // { type: 'auth', username: string }
        currentUser = msg.username;
        const existing = users.get(currentUser) || {};
        users.set(currentUser, { ...existing, ws });
        ws.send(JSON.stringify({ type: 'auth_ok' }));
        break;
      }

      case 'message': {
        // { type: 'message', to: string, payload: string /* encrypted base64 */ }
        if (!currentUser) return;
        const recipient = users.get(msg.to);
        if (recipient && recipient.ws && recipient.ws.readyState === 1) {
          recipient.ws.send(JSON.stringify({
            type: 'message',
            from: currentUser,
            payload: msg.payload, // opaque ciphertext — server never decrypts
            id: uuidv4(),
            timestamp: Date.now(),
          }));
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (currentUser) {
      const user = users.get(currentUser);
      if (user) users.set(currentUser, { ...user, ws: null });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`SecureChat backend listening on port ${PORT}`));
