import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

export type Notification = {
  id: number;
  userType: string;
  title: string;
  message: string;
  type: string;
  relatedId: string | null;
  isRead: boolean;
  date: string;
};

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export function useNotifications(userType: "buyer" | "supplier") {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
  });
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Connect to WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connected");
      // Subscribe to notifications for this user type
      ws.send(JSON.stringify({ type: "subscribe", userType }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle new notifications
        if (data.type === "notification") {
          const notification = data.data as Notification;
          
          // Only handle notifications for this user type
          if (notification.userType === userType) {
            // Update notifications list
            setState(prev => ({
              ...prev,
              notifications: [notification, ...prev.notifications],
              unreadCount: prev.unreadCount + 1,
            }));
            
            // Show toast notification
            toast({
              title: notification.title,
              description: notification.message,
              duration: 5000,
            });
            
            // Refresh related queries based on notification type
            if (notification.type === "transaction") {
              queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
            } else if (notification.type === "verification") {
              queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            }
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setState(prev => ({ ...prev, error: "WebSocket connection error" }));
    };
    
    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [userType, queryClient, toast]);

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        const response = await apiRequest("GET", `/api/notifications/${userType}`);
        const notificationsData = await response.json() as Notification[];
        
        setState({
          notifications: notificationsData,
          unreadCount: notificationsData.filter(n => !n.isRead).length,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: "Failed to load notifications" 
        }));
      }
    };
    
    fetchNotifications();
  }, [userType]);

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiRequest("PATCH", `/api/notifications/${userType}/read-all`);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return {
    ...state,
    markAsRead,
    markAllAsRead,
  };
}