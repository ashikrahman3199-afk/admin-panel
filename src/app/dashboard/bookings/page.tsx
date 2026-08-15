"use client";

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
import { Eye, RefreshCw, Phone, CheckCircle, Clock, CheckCircle2, Play, Activity, FastForward, ArrowRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/resource";

const client = generateClient<Schema>();

const getStatusColor = (status?: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
        case 'approved': 
        case 'completed':
        case 'ended':
            return 'bg-green-500/10 text-green-500';
        case 'forwarded': return 'bg-blue-500/10 text-blue-500';
        case 'pending': return 'bg-yellow-500/10 text-yellow-500';
        case 'preparing': return 'bg-orange-500/10 text-orange-500';
        case 'live': return 'bg-purple-500/10 text-purple-500';
        case 'extended': return 'bg-indigo-500/10 text-indigo-500';
        default: return 'bg-gray-500/10 text-gray-500';
    }
};

const ProgressTimeline = ({ status }: { status?: string }) => {
    const s = (status || '').toLowerCase();
    
    // Mapping current status to a progress level (0-4)
    let progressLevel = 0;
    if (['forwarded'].includes(s)) progressLevel = 1;
    if (['preparing'].includes(s)) progressLevel = 2;
    if (['live'].includes(s)) progressLevel = 3;
    if (['extended'].includes(s)) progressLevel = 3.5; 
    if (['ended', 'completed'].includes(s)) progressLevel = 4;

    const stages = [
        { level: 1, label: 'Forwarded', icon: ArrowRight },
        { level: 2, label: 'Preparing', icon: Clock },
        { level: 3, label: 'Live', icon: Activity },
        { level: 4, label: 'Completed', icon: CheckCircle2 },
    ];

    if (progressLevel === 0) return null; // Don't show timeline if pending/unforwarded

    return (
        <div className="border border-white/5 rounded-xl p-6 bg-black/20">
            <h3 className="text-xs font-semibold text-muted-foreground mb-6 uppercase tracking-wider text-center">Fulfillment Progress</h3>
            <div className="relative flex justify-between items-center px-2">
                {/* Connecting line */}
                <div className="absolute left-[10%] right-[10%] top-4 h-[2px] bg-white/10 z-0">
                    <div 
                        className="h-full bg-primary transition-all duration-500 ease-in-out"
                        style={{ width: `${Math.max(0, Math.min(100, (progressLevel - 1) * 33.33))}%` }}
                    />
                </div>
                
                {/* Stage Nodes */}
                {stages.map((stage) => {
                    const isActive = progressLevel >= stage.level;
                    const isExtended = progressLevel === 3.5 && stage.level === 3;
                    const Icon = stage.icon;
                    
                    return (
                        <div key={stage.label} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                                isActive 
                                    ? isExtended ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                                    : 'bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                : 'bg-[#1a1a1a] text-muted-foreground border border-white/10'
                            }`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className={`text-[10px] font-semibold ${isActive ? (isExtended ? 'text-indigo-400' : 'text-white') : 'text-muted-foreground'}`}>
                                {isExtended ? 'EXTENDED' : stage.label.toUpperCase()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function BookingsPage() {
    const [mounted, setMounted] = useState(false);
    const [bookings, setBookings] = useState<Array<any>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");
    const [updateLoading, setUpdateLoading] = useState(false);
    const [filterType, setFilterType] = useState<'ALL' | 'REQUESTED' | 'APPROVED'>('ALL');

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/bookings');
            const data = await response.json();
            if (data.success) {
                setBookings(data.bookings);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
            toast.error("Fetch Error", { description: "Failed to load bookings data." });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleUpdateStatus = async (newStatus: string) => {
        if (!selectedBooking) return;
        setUpdateLoading(true);
        try {
            const updates: any = { status: newStatus };
            if (adminNotes.trim()) {
                // If the booking model gets strictly typed and fails on extra fields, 
                // we store adminNotes in itemsJson or vendorProgressJson. 
                // We'll pass it to the API and let DynamoDB save it.
                updates.adminNotes = adminNotes;
            }

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedBooking.id,
                    updates
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Booking Updated", { description: `Booking status changed to ${newStatus}.` });
                setIsReviewOpen(false);
                fetchBookings();
            } else {
                toast.error("Update Failed", { description: data.error || "Failed to update booking." });
            }
        } catch (error) {
            toast.error("Error", { description: "An error occurred while updating the booking." });
        } finally {
            setUpdateLoading(false);
        }
    };

    const openReviewDialog = (booking: any) => {
        setSelectedBooking(booking);
        setAdminNotes(booking.adminNotes || "");
        setIsReviewOpen(true);
    };

    const filteredBookings = bookings.filter(b => {
        if (filterType === 'ALL') return true;
        if (filterType === 'REQUESTED') return b.extensionStatus?.toLowerCase() === 'requested';
        if (filterType === 'APPROVED') return b.extensionStatus?.toLowerCase() === 'approved';
        return true;
    });

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bookings Management</h1>
                    <p className="text-muted-foreground">
                        Manage client callback requests, orders, and advances.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white/5 p-1 rounded-full border border-white/10 flex items-center gap-1 mr-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`rounded-full px-4 h-8 text-xs font-semibold ${filterType === 'ALL' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-white hover:bg-white/10'}`}
                            onClick={() => setFilterType('ALL')}
                        >
                            All Bookings
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`rounded-full px-4 h-8 text-xs font-semibold ${filterType === 'REQUESTED' ? 'bg-orange-500 text-white' : 'text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10'}`}
                            onClick={() => setFilterType('REQUESTED')}
                        >
                            Extension Requests
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`rounded-full px-4 h-8 text-xs font-semibold ${filterType === 'APPROVED' ? 'bg-green-500 text-white' : 'text-muted-foreground hover:text-green-400 hover:bg-green-500/10'}`}
                            onClick={() => setFilterType('APPROVED')}
                        >
                            Extensions Approved
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full gap-2 bg-white/5 border-none"
                        onClick={fetchBookings}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/5">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[120px] text-muted-foreground/70">Order Date</TableHead>
                            <TableHead className="text-muted-foreground/70">Campaign Name</TableHead>
                            <TableHead className="text-muted-foreground/70">Service ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Client Info</TableHead>
                            <TableHead className="text-muted-foreground/70">Amount Paid</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                                    Loading bookings...
                                </TableCell>
                            </TableRow>
                        ) : bookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                                    No bookings found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            bookings.map((booking) => (
                                <TableRow key={booking.id} className="hover:bg-white/5 border-none transition-colors group">
                                    <TableCell className="font-medium text-xs text-muted-foreground">
                                        {new Date(booking.orderDate || booking.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-semibold text-sm">
                                        {booking.campaignName || "Untitled"}
                                        {booking.extensionStatus && (
                                            <div className="mt-1">
                                                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border-none ${
                                                    booking.extensionStatus.toLowerCase() === 'requested' ? 'bg-orange-500/20 text-orange-400' :
                                                    booking.extensionStatus.toLowerCase() === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                    'bg-white/10 text-white'
                                                }`}>
                                                    Ext: {booking.extensionStatus.toUpperCase()}
                                                </Badge>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium text-xs text-muted-foreground font-mono">
                                        {(() => {
                                            try {
                                                if (booking.itemsJson) {
                                                    const items = JSON.parse(booking.itemsJson);
                                                    if (items && items.length > 0 && items[0].id) {
                                                        return String(items[0].id).substring(0, 8);
                                                    }
                                                }
                                            } catch (e) {}
                                            return "N/A";
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{booking.clientName}</span>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                <Phone className="h-3 w-3" />
                                                {booking.clientPhone}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        ₹{(booking.amount || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`rounded-full px-3 border-none ${getStatusColor(booking.status)}`}>
                                            {booking.status?.toUpperCase() || "PENDING"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="rounded-full bg-white/5 hover:bg-white/10" onClick={() => openReviewDialog(booking)}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Review Dialog */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Booking Details</DialogTitle>
                        <DialogDescription>Review order information and contact the client.</DialogDescription>
                    </DialogHeader>

                    {selectedBooking && (
                        <div className="space-y-6 py-4">
                            <ProgressTimeline status={selectedBooking.status} />

                            {/* Contact Info Card */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Client Contact</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Name</div>
                                        <div className="font-medium text-sm">{selectedBooking.clientName}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Phone Number</div>
                                        <div className="font-medium text-sm flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-primary" />
                                            {selectedBooking.clientPhone}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-xs text-muted-foreground mb-1">Email</div>
                                        <div className="font-medium text-sm">{selectedBooking.clientEmail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Order Overview</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Campaign</div>
                                        <div className="font-medium text-sm">{selectedBooking.campaignName || "N/A"}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Advance Paid</div>
                                        <div className="font-medium text-sm text-green-400">₹{(selectedBooking.amount || 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Timeline</div>
                                        <div className="font-medium text-sm">
                                            {selectedBooking.startDate ? new Date(selectedBooking.startDate).toLocaleDateString() : 'TBD'} - 
                                            {selectedBooking.endDate ? new Date(selectedBooking.endDate).toLocaleDateString() : 'TBD'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Current Status</div>
                                        <Badge variant="outline" className={`rounded-full px-3 border-none ${getStatusColor(selectedBooking.status)}`}>
                                            {selectedBooking.status?.toUpperCase() || "PENDING"}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="text-xs text-muted-foreground mb-2">Services Booked</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedBooking.services?.map((svc: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="bg-white/10 text-xs py-1 px-3">
                                                {svc}
                                            </Badge>
                                        )) || <span className="text-sm text-muted-foreground">No specific services listed.</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Extension Details (Conditional) */}
                            {selectedBooking.extensionStatus && (
                                <div className={`rounded-xl p-4 border ${
                                    selectedBooking.extensionStatus.toLowerCase() === 'requested' ? 'bg-orange-500/5 border-orange-500/20' :
                                    selectedBooking.extensionStatus.toLowerCase() === 'approved' ? 'bg-green-500/5 border-green-500/20' :
                                    'bg-white/5 border-white/10'
                                }`}>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                                        Extension Status
                                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border-none ${
                                            selectedBooking.extensionStatus.toLowerCase() === 'requested' ? 'bg-orange-500/20 text-orange-400' :
                                            selectedBooking.extensionStatus.toLowerCase() === 'approved' ? 'bg-green-500/20 text-green-400' :
                                            'bg-white/10 text-white'
                                        }`}>
                                            {selectedBooking.extensionStatus.toUpperCase()}
                                        </Badge>
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {selectedBooking.extensionStatus.toLowerCase() === 'requested' 
                                            ? "A campaign extension has been requested. Please review and coordinate with the vendor or client if necessary."
                                            : selectedBooking.extensionStatus.toLowerCase() === 'approved'
                                            ? "The campaign extension has been approved. Ensure updated timelines and payments are tracked."
                                            : "Extension status update recorded."}
                                    </p>
                                </div>
                            )}

                            {/* Admin Notes */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Timeline & Delay Reasons (Admin Notes)</h3>
                                <Textarea 
                                    placeholder="Enter reasons for delay, callback summaries, or timeline adjustments here..."
                                    className="min-h-[100px] resize-none bg-black/40 border-white/10 focus-visible:ring-primary/50"
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex items-center justify-between mt-4">
                        <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="secondary" 
                                className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-none"
                                onClick={() => handleUpdateStatus("DELAYED")}
                                disabled={updateLoading}
                            >
                                <Clock className="h-4 w-4 mr-2" />
                                Mark Delayed
                            </Button>
                            <Button 
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleUpdateStatus("FORWARDED")}
                                disabled={updateLoading}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Forward to Vendor
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
