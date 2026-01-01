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
    LogOut,
    MessageSquare,
    CreditCard,
    AlertTriangle,
    ShieldCheck
} from "lucide-react";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: Users, label: "Users", href: "/dashboard/users" },
    { icon: Store, label: "Vendors", href: "/dashboard/vendors" },
    { icon: ShieldCheck, label: "Service Verification", href: "/dashboard/verification" },
    { icon: FileText, label: "Campaigns", href: "/dashboard/campaigns" },
    { icon: CreditCard, label: "Transactions", href: "/dashboard/transactions" },
    { icon: AlertTriangle, label: "Disputes", href: "/dashboard/disputes" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden w-64 flex-col md:flex h-screen sticky top-0 p-4">
            <div className="flex h-full flex-col rounded-3xl bg-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
                <div className="flex h-24 items-center justify-center px-6 bg-gradient-to-b from-white/5 to-transparent">
                    <span className="text-2xl font-black bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        AdminPanel
                    </span>
                </div>
                <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/30 translate-x-1"
                                        : "text-muted-foreground hover:bg-white/10 hover:text-primary hover:translate-x-1"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-primary/70")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t border-white/10 p-4">
                    <Link
                        href="/login"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </Link>
                </div>
            </div>
        </aside>
    );
}
