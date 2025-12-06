"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Lock, User, Shield, Globe } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Configure system preferences and integration parameters.
                </p>
            </div>

            <div className="grid gap-6">
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <CardTitle>Profile Settings</CardTitle>
                        </div>
                        <CardDescription>
                            Manage your admin profile information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" defaultValue="Admin User" className="bg-background/50" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" defaultValue="admin@example.com" className="bg-background/50" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button>Save Changes</Button>
                    </CardFooter>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>
                            Configure how you receive alerts and updates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="new-requests" className="flex flex-col space-y-1">
                                <span>New Integration Requests</span>
                                <span className="font-normal text-xs text-muted-foreground">Receive emails when new clients request access.</span>
                            </Label>
                            <Switch id="new-requests" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="system-alerts" className="flex flex-col space-y-1">
                                <span>System Health Alerts</span>
                                <span className="font-normal text-xs text-muted-foreground">Get notified about downtime or performance issues.</span>
                            </Label>
                            <Switch id="system-alerts" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="marketing" className="flex flex-col space-y-1">
                                <span>Marketing Updates</span>
                                <span className="font-normal text-xs text-muted-foreground">Receive news about new features and updates.</span>
                            </Label>
                            <Switch id="marketing" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <CardTitle>Security & Access</CardTitle>
                        </div>
                        <CardDescription>
                            Manage API access and security protocols.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="maintenance" className="flex flex-col space-y-1">
                                <span>Maintenance Mode</span>
                                <span className="font-normal text-xs text-muted-foreground">Temporarily disable all API access for maintenance.</span>
                            </Label>
                            <Switch id="maintenance" />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="public-signup" className="flex flex-col space-y-1">
                                <span>Public Sign-up</span>
                                <span className="font-normal text-xs text-muted-foreground">Allow new clients to register without invitation.</span>
                            </Label>
                            <Switch id="public-signup" defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
