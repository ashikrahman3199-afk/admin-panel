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
import { Eye, RefreshCw, Phone, CheckCircle, Clock } from "lucide-react";
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

export default function BookingsPage() {
    const [mounted, setMounted] = useState(false);
    const [bookings, setBookings] = useState<Array<any>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");
    const [updateLoading, setUpdateLoading] = useState(false);

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

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/5">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[120px] text-muted-foreground/70">Order Date</TableHead>
                            <TableHead className="text-muted-foreground/70">Campaign Name</TableHead>
                            <TableHead className="text-muted-foreground/70">Client Info</TableHead>
                            <TableHead className="text-muted-foreground/70">Amount Paid</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    Loading bookings...
                                </TableCell>
                            </TableRow>
                        ) : bookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
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
                                        <Badge variant="outline" className={`rounded-full px-3 border-none ${
                                            booking.status?.toLowerCase() === 'approved' ? 'bg-green-500/10 text-green-500' :
                                            booking.status?.toLowerCase() === 'forwarded' ? 'bg-blue-500/10 text-blue-500' :
                                            booking.status?.toLowerCase() === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                            'bg-gray-500/10 text-gray-500'
                                        }`}>
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
                                        <Badge variant="outline" className={`rounded-full px-3 border-none ${
                                            selectedBooking.status?.toLowerCase() === 'approved' ? 'bg-green-500/10 text-green-500' :
                                            selectedBooking.status?.toLowerCase() === 'forwarded' ? 'bg-blue-500/10 text-blue-500' :
                                            selectedBooking.status?.toLowerCase() === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                            'bg-gray-500/10 text-gray-500'
                                        }`}>
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
