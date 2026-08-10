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
import { CheckCircle2, XCircle, Info, RefreshCw, Pencil, MoreHorizontal } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
    const [openPopoverId, setOpenPopoverId] = React.useState<string | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [selectedVendor, setSelectedVendor] = React.useState<any>(null);
    const [editVendor, setEditVendor] = React.useState({ companyName: "", email: "", role: "VENDOR" });

    // Fix hydration mismatch by only rendering content after mount
    React.useEffect(() => {
        setMounted(true);
    }, []);

    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch vendors from the direct DynamoDB API route
            const response = await fetch('/api/vendors');
            const data = await response.json();
            
            if (data.success) {
                setVendorsList(data.vendors);
            } else {
                throw new Error(data.error);
            }

            // Fetch withdrawals
            const withdrawalsRes = await fetch('/api/withdrawals');
            const withdrawalsData = await withdrawalsRes.json();
            if (withdrawalsData.success) {
                setWithdrawals(withdrawalsData.withdrawals);
            }
        } catch (error) {
            console.error("Error fetching vendor data:", error);
            toast.error("Fetch Error", { description: "Could not load vendor data from the API." });
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
        
        // Set up polling for vendors and withdrawals
        const interval = setInterval(fetchData, 10000);

        return () => {
            clearInterval(interval);
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
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, updates: { status } })
            });
            if (!res.ok) throw new Error("API Request Failed");
            setVendorsList(prev => prev.map(v => v.id === id ? { ...v, status } : v));
            toast.success("Status Updated", { description: `${name} is now ${status}.` });
            setOpenPopoverId(null);
        } catch (error) {
            toast.error("Error", { description: "Failed to update vendor status." });
        }
    };

    const handleUpdateWithdrawalStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
        try {
            const res = await fetch('/api/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, updates: { status: newStatus } })
            });
            if (!res.ok) throw new Error("API Request Failed");
            
            // Update local state
            setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
            toast.success("Withdrawal Updated", { description: `Request has been ${newStatus.toLowerCase()}.` });
        } catch (error) {
            toast.error("Error", { description: "Failed to update withdrawal status." });
        }
    };

    const handleDeleteVendor = async (id: string) => {
        try {
            const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("API Request Failed");
            setVendorsList(prev => prev.filter(v => v.id !== id));
            toast.success("Vendor Deleted", { description: "The vendor has been removed from the system." });
        } catch (error) {
            toast.error("Error", { description: "Failed to delete vendor." });
        }
    };

    const openEditDialog = (vendor: any) => {
        setSelectedVendor(vendor);
        setEditVendor({
            companyName: vendor.companyName || vendor.name || "",
            email: vendor.email || "",
            role: vendor.role || "VENDOR"
        });
        setIsEditDialogOpen(true);
    };

    const handleEditSubmit = async () => {
        if (!selectedVendor) return;
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedVendor.id,
                    updates: {
                        companyName: editVendor.companyName,
                        name: editVendor.companyName,
                        email: editVendor.email,
                        role: editVendor.role,
                    }
                })
            });
            if (!res.ok) throw new Error("API Request Failed");
            setVendorsList(prev => prev.map(v => v.id === selectedVendor.id ? { ...v, companyName: editVendor.companyName, name: editVendor.companyName, email: editVendor.email, role: editVendor.role } : v));
            setIsEditDialogOpen(false);
            toast.success("Vendor Updated", { description: "Vendor details have been updated." });
        } catch (error) {
            toast.error("Error", { description: "Failed to update vendor." });
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
                                        {vendor.displayId || vendor.id.substring(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold">{vendor.companyName || vendor.name || "Unnamed Vendor"}</span>
                                            <span className="text-xs text-muted-foreground">{vendor.email}</span>
                                            {vendor.gstNumber && <span className="text-[10px] text-muted-foreground">GST: {vendor.gstNumber}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>{vendor.phoneNumber || "No contact"}</TableCell>
                                    <TableCell>
                                        <Popover open={openPopoverId === vendor.id} onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? vendor.id : null)}>
                                            <PopoverTrigger asChild>
                                                <Badge 
                                                    variant="outline" 
                                                    className={`cursor-pointer rounded-full px-3 border-none ${
                                                        vendor.status === "ACTIVE" 
                                                            ? "bg-green-500/10 text-green-500" 
                                                            : vendor.status === "INACTIVE"
                                                                ? "bg-red-500/10 text-red-500"
                                                                : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                                                    }`}
                                                >
                                                    {vendor.status || "PENDING"}
                                                </Badge>
                                            </PopoverTrigger>
                                            <PopoverContent side="right" className="w-[180px] p-2 rounded-xl backdrop-blur-xl bg-popover/95 shadow-2xl border-white/10 flex flex-col gap-2">
                                                <div className="text-xs font-semibold text-center mb-1">Update Status</div>
                                                <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white border-none rounded-lg h-8" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(vendor.id, vendor.companyName || vendor.name || "", "ACTIVE"); }}>Set Active</Button>
                                                <Button size="sm" variant="outline" className="w-full bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 rounded-lg h-8" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(vendor.id, vendor.companyName || vendor.name || "", "INACTIVE"); }}>Set Inactive</Button>
                                            </PopoverContent>
                                        </Popover>
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
                                                    <DialogTitle>{vendor.companyName || vendor.name || "Vendor"} - Financials</DialogTitle>
                                                    <DialogDescription>
                                                        Earnings, withdrawal history, and bank details.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    {/* Bank Details Section */}
                                                    <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-2">
                                                        <h4 className="font-semibold text-sm mb-2 text-primary">Bank Account Details</h4>
                                                        {vendor.bankDetails ? (
                                                            <div className="space-y-1 text-xs">
                                                                <div className="flex justify-between"><span className="text-muted-foreground">Account Name:</span> <span className="font-medium">{vendor.bankDetails.accountName || "N/A"}</span></div>
                                                                <div className="flex justify-between"><span className="text-muted-foreground">Account No:</span> <span className="font-medium">{vendor.bankDetails.accountNumber || "N/A"}</span></div>
                                                                <div className="flex justify-between"><span className="text-muted-foreground">IFSC Code:</span> <span className="font-medium">{vendor.bankDetails.ifscCode || "N/A"}</span></div>
                                                                <div className="flex justify-between"><span className="text-muted-foreground">Bank Name:</span> <span className="font-medium">{vendor.bankDetails.bankName || "N/A"}</span></div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground italic">No bank details provided yet.</p>
                                                        )}
                                                    </div>
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
                                                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                                                                {getVendorFinancials(vendor.userId, vendor.totalEarnings).requests.map(req => (
                                                                    <div key={req.id} className="flex flex-col gap-2 text-sm bg-white/5 p-3 rounded-xl border border-white/5">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="font-bold text-lg">₹{req.amount}</span>
                                                                            <Badge className={`text-xs px-2 py-0.5 rounded-full border-none ${
                                                                                req.status === 'APPROVED' || req.status === 'PROCESSED'
                                                                                    ? 'bg-green-500/10 text-green-500' 
                                                                                    : req.status === 'REJECTED' 
                                                                                        ? 'bg-red-500/10 text-red-500' 
                                                                                        : 'bg-yellow-500/10 text-yellow-500'
                                                                            }`}>
                                                                                {req.status}
                                                                            </Badge>
                                                                        </div>
                                                                        
                                                                        <div className="flex justify-between items-end">
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className="text-xs text-muted-foreground">{new Date(req.requestDate || req.createdAt).toLocaleString()}</span>
                                                                                {req.paymentMethod && <span className="text-xs text-muted-foreground font-medium">{req.paymentMethod}: {req.paymentDetails}</span>}
                                                                            </div>
                                                                            
                                                                            {req.status === 'PENDING' && (
                                                                                <div className="flex gap-2">
                                                                                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-full border-green-500/20 text-green-500 hover:bg-green-500/10 hover:text-green-500" onClick={() => handleUpdateWithdrawalStatus(req.id, "APPROVED")}>
                                                                                        Approve
                                                                                    </Button>
                                                                                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-full border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-500" onClick={() => handleUpdateWithdrawalStatus(req.id, "REJECTED")}>
                                                                                        Reject
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </div>
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
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(vendor)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-none bg-popover/80 backdrop-blur-xl shadow-2xl">
                                                    <DropdownMenuItem onClick={() => openEditDialog(vendor)}>Edit Details</DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-500/10" onClick={() => handleDeleteVendor(vendor.id)}>Delete Vendor</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Vendor</DialogTitle>
                        <DialogDescription>Update vendor information.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-company" className="text-right">Company</Label>
                            <Input
                                id="edit-company"
                                value={editVendor.companyName}
                                onChange={(e) => setEditVendor({ ...editVendor, companyName: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email" className="text-right">Email</Label>
                            <Input
                                id="edit-email"
                                value={editVendor.email}
                                onChange={(e) => setEditVendor({ ...editVendor, email: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-full">Cancel</Button>
                        <Button onClick={handleEditSubmit} className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
