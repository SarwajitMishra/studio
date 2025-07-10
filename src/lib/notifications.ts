
'use client';

export const LOCAL_STORAGE_NOTIFICATIONS_KEY = 'shravyaPlayhouse_notifications';

export interface Notification {
    id: string;
    message: string;
    type: string; // e.g., badge id, 'profile', 'theme'
    href?: string;
    timestamp: string; // ISO String
    isRead: boolean;
}

/**
 * Retrieves all notifications from localStorage.
 */
export const getNotifications = (): Notification[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_NOTIFICATIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error reading notifications from localStorage", e);
        return [];
    }
};

/**
 * Saves the entire list of notifications to localStorage.
 */
const saveNotifications = (notifications: Notification[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(notifications));
        // Notify other parts of the app that storage has been updated
        window.dispatchEvent(new CustomEvent('storageUpdated'));
    } catch (e) {
        console.error("Error writing notifications to localStorage", e);
    }
};

/**
 * Adds a new notification to the list.
 */
export const addNotification = (message: string, type: string, href?: string) => {
    const notifications = getNotifications();
    
    // Avoid creating duplicate notifications for the same event type
    const existingNotification = notifications.find(n => n.type === type);
    if (existingNotification) {
        console.log(`Notification of type '${type}' already exists. Skipping.`);
        return;
    }

    const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        message,
        type,
        href,
        timestamp: new Date().toISOString(),
        isRead: false,
    };
    
    // Add new notification to the top and limit the total number
    const updatedNotifications = [newNotification, ...notifications].slice(0, 100);
    saveNotifications(updatedNotifications);
};

/**
 * Marks a single notification as read.
 */
export const markAsRead = (id: string) => {
    const notifications = getNotifications();
    const updatedNotifications = notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
    );
    saveNotifications(updatedNotifications);
};

/**
 * Marks all notifications as read.
 */
export const markAllAsRead = () => {
    const notifications = getNotifications();
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updatedNotifications);
};


/**
 * Clears all notifications from storage.
 */
export const clearNotifications = () => {
    saveNotifications([]);
};
