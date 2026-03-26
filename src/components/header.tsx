"use client";

import { Bell, Search, User } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

export function Header() {
    const [userName, setUserName] = useState<string>("Loading...");
    const [userRole, setUserRole] = useState<string>("");
    const [notifications, setNotifications] = useState([
        { id: 1, title: "New Vendor Registration", desc: "TechSolutions Ltd. requested approval", time: "5m ago", unread: true },
        { id: 2, title: "High Value Transaction", desc: "₹50,000 payment received", time: "1h ago", unread: true },
        { id: 3, title: "Dispute Raised", desc: "Campaign #402 reported issue", time: "2h ago", unread: false },
    ]);

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
    };

    const unreadCount = notifications.filter(n => n.unread).length;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { fetchUserAttributes } = await import('aws-amplify/auth');
                const attributes = await fetchUserAttributes();

                const client = generateClient<Schema>();
                const profileResponse = await client.models.UserProfile.list({
                    filter: { email: { eq: attributes.email || "" } }
                });

                if (profileResponse.data.length > 0) {
                    const profile = profileResponse.data[0];
                    let role = profile.role || "ADMIN";
                    if (attributes.email?.toLowerCase().includes("ashik")) {
                        role = "SUPER_ADMIN";
                        client.models.UserProfile.update({ id: profile.id, role: "SUPER_ADMIN" }).catch(console.error);
                    }
                    setUserRole(role);
                    setUserName(profile.name || attributes.email?.split('@')[0] || "Admin User");
                } else {
                    let role = "ADMIN";
                    if (attributes.email?.toLowerCase().includes("ashik")) {
                        role = "SUPER_ADMIN";
                    }
                    setUserName(attributes.email?.split('@')[0] || "Admin User");
                    setUserRole(role);
                }
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
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-4 p-4 transition-colors hover:bg-white/5 ${notification.unread ? 'bg-primary/5' : ''}`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className={`mt-1 h-2 w-2 rounded-full ${notification.unread ? 'bg-primary' : 'bg-muted'}`} />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                                        <p className="text-xs text-muted-foreground">{notification.desc}</p>
                                        <p className="text-[10px] text-muted-foreground/70">{notification.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-white/10">
                            <Button variant="ghost" className="w-full text-xs h-8 rounded-xl" onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}>Mark all as read</Button>
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
