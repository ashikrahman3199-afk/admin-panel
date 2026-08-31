"use client";

import { Bell, Search, User, RefreshCw } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";

export function Header() {
    const [userName, setUserName] = useState<string>("Loading...");
    const [userRole, setUserRole] = useState<string>("");
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/notifications');
                const data = await res.json();
                if (data.success && data.notifications) {
                    setNotifications(data.notifications);
                }
            } catch (e) {
                console.error("Failed to fetch notifications", e);
            }
        };
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, read: true })
            });
        } catch (e) {
            console.error("Failed to mark notification as read", e);
        }
    };

    const markAllAsRead = async () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        try {
            await Promise.all(notifications.filter(n => !n.read).map(n => 
                fetch('/api/notifications', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: n.id, read: true })
                })
            ));
        } catch (e) {
            console.error("Failed to mark all as read", e);
        }
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins < 60) return `${diffMins || 1}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        return `${Math.floor(diffHrs / 24)}d ago`;
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { fetchUserAttributes } = await import('aws-amplify/auth');
                const attributes = await fetchUserAttributes();
                const email = attributes.email || "";

                // Fetch current admins
                const response = await fetch('/api/admins');
                const data = await response.json();
                const adminProfile = data.success && data.users ? data.users.find((u: any) => u.email === email) : null;

                let name = adminProfile?.name || email.split('@')[0] || "Admin User";
                let role = adminProfile?.role || "ADMIN";
                let status = adminProfile?.status || "PENDING_APPROVAL";

                // Ashik gets SUPER_ADMIN auto
                if (email.toLowerCase().includes("ashik") || email.toLowerCase() === "ashikrahman3199@gmail.com") {
                    role = "SUPER_ADMIN";
                    status = "ACTIVE";
                }

                // Auto-sync if not found in AdminUsers-custom
                if (!adminProfile && email) {
                    try {
                        await fetch('/api/admins', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: email,
                                updates: {
                                    name: name,
                                    email: email,
                                    role: role,
                                    status: status
                                }
                            })
                        });
                    } catch (e) {
                        console.error("Failed to sync new admin user", e);
                    }
                }

                setUserName(name);
                setUserRole(role);
            } catch (err) {
                console.error("Error fetching user data for header:", err);
                setUserName("Admin User");
                setUserRole("ADMIN");
            }
        };
        fetchUserData();
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-white/5 px-6 backdrop-blur-2xl shadow-sm ring-1 ring-white/10">
            <div className="flex items-center gap-4">
                <div className="relative w-96 group">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                    <Input
                        type="search"
                        placeholder="Search requests, clients, or vendors..."
                        className="pl-10 bg-white/10 border-white/10 rounded-full focus:bg-white/20 transition-all h-11"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-5 w-5" />
                </Button>
                <ModeToggle />

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-white/10">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white/20 animate-pulse" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 rounded-2xl border-none bg-popover/90 backdrop-blur-xl shadow-2xl ring-1 ring-white/10" align="end">
                        <div className="flex items-center justify-between border-b border-white/10 p-4">
                            <h4 className="font-semibold">Notifications</h4>
                            <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground">
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`flex items-start gap-4 p-4 transition-colors hover:bg-white/5 ${!notification.read ? 'bg-primary/5' : ''}`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full ${!notification.read ? 'bg-primary' : 'bg-muted'}`} />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{notification.title}</p>
                                            <p className="text-xs text-muted-foreground">{notification.message || notification.desc}</p>
                                            <p className="text-[10px] text-muted-foreground/70">{formatTime(notification.createdAt)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-2 border-t border-white/10">
                            <Button variant="ghost" className="w-full text-xs h-8 rounded-xl" onClick={markAllAsRead}>Mark all as read</Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-3 pl-4 border-l border-white/10 hover:opacity-80 transition-opacity text-left">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold">{userName}</span>
                                <span className="text-xs text-primary font-medium">{userRole.replace("_", " ")}</span>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-purple-400 p-[2px]">
                                <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4 rounded-2xl border-none bg-popover/90 backdrop-blur-xl shadow-2xl ring-1 ring-white/10" align="end">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary to-purple-400 p-[2px]">
                                <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold">{userName}</span>
                                <span className="text-xs text-muted-foreground">{userRole.replace("_", " ")}</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm border-t border-white/10 pt-2">
                            <Button variant="ghost" className="w-full justify-start rounded-xl">Profile Settings</Button>
                            <Button variant="ghost" className="w-full justify-start rounded-xl text-red-500 hover:text-red-500 hover:bg-red-500/10" onClick={async () => {
                                const { signOut } = await import('aws-amplify/auth');
                                await signOut();
                                window.location.href = '/login';
                            }}>Sign Out</Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </header>
    );
}
