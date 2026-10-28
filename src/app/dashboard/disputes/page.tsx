"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
    AlertCircle, 
    CheckCircle2, 
    MessageSquare, 
    RefreshCw, 
    Search, 
    Copy, 
    Check, 
    ShieldAlert, 
    ExternalLink,
    Clock,
    RotateCcw
} from "lucide-react";

export default function DisputesPage() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [counts, setCounts] = useState({ total: 0, open: 0, cleared: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [filterTab, setFilterTab] = useState<'ALL' | 'OPEN' | 'CLEARED'>('ALL');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDispute, setSelectedDispute] = useState<any>(null);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchDisputes = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/disputes');
            const data = await res.json();
            if (data.success) {
                setDisputes(data.disputes || []);
                if (data.counts) {
                    setCounts(data.counts);
                }
            } else {
                toast.error("Error", { description: data.error || "Failed to load disputes." });
            }
        } catch (error) {
            console.error("Failed to fetch disputes:", error);
            toast.error("Error", { description: "Failed to connect to dispute services." });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDisputes();
    }, [fetchDisputes]);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Copied to clipboard", { description: text });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleUpdateStatus = async (id: string, newStatus: 'CLEARED' | 'OPEN', notes?: string) => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/disputes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    status: newStatus,
                    resolutionNotes: notes !== undefined ? notes : resolutionNotes
                })
            });
            const data = await res.json();
            if (data.success) {
                if (newStatus === 'CLEARED') {
                    toast.success("Dispute Cleared", { 
                        description: "The dispute has been marked as cleared and resolved." 
                    });
                } else {
                    toast.info("Dispute Reopened", { 
                        description: "The dispute status has been reset to OPEN." 
                    });
                }
                setIsManageOpen(false);
                fetchDisputes();
            } else {
                toast.error("Update Failed", { description: data.error || "Could not update dispute." });
            }
        } catch (error) {
            toast.error("Error", { description: "An error occurred while updating the dispute." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openManageDialog = (dispute: any) => {
        setSelectedDispute(dispute);
        setResolutionNotes(dispute.resolutionNotes || "");
        setIsManageOpen(true);
    };

    const filteredDisputes = disputes.filter(d => {
        if (filterTab === 'OPEN' && d.status !== 'OPEN') return false;
        if (filterTab === 'CLEARED' && d.status !== 'CLEARED') return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (d.id && d.id.toLowerCase().includes(q)) ||
            (d.reason && d.reason.toLowerCase().includes(q)) ||
            (d.raisedBy && d.raisedBy.toLowerCase().includes(q)) ||
            (d.clientName && d.clientName.toLowerCase().includes(q)) ||
            (d.campaignName && d.campaignName.toLowerCase().includes(q)) ||
            (d.vendorName && d.vendorName.toLowerCase().includes(q)) ||
            (d.vendorEmail && d.vendorEmail.toLowerCase().includes(q)) ||
            (d.transactionId && d.transactionId.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dispute Management</h1>
                    <p className="text-muted-foreground">
                        Resolve conflicts between clients and vendors and manage dispute clearance.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full gap-2 border-white/10 hover:bg-white/10"
                        onClick={fetchDisputes}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All filed customer complaints
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            Open Resolutions
                            {counts.open > 0 ? (
                                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            ) : (
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                            )}
                        </CardTitle>
                        <AlertCircle className={`h-4 w-4 ${counts.open > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${counts.open > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {counts.open}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {counts.open === 0 ? "✓ All disputes cleared" : "Action required to resolve"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Cleared Disputes</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">
                            {counts.cleared}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Completed & cleared resolutions
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
                        All Disputes ({counts.total})
                    </button>
                    <button
                        onClick={() => setFilterTab('OPEN')}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                            filterTab === 'OPEN'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-muted-foreground hover:text-white'
                        }`}
                    >
                        Open ({counts.open})
                    </button>
                    <button
                        onClick={() => setFilterTab('CLEARED')}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                            filterTab === 'CLEARED'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-muted-foreground hover:text-white'
                        }`}
                    >
                        Cleared ({counts.cleared})
                    </button>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search issue, client, vendor, booking..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 rounded-full bg-white/5 border-white/10 text-sm focus:border-primary"
                    />
                </div>
            </div>

            {/* Disputes Table */}
            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl border border-white/5 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-white/10">
                            <TableHead className="w-[120px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Issue</TableHead>
                            <TableHead className="text-muted-foreground/70">Raised By</TableHead>
                            <TableHead className="text-muted-foreground/70">Related Booking</TableHead>
                            <TableHead className="text-muted-foreground/70">Against Vendor</TableHead>
                            <TableHead className="text-muted-foreground/70">Date</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Loading disputes...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredDisputes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                    No disputes found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDisputes.map((dispute) => {
                                const isOpen = dispute.status === 'OPEN';
                                const isCleared = dispute.status === 'CLEARED';

                                return (
                                    <TableRow key={dispute.id} className="hover:bg-white/5 border-white/5 transition-colors group">
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span title={dispute.id}>
                                                    {dispute.id.length > 10 ? `${dispute.id.slice(0, 8)}...` : dispute.id}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(dispute.id, dispute.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white"
                                                    title="Copy ID"
                                                >
                                                    {copiedId === dispute.id ? (
                                                        <Check className="h-3 w-3 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="font-medium text-sm text-foreground/90 max-w-[180px] truncate" title={dispute.reason}>
                                                {dispute.reason}
                                            </div>
                                            {dispute.resolutionNotes && (
                                                <div className="text-[11px] text-emerald-400/80 truncate max-w-[180px]" title={dispute.resolutionNotes}>
                                                    Note: {dispute.resolutionNotes}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <div className="text-sm font-medium max-w-[130px] truncate" title={dispute.clientName}>
                                                {dispute.clientName}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground max-w-[130px] truncate" title={dispute.clientEmail}>
                                                {dispute.clientEmail}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="text-sm font-medium max-w-[130px] truncate" title={dispute.campaignName}>
                                                {dispute.campaignName}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[130px]" title={dispute.transactionId}>
                                                {dispute.transactionId}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="text-sm font-medium max-w-[130px] truncate" title={dispute.vendorName}>
                                                {dispute.vendorName}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground max-w-[130px] truncate" title={dispute.vendorEmail}>
                                                {dispute.vendorEmail}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(dispute.createdAt).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`rounded-full px-3 py-0.5 text-xs font-semibold border-none ${
                                                    isCleared
                                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                                        : "bg-red-500/15 text-red-400 border border-red-500/20"
                                                }`}
                                            >
                                                {isCleared ? "CLEARED" : "OPEN"}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* Manage Dialog Trigger */}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="rounded-full hover:bg-white/10 h-8 w-8"
                                                    title="Review & Manage Dispute"
                                                    onClick={() => openManageDialog(dispute)}
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </Button>

                                                {/* One-click Action */}
                                                {isOpen ? (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="rounded-full hover:bg-emerald-500/10 hover:text-emerald-400 text-muted-foreground h-8 w-8"
                                                        title="Mark as Cleared"
                                                        onClick={() => handleUpdateStatus(dispute.id, 'CLEARED', 'Cleared by Super Admin')}
                                                        disabled={isSubmitting}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-emerald-400/80 font-medium px-2 py-1 flex items-center gap-1">
                                                        <Check className="h-3 w-3" />
                                                        Cleared
                                                    </span>
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

            {/* Dispute Management Dialog */}
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogContent className="sm:max-w-[550px] bg-card/95 backdrop-blur-2xl border-white/10 shadow-2xl p-6 rounded-3xl">
                    <DialogHeader className="border-b border-white/10 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl font-bold">Dispute Management</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Conflict details, investigation, and resolution clearance
                                </DialogDescription>
                            </div>
                            {selectedDispute && (
                                <Badge
                                    className={`rounded-full px-3 py-0.5 text-xs font-semibold border-none ${
                                        selectedDispute.status === 'CLEARED'
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                                    }`}
                                >
                                    {selectedDispute.status}
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>

                    {selectedDispute && (
                        <div className="space-y-4 py-2 text-sm">
                            {/* Dispute Identifiers */}
                            <div className="grid grid-cols-2 gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 text-xs">
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Dispute ID</span>
                                    <div className="font-mono font-medium truncate flex items-center gap-1" title={selectedDispute.id}>
                                        <span>{selectedDispute.id}</span>
                                        <button onClick={() => handleCopy(selectedDispute.id, 'modal-disp-id')} className="hover:text-primary">
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Date Raised</span>
                                    <div className="text-foreground">
                                        {new Date(selectedDispute.createdAt).toLocaleString('en-IN', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Issue Statement */}
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Issue Description
                                </span>
                                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-sm font-medium">
                                    {selectedDispute.reason}
                                </div>
                            </div>

                            {/* Parties Involved */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-muted-foreground block">Raised By (Client)</span>
                                    <div className="font-semibold text-sm">{selectedDispute.clientName}</div>
                                    <div className="text-xs text-muted-foreground truncate">{selectedDispute.clientEmail}</div>
                                    {selectedDispute.clientPhone && selectedDispute.clientPhone !== 'N/A' && (
                                        <div className="text-[11px] text-muted-foreground">{selectedDispute.clientPhone}</div>
                                    )}
                                </div>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-muted-foreground block">Against (Vendor)</span>
                                    <div className="font-semibold text-sm">{selectedDispute.vendorName}</div>
                                    <div className="text-xs text-muted-foreground truncate">{selectedDispute.vendorEmail}</div>
                                </div>
                            </div>

                            {/* Associated Booking Record */}
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-muted-foreground block">Related Booking</span>
                                    <div className="font-semibold text-sm mt-0.5">{selectedDispute.campaignName}</div>
                                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{selectedDispute.transactionId}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-muted-foreground block">Booking Amount</span>
                                    <div className="font-bold text-sm text-primary mt-0.5">
                                        ₹{selectedDispute.bookingAmount?.toLocaleString('en-IN') || 0}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5 uppercase">
                                        {selectedDispute.bookingStatus}
                                    </div>
                                </div>
                            </div>

                            {/* Resolution Notes Input */}
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Resolution & Clearance Notes
                                </span>
                                <Textarea
                                    placeholder="Enter administrative notes on how this dispute was handled (e.g., Refund issued, Vendor re-scheduled campaign, Agreement reached)..."
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    className="bg-white/5 border-white/10 rounded-2xl text-xs resize-none h-20 focus:border-primary"
                                />
                                {selectedDispute.clearedAt && (
                                    <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                                        <Check className="h-3 w-3" />
                                        Cleared on {new Date(selectedDispute.clearedAt).toLocaleString('en-IN')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 pt-2 border-t border-white/10">
                        {selectedDispute && selectedDispute.status === 'OPEN' ? (
                            <Button 
                                variant="default" 
                                className="w-full sm:w-auto rounded-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                                onClick={() => handleUpdateStatus(selectedDispute.id, 'CLEARED')}
                                disabled={isSubmitting}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {isSubmitting ? "Marking Cleared..." : "Mark as Cleared"}
                            </Button>
                        ) : (
                            <Button 
                                variant="outline" 
                                className="w-full sm:w-auto rounded-full border-white/10 hover:bg-white/10 text-muted-foreground gap-2"
                                onClick={() => handleUpdateStatus(selectedDispute.id, 'OPEN')}
                                disabled={isSubmitting}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reopen Dispute
                            </Button>
                        )}
                        <Button 
                            variant="outline" 
                            className="w-full sm:w-auto rounded-full border-white/10 hover:bg-white/10"
                            onClick={() => setIsManageOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
