
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, ArrowLeft, Trash2 } from "lucide-react";
import { getNotifications, markAllAsRead, type Notification, clearNotifications } from '@/lib/notifications';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { BADGES } from '@/lib/constants';

const getIconForType = (type: Notification['type']): React.ElementType => {
    const badge = BADGES.find(b => b.id === type);
    if (badge) return badge.Icon;
    return Bell; // Default icon
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = () => {
        setNotifications(getNotifications());
    };

    useEffect(() => {
        fetchNotifications();
        window.addEventListener('storageUpdated', fetchNotifications);
        return () => window.removeEventListener('storageUpdated', fetchNotifications);
    }, []);

    const handleMarkAllRead = () => {
        markAllAsRead();
        fetchNotifications(); // Re-fetch to update UI
    };

    const handleClearAll = () => {
        clearNotifications();
        fetchNotifications();
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bell className="h-6 w-6 text-primary"/>
                            <CardTitle className="text-2xl">Notifications</CardTitle>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Home</Link>
                        </Button>
                    </div>
                    <CardDescription>All your recent alerts and achievements.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-end gap-2 mb-4">
                        <Button onClick={handleMarkAllRead} variant="secondary" size="sm" disabled={notifications.every(n => n.isRead)}>
                           <CheckCheck className="mr-2 h-4 w-4"/> Mark All as Read
                        </Button>
                         <Button onClick={handleClearAll} variant="destructive" size="sm" disabled={notifications.length === 0}>
                           <Trash2 className="mr-2 h-4 w-4"/> Clear All
                        </Button>
                    </div>

                    <ScrollArea className="h-[60vh] pr-4 -mr-4">
                        <div className="space-y-4">
                        {notifications.length > 0 ? (
                            notifications.map(notif => {
                                const Icon = getIconForType(notif.type);
                                return (
                                    <div 
                                        key={notif.id}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                                            notif.isRead ? "bg-card text-muted-foreground" : "bg-primary/10 border-primary/50"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-full", notif.isRead ? "bg-muted" : "bg-primary/20")}>
                                            <Icon className={cn("h-6 w-6 flex-shrink-0", notif.isRead ? "text-muted-foreground" : "text-primary")} />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-foreground">{notif.message}</p>
                                            <div className="text-xs text-muted-foreground flex justify-between items-center mt-1">
                                                <span>{formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}</span>
                                                {notif.href && (
                                                    <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                                                        <Link href={notif.href}>View</Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-20">
                                <Bell size={48} className="mx-auto text-muted-foreground/30 mb-4"/>
                                <p className="text-lg font-medium text-muted-foreground">No notifications yet!</p>
                                <p className="text-sm text-muted-foreground">Play games and complete achievements to see them here.</p>
                            </div>
                        )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
