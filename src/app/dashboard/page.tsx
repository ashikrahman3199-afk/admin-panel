"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, FileText, Activity, Image as ImageIcon, TrendingUp } from "lucide-react";

const client = generateClient<Schema>();

export default function DashboardPage() {
    const [metrics, setMetrics] = useState({
        pendingListings: 0,
        totalBookings: 0,
        activeCampaigns: 0,
        revenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // In the shared backend, listings are AdSpaces and revenue comes from Bookings
                const [adSpaces, bookings, campaigns] = await Promise.all([
                    client.models.AdSpace ? client.models.AdSpace.list({ filter: { approvalStatus: { eq: 'PENDING' } } }) : Promise.resolve({ data: [] }),
                    client.models.Booking ? client.models.Booking.list({}) : Promise.resolve({ data: [] }),
                    client.models.Campaign ? client.models.Campaign.list({ filter: { status: { eq: 'ACTIVE' } } }) : Promise.resolve({ data: [] }),
                ]);

                // Calculate total revenue from bookings
                const totalRevenue = bookings.data.reduce((sum, b) => sum + (b.amount || 0), 0);

                setMetrics({
                    pendingListings: adSpaces.data.length,
                    totalBookings: bookings.data.length,
                    activeCampaigns: campaigns.data.length,
                    revenue: totalRevenue,
                });
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/dashboard/verification">
                    <Card className="bg-card/50 backdrop-blur-sm hover:bg-white/10 transition-colors shadow-sm ring-1 ring-blue-500/20 group cursor-pointer">
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

                <Link href="/dashboard/transactions"> {/* Assuming bookings page is transactions or similar, adjust if wrong */}
                    <Card className="bg-card/50 backdrop-blur-sm hover:bg-white/10 transition-colors shadow-sm ring-1 ring-white/10 group cursor-pointer">
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

                <Link href="/dashboard/campaigns">
                    <Card className="bg-card/50 backdrop-blur-sm hover:bg-white/10 transition-colors shadow-sm ring-1 ring-white/10 group cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Active Campaigns</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold group-hover:text-primary transition-colors">{loading ? "..." : metrics.activeCampaigns}</div>
                            <p className="text-xs text-muted-foreground">
                                Currently running
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/transactions">
                    <Card className="bg-card/50 backdrop-blur-sm hover:bg-white/10 transition-colors shadow-sm ring-1 ring-white/10 group cursor-pointer">
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
                        <div className="space-y-8">
                            {/* Placeholder for future real activity stream */}
                            <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
                                Activity stream will populate as bookings occur.
                            </div>
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
