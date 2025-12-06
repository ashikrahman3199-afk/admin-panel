"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Store,
    FileText,
    Settings,
    LogOut
} from "lucide-react";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: FileText, label: "Bookings", href: "/dashboard/bookings" },
    { icon: Users, label: "Clients", href: "/dashboard/clients" },
    { icon: Store, label: "Vendors", href: "/dashboard/vendors" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl md:flex">
            <div className="flex h-16 items-center border-b border-border px-6">
                <span className="text-lg font-bold text-primary">AdminPanel</span>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-border p-4">
                <Link
                    href="/login"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Link>
            </div>
        </aside>
    );
}
