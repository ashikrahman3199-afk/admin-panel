import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, FileText, Activity, Image as ImageIcon, TrendingUp } from "lucide-react";

const stats = [
    {
        title: "Pending Listings",
        value: "12",
        change: "+4 new",
        icon: ImageIcon,
        trend: "up",
    },
    {
        title: "New Bookings",
        value: "48",
        change: "+12.5%",
        icon: FileText,
        trend: "up",
    },
    {
        title: "Active Campaigns",
        value: "156",
        change: "+8.2%",
        icon: TrendingUp,
        trend: "up",
    },
    {
        title: "Total Revenue",
        value: "₹1.2Cr",
        change: "+15%",
        icon: Activity,
        trend: "up",
    },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of your ad platform's performance.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                <span className={stat.trend === "up" ? "text-green-500" : "text-gray-500"}>
                                    {stat.change}
                                </span>{" "}
                                from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center">
                                    <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Activity className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            New booking request from Client #{1000 + i}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            For "Anna Nagar Arch Billboard" (Pending Review)
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-sm text-muted-foreground">
                                        {i * 15}m ago
                                    </div>
                                </div>
                            ))}
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
