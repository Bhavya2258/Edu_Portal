import { useEffect, useRef, useState, useCallback } from "react";

type SocketEventListener = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<SocketEventListener>> = new Map();
  private isConnecting = false;
  private reconnectTimer: any = null;

  public connect(userId?: string, role?: string, sessionId?: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.ws.readyState === WebSocket.OPEN && userId) {
        this.send({ type: "REGISTER", userId, role, sessionId });
      }
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.isConnecting = true;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        if (userId) {
          this.send({ type: "REGISTER", userId, role, sessionId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type || "MESSAGE";
          
          // Notify type-specific listeners
          const typeListeners = this.listeners.get(type);
          if (typeListeners) {
            typeListeners.forEach((listener) => listener(data));
          }

          // Notify global wildcard listeners
          const allListeners = this.listeners.get("*");
          if (allListeners) {
            allListeners.forEach((listener) => listener(data));
          }
        } catch (e) {
          console.error("Failed to parse WS incoming message", e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        // Schedule auto-reconnect
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect(userId, role, sessionId);
          }, 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("WebSocket connection warning:", err);
      };
    } catch (e) {
      this.isConnecting = false;
    }
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public on(eventType: string, listener: SocketEventListener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      this.off(eventType, listener);
    };
  }

  public off(eventType: string, listener: SocketEventListener) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.delete(listener);
    }
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socketService = new WebSocketService();

export function useSocketEvent<T = any>(eventType: string, handler: (data: T) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsubscribe = socketService.on(eventType, (data) => {
      if (handlerRef.current) {
        handlerRef.current(data);
      }
    });

    return unsubscribe;
  }, [eventType]);
}
