"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage platform configuration and preferences.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>
                            Configure basic platform details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="site-name">Platform Name</Label>
                            <Input id="site-name" defaultValue="AdMediLink Admin" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="contact-email">Support Email</Label>
                            <Input id="contact-email" defaultValue="support@admedilink.com" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button>Save Changes</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>
                            Control what events trigger alerts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="new-orders" className="flex flex-col space-y-1">
                                <span>New Bookings</span>
                                <span className="font-normal text-xs text-muted-foreground">Receive alerts for new booking requests.</span>
                            </Label>
                            <Switch id="new-orders" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="disputes" className="flex flex-col space-y-1">
                                <span>Dispute Raised</span>
                                <span className="font-normal text-xs text-muted-foreground">Notify when a client raises a dispute.</span>
                            </Label>
                            <Switch id="disputes" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="marketing" className="flex flex-col space-y-1">
                                <span>Marketing Emails</span>
                                <span className="font-normal text-xs text-muted-foreground">Receive updates about platform features.</span>
                            </Label>
                            <Switch id="marketing" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button>Save Preferences</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
