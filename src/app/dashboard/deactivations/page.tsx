"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function DeactivationsPage() {
    const [requests, setRequests] = React.useState<Array<any>>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [currentUserRole, setCurrentUserRole] = React.useState<string>("ADMIN");

    React.useEffect(() => {
        const checkRole = async () => {
            try {
                const { fetchUserAttributes } = await import('aws-amplify/auth');
                const attrs = await fetchUserAttributes();
                const email = attrs.email?.toLowerCase() || "";
                
                const response = await fetch('/api/admins');
                const data = await response.json();
                let role = "ADMIN";
                
                if (data.success && data.users) {
                    const profile = data.users.find((u: any) => u.email?.toLowerCase() === email);
                    if (profile && profile.role) {
                        role = profile.role;
                    }
                }
                
                if (email.includes("ashik") || email === "ashikrahman3199@gmail.com") {
                    role = "SUPER_ADMIN";
                }
                
                setCurrentUserRole(role);
            } catch (e) {
                console.error("Failed to check role", e);
            }
        };
        checkRole();
    }, []);

    const fetchRequests = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/deactivations');
            const result = await response.json();
            
            if (!result.success) throw new Error(result.error);
            setRequests(result.requests || []);
        } catch (error) {
            console.error("Error fetching deactivations:", error);
            toast.error("Failed to load requests");
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT' | 'IMMEDIATE') => {
        if (action === 'IMMEDIATE' && currentUserRole !== "SUPER_ADMIN") {
            toast.error("Unauthorized", { description: "Only Super Admins can deactivate immediately." });
            return;
        }

        let confirmMsg = "";
        if (action === 'APPROVE') confirmMsg = "Are you sure you want to approve this? It will deactivate in 30 days.";
        if (action === 'REJECT') confirmMsg = "Are you sure you want to reject this request? The service will remain active.";
        if (action === 'IMMEDIATE') confirmMsg = "EMERGENCY ACTION: Are you sure you want to deactivate this immediately? All pending bookings might be disrupted.";

        if (!confirm(confirmMsg)) return;

        try {
            const response = await fetch('/api/deactivations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            });
            const result = await response.json();
            
            if (!result.success) throw new Error(result.error);
            
            toast.success("Action Successful");
            fetchRequests();
        } catch (error: any) {
            console.error("Error performing action:", error);
            toast.error(error.message || "Failed to perform action");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Deactivation Requests</h1>
                    <p className="text-muted-foreground">
                        Manage vendor requests to deactivate services. Check for pending bookings and contact vendors before approving.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 bg-white/5 border-none"
                    onClick={fetchRequests}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/5">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[100px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Service Title</TableHead>
                            <TableHead className="text-muted-foreground/70">Vendor Mobile</TableHead>
                            <TableHead className="text-muted-foreground/70 max-w-[300px]">Reason</TableHead>
                            <TableHead className="text-muted-foreground/70 text-center">Pending Bookings (30 Days)</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    Loading requests...
                                </TableCell>
                            </TableRow>
                        ) : requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    No pending deactivation requests found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((req) => (
                                <TableRow key={req.id} className="hover:bg-white/5 border-none transition-colors group">
                                    <TableCell className="font-medium text-xs text-muted-foreground">{req.id.substring(0, 8)}</TableCell>
                                    <TableCell className="font-bold">{req.title}</TableCell>
                                    <TableCell className="font-medium">{req.vendorPhone}</TableCell>
                                    <TableCell className="max-w-[300px] truncate" title={req.reason}>{req.reason}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge 
                                            variant="secondary" 
                                            className={`rounded-full px-3 border-none ${
                                                req.pendingBookingsCount > 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                                            }`}
                                        >
                                            {req.pendingBookingsCount > 0 ? `${req.pendingBookingsCount} Bookings` : 'Clear (0)'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 items-center">
                                            {req.approvalStatus === 'DEACTIVATING_IN_30_DAYS' ? (
                                                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-none mr-2">
                                                    Approved (30d Timer)
                                                </Badge>
                                            ) : (
                                                <>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="rounded-xl hover:bg-green-500/10 text-green-500 disabled:opacity-50"
                                                        onClick={() => handleAction(req.id, 'APPROVE')}
                                                        disabled={req.pendingBookingsCount > 0}
                                                        title={req.pendingBookingsCount > 0 ? "Cannot approve while there are pending bookings" : "Approve deactivation (takes 30 days)"}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="rounded-xl hover:bg-white/10"
                                                        onClick={() => handleAction(req.id, 'REJECT')}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {currentUserRole === "SUPER_ADMIN" && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="rounded-xl hover:bg-red-500/10 text-red-500 border border-red-500/20 ml-2"
                                                    onClick={() => handleAction(req.id, 'IMMEDIATE')}
                                                >
                                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                                    Emergency Deactivate
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
