type MessageHandler = (from: string, payload: string, id: string, timestamp: number) => void;

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:3000';

class SocketService {
  private ws: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private username: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(username: string): Promise<void> {
    this.username = username;
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      this.ws = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', username }));
      };

      ws.onmessage = (event) => {
        let msg: any;
        try { msg = JSON.parse(event.data); } catch { return; }
        if (msg.type === 'auth_ok') {
          resolve();
        } else if (msg.type === 'message') {
          this.handlers.forEach(h => h(msg.from, msg.payload, msg.id, msg.timestamp));
        }
      };

      ws.onerror = () => reject(new Error('WebSocket connection failed'));

      ws.onclose = () => {
        if (this.username) {
          // Auto-reconnect with 3s delay
          this.reconnectTimer = setTimeout(() => this.connect(this.username!), 3000);
        }
      };
    });
  }

  send(to: string, payload: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Socket not connected');
    }
    this.ws.send(JSON.stringify({ type: 'message', to, payload }));
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect(): void {
    this.username = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}

export const socketService = new SocketService();
