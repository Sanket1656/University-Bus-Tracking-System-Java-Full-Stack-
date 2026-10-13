import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import notificationApi from '../api/notificationApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.role) return;

    setLoading(true);
    try {
      const { data } = await notificationApi.getNotifications();
      setNotifications(data?.data ?? []);
      setError(null);
      hasFetchedRef.current = true;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load notifications.';
      setError(message);
      if (!hasFetchedRef.current) addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, user?.role]);

  useEffect(() => {
    if (!user?.role) {
      setNotifications([]);
      setError(null);
      setLoading(false);
      hasFetchedRef.current = false;
      return undefined;
    }

    fetchNotifications();
    const refreshTimer = setInterval(fetchNotifications, 30000);

    return () => clearInterval(refreshTimer);
  }, [fetchNotifications, user?.role]);

  const markAsRead = useCallback(async (notificationId) => {
    const previousNotifications = notifications;
    const notification = notifications.find(({ _id }) => _id === notificationId);

    if (!notification || notification.isRead) return;

    setNotifications((current) => current.map((item) => (
      item._id === notificationId ? { ...item, isRead: true } : item
    )));

    try {
      await notificationApi.markAsRead(notificationId);
    } catch (err) {
      setNotifications(previousNotifications);
      addToast(err.response?.data?.message || 'Failed to mark notification as read.', 'error');
    }
  }, [addToast, notifications]);

  const markAllAsRead = useCallback(async () => {
    const previousNotifications = notifications;
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));

    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      setNotifications(previousNotifications);
      addToast(err.response?.data?.message || 'Failed to mark notifications as read.', 'error');
    }
  }, [addToast, notifications]);

  const unreadCount = notifications.filter(({ isRead }) => !isRead).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
