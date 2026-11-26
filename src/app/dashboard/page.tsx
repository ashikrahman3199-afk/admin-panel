"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, FileText, Activity, Image as ImageIcon, TrendingUp, PhoneCall, Phone } from "lucide-react";

const client = generateClient<Schema>();

export default function DashboardPage() {
    const [metrics, setMetrics] = useState({
        pendingListings: 0,
        totalBookings: 0,
        totalCallbacks: 0,
        pendingCallbacks: 0,
        activeCampaigns: 0,
        clearedDisputes: 0,
        revenue: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/dashboard-stats');
                const result = await response.json();
                
                if (result.success && result.metrics) {
                    setMetrics({
                        pendingListings: result.metrics.pendingListings || 0,
                        totalBookings: result.metrics.totalBookings || 0,
                        totalCallbacks: result.metrics.totalCallbacks || 0,
                        pendingCallbacks: result.metrics.pendingCallbacks || 0,
                        activeCampaigns: result.metrics.activeDisputes ?? 0,
                        clearedDisputes: result.metrics.clearedDisputes ?? 0,
                        revenue: result.metrics.revenue || 0,
                    });
                    setRecentActivity(result.recentActivity || []);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of your ad platform&apos;s performance.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Link href="/dashboard/verification">
                    <Card className="bg-card/50 backdrop-blur-sm hover:bg-white/10 transition-colors shadow-sm ring-1 ring-blue-500/20 group cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 group-hover:text-blue-500 transition-colors">
                                Pending Listings
                                {metrics.pendingListings > 0 && (
                                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse mt-0.5" />
                                )}
                            </CardTitle>
                            <ImageIcon className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold group-hover:text-blue-500 transition-colors">{loading ? "..." : metrics.pendingListings}</div>
                            <p className="text-xs text-muted-foreground">
                                Requires verification
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/bookings">
                    <Card className="bg-card/50 backdrop-blur-sm hover:bg-white/10 transition-colors shadow-sm ring-1 ring-white/10 group cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Total Bookings</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold group-hover:text-primary transition-colors">{loading ? "..." : metrics.totalBookings}</div>
                            <p className="text-xs text-muted-foreground">
                                All time bookings
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/bookings?filter=callback">
                    <Card className="bg-card/50 backdrop-blur-sm hover:bg-white/10 transition-colors shadow-sm ring-1 ring-amber-500/20 group cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 group-hover:text-amber-400 transition-colors">
                                Callbacks
                                {metrics.pendingCallbacks > 0 && (
                                    <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse mt-0.5" />
                                )}
                            </CardTitle>
                            <PhoneCall className="h-4 w-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold group-hover:text-amber-400 transition-colors">{loading ? "..." : metrics.totalCallbacks}</div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {metrics.pendingCallbacks > 0 ? (
                                    <span className="text-amber-400 font-medium">{metrics.pendingCallbacks} to call back</span>
                                ) : (
                                    <span className="text-green-500 font-medium">All contacted</span>
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/disputes">
                    <Card className="bg-card/50 backdrop-blur-sm hover:bg-white/10 transition-colors shadow-sm ring-1 ring-white/10 group cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                                Disputes
                                {metrics.activeCampaigns > 0 ? (
                                    <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse mt-0.5" />
                                ) : (
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 mt-0.5" />
                                )}
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold group-hover:text-primary transition-colors">{loading ? "..." : metrics.activeCampaigns}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.activeCampaigns === 0 ? (
                                    <span className="text-green-500 font-medium">All cleared</span>
                                ) : (
                                    <span className="text-amber-500/90 font-medium">{metrics.activeCampaigns} open {metrics.activeCampaigns === 1 ? 'resolution' : 'resolutions'}</span>
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/transactions">
                    <Card className="bg-card/50 backdrop-blur-sm hover:bg-white/10 transition-colors shadow-sm ring-1 ring-white/10 group cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Total Revenue</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold group-hover:text-primary transition-colors">{loading ? "..." : formatCurrency(metrics.revenue)}</div>
                            <p className="text-xs text-muted-foreground">
                                From completed transactions
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentActivity.length === 0 ? (
                                <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
                                    Activity stream will populate as bookings, listings, and disputes occur.
                                </div>
                            ) : (
                                recentActivity.map((activity, i) => (
                                    <div key={i} className="flex gap-4 items-center justify-between group">
                                        <div className="flex gap-3 items-start flex-1 min-w-0">
                                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                activity.type === 'callback' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' :
                                                activity.type === 'dispute' ? 'bg-red-500/10 text-red-500' : 
                                                activity.type === 'booking' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                                            }`}>
                                                {activity.type === 'callback' ? (
                                                    <PhoneCall className="h-4 w-4" />
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-current" />
                                                )}
                                            </div>
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium leading-none truncate">{activity.title}</p>
                                                    {activity.isCallback && (
                                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                                                            Callback
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{activity.desc}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(activity.createdAt).toLocaleDateString()}
                                            </span>
                                            {activity.isCallback && (
                                                <Link href="/dashboard/bookings?filter=callback">
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors cursor-pointer">
                                                        <Phone className="h-3 w-3" />
                                                        Reach
                                                    </span>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Platform Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Ad Server</p>
                                    <p className="text-xs text-muted-foreground">Delivering 5k impressions/s</p>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Vendor Portal</p>
                                    <p className="text-xs text-muted-foreground">All systems operational</p>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Client Dashboard</p>
                                    <p className="text-xs text-muted-foreground">99.9% uptime</p>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
