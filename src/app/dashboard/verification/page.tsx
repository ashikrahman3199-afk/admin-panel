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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    Store,
    MapPin,
    Calendar,
    CalendarOff,
    Layers,
    Settings2,
    Image as ImageIcon,
    ExternalLink,
    Tag,
    X,
    Navigation,
    Lock,
    Unlock,
    Info
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

// City GPS Coordinate Presets for rapid map pin placement
const CITY_PRESETS = [
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
    { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
    { name: "Delhi / NCR", lat: 28.6139, lng: 77.2090 },
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
    { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
    { name: "Pune", lat: 18.5204, lng: 73.8567 },
];

export default function VerificationPage() {
    const [mounted, setMounted] = React.useState(false);
    const [adSpaces, setAdSpaces] = React.useState<Array<any>>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [selectedSpaceForRejection, setSelectedSpaceForRejection] = React.useState<any>(null);
    const [isRejectionDialogOpen, setIsRejectionDialogOpen] = React.useState(false);
    const [currentUserRole, setCurrentUserRole] = React.useState<string>("ADMIN");
    const [allBookings, setAllBookings] = React.useState<Array<any>>([]);
    
    // Edit Dialog States
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [editSpace, setEditSpace] = React.useState<any>(null);
    const [editActiveTab, setEditActiveTab] = React.useState("general");
    
    // Sub-form states inside Edit Dialog
    const [newBlockedDate, setNewBlockedDate] = React.useState("");
    const [newBlockedEndDate, setNewBlockedEndDate] = React.useState("");
    const [newBlockedReason, setNewBlockedReason] = React.useState("");
    const [newFeatureTag, setNewFeatureTag] = React.useState("");
    const [newOptionName, setNewOptionName] = React.useState("");
    const [newOptionPrice, setNewOptionPrice] = React.useState<number | "">("");
    const [newOptionDuration, setNewOptionDuration] = React.useState<number | "">("");

    // Navigation and filters
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

    // Helper: Determine if a service is LIVE and VISIBLE to users in the app
    const isServiceLive = (space: any): boolean => {
        if (!space) return false;
        if (space.adminDisabled === true) return false;
        
        const status = (space.status || "").toUpperCase();
        const approval = (space.approvalStatus || "").toUpperCase();

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
            fetchPendingAdSpaces();
        } finally {
            setTogglingId(null);
        }
    };

    // Open Edit Dialog and initialize all state fields
    const openEditDialog = (space: any) => {
        let imgs = space.images || [];
        if (imgs.length === 0 && space.image) {
            imgs = [space.image];
        }

        // Parse blocked dates
        let blocked: string[] = [];
        let blockedReasons: Record<string, string> = {};

        if (Array.isArray(space.blockedDates)) {
            blocked = [...space.blockedDates];
        } else if (space.blockedDates && typeof space.blockedDates === 'object') {
            blocked = Object.keys(space.blockedDates);
            Object.keys(space.blockedDates).forEach(k => {
                blockedReasons[k] = space.blockedDates[k]?.reason || "Blocked";
            });
        }

        if (space.blockedDatesMap && typeof space.blockedDatesMap === 'object') {
            Object.keys(space.blockedDatesMap).forEach(k => {
                if (!blocked.includes(k)) blocked.push(k);
                blockedReasons[k] = space.blockedDatesMap[k]?.reason || "Blocked";
            });
        }

        // Parse options
        let parsedOptions: any[] = space.options || [];
        if (parsedOptions.length === 0 && space.optionsJson) {
            try {
                parsedOptions = JSON.parse(space.optionsJson);
            } catch (e) {}
        }

        // Parse lat/lng
        const lat = space.latitude ?? space.lat ?? space.coordinates?.latitude ?? space.mapLocation?.latitude ?? "";
        const lng = space.longitude ?? space.lng ?? space.coordinates?.longitude ?? space.mapLocation?.longitude ?? "";

        setEditSpace({
            ...space,
            images: imgs,
            blockedDates: blocked,
            blockedReasons: blockedReasons,
            options: parsedOptions,
            latitude: lat,
            longitude: lng,
            details: space.details || {},
            features: space.features || ["Premium Location", "High Visibility"],
            reach: space.reach || "50k+ Impressions",
            priceUnit: space.priceUnit || "Monthly",
            minSpend: space.minSpend || space.price || 0,
            location: space.location || ""
        });

        setNewBlockedDate("");
        setNewBlockedEndDate("");
        setNewBlockedReason("");
        setNewFeatureTag("");
        setNewOptionName("");
        setNewOptionPrice("");
        setNewOptionDuration("");
        setEditActiveTab("general");
        setIsEditDialogOpen(true);
    };

    // Block Date Handler (supports single date or full date range)
    const handleAddBlockedDate = () => {
        if (!newBlockedDate) {
            toast.error("Please pick a date to block.");
            return;
        }

        const datesToAdd: string[] = [];
        const start = new Date(newBlockedDate);
        const end = newBlockedEndDate ? new Date(newBlockedEndDate) : new Date(newBlockedDate);

        if (end < start) {
            toast.error("End date cannot be earlier than start date.");
            return;
        }

        const current = new Date(start);
        while (current <= end) {
            datesToAdd.push(current.toISOString().slice(0, 10));
            current.setDate(current.getDate() + 1);
        }

        const updatedBlocked = Array.from(new Set([...(editSpace.blockedDates || []), ...datesToAdd])).sort();
        const updatedReasons = { ...(editSpace.blockedReasons || {}) };
        datesToAdd.forEach(d => {
            updatedReasons[d] = newBlockedReason.trim() || "Admin Blocked";
        });

        setEditSpace({
            ...editSpace,
            blockedDates: updatedBlocked,
            blockedReasons: updatedReasons
        });

        setNewBlockedDate("");
        setNewBlockedEndDate("");
        setNewBlockedReason("");

        toast.success(`Blocked ${datesToAdd.length} date(s) successfully.`);
    };

    const handleRemoveBlockedDate = (dateStr: string) => {
        const updated = (editSpace.blockedDates || []).filter((d: string) => d !== dateStr);
        const updatedReasons = { ...(editSpace.blockedReasons || {}) };
        delete updatedReasons[dateStr];

        setEditSpace({
            ...editSpace,
            blockedDates: updated,
            blockedReasons: updatedReasons
        });

        toast.info(`Unblocked ${dateStr}.`);
    };

    const handleClearAllBlockedDates = () => {
        if (!confirm("Are you sure you want to clear all blocked dates for this service?")) return;
        setEditSpace({
            ...editSpace,
            blockedDates: [],
            blockedReasons: {}
        });
        toast.info("All blocked dates cleared.");
    };

    const handleBlockNextDays = (days: number) => {
        const dates: string[] = [];
        const today = new Date();
        for (let i = 1; i <= days; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d.toISOString().slice(0, 10));
        }

        const updated = Array.from(new Set([...(editSpace.blockedDates || []), ...dates])).sort();
        const updatedReasons = { ...(editSpace.blockedReasons || {}) };
        dates.forEach(d => {
            updatedReasons[d] = `Admin Blocked (${days} Days)`;
        });

        setEditSpace({
            ...editSpace,
            blockedDates: updated,
            blockedReasons: updatedReasons
        });

        toast.success(`Blocked the next ${days} days.`);
    };

    // City Preset Handler
    const handleSetCityPreset = (city: typeof CITY_PRESETS[0]) => {
        setEditSpace({
            ...editSpace,
            latitude: city.lat,
            longitude: city.lng,
            location: editSpace.location ? `${editSpace.location}, ${city.name}` : city.name
        });
        toast.success(`Coordinates set to ${city.name} (${city.lat}, ${city.lng})`);
    };

    // Sub-Option Handlers
    const handleAddOption = () => {
        if (!newOptionName.trim()) {
            toast.error("Please enter option name.");
            return;
        }

        const newOpt = {
            id: `opt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            name: newOptionName.trim(),
            price: Number(newOptionPrice) || 0,
            duration: Number(newOptionDuration) || 1,
            availability: "available",
            blockedDates: {},
            photos: []
        };

        setEditSpace({
            ...editSpace,
            options: [...(editSpace.options || []), newOpt]
        });

        setNewOptionName("");
        setNewOptionPrice("");
        setNewOptionDuration("");
        toast.success("Option added.");
    };

    const handleRemoveOption = (index: number) => {
        const opts = [...(editSpace.options || [])];
        opts.splice(index, 1);
        setEditSpace({
            ...editSpace,
            options: opts
        });
        toast.info("Option removed.");
    };

    // Feature Tag Handlers
    const handleAddFeatureTag = () => {
        if (!newFeatureTag.trim()) return;
        const tag = newFeatureTag.trim();
        if ((editSpace.features || []).includes(tag)) {
            toast.info("Feature tag already exists.");
            return;
        }
        setEditSpace({
            ...editSpace,
            features: [...(editSpace.features || []), tag]
        });
        setNewFeatureTag("");
    };

    const handleRemoveFeatureTag = (tag: string) => {
        setEditSpace({
            ...editSpace,
            features: (editSpace.features || []).filter((f: string) => f !== tag)
        });
    };

    // Save All Changes (Comprehensive Multi-Field Update)
    const handleUpdateDetails = async () => {
        if (!editSpace) return;
        try {
            const isLive = isServiceLive(editSpace);
            const targetStatus = isLive ? "APPROVED" : "DEACTIVATED";

            // Prepare coordinates
            const lat = editSpace.latitude !== undefined && editSpace.latitude !== "" ? Number(editSpace.latitude) : undefined;
            const lng = editSpace.longitude !== undefined && editSpace.longitude !== "" ? Number(editSpace.longitude) : undefined;

            // Prepare blocked dates
            const blockedDatesArray = Array.isArray(editSpace.blockedDates) ? editSpace.blockedDates : [];
            const blockedDatesMap: Record<string, any> = {};
            blockedDatesArray.forEach((d: string) => {
                blockedDatesMap[d] = {
                    blockedAt: new Date().toISOString(),
                    reason: editSpace.blockedReasons?.[d] || "Admin Blocked"
                };
            });

            // Prepare options with synced blockedDates
            const updatedOptions = (editSpace.options || []).map((opt: any) => ({
                ...opt,
                blockedDates: {
                    ...(opt.blockedDates || {}),
                    ...blockedDatesMap
                }
            }));

            const updates: any = {
                name: editSpace.name,
                title: editSpace.title,
                category: editSpace.category,
                price: Number(editSpace.price),
                priceUnit: editSpace.priceUnit || "Monthly",
                minSpend: Number(editSpace.minSpend || editSpace.price || 0),
                location: editSpace.location || "",
                description: editSpace.description || "",
                reach: editSpace.reach || "50k+ Impressions",
                features: editSpace.features || [],
                image: (editSpace.images && editSpace.images.length > 0) ? editSpace.images[0] : (editSpace.image || ""),
                images: editSpace.images || [],
                details: editSpace.details || {},
                options: updatedOptions,
                optionsJson: JSON.stringify(updatedOptions),
                blockedDates: blockedDatesArray,
                blockedDatesMap: blockedDatesMap,
                status: targetStatus,
                approvalStatus: targetStatus,
                isActive: isLive,
                isAvailable: isLive,
                adminDisabled: !isLive,
                updatedAt: new Date().toISOString()
            };

            if (lat !== undefined && !isNaN(lat)) {
                updates.latitude = lat;
                updates.lat = lat;
            }
            if (lng !== undefined && !isNaN(lng)) {
                updates.longitude = lng;
                updates.lng = lng;
            }
            if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
                updates.coordinates = { latitude: lat, longitude: lng };
                updates.mapLocation = {
                    address: editSpace.location || "",
                    latitude: lat,
                    longitude: lng
                };
            }

            const res = await fetch('/api/adspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editSpace.id,
                    updates
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to update service");

            toast.success("Service Updated Successfully", {
                description: `All changes (pricing, map pin, blocked dates, details) have been saved and applied directly to users.`
            });

            setIsEditDialogOpen(false);
            fetchPendingAdSpaces();
        } catch (error: any) {
            console.error("Update error:", error);
            toast.error("Error Updating Service", { description: error.message });
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
            
            if (!result.success) throw new Error(result.error);
            
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
        const isLive = isServiceLive(space);
        const isPending = space.approvalStatus === 'PENDING' || space.approvalStatus === 'Pending' || space.status === 'PENDING';

        if (filterTab === 'LIVE' && !isLive) return false;
        if (filterTab === 'OFF' && (isLive || isPending)) return false;
        if (filterTab === 'PENDING' && !isPending) return false;

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
                    <h1 className="text-3xl font-bold tracking-tight">Service Verification & Management</h1>
                    <p className="text-muted-foreground mt-0.5">
                        Manage vendor services, modify details, block calendar dates, set map coordinates, and control user visibility.
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
                            <TableHead className="text-muted-foreground/70">Location & Map Pin</TableHead>
                            <TableHead className="text-muted-foreground/70">Price</TableHead>
                            <TableHead className="text-muted-foreground/70">Blocked Dates</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-center text-muted-foreground/70">User Visibility</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-20 text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Loading listings...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredAdSpaces.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-20 text-muted-foreground">
                                    No services found matching your filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAdSpaces.map((space) => {
                                const isLive = isServiceLive(space);
                                const isPending = space.approvalStatus === 'PENDING' || space.approvalStatus === 'Pending' || space.status === 'PENDING';
                                const isDeactivated = space.status?.toLowerCase() === "deactivated" || space.approvalStatus?.toLowerCase() === "deactivated";

                                const lat = space.latitude ?? space.lat ?? space.coordinates?.latitude;
                                const lng = space.longitude ?? space.lng ?? space.coordinates?.longitude;
                                const hasMapPin = lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng));

                                const blockedCount = Array.isArray(space.blockedDates) ? space.blockedDates.length : (space.blockedDates ? Object.keys(space.blockedDates).length : 0);

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
                                                    <span className="font-bold text-sm text-foreground/90 block truncate max-w-[170px]" title={space.name || space.title}>
                                                        {space.name || space.title}
                                                    </span>
                                                    {space.vendorId && (
                                                        <span className="text-[11px] text-muted-foreground block truncate max-w-[170px]">
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

                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                <span className="text-foreground/90 truncate max-w-[130px] font-medium" title={space.location}>
                                                    {space.location || "Location not set"}
                                                </span>
                                                {hasMapPin ? (
                                                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                                                        <MapPin className="h-2.5 w-2.5" />
                                                        GPS: {Number(lat).toFixed(2)}, {Number(lng).toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-amber-400/80 mt-0.5">
                                                        Pin not set
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="font-bold text-sm whitespace-nowrap">
                                            ₹{space.price || 0}/{space.priceUnit?.toLowerCase() === 'days' ? 'day' : 'month'}
                                        </TableCell>

                                        <TableCell>
                                            {blockedCount > 0 ? (
                                                <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-400 text-xs gap-1 py-0.5">
                                                    <CalendarOff className="h-3 w-3" />
                                                    {blockedCount} Blocked
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">None</span>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Badge 
                                                variant="secondary" 
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border-none ${
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
                                                    {isLive ? "Visible in App" : "Hidden in App"}
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
                                                    title="Edit All Details, Block Dates & Pin"
                                                    onClick={() => openEditDialog(space)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>

                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 h-8 w-8" title="Review Service">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto p-6 max-w-xl">
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
                                                                        {isLive ? "Users can see, search, and book this service." : "Service cannot be viewed or booked in the app."}
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

                                                        <div className="grid gap-3 py-2">
                                                            <div className="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3.5 rounded-2xl border border-white/5">
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
                                                                <div className="flex flex-col col-span-2 border-t border-white/5 pt-2">
                                                                    <span className="font-bold text-muted-foreground flex items-center gap-1">
                                                                        <MapPin className="h-3 w-3 text-primary" /> Location & Map Pin
                                                                    </span>
                                                                    <span className="mt-0.5">{space.location || "Address not provided"}</span>
                                                                    {hasMapPin && (
                                                                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5 text-[11px] text-emerald-400">
                                                                            <span>Coordinates: {lat}, {lng}</span>
                                                                            <a 
                                                                                href={`https://www.google.com/maps?q=${lat},${lng}`} 
                                                                                target="_blank" 
                                                                                rel="noreferrer"
                                                                                className="hover:underline flex items-center gap-1 text-primary"
                                                                            >
                                                                                View on Map <ExternalLink className="h-3 w-3" />
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Blocked Dates Info */}
                                                            {blockedCount > 0 && (
                                                                <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 text-xs">
                                                                    <span className="font-bold text-red-400 uppercase flex items-center gap-1 mb-1.5">
                                                                        <CalendarOff className="h-3.5 w-3.5" /> Blocked Calendar Dates ({blockedCount})
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                                                        {(Array.isArray(space.blockedDates) ? space.blockedDates : Object.keys(space.blockedDates || {})).map((d: string) => (
                                                                            <span key={d} className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded-md text-[10px] font-mono">
                                                                                {d}
                                                                            </span>
                                                                        ))}
                                                                    </div>
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
                                                        </div>

                                                        <DialogFooter className="gap-2 mt-4 pt-2 border-t border-white/10">
                                                            <Button 
                                                                variant="outline" 
                                                                className="rounded-full text-xs" 
                                                                onClick={() => {
                                                                    openEditDialog(space);
                                                                }}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                                                Edit Service & Block Dates
                                                            </Button>
                                                            {isPending && (
                                                                <Button className="rounded-full px-5 bg-emerald-600 hover:bg-emerald-500 text-xs" onClick={() => handleUpdateStatus(space.id, space.name || space.title, "Approved")}>
                                                                    Approve & Turn ON
                                                                </Button>
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

            {/* Comprehensive Service Management & Editor Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-3xl bg-card/95 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl max-h-[92vh] overflow-y-auto p-6">
                    <DialogHeader className="border-b border-white/10 pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl font-bold">Service Editor & Controls</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Modify all service parameters, lock out dates, adjust map pin coordinates, and manage live visibility.
                                </DialogDescription>
                            </div>
                            {editSpace && (
                                <Badge className={`rounded-full px-3 py-0.5 text-xs font-semibold ${isServiceLive(editSpace) ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-400"}`}>
                                    {isServiceLive(editSpace) ? "LIVE IN USER APP" : "HIDDEN IN USER APP"}
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>

                    {editSpace && (
                        <div className="py-2">
                            <Tabs value={editActiveTab} onValueChange={setEditActiveTab} className="w-full">
                                <TabsList className="grid grid-cols-5 bg-white/5 p-1 rounded-2xl mb-4 border border-white/10">
                                    <TabsTrigger value="general" className="rounded-xl text-xs flex items-center gap-1.5 py-2">
                                        <Settings2 className="h-3.5 w-3.5" />
                                        General
                                    </TabsTrigger>
                                    <TabsTrigger value="location" className="rounded-xl text-xs flex items-center gap-1.5 py-2">
                                        <MapPin className="h-3.5 w-3.5" />
                                        Map Pin
                                    </TabsTrigger>
                                    <TabsTrigger value="calendar" className="rounded-xl text-xs flex items-center gap-1.5 py-2">
                                        <CalendarOff className="h-3.5 w-3.5" />
                                        Blocked Dates
                                        {(editSpace.blockedDates || []).length > 0 && (
                                            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 text-[10px]">
                                                {editSpace.blockedDates.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="options" className="rounded-xl text-xs flex items-center gap-1.5 py-2">
                                        <Layers className="h-3.5 w-3.5" />
                                        Options
                                    </TabsTrigger>
                                    <TabsTrigger value="media" className="rounded-xl text-xs flex items-center gap-1.5 py-2">
                                        <ImageIcon className="h-3.5 w-3.5" />
                                        Photos
                                    </TabsTrigger>
                                </TabsList>

                                {/* TAB 1: GENERAL INFO & VISIBILITY */}
                                <TabsContent value="general" className="space-y-4">
                                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold text-white">Live in User App</Label>
                                            <p className="text-xs text-muted-foreground">
                                                {isServiceLive(editSpace) ? "Service is live and visible to all users" : "Service is hidden from the user app"}
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs">Service Title</Label>
                                            <Input 
                                                value={editSpace.name || editSpace.title || ""} 
                                                onChange={(e) => setEditSpace({...editSpace, name: e.target.value, title: e.target.value})} 
                                                className="bg-white/5 border-white/10" 
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs">Category</Label>
                                            <Input 
                                                value={editSpace.category || ""} 
                                                onChange={(e) => setEditSpace({...editSpace, category: e.target.value})} 
                                                placeholder="Billboards, LED Billboards, Cinema, etc."
                                                className="bg-white/5 border-white/10" 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs">Base Price (₹)</Label>
                                            <Input 
                                                type="number" 
                                                value={editSpace.price || 0} 
                                                onChange={(e) => setEditSpace({...editSpace, price: e.target.value})} 
                                                className="bg-white/5 border-white/10 font-bold" 
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs">Price Unit</Label>
                                            <Input 
                                                value={editSpace.priceUnit || "Monthly"} 
                                                onChange={(e) => setEditSpace({...editSpace, priceUnit: e.target.value})} 
                                                placeholder="Monthly or Days"
                                                className="bg-white/5 border-white/10" 
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs">Estimated Reach</Label>
                                            <Input 
                                                value={editSpace.reach || ""} 
                                                onChange={(e) => setEditSpace({...editSpace, reach: e.target.value})} 
                                                placeholder="e.g. 50k+ Impressions"
                                                className="bg-white/5 border-white/10" 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">Description</Label>
                                        <Textarea 
                                            value={editSpace.description || ""} 
                                            onChange={(e) => setEditSpace({...editSpace, description: e.target.value})} 
                                            className="bg-white/5 border-white/10 h-24 resize-none text-xs" 
                                            placeholder="Detailed description visible to users on service page..."
                                        />
                                    </div>

                                    {/* Features & Tags */}
                                    <div className="grid gap-2 bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <Label className="text-xs text-muted-foreground uppercase font-bold">Feature Tags</Label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(editSpace.features || []).map((tag: string) => (
                                                <Badge key={tag} variant="secondary" className="bg-white/10 hover:bg-white/15 gap-1 text-xs py-1 px-2.5">
                                                    {tag}
                                                    <button type="button" onClick={() => handleRemoveFeatureTag(tag)} className="hover:text-red-400">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                            <Input 
                                                value={newFeatureTag}
                                                onChange={(e) => setNewFeatureTag(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeatureTag(); } }}
                                                placeholder="Add feature tag (e.g. Prime Location, Front Lit)..."
                                                className="bg-white/5 border-white/10 text-xs h-8"
                                            />
                                            <Button type="button" size="sm" variant="outline" className="h-8 rounded-xl" onClick={handleAddFeatureTag}>
                                                + Add Tag
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* TAB 2: MAP PIN & LOCATION */}
                                <TabsContent value="location" className="space-y-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            <h4 className="font-bold text-sm">Map Pin Coordinates & Location</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Set the exact latitude and longitude coordinates. The user app map will drop the location pin directly at this position.
                                        </p>

                                        <div className="grid gap-2">
                                            <Label className="text-xs">Location Name / Display Address</Label>
                                            <Input 
                                                value={editSpace.location || ""} 
                                                onChange={(e) => setEditSpace({...editSpace, location: e.target.value})} 
                                                placeholder="e.g. Anna Nagar 2nd Avenue, Chennai"
                                                className="bg-white/5 border-white/10" 
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-1">
                                                <Label className="text-xs font-mono">Latitude (Lat)</Label>
                                                <Input 
                                                    type="number"
                                                    step="any"
                                                    value={editSpace.latitude ?? ""} 
                                                    onChange={(e) => setEditSpace({...editSpace, latitude: e.target.value})} 
                                                    placeholder="e.g. 13.0827"
                                                    className="bg-white/5 border-white/10 font-mono text-xs" 
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label className="text-xs font-mono">Longitude (Lng)</Label>
                                                <Input 
                                                    type="number"
                                                    step="any"
                                                    value={editSpace.longitude ?? ""} 
                                                    onChange={(e) => setEditSpace({...editSpace, longitude: e.target.value})} 
                                                    placeholder="e.g. 80.2707"
                                                    className="bg-white/5 border-white/10 font-mono text-xs" 
                                                />
                                            </div>
                                        </div>

                                        {/* City Presets */}
                                        <div className="space-y-1.5 pt-1">
                                            <Label className="text-[11px] text-muted-foreground uppercase font-bold">Quick City GPS Presets</Label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {CITY_PRESETS.map(city => (
                                                    <Button
                                                        key={city.name}
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs rounded-xl bg-white/5 border-white/10 hover:bg-white/10"
                                                        onClick={() => handleSetCityPreset(city)}
                                                    >
                                                        {city.name}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Verification Link Card */}
                                        {editSpace.latitude && editSpace.longitude && !isNaN(Number(editSpace.latitude)) && !isNaN(Number(editSpace.longitude)) ? (
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                                                <div className="flex items-center gap-2">
                                                    <Navigation className="h-4 w-4 shrink-0 text-emerald-400" />
                                                    <span>Active Pin: {Number(editSpace.latitude).toFixed(4)}, {Number(editSpace.longitude).toFixed(4)}</span>
                                                </div>
                                                <a 
                                                    href={`https://www.google.com/maps?q=${editSpace.latitude},${editSpace.longitude}`}
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="hover:underline flex items-center gap-1 font-semibold text-primary"
                                                >
                                                    Verify on Google Maps <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-muted-foreground flex items-center gap-2">
                                                <Info className="h-4 w-4 shrink-0" />
                                                <span>Enter latitude and longitude coordinates above to accurately locate this service on the user app map.</span>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* TAB 3: BLOCKED DATES & CALENDAR LOCKING */}
                                <TabsContent value="calendar" className="space-y-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CalendarOff className="h-4 w-4 text-red-400" />
                                                <h4 className="font-bold text-sm">Block Calendar Dates from Users</h4>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button 
                                                    type="button" 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-7 text-xs rounded-xl bg-white/5 border-white/10 hover:bg-white/10"
                                                    onClick={() => handleBlockNextDays(7)}
                                                >
                                                    + Block 7 Days
                                                </Button>
                                                <Button 
                                                    type="button" 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-7 text-xs rounded-xl bg-white/5 border-white/10 hover:bg-white/10"
                                                    onClick={() => handleBlockNextDays(30)}
                                                >
                                                    + Block 30 Days
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Any dates blocked here are immediately locked and grayed out in the user app booking calendar. Users will not be able to select or book these dates.
                                        </p>

                                        {/* Block Date Form */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-black/20 p-3 rounded-xl border border-white/5">
                                            <div>
                                                <Label className="text-[11px] text-muted-foreground block mb-1">Start Date</Label>
                                                <Input 
                                                    type="date"
                                                    value={newBlockedDate}
                                                    onChange={(e) => setNewBlockedDate(e.target.value)}
                                                    className="bg-white/5 border-white/10 text-xs h-9"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[11px] text-muted-foreground block mb-1">End Date (Optional Range)</Label>
                                                <Input 
                                                    type="date"
                                                    value={newBlockedEndDate}
                                                    min={newBlockedDate}
                                                    onChange={(e) => setNewBlockedEndDate(e.target.value)}
                                                    className="bg-white/5 border-white/10 text-xs h-9"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[11px] text-muted-foreground block mb-1">Reason / Note</Label>
                                                <Input 
                                                    placeholder="e.g. Maintenance, VIP..."
                                                    value={newBlockedReason}
                                                    onChange={(e) => setNewBlockedReason(e.target.value)}
                                                    className="bg-white/5 border-white/10 text-xs h-9"
                                                />
                                            </div>
                                            <div className="sm:col-span-3 flex justify-end">
                                                <Button 
                                                    type="button" 
                                                    size="sm" 
                                                    className="rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs gap-1.5"
                                                    onClick={handleAddBlockedDate}
                                                >
                                                    <Lock className="h-3 w-3" />
                                                    Lock Date / Range
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Currently Blocked Dates List */}
                                        <div className="space-y-2 pt-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase">
                                                    Currently Blocked Dates ({(editSpace.blockedDates || []).length})
                                                </Label>
                                                {(editSpace.blockedDates || []).length > 0 && (
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-xs text-red-400 hover:bg-red-500/10 h-6 px-2"
                                                        onClick={handleClearAllBlockedDates}
                                                    >
                                                        Clear All
                                                    </Button>
                                                )}
                                            </div>

                                            {(editSpace.blockedDates || []).length === 0 ? (
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-muted-foreground">
                                                    No dates are currently blocked. The service calendar is fully open for bookings.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                                    {(editSpace.blockedDates || []).map((dateStr: string) => {
                                                        const reason = editSpace.blockedReasons?.[dateStr] || "Blocked";
                                                        return (
                                                            <div 
                                                                key={dateStr}
                                                                className="flex items-center justify-between p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs"
                                                            >
                                                                <div className="min-w-0 pr-1">
                                                                    <div className="font-mono font-bold text-red-300 truncate">{dateStr}</div>
                                                                    <div className="text-[10px] text-muted-foreground truncate">{reason}</div>
                                                                </div>
                                                                <Button 
                                                                    type="button"
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-6 w-6 shrink-0 text-red-400 hover:bg-red-500/20 rounded-full"
                                                                    title="Unblock this date"
                                                                    onClick={() => handleRemoveBlockedDate(dateStr)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* TAB 4: OPTIONS & SPECIFICATIONS */}
                                <TabsContent value="options" className="space-y-4">
                                    {/* Specifications */}
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                                        <h4 className="font-bold text-sm">Physical & Technical Specifications</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-1">
                                                <Label className="text-xs">Dimensions / Size</Label>
                                                <Input 
                                                    value={editSpace.details?.size || ""} 
                                                    onChange={(e) => setEditSpace({
                                                        ...editSpace, 
                                                        details: { ...editSpace.details, size: e.target.value }
                                                    })}
                                                    placeholder="e.g. 30x40 ft, 20x10 ft"
                                                    className="bg-white/5 border-white/10 text-xs" 
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label className="text-xs">Lighting Type</Label>
                                                <Input 
                                                    value={editSpace.details?.lighting || ""} 
                                                    onChange={(e) => setEditSpace({
                                                        ...editSpace, 
                                                        details: { ...editSpace.details, lighting: e.target.value }
                                                    })}
                                                    placeholder="e.g. Front Lit, Back Lit, Digital LED"
                                                    className="bg-white/5 border-white/10 text-xs" 
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label className="text-xs">Daily Impressions</Label>
                                                <Input 
                                                    value={editSpace.details?.impression || ""} 
                                                    onChange={(e) => setEditSpace({
                                                        ...editSpace, 
                                                        details: { ...editSpace.details, impression: e.target.value }
                                                    })}
                                                    placeholder="e.g. 30,000 / day"
                                                    className="bg-white/5 border-white/10 text-xs" 
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label className="text-xs">Venue / Location Details</Label>
                                                <Input 
                                                    value={editSpace.details?.venue || editSpace.details?.location || ""} 
                                                    onChange={(e) => setEditSpace({
                                                        ...editSpace, 
                                                        details: { ...editSpace.details, venue: e.target.value }
                                                    })}
                                                    placeholder="e.g. Food Court, Audi 1, West Wing"
                                                    className="bg-white/5 border-white/10 text-xs" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add-on Sub-Options */}
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm">Sub-Services & Options ({(editSpace.options || []).length})</h4>
                                        </div>

                                        {/* Options List */}
                                        <div className="space-y-2">
                                            {(editSpace.options || []).map((opt: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-sm block">{opt.name || "Option"}</span>
                                                        <span className="text-muted-foreground">Min Duration: {opt.duration || 1} day(s)</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-emerald-400 text-sm">₹{opt.price || 0}</span>
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-red-400 hover:bg-red-500/10 rounded-full"
                                                            onClick={() => handleRemoveOption(idx)}
                                                        >
                                                            <Trash className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Option Form */}
                                        <div className="grid grid-cols-3 gap-2 bg-black/20 p-3 rounded-xl border border-white/5">
                                            <div className="col-span-3 sm:col-span-1">
                                                <Label className="text-[11px] text-muted-foreground block mb-1">Option Name</Label>
                                                <Input 
                                                    placeholder="e.g. Digital Slot, Hoarding"
                                                    value={newOptionName}
                                                    onChange={(e) => setNewOptionName(e.target.value)}
                                                    className="bg-white/5 border-white/10 text-xs h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[11px] text-muted-foreground block mb-1">Price (₹)</Label>
                                                <Input 
                                                    type="number"
                                                    placeholder="e.g. 50000"
                                                    value={newOptionPrice}
                                                    onChange={(e) => setNewOptionPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                                    className="bg-white/5 border-white/10 text-xs h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[11px] text-muted-foreground block mb-1">Min Duration (days)</Label>
                                                <Input 
                                                    type="number"
                                                    placeholder="e.g. 30"
                                                    value={newOptionDuration}
                                                    onChange={(e) => setNewOptionDuration(e.target.value === "" ? "" : Number(e.target.value))}
                                                    className="bg-white/5 border-white/10 text-xs h-8"
                                                />
                                            </div>
                                            <div className="col-span-3 flex justify-end mt-1">
                                                <Button 
                                                    type="button" 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-8 rounded-xl text-xs"
                                                    onClick={handleAddOption}
                                                >
                                                    + Add Option
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* TAB 5: PHOTOS & MEDIA */}
                                <TabsContent value="media" className="space-y-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-sm">Service Images & Gallery</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    First image is used as the cover photo on search cards in the user app.
                                                </p>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-7 text-xs rounded-xl"
                                                onClick={() => setEditSpace({...editSpace, images: [...(editSpace.images || []), ""]})}
                                            >
                                                <Plus className="h-3 w-3 mr-1" /> Add Image URL
                                            </Button>
                                        </div>

                                        <div className="space-y-2.5">
                                            {(editSpace.images || []).map((imgUrl: string, idx: number) => (
                                                <div key={idx} className="flex gap-2.5 items-center bg-black/20 p-2.5 rounded-xl border border-white/5">
                                                    {imgUrl ? (
                                                        <img 
                                                            src={imgUrl} 
                                                            alt="Preview" 
                                                            className="w-12 h-12 rounded-lg object-cover bg-white/10 shrink-0" 
                                                            onError={(e) => { (e.target as any).style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <Input 
                                                            value={imgUrl} 
                                                            onChange={(e) => {
                                                                const newImgs = [...editSpace.images];
                                                                newImgs[idx] = e.target.value;
                                                                setEditSpace({...editSpace, images: newImgs});
                                                            }} 
                                                            placeholder="https://..." 
                                                            className="bg-white/5 border-white/10 text-xs h-9" 
                                                        />
                                                    </div>
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 shrink-0 text-red-400 hover:bg-red-500/10 rounded-full" 
                                                        onClick={() => {
                                                            const newImgs = [...editSpace.images];
                                                            newImgs.splice(idx, 1);
                                                            setEditSpace({...editSpace, images: newImgs});
                                                        }}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    <DialogFooter className="border-t border-white/10 pt-3 flex justify-between items-center">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsEditDialogOpen(false)} 
                            className="rounded-xl border-white/10 hover:bg-white/5 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleUpdateDetails} 
                            className="rounded-xl bg-primary hover:bg-primary/90 text-xs font-semibold px-6 shadow-lg shadow-primary/20"
                        >
                            Save All Changes & Sync to App
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
