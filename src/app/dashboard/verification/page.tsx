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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    CheckCircle2, 
    XCircle, 
    Eye, 
    RefreshCw, 
    Trash2, 
    Pencil, 
    Plus, 
    Trash, 
    Search, 
    Power, 
    PowerOff, 
    ShieldCheck, 
    Clock, 
    Store 
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/resource";

const client = generateClient<Schema>();

export default function VerificationPage() {
    const [mounted, setMounted] = React.useState(false);
    const [adSpaces, setAdSpaces] = React.useState<Array<any>>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [selectedSpaceForRejection, setSelectedSpaceForRejection] = React.useState<any>(null);
    const [isRejectionDialogOpen, setIsRejectionDialogOpen] = React.useState(false);
    const [currentUserRole, setCurrentUserRole] = React.useState<string>("ADMIN");
    const [allBookings, setAllBookings] = React.useState<Array<any>>([]);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [editSpace, setEditSpace] = React.useState<any>(null);
    
    // New states for ON/OFF toggle and search/filter
    const [searchQuery, setSearchQuery] = React.useState("");
    const [filterTab, setFilterTab] = React.useState<'ALL' | 'LIVE' | 'OFF' | 'PENDING'>('ALL');
    const [togglingId, setTogglingId] = React.useState<string | null>(null);

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
            const data = result.adSpaces || [];
            
            // Sort: Pending first, then by date descending
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
    }, [fetchPendingAdSpaces]);

    // Helper: Determine if a service is LIVE and VISIBLE to users in the mobile/user app
    const isServiceLive = (space: any): boolean => {
        if (!space) return false;
        if (space.adminDisabled === true) return false;
        
        const status = (space.status || "").toUpperCase();
        const approval = (space.approvalStatus || "").toUpperCase();

        // If deactivated, rejected, pending, or off, it is NOT live
        if (status === "DEACTIVATED" || approval === "DEACTIVATED" || 
            status === "OFF" || approval === "OFF" ||
            status === "INACTIVE" || approval === "INACTIVE" ||
            status === "REJECTED" || approval === "REJECTED" ||
            approval === "PENDING" || status === "PENDING" ||
            approval === "PENDING_DEACTIVATION" || status === "PENDING_DEACTIVATION" ||
            approval === "DEACTIVATING_IN_30_DAYS" || status === "DEACTIVATING_IN_30_DAYS") {
            return false;
        }

        return status === "APPROVED" || status === "ACTIVE" || approval === "APPROVED";
    };

    // Toggle live status (ON/OFF)
    const handleToggleLive = async (space: any) => {
        const currentlyLive = isServiceLive(space);
        const targetLive = !currentlyLive;
        const targetStatus = targetLive ? "APPROVED" : "DEACTIVATED";

        // Optimistically update local state
        setAdSpaces(prev => prev.map(s => {
            if (s.id === space.id) {
                return {
                    ...s,
                    status: targetStatus,
                    approvalStatus: targetStatus,
                    isActive: targetLive,
                    isAvailable: targetLive,
                    adminDisabled: !targetLive
                };
            }
            return s;
        }));

        setTogglingId(space.id);

        try {
            const response = await fetch('/api/adspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: space.id,
                    toggleLive: targetLive
                })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error || "Failed to update service status");

            if (targetLive) {
                toast.success("Service Turned ON", { 
                    description: `"${space.name || space.title}" is now LIVE and visible to users in the app.` 
                });
            } else {
                toast.info("Service Turned OFF", { 
                    description: `"${space.name || space.title}" is now HIDDEN from the user app.` 
                });
            }
        } catch (err: any) {
            console.error("Toggle error:", err);
            toast.error("Failed to update status", { description: err.message });
            fetchPendingAdSpaces(); // Revert on failure
        } finally {
            setTogglingId(null);
        }
    };

    const openEditDialog = (space: any) => {
        let imgs = space.images || [];
        if (imgs.length === 0 && space.image) {
            imgs = [space.image];
        }
        setEditSpace({ ...space, images: imgs });
        setIsEditDialogOpen(true);
    };

    const handleUpdateDetails = async () => {
        if (!editSpace) return;
        try {
            const isLive = isServiceLive(editSpace);
            const targetStatus = isLive ? "APPROVED" : "DEACTIVATED";

            const res = await fetch('/api/adspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editSpace.id,
                    updates: {
                        name: editSpace.name,
                        title: editSpace.title,
                        category: editSpace.category,
                        price: Number(editSpace.price),
                        location: editSpace.location,
                        description: editSpace.description,
                        image: (editSpace.images && editSpace.images.length > 0) ? editSpace.images[0] : editSpace.image,
                        images: editSpace.images || [],
                        details: editSpace.details,
                        status: targetStatus,
                        approvalStatus: targetStatus,
                        isActive: isLive,
                        isAvailable: isLive,
                        adminDisabled: !isLive
                    }
                })
            });
            if (!res.ok) throw new Error("API Request Failed");
            
            setAdSpaces(prev => prev.map(s => s.id === editSpace.id ? { ...s, ...editSpace, status: targetStatus, approvalStatus: targetStatus } : s));
            toast.success("Service Updated", { description: "The service details and visibility have been saved." });
            setIsEditDialogOpen(false);
        } catch (error) {
            toast.error("Error", { description: "Failed to update service." });
        }
    };

    const handleUpdateStatus = async (id: string, name: string, status: "Approved" | "Rejected" | "Pending", reason?: string) => {
        try {
            const mappedStatus = status === "Approved" ? "APPROVED" : status.toUpperCase();
            
            const response = await fetch('/api/adspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id, 
                    approvalStatus: mappedStatus, 
                    rejectionReason: reason,
                    toggleLive: status === "Approved" ? true : false
                })
            });
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            toast.success(`Listing ${status}`, { description: `${name} has been ${status.toLowerCase()}.` });
            setIsRejectionDialogOpen(false);
            setRejectionReason("");
            fetchPendingAdSpaces();
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

    // Filter calculations
    const liveCount = adSpaces.filter(s => isServiceLive(s)).length;
    const offCount = adSpaces.filter(s => !isServiceLive(s) && (s.approvalStatus !== 'PENDING' && s.status !== 'PENDING')).length;
    const pendingCount = adSpaces.filter(s => s.approvalStatus === 'PENDING' || s.approvalStatus === 'Pending' || s.status === 'PENDING').length;

    const filteredAdSpaces = adSpaces.filter(space => {
        // Tab filter
        const isLive = isServiceLive(space);
        const isPending = space.approvalStatus === 'PENDING' || space.approvalStatus === 'Pending' || space.status === 'PENDING';

        if (filterTab === 'LIVE' && !isLive) return false;
        if (filterTab === 'OFF' && (isLive || isPending)) return false;
        if (filterTab === 'PENDING' && !isPending) return false;

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (space.name && space.name.toLowerCase().includes(q)) ||
            (space.title && space.title.toLowerCase().includes(q)) ||
            (space.category && space.category.toLowerCase().includes(q)) ||
            (space.location && space.location.toLowerCase().includes(q)) ||
            (space.id && space.id.toLowerCase().includes(q)) ||
            (space.vendorId && space.vendorId.toLowerCase().includes(q))
        );
    });

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Service Verification & Visibility</h1>
                    <p className="text-muted-foreground mt-0.5">
                        Manage vendor services, review new listings, and control user visibility (ON/OFF).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full gap-2 bg-white/5 border-white/10 hover:bg-white/10"
                        onClick={fetchPendingAdSpaces}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Summary Metric Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                        <Store className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{adSpaces.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All platform service listings
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            Live Services (ON)
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        </CardTitle>
                        <Power className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">{liveCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Visible to users in the app
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Turned OFF (Hidden)</CardTitle>
                        <PowerOff className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">{offCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hidden from users in the app
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
                        <Clock className={`h-4 w-4 ${pendingCount > 0 ? 'text-amber-400' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${pendingCount > 0 ? 'text-amber-400' : ''}`}>{pendingCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Awaiting admin review
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="inline-flex rounded-full bg-white/5 p-1 border border-white/10">
                    <button
                        onClick={() => setFilterTab('ALL')}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                            filterTab === 'ALL'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-white'
                        }`}
                    >
                        All Services ({adSpaces.length})
                    </button>
                    <button
                        onClick={() => setFilterTab('LIVE')}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                            filterTab === 'LIVE'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-muted-foreground hover:text-white'
                        }`}
                    >
                        Live / ON ({liveCount})
                    </button>
                    <button
                        onClick={() => setFilterTab('OFF')}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                            filterTab === 'OFF'
                                ? 'bg-zinc-700 text-white shadow-sm'
                                : 'text-muted-foreground hover:text-white'
                        }`}
                    >
                        Turned OFF ({offCount})
                    </button>
                    <button
                        onClick={() => setFilterTab('PENDING')}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                            filterTab === 'PENDING'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-muted-foreground hover:text-white'
                        }`}
                    >
                        Pending ({pendingCount})
                    </button>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search service, category, location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 rounded-full bg-white/5 border-white/10 text-sm focus:border-primary"
                    />
                </div>
            </div>

            {/* Services Table */}
            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/5">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-white/10">
                            <TableHead className="w-[80px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Service Details</TableHead>
                            <TableHead className="text-muted-foreground/70">Category</TableHead>
                            <TableHead className="text-muted-foreground/70">Location</TableHead>
                            <TableHead className="text-muted-foreground/70">Price</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-center text-muted-foreground/70">User Visibility (Live)</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Loading listings...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredAdSpaces.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                                    No services found matching your filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAdSpaces.map((space) => {
                                const isLive = isServiceLive(space);
                                const isPending = space.approvalStatus === 'PENDING' || space.approvalStatus === 'Pending' || space.status === 'PENDING';
                                const isDeactivated = space.status?.toLowerCase() === "deactivated" || space.approvalStatus?.toLowerCase() === "deactivated";

                                return (
                                    <TableRow key={space.id} className="hover:bg-white/5 border-white/5 transition-colors group">
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {space.id.substring(0, 8)}
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {space.image ? (
                                                    <img 
                                                        src={space.image} 
                                                        alt="Thumbnail" 
                                                        className="w-10 h-10 rounded-xl object-cover bg-white/10 shrink-0" 
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                                        <Store className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <span className="font-bold text-sm text-foreground/90 block truncate max-w-[180px]">
                                                        {space.name || space.title}
                                                    </span>
                                                    {space.vendorId && (
                                                        <span className="text-[11px] text-muted-foreground block truncate max-w-[180px]">
                                                            {space.vendorId}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <Badge variant="outline" className="rounded-full bg-white/5 border-white/10 text-xs">
                                                {space.categoryId || space.category}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-sm text-foreground/80">
                                            {space.location}
                                        </TableCell>

                                        <TableCell className="font-bold text-sm whitespace-nowrap">
                                            ₹{space.price || 0}/{space.priceUnit?.toLowerCase() === 'days' ? 'day' : 'month'}
                                        </TableCell>

                                        <TableCell>
                                            <Badge 
                                                variant="secondary" 
                                                className={`rounded-full px-3 py-0.5 text-xs font-semibold border-none ${
                                                    isDeactivated
                                                        ? "bg-gray-500/15 text-gray-400" 
                                                    : (space.approvalStatus === "PENDING_DEACTIVATION" || space.approvalStatus === "deactivation_requested" || space.status === "deactivation_requested")
                                                        ? "bg-orange-500/15 text-orange-400"
                                                    : (space.approvalStatus === "DEACTIVATING_IN_30_DAYS" || space.status === "DEACTIVATING_IN_30_DAYS")
                                                        ? "bg-purple-500/15 text-purple-400"
                                                    : isLive
                                                        ? "bg-emerald-500/15 text-emerald-400" 
                                                    : (space.status?.toLowerCase() === "rejected" || space.approvalStatus?.toLowerCase() === "rejected")
                                                        ? "bg-red-500/15 text-red-400"
                                                        : "bg-amber-500/15 text-amber-400"
                                                }`}
                                            >
                                                {
                                                    isDeactivated ? "Deactivated" : 
                                                    (space.approvalStatus === "PENDING_DEACTIVATION" || space.approvalStatus === "deactivation_requested" || space.status === "deactivation_requested") ? "Deactivation Req." :
                                                    (space.approvalStatus === "DEACTIVATING_IN_30_DAYS" || space.status === "DEACTIVATING_IN_30_DAYS") ? "Deactivating (30d)" :
                                                    isLive ? "Approved" : 
                                                    (space.status?.toLowerCase() === "rejected" || space.approvalStatus?.toLowerCase() === "rejected") ? "Rejected" : 
                                                    "Pending"
                                                }
                                            </Badge>
                                        </TableCell>

                                        {/* USER VISIBILITY TOGGLE (ON / OFF) */}
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={isLive}
                                                        disabled={togglingId === space.id}
                                                        onCheckedChange={() => handleToggleLive(space)}
                                                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-600"
                                                        aria-label={`Toggle user visibility for ${space.name || space.title}`}
                                                    />
                                                    <span className={`text-xs font-bold ${isLive ? "text-emerald-400" : "text-muted-foreground"}`}>
                                                        {togglingId === space.id ? "..." : (isLive ? "ON" : "OFF")}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-medium ${isLive ? "text-emerald-400/80" : "text-muted-foreground/80"}`}>
                                                    {isLive ? "Visible in User App" : "Hidden from User App"}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1.5 items-center">
                                                {currentUserRole === "SUPER_ADMIN" && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="rounded-full hover:bg-red-500/10 text-red-400 h-8 w-8"
                                                        title="Delete Service"
                                                        onClick={() => handleDeleteService(space.id, space.name || space.title)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary h-8 w-8" 
                                                    title="Edit Service & Visibility"
                                                    onClick={() => openEditDialog(space)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>

                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 h-8 w-8" title="Review Details">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto p-6 max-w-lg">
                                                        <DialogHeader>
                                                            <div className="flex items-center justify-between">
                                                                <DialogTitle className="text-xl font-bold">{space.name || space.title}</DialogTitle>
                                                                <Badge className={`rounded-full px-3 py-0.5 text-xs font-semibold ${isLive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-400"}`}>
                                                                    {isLive ? "LIVE IN USER APP" : "HIDDEN FROM USER APP"}
                                                                </Badge>
                                                            </div>
                                                            <DialogDescription>
                                                                {space.description || "No description provided."}
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        {/* Visibility Control Card Inside Review Dialog */}
                                                        <div className={`flex items-center justify-between p-3.5 rounded-2xl border my-2 ${
                                                            isLive
                                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                                : "bg-white/5 border-white/10 text-muted-foreground"
                                                        }`}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-2.5 w-2.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-gray-500"}`} />
                                                                <div>
                                                                    <span className="font-bold text-sm block">
                                                                        {isLive ? "Service is Visible to Users" : "Service is Hidden from Users"}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {isLive ? "Users can search, view, and book this service." : "Service cannot be viewed or booked in the app."}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant={isLive ? "outline" : "default"}
                                                                className={`rounded-full text-xs font-semibold ${isLive ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}
                                                                onClick={() => handleToggleLive(space)}
                                                                disabled={togglingId === space.id}
                                                            >
                                                                {isLive ? "Turn OFF" : "Turn ON"}
                                                            </Button>
                                                        </div>

                                                        <div className="grid gap-4 py-2">
                                                            <div className="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3 rounded-2xl border border-white/5">
                                                                <div className="flex flex-col col-span-2 border-b border-white/5 pb-2">
                                                                    <span className="font-bold text-muted-foreground">Service ID</span>
                                                                    <span className="font-mono mt-0.5 text-white/90">{space.id}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-muted-foreground">Category</span>
                                                                    <span className="font-semibold mt-0.5">{space.categoryId || space.category}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-muted-foreground">Price</span>
                                                                    <span className="font-bold text-emerald-400 mt-0.5">₹{space.price}/{space.priceUnit?.toLowerCase() === 'days' ? 'day' : 'month'}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-muted-foreground">Location</span>
                                                                    <span className="mt-0.5">{space.location}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-muted-foreground">Reach</span>
                                                                    <span className="mt-0.5">{space.reach || "N/A"}</span>
                                                                </div>
                                                            </div>

                                                            {(space.status === "Rejected" || space.approvalStatus === "REJECTED") && space.rejectionReason && (
                                                                <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                                                    <span className="text-xs font-bold text-red-500 uppercase">Rejection Reason</span>
                                                                    <p className="text-sm text-red-400 mt-1">{space.rejectionReason}</p>
                                                                </div>
                                                            )}

                                                            {space.features && space.features.length > 0 && (
                                                                <div className="space-y-1.5">
                                                                    <span className="font-bold text-xs text-muted-foreground uppercase">Features</span>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {space.features.map((f: string, i: number) => (
                                                                            <Badge key={i} variant="secondary" className="rounded-full bg-white/5 text-xs">{f}</Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Booking History & Status */}
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
                                                                    <div className="mt-2 pt-3 border-t border-white/10">
                                                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Booking History</h3>
                                                                        {spaceBookings.length === 0 ? (
                                                                            <div className="text-xs text-muted-foreground p-3 bg-white/5 rounded-xl text-center border border-white/5">
                                                                                No bookings found for this service.
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-2 max-h-36 overflow-y-auto">
                                                                                {spaceBookings.map((b, idx) => {
                                                                                    const isCompleted = b.status?.toLowerCase() === 'completed' || b.status?.toLowerCase() === 'ended';
                                                                                    const isFuture = new Date(b.startDate || 0) > new Date();
                                                                                    const isCurrent = !isCompleted && !isFuture && new Date(b.endDate || 0) > new Date();
                                                                                    
                                                                                    let statusColor = "bg-gray-500/10 text-gray-400 border-gray-500/20";
                                                                                    if (isCurrent) statusColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                                                                                    else if (isFuture) statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                                                                                    else if (isCompleted) statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

                                                                                    return (
                                                                                        <div key={b.id || idx} className="flex flex-col bg-white/5 p-2.5 rounded-xl border border-white/5 text-xs">
                                                                                            <div className="flex justify-between items-start mb-0.5">
                                                                                                <span className="font-semibold text-white">{b.campaignName || "Untitled Campaign"}</span>
                                                                                                <Badge variant="outline" className={`text-[9px] uppercase ${statusColor}`}>
                                                                                                    {isCurrent ? "Running" : isFuture ? "Upcoming" : "Completed"}
                                                                                                </Badge>
                                                                                            </div>
                                                                                            <div className="text-[11px] text-muted-foreground">
                                                                                                {new Date(b.startDate || b.createdAt).toLocaleDateString()} - {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'TBD'}
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

                                                        <DialogFooter className="gap-2 mt-4 pt-2 border-t border-white/10">
                                                            {isPending && (
                                                                <>
                                                                    <Button variant="destructive" className="rounded-full px-5 text-xs" onClick={() => {
                                                                        setSelectedSpaceForRejection(space);
                                                                        setIsRejectionDialogOpen(true);
                                                                    }}>
                                                                        Reject
                                                                    </Button>
                                                                    <Button className="rounded-full px-5 bg-emerald-600 hover:bg-emerald-500 text-xs" onClick={() => handleUpdateStatus(space.id, space.name || space.title, "Approved")}>
                                                                        Approve & Turn ON
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>

                                                {isPending && (
                                                    <>
                                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-emerald-500/10 text-emerald-400 h-8 w-8" title="Approve & Turn ON" onClick={() => handleUpdateStatus(space.id, space.name || space.title, "Approved")}>
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-red-500/10 text-red-400 h-8 w-8" title="Reject" onClick={() => {
                                                            setSelectedSpaceForRejection(space);
                                                            setIsRejectionDialogOpen(true);
                                                        }}>
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Rejection Reason Dialog */}
            <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
                <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-2xl max-w-sm">
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
                            className="bg-white/5 border-white/10 rounded-xl"
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

            {/* Edit Service Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl border-white/10 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Service & Visibility</DialogTitle>
                        <DialogDescription>Modify service details and user app visibility.</DialogDescription>
                    </DialogHeader>
                    {editSpace && (
                        <div className="grid gap-4 py-4">
                            {/* Live Visibility Switch inside Edit dialog */}
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-semibold text-white">Live in User App</Label>
                                    <p className="text-xs text-muted-foreground">
                                        {isServiceLive(editSpace) ? "Service is visible to users in app" : "Service is hidden from user app"}
                                    </p>
                                </div>
                                <Switch 
                                    checked={isServiceLive(editSpace)}
                                    onCheckedChange={(checked) => {
                                        setEditSpace({
                                            ...editSpace,
                                            status: checked ? "APPROVED" : "DEACTIVATED",
                                            approvalStatus: checked ? "APPROVED" : "DEACTIVATED",
                                            isActive: checked,
                                            isAvailable: checked,
                                            adminDisabled: !checked
                                        });
                                    }}
                                    className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-600"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Title</Label>
                                <Input value={editSpace.name || editSpace.title || ""} onChange={(e) => setEditSpace({...editSpace, name: e.target.value, title: e.target.value})} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Input value={editSpace.category || ""} onChange={(e) => setEditSpace({...editSpace, category: e.target.value})} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Price (₹)</Label>
                                    <Input type="number" value={editSpace.price || 0} onChange={(e) => setEditSpace({...editSpace, price: e.target.value})} className="bg-white/5 border-white/10" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Location</Label>
                                    <Input value={editSpace.location || ""} onChange={(e) => setEditSpace({...editSpace, location: e.target.value})} className="bg-white/5 border-white/10" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea value={editSpace.description || ""} onChange={(e) => setEditSpace({...editSpace, description: e.target.value})} className="bg-white/5 border-white/10 h-24 resize-none" />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Images</Label>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs rounded-full" onClick={() => setEditSpace({...editSpace, images: [...(editSpace.images || []), ""]})}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Image
                                    </Button>
                                </div>
                                {(editSpace.images || []).map((imgUrl: string, idx: number) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <Input 
                                            value={imgUrl} 
                                            onChange={(e) => {
                                                const newImgs = [...editSpace.images];
                                                newImgs[idx] = e.target.value;
                                                setEditSpace({...editSpace, images: newImgs});
                                            }} 
                                            placeholder="https://..." 
                                            className="bg-white/5 border-white/10 text-xs" 
                                        />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500 hover:bg-red-500/10" onClick={() => {
                                            const newImgs = [...editSpace.images];
                                            newImgs.splice(idx, 1);
                                            setEditSpace({...editSpace, images: newImgs});
                                        }}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl border-white/10 hover:bg-white/5">Cancel</Button>
                        <Button onClick={handleUpdateDetails} className="rounded-xl">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
