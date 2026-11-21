import { useState, useEffect, useRef } from "react";
import { WS_URL } from "../services/api";

export function useAlertSocket({ token, onMessage, onOpen, onSessionExpired }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef(null);
  const handlersRef = useRef({ onMessage, onOpen, onSessionExpired });

  useEffect(() => {
    handlersRef.current = { onMessage, onOpen, onSessionExpired };
  }, [onMessage, onOpen, onSessionExpired]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let backoffMs = 1000;
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;
      clearTimeout(reconnectTimer);
      ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        backoffMs = 1000;
        setWsConnected(true);
        if (handlersRef.current.onOpen) handlersRef.current.onOpen();
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (handlersRef.current.onMessage) handlersRef.current.onMessage(msg);
        } catch {
          // ignore malformed ws message
        }
      };

      ws.onclose = (event) => {
        setWsConnected(false);
        if (unmounted) return;
        if (event.code === 4002 && handlersRef.current.onSessionExpired) {
          handlersRef.current.onSessionExpired();
          return;
        }
        reconnectTimer = setTimeout(connect, backoffMs);
        backoffMs = Math.min(backoffMs * 2, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    const handleReconnectTrigger = () => {
      if (document.visibilityState === "hidden") return;
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        backoffMs = 1000;
        connect();
      }
    };

    connect();
    window.addEventListener("online", handleReconnectTrigger);
    document.addEventListener("visibilitychange", handleReconnectTrigger);

    return () => {
      unmounted = true;
      clearTimeout(reconnectTimer);
      window.removeEventListener("online", handleReconnectTrigger);
      document.removeEventListener("visibilitychange", handleReconnectTrigger);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [token]);

  return { isOnline, wsConnected, isConnected: isOnline && wsConnected };
}
