import { config } from '../lib/config';

const WS_URL = config.api.baseUrl.replace('/api/v1', '').replace('http', 'ws');

export interface MessageData {
  id: string;
  conversation_id: string;
  sender: {
    id: string;
    username: string;
    full_name: string;
  };
  recipient_id?: string;
  sender_id?: string;
  content: string;
  created_at: string;
}

export interface WebSocketMessage {
  type: string;
  message?: MessageData;
  conversation_id?: string;
  error?: string;
}

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.warn('No authentication token found, cannot connect to WebSocket');
      this.isConnecting = false;
      return;
    }

    try {
      // Ajouter le token dans les query params pour l'authentification
      const token = localStorage.getItem('access_token');
      const wsUrl = `${WS_URL}/ws/chat/${token ? `?token=${token}` : ''}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket URL:', wsUrl);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', { code: event.code, reason: event.reason });
        this.isConnecting = false;
        this.ws = null;
        if (event.code !== 1000) { // 1000 = normal closure
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(data: WebSocketMessage) {
    const listeners = this.listeners.get(data.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  public subscribe(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Si la connexion n'est pas établie, essayer de se connecter
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    return () => {
      this.unsubscribe(eventType, callback);
    };
  }

  public unsubscribe(eventType: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  public subscribeToConversation(conversationId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_conversation',
        conversation_id: conversationId,
      }));
    } else {
      // Attendre que la connexion soit établie
      const checkConnection = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          clearInterval(checkConnection);
          this.ws.send(JSON.stringify({
            type: 'subscribe_conversation',
            conversation_id: conversationId,
          }));
        }
      }, 100);
      
      // Timeout après 5 secondes
      setTimeout(() => clearInterval(checkConnection), 5000);
    }
  }

  public unsubscribeFromConversation(conversationId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe_conversation',
        conversation_id: conversationId,
      }));
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = this.maxReconnectAttempts; // Empêcher la reconnexion
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Instance singleton
export const chatWebSocket = new ChatWebSocket();

