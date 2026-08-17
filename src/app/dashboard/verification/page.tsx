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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Eye, RefreshCw, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/resource";

const client = generateClient<Schema>();

// Removed legacy server actions

export default function VerificationPage() {
    const [mounted, setMounted] = React.useState(false);
    const [adSpaces, setAdSpaces] = React.useState<Array<any>>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [selectedSpaceForRejection, setSelectedSpaceForRejection] = React.useState<any>(null);
    const [isRejectionDialogOpen, setIsRejectionDialogOpen] = React.useState(false);
    const [currentUserRole, setCurrentUserRole] = React.useState<string>("ADMIN");
    const [allBookings, setAllBookings] = React.useState<Array<any>>([]);

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

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const fetchPendingAdSpaces = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/adspaces');
            const result = await response.json();
            
            if (!result.success) throw new Error(result.error);
            const data = result.adSpaces;
            
            // Sort: Pending first, then by date
            const sortedData = [...data].sort((a, b) => {
                const isPendingA = a.approvalStatus === 'PENDING' || a.approvalStatus === 'Pending';
                const isPendingB = b.approvalStatus === 'PENDING' || b.approvalStatus === 'Pending';

                if (isPendingA && !isPendingB) return -1;
                if (!isPendingA && isPendingB) return 1;
                return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
            });
            
            setAdSpaces(sortedData);
        } catch (error) {
            console.error("Error fetching ad spaces:", error);
            toast.error("Failed to load listings");
        } finally {
            setIsLoading(false);
        }
        
        // Also fetch bookings
        try {
            const bRes = await fetch('/api/bookings');
            const bData = await bRes.json();
            if (bData.success) {
                setAllBookings(bData.bookings || []);
            }
        } catch(e) {
            console.error("Failed to fetch bookings", e);
        }
    }, []);

    React.useEffect(() => {
        fetchPendingAdSpaces();
        // Removed AppSync subscriptions since we are directly using DynamoDB Server Actions for now
    }, [fetchPendingAdSpaces]);

    const handleUpdateStatus = async (id: string, name: string, status: "Approved" | "Rejected" | "Pending", reason?: string) => {
        try {
            // Use "APPROVED" to match schema but display as "Approved"
            const mappedStatus = status === "Approved" ? "APPROVED" : status.toUpperCase();
            
            const response = await fetch('/api/adspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, approvalStatus: mappedStatus, rejectionReason: reason })
            });
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            toast.success(`Listing ${status}`, { description: `${name} has been ${status.toLowerCase()}.` });
            setIsRejectionDialogOpen(false);
            setRejectionReason("");
            fetchPendingAdSpaces(); // Refresh data
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Update Failed");
        }
    };

    const handleDeleteService = async (id: string, name: string) => {
        if (currentUserRole !== "SUPER_ADMIN") {
            toast.error("Unauthorized", { description: "Only Super Admins can delete services." });
            return;
        }

        if (!confirm(`Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) return;
        
        try {
            const response = await fetch('/api/adspaces', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            
            if (!result.success) throw new Error(result.error);
            
            toast.success(`Service Deleted`, { description: `${name} has been permanently removed.` });
            fetchPendingAdSpaces();
        } catch (error) {
            toast.error("Deletion Failed");
        }
    };

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Listing Verification</h1>
                    <p className="text-muted-foreground">
                        Review and approve new ad spaces added by vendors.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 bg-white/5 border-none"
                    onClick={fetchPendingAdSpaces}
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
                            <TableHead className="text-muted-foreground/70">Title</TableHead>
                            <TableHead className="text-muted-foreground/70">Category</TableHead>
                            <TableHead className="text-muted-foreground/70">Location</TableHead>
                            <TableHead className="text-muted-foreground/70">Price</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    Loading listings...
                                </TableCell>
                            </TableRow>
                        ) : adSpaces.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    No pending listings found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            adSpaces.map((space) => (
                                <TableRow key={space.id} className="hover:bg-white/5 border-none transition-colors group">
                                    <TableCell className="font-medium text-xs text-muted-foreground">{space.id.substring(0, 8)}</TableCell>
                                    <TableCell className="font-bold">{space.name || space.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="rounded-full bg-white/5 border-none">{space.categoryId || space.category}</Badge>
                                    </TableCell>
                                    <TableCell>{space.location}</TableCell>
                                    <TableCell className="font-bold">₹{space.price}/day</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant="secondary" 
                                            className={`rounded-full px-3 border-none ${
                                                (space.status?.toLowerCase() === "deactivated" || space.approvalStatus?.toLowerCase() === "deactivated")
                                                    ? "bg-gray-500/10 text-gray-500" 
                                                : (space.approvalStatus === "PENDING_DEACTIVATION" || space.approvalStatus === "deactivation_requested" || space.status === "deactivation_requested")
                                                    ? "bg-orange-500/10 text-orange-500"
                                                : (space.approvalStatus === "DEACTIVATING_IN_30_DAYS" || space.status === "DEACTIVATING_IN_30_DAYS")
                                                    ? "bg-purple-500/10 text-purple-500"
                                                : (space.status === "Active" || space.status === "APPROVED" || space.status === "Approved" || space.status === "active")
                                                    ? "bg-green-500/10 text-green-500" 
                                                : (space.status === "Rejected" || space.status === "REJECTED" || space.status === "Rejected" || space.status === "rejected")
                                                    ? "bg-red-500/10 text-red-500"
                                                    : "bg-yellow-500/10 text-yellow-500"
                                            }`}
                                        >
                                            {
                                                (space.status?.toLowerCase() === "deactivated" || space.approvalStatus?.toLowerCase() === "deactivated") ? "Deactivated" : 
                                                (space.approvalStatus === "PENDING_DEACTIVATION" || space.approvalStatus === "deactivation_requested" || space.status === "deactivation_requested") ? "Deactivation Req." :
                                                (space.approvalStatus === "DEACTIVATING_IN_30_DAYS" || space.status === "DEACTIVATING_IN_30_DAYS") ? "Deactivating (30d)" :
                                                (space.status === "Active" || space.status === "APPROVED" || space.status === "Approved" || space.status === "active") ? "Approved" : 
                                                (space.status === "Rejected" || space.status === "REJECTED" || space.status === "Rejected" || space.status === "rejected") ? "Rejected" : 
                                                "Pending"
                                            }
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 items-center">
                                            {currentUserRole === "SUPER_ADMIN" && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="rounded-full hover:bg-red-500/10 text-red-500"
                                                    onClick={() => handleDeleteService(space.id, space.name || space.title)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-card/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>{space.name || space.title}</DialogTitle>
                                                        <DialogDescription>
                                                            {space.description || "No description provided."}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div className="flex flex-col col-span-2 border-b border-white/5 pb-3">
                                                                <span className="font-bold text-muted-foreground">Service ID</span>
                                                                <span className="font-mono mt-1 text-white/90">{space.id}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-muted-foreground">Category</span>
                                                                <span>{space.categoryId || space.category}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-muted-foreground">Price</span>
                                                                <span>₹{space.price}/day</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-muted-foreground">Location</span>
                                                                <span>{space.location}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-muted-foreground">Reach</span>
                                                                <span>{space.reach || "N/A"}</span>
                                                            </div>
                                                        </div>
                                                        {(space.status === "Rejected" || space.approvalStatus === "REJECTED") && space.rejectionReason && (
                                                            <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                                                <span className="text-xs font-bold text-red-500 uppercase">Rejection Reason</span>
                                                                <p className="text-sm text-red-700 mt-1">{space.rejectionReason}</p>
                                                            </div>
                                                        )}
                                                        {space.features && space.features.length > 0 && (
                                                            <div className="space-y-2">
                                                                <span className="font-bold text-xs text-muted-foreground uppercase">Features</span>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {space.features.map((f: string, i: number) => (
                                                                        <Badge key={i} variant="secondary" className="rounded-full bg-white/5">{f}</Badge>
                                                                    ))}
                                                                </div>
                                                                {(() => {
                                                            const spaceBookings = allBookings.filter(b => {
                                                                if (b.itemsJson) {
                                                                    try {
                                                                        const items = JSON.parse(b.itemsJson);
                                                                        if (items.some((item: any) => item.id === space.id)) return true;
                                                                    } catch (e) {}
                                                                } else if (b.services && Array.isArray(b.services)) {
                                                                    if (b.services.includes(space.id) || b.services.includes(space.title) || b.services.includes(space.name)) return true;
                                                                }
                                                                return false;
                                                            });
                                                            
                                                            return (
                                                                <div className="mt-6 pt-6 border-t border-white/10">
                                                                    <h3 className="text-sm font-semibold text-white mb-4">Booking History & Status</h3>
                                                                    {spaceBookings.length === 0 ? (
                                                                        <div className="text-sm text-muted-foreground p-4 bg-white/5 rounded-xl text-center border border-white/5">
                                                                            No bookings found for this service.
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-3">
                                                                            {spaceBookings.map((b, idx) => {
                                                                                const isCompleted = b.status?.toLowerCase() === 'completed' || b.status?.toLowerCase() === 'ended';
                                                                                const isFuture = new Date(b.startDate || 0) > new Date();
                                                                                const isCurrent = !isCompleted && !isFuture && new Date(b.endDate || 0) > new Date();
                                                                                
                                                                                let statusColor = "bg-gray-500/10 text-gray-400 border-gray-500/20";
                                                                                if (isCurrent) statusColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                                                                                else if (isFuture) statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                                                                                else if (isCompleted) statusColor = "bg-green-500/10 text-green-400 border-green-500/20";

                                                                                return (
                                                                                    <div key={b.id || idx} className="flex flex-col bg-black/20 p-3 rounded-xl border border-white/5">
                                                                                        <div className="flex justify-between items-start mb-1">
                                                                                            <span className="font-semibold text-sm text-white">{b.campaignName || "Untitled Campaign"}</span>
                                                                                            <Badge variant="outline" className={`text-[10px] uppercase ${statusColor}`}>
                                                                                                {isCurrent ? "Currently Running" : isFuture ? "Upcoming" : "Past/Completed"}
                                                                                            </Badge>
                                                                                        </div>
                                                                                        <div className="text-xs text-muted-foreground">
                                                                                            {new Date(b.startDate || b.createdAt).toLocaleDateString()} - {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'TBD'}
                                                                                        </div>
                                                                                        <div className="text-xs font-medium text-white/70 mt-2">
                                                                                            Booked by: {b.clientName || "Unknown"}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                            </div>
                                                        )}
                                                        {space.optionsJson && (
                                                            <div className="space-y-2">
                                                                <span className="font-bold text-xs text-muted-foreground uppercase">Add-on Services (Options)</span>
                                                                <div className="grid gap-2">
                                                                    {(() => {
                                                                        try {
                                                                            const options = JSON.parse(space.optionsJson);
                                                                            return options.map((opt: any, i: number) => (
                                                                                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-bold text-sm">{opt.name}</span>
                                                                                        <span className="text-xs text-muted-foreground">Min Duration: {opt.duration} day(s)</span>
                                                                                    </div>
                                                                                    <span className="font-bold text-green-500">₹{opt.price}</span>
                                                                                </div>
                                                                            ));
                                                                        } catch (e) {
                                                                            return <span className="text-xs text-red-500">Error parsing options</span>;
                                                                        }
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <DialogFooter className="gap-2">
                                                        {(space.status?.toUpperCase() === "PENDING" || space.approvalStatus?.toUpperCase() === "PENDING" || (!space.status && !space.approvalStatus)) ? (
                                                            <>
                                                                <Button variant="destructive" className="rounded-full px-6" onClick={() => {
                                                                    setSelectedSpaceForRejection(space);
                                                                    setIsRejectionDialogOpen(true);
                                                                }}>
                                                                    Reject
                                                                </Button>
                                                                <Button className="rounded-full px-6 bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(space.id, space.name || space.title, "Approved")}>
                                                                    Approve
                                                                </Button>
                                                            </>
                                                        ) : (space.status?.toLowerCase() === "deactivated" || space.approvalStatus?.toLowerCase() === "deactivated") ? (
                                                            <div className="flex w-full justify-center items-center">
                                                                <span className="text-muted-foreground text-sm font-bold">
                                                                    Vendor Deactivated
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex w-full justify-center">
                                                                <span className="text-muted-foreground text-sm">
                                                                    This listing is already <span className="font-bold">
                                                                        {(space.status === "Active" || space.status === "APPROVED" || space.status === "Approved") ? "Approved" : "Rejected"}
                                                                    </span>.
                                                                </span>
                                                            </div>
                                                        )}
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            {(space.status?.toUpperCase() === "PENDING" || space.approvalStatus?.toUpperCase() === "PENDING") && (
                                                <>
                                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-green-500/10 text-green-500" onClick={() => handleUpdateStatus(space.id, space.name || space.title, "Approved")}>
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-red-500/10 text-red-500" onClick={() => {
                                                        setSelectedSpaceForRejection(space);
                                                        setIsRejectionDialogOpen(true);
                                                    }}>
                                                        <XCircle className="h-5 w-5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Rejection Reason Dialog */}
            <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
                <DialogContent className="bg-card/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Reject Listing</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting &quot;{selectedSpaceForRejection?.name || selectedSpaceForRejection?.title}&quot;.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="reason" className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Reason</Label>
                        <Input 
                            id="reason"
                            placeholder="e.g., Incomplete details, invalid image..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="bg-white/5 border-none rounded-xl"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-full" onClick={() => setIsRejectionDialogOpen(false)}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            className="rounded-full" 
                            disabled={!rejectionReason.trim()}
                            onClick={() => handleUpdateStatus(selectedSpaceForRejection.id, selectedSpaceForRejection.name || selectedSpaceForRejection.title, "Rejected", rejectionReason)}
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
