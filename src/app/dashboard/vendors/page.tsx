"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CheckCircle2, XCircle } from "lucide-react";
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
    const [vendorsList, setVendorsList] = React.useState<Array<Schema["Vendor"]["type"]>>([]);
    const [transactions, setTransactions] = React.useState<Array<Schema["Transaction"]["type"]>>([]);
    const [withdrawals, setWithdrawals] = React.useState<Array<Schema["WithdrawalRequest"]["type"]>>([]);
    const [isOnboardDialogOpen, setIsOnboardDialogOpen] = React.useState(false);
    const [newVendor, setNewVendor] = React.useState({ businessName: "", contact: "", location: "" });

    React.useEffect(() => {
        const subVendors = client.models.Vendor.observeQuery().subscribe({
            next: (data) => setVendorsList([...data.items]),
        });
        const subTxns = client.models.Transaction.observeQuery().subscribe({
            next: (data) => setTransactions([...data.items]),
        });
        
        let subWithdrawals: { unsubscribe: () => void } | undefined;
        if (client.models.WithdrawalRequest) {
            subWithdrawals = client.models.WithdrawalRequest.observeQuery().subscribe({
                next: (data) => setWithdrawals([...data.items]),
            });
        }
        
        return () => {
            subVendors.unsubscribe();
            subTxns.unsubscribe();
            if (subWithdrawals) subWithdrawals.unsubscribe();
        };
    }, []);

    const getVendorFinancials = (vendorId: string) => {
        const vendorTxns = transactions.filter(t => t.vendorId === vendorId && t.status === "SUCCESS");
        const totalEarnings = vendorTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const vendorWithdrawals = withdrawals.filter(w => w.vendorId === vendorId);
        const pendingWithdrawals = vendorWithdrawals.filter(w => w.status === "PENDING").reduce((sum, w) => sum + (w.amount || 0), 0);
        const approvedWithdrawals = vendorWithdrawals.filter(w => w.status === "APPROVED").reduce((sum, w) => sum + (w.amount || 0), 0);
        
        const availableBalance = totalEarnings - approvedWithdrawals - pendingWithdrawals;
        
        return { totalEarnings, pendingWithdrawals, approvedWithdrawals, availableBalance, requests: vendorWithdrawals };
    };

    const handleApprove = async (id: string, name: string) => {
        try {
            setVendorsList(prev => prev.map(v => v.id === id ? { ...v, status: "VERIFIED" } : v));
            await client.models.Vendor.update({ id, status: "VERIFIED" });
            toast.success("Vendor Approved", { description: `${name} has been approved.` });
        } catch {
            toast.error("Error", { description: "Failed to approve vendor." });
        }
    };

    const handleReject = async (id: string, name: string) => {
        try {
            setVendorsList(prev => prev.map(v => v.id === id ? { ...v, status: "REJECTED" } : v));
            await client.models.Vendor.update({ id, status: "REJECTED" });
            toast.error("Vendor Rejected", { description: `${name} has been rejected.` });
        } catch {
            toast.error("Error", { description: "Failed to reject vendor." });
        }
    };

    const handleOnboardVendor = async () => {
        if (!newVendor.businessName || !newVendor.contact) {
            toast.error("Validation Error", { description: "Business Name and Contact are required." });
            return;
        }
        try {
            await client.models.Vendor.create({
                businessName: newVendor.businessName,
                contact: newVendor.contact,
                location: newVendor.location,
                status: "PENDING",
            });
            setIsOnboardDialogOpen(false);
            setNewVendor({ businessName: "", contact: "", location: "" });
            toast.success("Vendor Onboarded", { description: `${newVendor.businessName} has been added.` });
        } catch {
            toast.error("Error", { description: "Failed to create vendor." });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
                    <p className="text-muted-foreground">
                        Oversee vendor accounts, verification, and inventory.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="default"
                        className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                        onClick={() => {
                            toast.loading("Refetching vendors...", { duration: 1000 });
                            client.models.Vendor.list().then(res => setVendorsList([...res.data]));
                        }}
                    >
                        Refresh List
                    </Button>
                    <Dialog open={isOnboardDialogOpen} onOpenChange={setIsOnboardDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">Onboard Vendor</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Onboard New Vendor</DialogTitle>
                                <DialogDescription>Register a new vendor and their primary location.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <span className="text-right text-sm font-medium">Business</span>
                                    <Input
                                        id="business"
                                        placeholder="Vendor Co."
                                        className="col-span-3"
                                        value={newVendor.businessName}
                                        onChange={(e) => setNewVendor({ ...newVendor, businessName: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <span className="text-right text-sm font-medium">Contact</span>
                                    <Input
                                        id="contact"
                                        placeholder="Jane Doe"
                                        className="col-span-3"
                                        value={newVendor.contact}
                                        onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <span className="text-right text-sm font-medium">Location</span>
                                    <Input
                                        id="location"
                                        placeholder="City, State"
                                        className="col-span-3"
                                        value={newVendor.location}
                                        onChange={(e) => setNewVendor({ ...newVendor, location: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleOnboardVendor}>Complete Onboarding</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[100px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Business Name</TableHead>
                            <TableHead className="text-muted-foreground/70">Contact</TableHead>
                            <TableHead className="text-muted-foreground/70">Location</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-center text-muted-foreground/70">Inventory</TableHead>
                            <TableHead className="text-center text-muted-foreground/70">Financials</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vendorsList.filter(v => v && v.id).map((vendor) => (
                            <TableRow key={vendor.id} className="hover:bg-white/5 border-none transition-colors group">
                                <TableCell className="font-medium group-hover:text-primary transition-colors">{vendor.id.substring(0, 8)}</TableCell>
                                <TableCell className="font-bold">{vendor.businessName}</TableCell>
                                <TableCell>{vendor.contact}</TableCell>
                                <TableCell>{vendor.location}</TableCell>
                                <TableCell>
                                    <Badge variant={vendor.status === "VERIFIED" ? "default" : vendor.status === "REJECTED" ? "destructive" : "secondary"} className={`rounded-full px-3 border-none ${vendor.status === "VERIFIED" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : vendor.status === "REJECTED" ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"}`}>
                                        {vendor.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="link" className="text-primary hover:underline font-bold">
                                                View Services
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl bg-card/90 backdrop-blur-xl border-none shadow-2xl">
                                            <DialogHeader>
                                                <DialogTitle>{vendor.businessName} - Inventory</DialogTitle>
                                                <DialogDescription>
                                                    Manage services and inventory units provided by this vendor.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="bg-white/5 rounded-2xl mt-4 overflow-hidden border-none ring-1 ring-white/5">
                                                <p className="p-4 text-center text-muted-foreground">Service list integration pending...</p>
                                            </div>
                                            <DialogFooter className="mt-4">
                                                <DialogClose asChild>
                                                    <Button variant="outline" className="rounded-full border-none bg-white/5 hover:bg-white/10">Close</Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="rounded-full shadow-sm bg-white/5 border-none hover:bg-white/10">
                                                View Financials
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md bg-card/90 backdrop-blur-xl border-none shadow-2xl">
                                            <DialogHeader>
                                                <DialogTitle>{vendor.businessName} - Financials</DialogTitle>
                                                <DialogDescription>
                                                    Earnings and withdrawal requests.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="flex justify-between border-b border-white/10 pb-2">
                                                    <span className="font-medium text-muted-foreground">Total Earnings</span>
                                                    <span className="font-bold text-green-500">₹{getVendorFinancials(vendor.id).totalEarnings}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/10 pb-2">
                                                    <span className="font-medium text-muted-foreground">Approved Withdrawals</span>
                                                    <span className="font-bold">₹{getVendorFinancials(vendor.id).approvedWithdrawals}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/10 pb-2">
                                                    <span className="font-medium text-muted-foreground">Pending Requests</span>
                                                    <span className="font-bold text-yellow-500">₹{getVendorFinancials(vendor.id).pendingWithdrawals}</span>
                                                </div>
                                                <div className="flex justify-between pt-2">
                                                    <span className="font-medium text-primary">Available Balance</span>
                                                    <span className="font-bold text-primary text-xl">₹{getVendorFinancials(vendor.id).availableBalance}</span>
                                                </div>
                                                
                                                {getVendorFinancials(vendor.id).requests.length > 0 && (
                                                    <div className="mt-4 border-t border-white/10 pt-4">
                                                        <h4 className="font-medium mb-2 text-sm text-muted-foreground">Recent Requests</h4>
                                                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                                            {getVendorFinancials(vendor.id).requests.map(req => (
                                                                <div key={req.id} className="flex flex-col gap-1 text-sm bg-white/5 p-3 rounded-xl border border-white/5">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="font-bold">₹{req.amount}</span>
                                                                        <Badge variant={req.status === 'APPROVED' ? 'default' : req.status === 'REJECTED' ? 'destructive' : 'secondary'} className={`text-[10px] h-5 rounded-full ${req.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-none' : req.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-none' : 'bg-yellow-500/10 text-yellow-500 border-none'}`}>
                                                                            {req.status}
                                                                        </Badge>
                                                                    </div>
                                                                    {req.bankDetails && <span className="text-xs text-muted-foreground truncate" title={req.bankDetails}>{req.bankDetails}</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <DialogFooter className="mt-4">
                                                <DialogClose asChild>
                                                    <Button variant="outline" className="rounded-full border-none bg-white/5 hover:bg-white/10">Close</Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2 items-center min-h-[40px]">
                                        {vendor.status === "PENDING" ? (
                                            <>
                                                <Button variant="ghost" size="icon" title="Approve" className="rounded-full hover:bg-green-500/10 hover:text-green-500" onClick={() => handleApprove(vendor.id, vendor.businessName)}>
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Reject" className="rounded-full hover:bg-red-500/10 hover:text-red-500" onClick={() => handleReject(vendor.id, vendor.businessName)}>
                                                    <XCircle className="h-5 w-5 text-destructive" />
                                                </Button>
                                            </>
                                        ) : vendor.status === "VERIFIED" ? (
                                            <div className="flex items-center gap-2 text-green-500 font-medium px-3 py-1 rounded-full bg-green-500/10">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Approved
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-500 font-medium px-3 py-1 rounded-full bg-red-500/10">
                                                <XCircle className="h-4 w-4" />
                                                Rejected
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
