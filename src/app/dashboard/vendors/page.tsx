"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Info, RefreshCw } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/resource";

const client = generateClient<Schema>();

export default function VendorsPage() {
    const [mounted, setMounted] = React.useState(false);
    const [vendorsList, setVendorsList] = React.useState<Array<any>>([]);
    const [withdrawals, setWithdrawals] = React.useState<Array<any>>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // Fix hydration mismatch by only rendering content after mount
    React.useEffect(() => {
        setMounted(true);
    }, []);

    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            // In the shared backend, vendors are UserProfiles with role 'VENDOR'
            const profilesRes = await client.models.UserProfile.list();
            setVendorsList(profilesRes.data.filter(p => p && (p.role === "VENDOR" || p.role === "VENDOR_PENDING")));

            const withdrawalsRes = await client.models.WithdrawalRequest.list();
            setWithdrawals(withdrawalsRes.data.filter(Boolean));
        } catch (error) {
            console.error("Error fetching vendor data:", error);
            toast.error("Fetch Error", { description: "Could not load vendor data from the shared backend." });
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
        
        // Setup subscriptions
        const subProfiles = client.models.UserProfile.observeQuery().subscribe({
            next: (data) => setVendorsList([...data.items].filter(p => p && (p.role === "VENDOR" || p.role === "VENDOR_PENDING"))),
        });

        const subWithdrawals = client.models.WithdrawalRequest.observeQuery().subscribe({
            next: (data) => setWithdrawals([...data.items].filter(Boolean)),
        });

        return () => {
            subProfiles.unsubscribe();
            subWithdrawals.unsubscribe();
        };
    }, [fetchData]);

    const getVendorFinancials = (userId: string, totalEarnings: number = 0) => {
        const vendorWithdrawals = withdrawals.filter(w => w.userId === userId);
        const pendingWithdrawals = vendorWithdrawals
            .filter(w => w.status === "PENDING")
            .reduce((sum, w) => sum + (w.amount || 0), 0);
        const approvedWithdrawals = vendorWithdrawals
            .filter(w => w.status === "APPROVED" || w.status === "PROCESSED")
            .reduce((sum, w) => sum + (w.amount || 0), 0);
        
        const availableBalance = totalEarnings - approvedWithdrawals - pendingWithdrawals;
        
        return { 
            totalEarnings, 
            pendingWithdrawals, 
            approvedWithdrawals, 
            availableBalance, 
            requests: vendorWithdrawals 
        };
    };

    const handleUpdateStatus = async (id: string, name: string, status: string) => {
        try {
            await client.models.UserProfile.update({ id, status });
            toast.success("Status Updated", { description: `${name} is now ${status}.` });
        } catch (error) {
            toast.error("Error", { description: "Failed to update vendor status." });
        }
    };

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
                    <p className="text-muted-foreground">
                        Oversee vendor accounts, verification, and financials from the shared backend.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 bg-white/5 border-none"
                    onClick={fetchData}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh Data
                </Button>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/5">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[100px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Vendor Name</TableHead>
                            <TableHead className="text-muted-foreground/70">Contact</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-center text-muted-foreground/70">Financials</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    Loading vendor data...
                                </TableCell>
                            </TableRow>
                        ) : vendorsList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    No vendors found in the shared backend.
                                </TableCell>
                            </TableRow>
                        ) : (
                            vendorsList.map((vendor) => (
                                <TableRow key={vendor.id} className="hover:bg-white/5 border-none transition-colors group">
                                    <TableCell className="font-medium text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                        {vendor.userId?.substring(0, 8) || vendor.id.substring(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold">{vendor.name || "Unnamed Vendor"}</span>
                                            <span className="text-xs text-muted-foreground">{vendor.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{vendor.phoneNumber || "No contact"}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant="secondary" 
                                            className={`rounded-full px-3 border-none ${
                                                vendor.status === "ACTIVE" 
                                                    ? "bg-green-500/10 text-green-500" 
                                                    : "bg-yellow-500/10 text-yellow-500"
                                            }`}
                                        >
                                            {vendor.status || "PENDING"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="rounded-full bg-white/5 border-none hover:bg-white/10">
                                                    View Financials
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md bg-card/90 backdrop-blur-xl border-none shadow-2xl" suppressHydrationWarning>
                                                <DialogHeader>
                                                    <DialogTitle>{vendor.name || "Vendor"} - Financials</DialogTitle>
                                                    <DialogDescription>
                                                        Earnings and withdrawal history from the shared backend.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                                        <span className="font-medium text-muted-foreground">Total Earnings</span>
                                                        <span className="font-bold text-green-500">₹{vendor.totalEarnings || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                                        <span className="font-medium text-muted-foreground">Approved Withdrawals</span>
                                                        <span className="font-bold">₹{getVendorFinancials(vendor.userId, vendor.totalEarnings).approvedWithdrawals}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                                        <span className="font-medium text-muted-foreground">Pending Requests</span>
                                                        <span className="font-bold text-yellow-500">₹{getVendorFinancials(vendor.userId, vendor.totalEarnings).pendingWithdrawals}</span>
                                                    </div>
                                                    <div className="flex justify-between pt-2">
                                                        <span className="font-medium text-primary">Available Balance</span>
                                                        <span className="font-bold text-primary text-xl">₹{getVendorFinancials(vendor.userId, vendor.totalEarnings).availableBalance}</span>
                                                    </div>
                                                    
                                                    {getVendorFinancials(vendor.userId, vendor.totalEarnings).requests.length > 0 && (
                                                        <div className="mt-4 border-t border-white/10 pt-4">
                                                            <h4 className="font-medium mb-2 text-sm text-muted-foreground">Withdrawal Requests</h4>
                                                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                                                {getVendorFinancials(vendor.userId, vendor.totalEarnings).requests.map(req => (
                                                                    <div key={req.id} className="flex flex-col gap-1 text-sm bg-white/5 p-3 rounded-xl border border-white/5">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="font-bold">₹{req.amount}</span>
                                                                            <Badge className={`text-[10px] h-5 rounded-full border-none ${
                                                                                req.status === 'APPROVED' || req.status === 'PROCESSED'
                                                                                    ? 'bg-green-500/10 text-green-500' 
                                                                                    : req.status === 'REJECTED' 
                                                                                        ? 'bg-red-500/10 text-red-500' 
                                                                                        : 'bg-yellow-500/10 text-yellow-500'
                                                                            }`}>
                                                                                {req.status}
                                                                            </Badge>
                                                                        </div>
                                                                        <span className="text-[10px] text-muted-foreground">{req.requestDate}</span>
                                                                        {req.paymentMethod && <span className="text-[10px] text-muted-foreground">{req.paymentMethod}: {req.paymentDetails}</span>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="outline" className="rounded-full border-none bg-white/5">Close</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {vendor.status !== "ACTIVE" ? (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="rounded-full hover:bg-green-500/10 text-green-500"
                                                    onClick={() => handleUpdateStatus(vendor.id, vendor.name, "ACTIVE")}
                                                >
                                                    <CheckCircle2 className="h-5 w-5" />
                                                </Button>
                                            ) : (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="rounded-full hover:bg-red-500/10 text-red-500"
                                                    onClick={() => handleUpdateStatus(vendor.id, vendor.name, "INACTIVE")}
                                                >
                                                    <XCircle className="h-5 w-5" />
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
