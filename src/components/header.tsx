"use client";

import { Bell, Search, User } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <div className="relative w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search requests, clients, or vendors..."
                        className="pl-9 bg-background/50"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <ModeToggle />
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-medium">Admin User</span>
                        <span className="text-xs text-muted-foreground">Super Admin</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/20" />
                </div>
            </div>
        </header>
    );
}
