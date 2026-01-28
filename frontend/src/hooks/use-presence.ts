import { useState, useEffect, useCallback } from 'react';
import { chatWebSocket, WebSocketMessage } from '../services/websocket';

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // S'abonner aux mises à jour de statut
    const handleUserStatus = (data: WebSocketMessage) => {
      if (data.type === 'user_status' && data.user_id && data.status) {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (data.status === 'online') {
            newSet.add(data.user_id!);
          } else {
            newSet.delete(data.user_id!);
          }
          return newSet;
        });
      } else if (data.type === 'online_users_list' && data.user_ids) {
        setOnlineUsers(new Set(data.user_ids));
      } else if (data.type === 'user_status_change' && data.user_id && data.status) {
        // Redondance avec user_status, mais au cas où
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (data.status === 'online') {
            newSet.add(data.user_id!);
          } else {
            newSet.delete(data.user_id!);
          }
          return newSet;
        });
      }
    };

    const unsubscribeStatus = chatWebSocket.subscribe('user_status', handleUserStatus);
    const unsubscribeList = chatWebSocket.subscribe('online_users_list', handleUserStatus);
    const unsubscribeChange = chatWebSocket.subscribe('user_status_change', handleUserStatus);

    // Demander la liste des utilisateurs en ligne si le socket est connecté
    if (chatWebSocket.isConnected()) {
      chatWebSocket.getOnlineUsers();
    } else {
      // Sinon attendre la connexion (géré dans websocket.ts onopen, mais aussi ici pour hot reload/hook mount)
      // On pourrait ajouter un listener 'open' mais websocket.ts le fait déjà
      // Juste essayer d'envoyer, le service gérera le retry
      chatWebSocket.getOnlineUsers();
    }

    return () => {
      unsubscribeStatus();
      unsubscribeList();
      unsubscribeChange();
    };
  }, []);

  const isOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return {
    onlineUsers,
    isOnline,
  };
}
