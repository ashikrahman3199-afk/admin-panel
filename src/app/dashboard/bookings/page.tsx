"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Eye,
    RefreshCw,
    Phone,
    PhoneCall,
    CheckCircle,
    Clock,
    CheckCircle2,
    Activity,
    ArrowRight,
    MessageSquare,
    Send,
    Plus,
    Search,
    Mail,
    ExternalLink,
    User,
    Calendar,
    Sparkles,
    ShieldAlert
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const getStatusColor = (status?: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
        case 'approved': 
        case 'completed':
        case 'ended':
            return 'bg-green-500/10 text-green-500';
        case 'forwarded': return 'bg-blue-500/10 text-blue-500';
        case 'confirmed': return 'bg-emerald-500/10 text-emerald-400';
        case 'pending': return 'bg-yellow-500/10 text-yellow-500';
        case 'preparing': return 'bg-orange-500/10 text-orange-500';
        case 'live': return 'bg-purple-500/10 text-purple-500';
        case 'extended': return 'bg-indigo-500/10 text-indigo-500';
        case 'delayed': return 'bg-red-500/10 text-red-400';
        default: return 'bg-gray-500/10 text-gray-400';
    }
};

const ProgressTimeline = ({ status }: { status?: string }) => {
    const s = (status || '').toLowerCase();
    
    // Mapping current status to a progress level (0-4)
    let progressLevel = 0;
    if (['forwarded', 'confirmed'].includes(s)) progressLevel = 1;
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

    if (progressLevel === 0) return null;

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
    const [userMessage, setUserMessage] = useState("");
    const [updateLoading, setUpdateLoading] = useState(false);
    const [filterType, setFilterType] = useState<'ALL' | 'CALLBACK' | 'REQUESTED' | 'APPROVED'>('ALL');
    const [searchQuery, setSearchQuery] = useState("");

    // Create New Booking / Callback Dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [newBookingData, setNewBookingData] = useState({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        campaignName: "",
        amount: "",
        paymentType: "callback",
        notes: "",
        notifyUser: true
    });

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const filter = params.get('filter');
            if (filter === 'callback') {
                setFilterType('CALLBACK');
            }
        }
    }, []);

    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/bookings');
            const data = await response.json();
            if (data.success) {
                setBookings(data.bookings || []);
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

    // Handle updating status (e.g., Forwarded, Delayed, Confirmed)
    const handleUpdateStatus = async (newStatus: string, additionalUpdates: Record<string, any> = {}) => {
        if (!selectedBooking) return;
        setUpdateLoading(true);
        try {
            const updates: any = { 
                status: newStatus,
                ...additionalUpdates
            };
            if (adminNotes.trim()) {
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

    // Mark callback as contacted
    const handleMarkContacted = async () => {
        if (!selectedBooking) return;
        setUpdateLoading(true);
        try {
            const now = new Date().toISOString();
            const updates: any = {
                callbackStatus: 'CONTACTED',
                contactedAt: now,
                status: selectedBooking.status?.toLowerCase() === 'pending' ? 'CONFIRMED' : selectedBooking.status
            };
            if (adminNotes.trim()) {
                updates.adminNotes = adminNotes;
            }

            // Also send notification to user app
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedBooking.id,
                    updates,
                    sendUserNotification: true,
                    userNotification: {
                        userId: selectedBooking.userId,
                        title: "Callback Request Update",
                        message: `Our representative has processed your callback request for "${selectedBooking.campaignName}". We are actively coordinating your ad campaign.`,
                        type: "CALLBACK"
                    }
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Client Contacted", { description: "Callback marked as contacted & update sent to user app." });
                setIsReviewOpen(false);
                fetchBookings();
            } else {
                toast.error("Update Failed", { description: data.error || "Failed to update callback." });
            }
        } catch (error) {
            toast.error("Error", { description: "Could not mark as contacted." });
        } finally {
            setUpdateLoading(false);
        }
    };

    // Send custom In-App notification directly to user app
    const handleSendUserNotification = async () => {
        if (!selectedBooking) return;
        if (!userMessage.trim()) {
            toast.error("Empty Message", { description: "Please enter a message to send to the user." });
            return;
        }

        setUpdateLoading(true);
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedBooking.id,
                    updates: adminNotes.trim() ? { adminNotes } : undefined,
                    sendUserNotification: true,
                    userNotification: {
                        userId: selectedBooking.userId,
                        title: `Callback Update: ${selectedBooking.campaignName || 'Campaign'}`,
                        message: userMessage.trim(),
                        type: "CALLBACK"
                    }
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Notification Delivered", { 
                    description: `Sent directly to ${selectedBooking.clientName || 'user'}'s mobile app!` 
                });
                setUserMessage("");
                fetchBookings();
            } else {
                toast.error("Delivery Failed", { description: data.error || "Could not send notification." });
            }
        } catch (error) {
            toast.error("Error", { description: "Failed to dispatch notification to user." });
        } finally {
            setUpdateLoading(false);
        }
    };

    // Handle manual booking/callback creation
    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBookingData.campaignName || !newBookingData.clientName) {
            toast.error("Missing Details", { description: "Please provide campaign name and client name." });
            return;
        }

        setCreateLoading(true);
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    create: true,
                    sendUserNotification: newBookingData.notifyUser,
                    newBooking: {
                        userName: newBookingData.clientName,
                        userPhone: newBookingData.clientPhone,
                        userId: newBookingData.clientEmail || `client-${Date.now()}@direct.com`,
                        campaignName: newBookingData.campaignName,
                        amount: Number(newBookingData.amount) || 0,
                        paymentType: newBookingData.paymentType,
                        adminNotes: newBookingData.notes,
                        status: newBookingData.paymentType === 'callback' ? 'PENDING' : 'CONFIRMED'
                    },
                    userNotification: {
                        title: newBookingData.paymentType === 'callback' ? "Callback Request Registered" : "Booking Confirmed",
                        message: `Your booking for "${newBookingData.campaignName}" has been registered by the administration team.`
                    }
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Booking Created", { description: "New booking logged and synced." });
                setIsCreateOpen(false);
                setNewBookingData({
                    clientName: "",
                    clientPhone: "",
                    clientEmail: "",
                    campaignName: "",
                    amount: "",
                    paymentType: "callback",
                    notes: "",
                    notifyUser: true
                });
                fetchBookings();
            } else {
                toast.error("Creation Failed", { description: data.error || "Could not create booking." });
            }
        } catch (error) {
            toast.error("Error", { description: "Failed to create booking." });
        } finally {
            setCreateLoading(false);
        }
    };

    const openReviewDialog = (booking: any) => {
        setSelectedBooking(booking);
        setAdminNotes(booking.adminNotes || "");
        setUserMessage("");
        setIsReviewOpen(true);
    };

    // Filter calculations
    const callbackBookings = useMemo(() => {
        return bookings.filter(b => (b.paymentType || '').toLowerCase() === 'callback');
    }, [bookings]);

    const pendingCallbacksCount = useMemo(() => {
        return callbackBookings.filter(b => {
            const s = (b.status || '').toLowerCase();
            const cs = (b.callbackStatus || '').toLowerCase();
            return (s === 'pending' || cs === 'pending' || !cs) && cs !== 'contacted';
        }).length;
    }, [callbackBookings]);

    const extRequestedCount = useMemo(() => {
        return bookings.filter(b => b.extensionStatus?.toLowerCase() === 'requested').length;
    }, [bookings]);

    const extApprovedCount = useMemo(() => {
        return bookings.filter(b => b.extensionStatus?.toLowerCase() === 'approved').length;
    }, [bookings]);

    // Filtered by tab and search
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            // Tab filter
            if (filterType === 'CALLBACK' && (b.paymentType || '').toLowerCase() !== 'callback') return false;
            if (filterType === 'REQUESTED' && b.extensionStatus?.toLowerCase() !== 'requested') return false;
            if (filterType === 'APPROVED' && b.extensionStatus?.toLowerCase() !== 'approved') return false;

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const idMatch = (b.id || '').toLowerCase().includes(q);
                const nameMatch = (b.clientName || '').toLowerCase().includes(q);
                const phoneMatch = (b.clientPhone || '').toLowerCase().includes(q);
                const campMatch = (b.campaignName || '').toLowerCase().includes(q);
                const emailMatch = (b.clientEmail || '').toLowerCase().includes(q);
                return idMatch || nameMatch || phoneMatch || campMatch || emailMatch;
            }

            return true;
        });
    }, [bookings, filterType, searchQuery]);

    // Clean phone number for WhatsApp and Tel
    const cleanPhone = (phone?: string) => {
        if (!phone) return "";
        return phone.replace(/[^0-9]/g, '');
    };

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        Bookings & Callback Requests
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Manage client callback requests, orders, and directly reach users via Call, WhatsApp, or App Notification.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        size="sm"
                        className="rounded-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Log Callback / Booking
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full gap-2 bg-white/5 border-white/10"
                        onClick={fetchBookings}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex items-center gap-1 overflow-x-auto">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`rounded-xl px-3.5 h-8 text-xs font-semibold shrink-0 ${
                            filterType === 'ALL' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-white hover:bg-white/10'
                        }`}
                        onClick={() => setFilterType('ALL')}
                    >
                        All Bookings ({bookings.length})
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`rounded-xl px-3.5 h-8 text-xs font-semibold shrink-0 flex items-center gap-1.5 ${
                            filterType === 'CALLBACK' 
                                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30' 
                                : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10'
                        }`}
                        onClick={() => setFilterType('CALLBACK')}
                    >
                        <PhoneCall className="h-3.5 w-3.5" />
                        Callback Requests ({callbackBookings.length})
                        {pendingCallbacksCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-amber-700 animate-pulse">
                                {pendingCallbacksCount} Pending
                            </span>
                        )}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`rounded-xl px-3.5 h-8 text-xs font-semibold shrink-0 ${
                            filterType === 'REQUESTED' 
                                ? 'bg-orange-500 text-white shadow-sm' 
                                : 'text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10'
                        }`}
                        onClick={() => setFilterType('REQUESTED')}
                    >
                        Extension Requests ({extRequestedCount})
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`rounded-xl px-3.5 h-8 text-xs font-semibold shrink-0 ${
                            filterType === 'APPROVED' 
                                ? 'bg-green-500 text-white shadow-sm' 
                                : 'text-muted-foreground hover:text-green-400 hover:bg-green-500/10'
                        }`}
                        onClick={() => setFilterType('APPROVED')}
                    >
                        Extensions Approved ({extApprovedCount})
                    </Button>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search client, phone, campaign..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 rounded-xl bg-white/5 border-white/10 text-xs focus-visible:ring-primary/50"
                    />
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/5">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[110px] text-muted-foreground/70">Booking ID</TableHead>
                            <TableHead className="w-[110px] text-muted-foreground/70">Order Date</TableHead>
                            <TableHead className="text-muted-foreground/70">Campaign Name</TableHead>
                            <TableHead className="text-muted-foreground/70">Request Type</TableHead>
                            <TableHead className="text-muted-foreground/70">Client Contact</TableHead>
                            <TableHead className="text-muted-foreground/70">Amount Paid</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                                    Loading bookings & callback requests...
                                </TableCell>
                            </TableRow>
                        ) : filteredBookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                                    {filterType === 'CALLBACK' 
                                        ? "No callback requests match the filter." 
                                        : "No bookings found matching current criteria."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBookings.map((booking) => {
                                const isCallback = (booking.paymentType || '').toLowerCase() === 'callback';
                                const isPendingCallback = isCallback && (
                                    (booking.status || '').toLowerCase() === 'pending' || 
                                    (booking.callbackStatus || '').toLowerCase() === 'pending' ||
                                    !booking.callbackStatus
                                ) && booking.callbackStatus?.toLowerCase() !== 'contacted';

                                return (
                                    <TableRow key={booking.id} className="hover:bg-white/5 border-none transition-colors group">
                                        <TableCell className="font-medium text-xs text-muted-foreground font-mono uppercase" title={booking.id}>
                                            #{booking.id.replace(/^booking-/i, '').substring(0, 8)}
                                        </TableCell>
                                        <TableCell className="font-medium text-xs text-muted-foreground">
                                            {new Date(booking.orderDate || booking.createdAt || Date.now()).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="font-semibold text-sm">
                                            {booking.campaignName || "Untitled Campaign"}
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
                                        <TableCell>
                                            {isCallback ? (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-none text-[10px] px-2 py-0.5 font-semibold flex items-center gap-1">
                                                        <PhoneCall className="h-3 w-3" />
                                                        CALLBACK REQUEST
                                                    </Badge>
                                                    {isPendingCallback ? (
                                                        <span className="text-[10px] font-medium text-amber-400 flex items-center gap-1">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                            Needs Contact
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-green-400 flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Contacted
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (booking.paymentType || '').toLowerCase() === 'full' ? (
                                                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-none text-[10px] px-2 py-0.5">
                                                    FULL PAYMENT
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-none text-[10px] px-2 py-0.5">
                                                    ADVANCE PAID
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{booking.clientName}</span>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                    <Phone className="h-3 w-3 text-primary" />
                                                    <span>{booking.clientPhone}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-semibold">
                                            ₹{(booking.amount || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`rounded-full px-3 border-none font-medium ${getStatusColor(booking.status)}`}>
                                                {booking.status?.toUpperCase() || "PENDING"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {isCallback && (
                                                    <Button 
                                                        size="sm" 
                                                        className="rounded-full h-8 text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                                                        onClick={() => openReviewDialog(booking)}
                                                    >
                                                        <PhoneCall className="h-3.5 w-3.5 mr-1" />
                                                        Reach User
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="rounded-full h-8 text-xs bg-white/5 hover:bg-white/10" 
                                                    onClick={() => openReviewDialog(booking)}
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                                    Review
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Review & Reach Client Dialog */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    Booking & Client Management
                                    {selectedBooking?.isCallback && (
                                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 text-xs">
                                            Callback Request
                                        </Badge>
                                    )}
                                </DialogTitle>
                                <DialogDescription>
                                    Reach out to the customer directly via Phone, WhatsApp, or send an in-app notification to their mobile app.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedBooking && (
                        <div className="space-y-6 py-2">
                            <ProgressTimeline status={selectedBooking.status} />

                            {/* REACH USER ACTION HUB (Top Priority) */}
                            <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 via-primary/10 to-purple-500/10 border border-amber-500/30 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <PhoneCall className="h-4 w-4" />
                                        Direct Client Outreach (Reach User)
                                    </h3>
                                    {selectedBooking.clientPhone && (
                                        <span className="text-xs font-mono font-medium text-white/80">
                                            {selectedBooking.clientPhone}
                                        </span>
                                    )}
                                </div>

                                {/* Quick Contact Buttons */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {/* Direct Phone Call */}
                                    <a 
                                        href={`tel:${cleanPhone(selectedBooking.clientPhone)}`}
                                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-500/30 text-xs font-semibold transition-colors"
                                    >
                                        <Phone className="h-4 w-4 text-blue-400" />
                                        Call Customer
                                    </a>

                                    {/* Direct WhatsApp */}
                                    <a 
                                        href={`https://wa.me/91${cleanPhone(selectedBooking.clientPhone)}?text=${encodeURIComponent(
                                            `Hello ${selectedBooking.clientName}, this is from the Ad Platform team regarding your callback request for campaign "${selectedBooking.campaignName || 'Ad Campaign'}". How can we assist you with your booking?`
                                        )}`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/30 text-xs font-semibold transition-colors"
                                    >
                                        <MessageSquare className="h-4 w-4 text-emerald-400" />
                                        WhatsApp Chat
                                    </a>

                                    {/* Direct Email */}
                                    <a 
                                        href={`mailto:${selectedBooking.clientEmail}?subject=${encodeURIComponent(
                                            `Update on your Ad Campaign: ${selectedBooking.campaignName || 'Booking'}`
                                        )}`}
                                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-colors"
                                    >
                                        <Mail className="h-4 w-4 text-purple-400" />
                                        Send Email
                                    </a>
                                </div>

                                {/* Send Notification Directly to User Mobile App */}
                                <div className="pt-3 border-t border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                                            <Send className="h-3.5 w-3.5 text-primary" />
                                            Send In-App Notification to User&apos;s Mobile App
                                        </label>
                                        <span className="text-[10px] text-muted-foreground">
                                            Account: {selectedBooking.clientEmail}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Write message to appear directly in client's app notifications..."
                                            value={userMessage}
                                            onChange={(e) => setUserMessage(e.target.value)}
                                            className="bg-black/40 border-white/10 text-xs h-9"
                                        />
                                        <Button
                                            size="sm"
                                            className="h-9 px-4 rounded-xl bg-primary text-white shrink-0 gap-1.5"
                                            onClick={handleSendUserNotification}
                                            disabled={updateLoading || !userMessage.trim()}
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            Send to App
                                        </Button>
                                    </div>

                                    {/* Message Quick Presets */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        <button
                                            type="button"
                                            className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors border border-white/5"
                                            onClick={() => setUserMessage(`We received your callback request for "${selectedBooking.campaignName}". Our representative will reach out shortly.`)}
                                        >
                                            💡 Callback Received
                                        </button>
                                        <button
                                            type="button"
                                            className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors border border-white/5"
                                            onClick={() => setUserMessage(`Your campaign booking for "${selectedBooking.campaignName}" has been confirmed by our team.`)}
                                        >
                                            💡 Booking Confirmed
                                        </button>
                                        <button
                                            type="button"
                                            className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors border border-white/5"
                                            onClick={() => setUserMessage(`We attempted to call your number regarding "${selectedBooking.campaignName}". Please let us know your preferred call time.`)}
                                        >
                                            💡 Attempted Call
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info Card */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Client Profile</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Customer Name</div>
                                        <div className="font-semibold text-sm">{selectedBooking.clientName}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Phone Number</div>
                                        <div className="font-semibold text-sm font-mono flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-primary" />
                                            {selectedBooking.clientPhone}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-xs text-muted-foreground mb-1">Email / Account ID</div>
                                        <div className="font-medium text-sm font-mono">{selectedBooking.clientEmail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Campaign Overview</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Booking ID</div>
                                        <div className="font-medium text-sm font-mono">#{selectedBooking.id.replace(/^booking-/i, '')}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Service ID</div>
                                        <div className="font-medium text-sm font-mono">
                                            {(() => {
                                                try {
                                                    if (selectedBooking.itemsJson) {
                                                        const items = JSON.parse(selectedBooking.itemsJson);
                                                        if (items && items.length > 0 && items[0].id) {
                                                            return items[0].id;
                                                        }
                                                    }
                                                } catch (e) {}
                                                return "N/A";
                                            })()}
                                        </div>
                                    </div>
                                    <div className="col-span-2 border-t border-white/10 pt-4 mt-2"></div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Campaign Name</div>
                                        <div className="font-semibold text-sm">{selectedBooking.campaignName || "Untitled"}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Amount / Advance Paid</div>
                                        <div className="font-semibold text-sm text-green-400">₹{(selectedBooking.amount || 0).toLocaleString()}</div>
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
                                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                                        Extension Status
                                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border-none ${
                                            selectedBooking.extensionStatus.toLowerCase() === 'requested' ? 'bg-orange-500/20 text-orange-400' :
                                            selectedBooking.extensionStatus.toLowerCase() === 'approved' ? 'bg-green-500/20 text-green-400' :
                                            'bg-white/10 text-white'
                                        }`}>
                                            {selectedBooking.extensionStatus.toUpperCase()}
                                        </Badge>
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedBooking.extensionStatus.toLowerCase() === 'requested' 
                                            ? "A campaign extension has been requested. Please coordinate with the vendor or client."
                                            : "The campaign extension has been approved."}
                                    </p>
                                </div>
                            )}

                            {/* Admin Notes */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                                    Callback Summary & Admin Notes
                                </h3>
                                <Textarea 
                                    placeholder="Enter conversation notes, client preferences, or fulfillment instructions here..."
                                    className="min-h-[90px] resize-none bg-black/40 border-white/10 focus-visible:ring-primary/50 text-xs"
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 pt-4 border-t border-white/10">
                        <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
                            Close
                        </Button>
                        <div className="flex items-center gap-2 flex-wrap">
                            {selectedBooking?.isCallback && (
                                <Button
                                    variant="secondary"
                                    className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-none text-xs"
                                    onClick={handleMarkContacted}
                                    disabled={updateLoading}
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                    Mark Contacted
                                </Button>
                            )}
                            <Button 
                                variant="secondary" 
                                className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-none text-xs"
                                onClick={() => handleUpdateStatus("DELAYED")}
                                disabled={updateLoading}
                            >
                                <Clock className="h-4 w-4 mr-1.5" />
                                Mark Delayed
                            </Button>
                            <Button 
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                onClick={() => handleUpdateStatus("FORWARDED")}
                                disabled={updateLoading}
                            >
                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                Forward to Vendor
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Callback / Booking Creation Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-amber-400" />
                            Log Direct Callback / Booking
                        </DialogTitle>
                        <DialogDescription>
                            Record an offline client request or phone call directly into the database.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateBooking} className="space-y-4 py-2">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                Client Name *
                            </label>
                            <Input
                                required
                                placeholder="e.g. Sivanesh"
                                value={newBookingData.clientName}
                                onChange={(e) => setNewBookingData({ ...newBookingData, clientName: e.target.value })}
                                className="bg-black/30 border-white/10 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                    Phone Number
                                </label>
                                <Input
                                    placeholder="e.g. 9080052410"
                                    value={newBookingData.clientPhone}
                                    onChange={(e) => setNewBookingData({ ...newBookingData, clientPhone: e.target.value })}
                                    className="bg-black/30 border-white/10 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                    Client Email / Account
                                </label>
                                <Input
                                    type="email"
                                    placeholder="client@gmail.com"
                                    value={newBookingData.clientEmail}
                                    onChange={(e) => setNewBookingData({ ...newBookingData, clientEmail: e.target.value })}
                                    className="bg-black/30 border-white/10 text-xs"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                Campaign / Service Name *
                            </label>
                            <Input
                                required
                                placeholder="e.g. Skywalk Outer Facade"
                                value={newBookingData.campaignName}
                                onChange={(e) => setNewBookingData({ ...newBookingData, campaignName: e.target.value })}
                                className="bg-black/30 border-white/10 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                    Amount / Budget (₹)
                                </label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 246000"
                                    value={newBookingData.amount}
                                    onChange={(e) => setNewBookingData({ ...newBookingData, amount: e.target.value })}
                                    className="bg-black/30 border-white/10 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                    Request Type
                                </label>
                                <select
                                    value={newBookingData.paymentType}
                                    onChange={(e) => setNewBookingData({ ...newBookingData, paymentType: e.target.value })}
                                    className="w-full h-9 rounded-md bg-black/40 border border-white/10 text-xs px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value="callback" className="bg-[#1a1a1a]">📞 Callback Request</option>
                                    <option value="advance" className="bg-[#1a1a1a]">₹ Direct Order (Advance)</option>
                                    <option value="full" className="bg-[#1a1a1a]">₹ Full Payment</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                Request Summary & Notes
                            </label>
                            <Textarea
                                placeholder="Summary of client's requirements from phone conversation..."
                                value={newBookingData.notes}
                                onChange={(e) => setNewBookingData({ ...newBookingData, notes: e.target.value })}
                                className="min-h-[70px] bg-black/30 border-white/10 text-xs resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="notifyCheckbox"
                                checked={newBookingData.notifyUser}
                                onChange={(e) => setNewBookingData({ ...newBookingData, notifyUser: e.target.checked })}
                                className="rounded border-white/20"
                            />
                            <label htmlFor="notifyCheckbox" className="text-xs text-muted-foreground cursor-pointer">
                                Dispatch in-app notification to client&apos;s mobile app
                            </label>
                        </div>

                        <DialogFooter className="mt-4 pt-3 border-t border-white/10">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                                disabled={createLoading}
                            >
                                {createLoading ? "Saving..." : "Create & Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
