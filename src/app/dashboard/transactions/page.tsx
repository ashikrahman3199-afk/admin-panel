"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    Download, 
    RefreshCw, 
    Search, 
    CheckCircle2, 
    Clock, 
    Activity, 
    Copy, 
    Check, 
    FileText, 
    Printer 
} from "lucide-react";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalCompletedCount: 0,
        totalPendingCount: 0,
        totalTransactions: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTab, setFilterTab] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');
    const [selectedTxn, setSelectedTxn] = useState<any>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/transactions');
            const data = await res.json();
            if (data.success) {
                setTransactions(data.transactions || []);
                if (data.summary) {
                    setSummary(data.summary);
                }
            } else {
                toast.error("Error", { description: data.error || "Failed to load transactions." });
            }
        } catch (error: any) {
            console.error("Failed to fetch transactions:", error);
            toast.error("Error", { description: "Failed to connect to transaction services." });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Copied to clipboard", { description: text });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleMarkCompleted = async (bookingId: string) => {
        setUpdatingId(bookingId);
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, status: 'COMPLETED' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Transaction Completed", { 
                    description: "Transaction status updated to COMPLETED and added to Total Revenue." 
                });
                setIsReceiptOpen(false);
                fetchTransactions();
            } else {
                toast.error("Update Failed", { description: data.error || "Could not update status." });
            }
        } catch (err: any) {
            toast.error("Error", { description: "An error occurred while updating status." });
        } finally {
            setUpdatingId(null);
        }
    };

    const exportToCSV = () => {
        if (transactions.length === 0) {
            toast.error("No Data", { description: "There are no transactions to export." });
            return;
        }

        const headers = ["Transaction ID", "Booking ID", "Campaign Name", "Amount (INR)", "Payer Name", "Payer Email", "Payee Vendor", "Date", "Payment Method", "Status"];
        const rows = filteredTransactions.map(t => [
            `"${t.id}"`,
            `"${t.bookingId}"`,
            `"${t.campaignName || ''}"`,
            t.amount,
            `"${t.payerName || ''}"`,
            `"${t.payerEmail || ''}"`,
            `"${t.payeeName || t.payeeEmail || ''}"`,
            `"${new Date(t.date).toLocaleDateString()}"`,
            `"${t.method || ''}"`,
            `"${t.status}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `AdAgen_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Report Exported", { description: "CSV report has been downloaded." });
    };

    // Filter transactions
    const filteredTransactions = transactions.filter(txn => {
        // Tab filter
        if (filterTab === 'COMPLETED' && txn.status !== 'COMPLETED') return false;
        if (filterTab === 'PENDING' && txn.status === 'COMPLETED') return false;

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (txn.id && txn.id.toLowerCase().includes(q)) ||
            (txn.bookingId && txn.bookingId.toLowerCase().includes(q)) ||
            (txn.campaignName && txn.campaignName.toLowerCase().includes(q)) ||
            (txn.payerName && txn.payerName.toLowerCase().includes(q)) ||
            (txn.payerEmail && txn.payerEmail.toLowerCase().includes(q)) ||
            (txn.payeeName && txn.payeeName.toLowerCase().includes(q)) ||
            (txn.payeeEmail && txn.payeeEmail.toLowerCase().includes(q))
        );
    });

    const openReceipt = (txn: any) => {
        setSelectedTxn(txn);
        setIsReceiptOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transaction Reports</h1>
                    <p className="text-muted-foreground">
                        Financial transaction records reported from customer bookings and fulfilled orders.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full gap-2 border-white/10 hover:bg-white/10"
                        onClick={fetchTransactions}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button 
                        variant="default" 
                        size="sm"
                        className="rounded-full shadow-lg shadow-primary/20 gap-2" 
                        onClick={exportToCSV}
                    >
                        <Download className="h-4 w-4" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Completed Revenue</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">
                            {formatCurrency(summary.totalRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Reported from completed transactions (matches Dashboard)
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Completed Transactions</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.totalCompletedCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Fully completed & accounted transactions
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending / In-Progress</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-400">
                            {summary.totalPendingCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Active bookings awaiting completion
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls: Search and Filter Tabs */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-full bg-white/5 p-1 border border-white/10">
                        <button
                            onClick={() => setFilterTab('ALL')}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                filterTab === 'ALL'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-white'
                            }`}
                        >
                            All ({transactions.length})
                        </button>
                        <button
                            onClick={() => setFilterTab('COMPLETED')}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                filterTab === 'COMPLETED'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-muted-foreground hover:text-white'
                            }`}
                        >
                            Completed ({summary.totalCompletedCount})
                        </button>
                        <button
                            onClick={() => setFilterTab('PENDING')}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                filterTab === 'PENDING'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-muted-foreground hover:text-white'
                            }`}
                        >
                            Pending / Active ({summary.totalPendingCount})
                        </button>
                    </div>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search ID, client, vendor, campaign..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 rounded-full bg-white/5 border-white/10 text-sm focus:border-primary"
                    />
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl border border-white/5 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-white/10">
                            <TableHead className="w-[130px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Campaign</TableHead>
                            <TableHead className="text-muted-foreground/70">Amount (INR)</TableHead>
                            <TableHead className="text-muted-foreground/70">Payer</TableHead>
                            <TableHead className="text-muted-foreground/70">Payee (Vendor)</TableHead>
                            <TableHead className="text-muted-foreground/70">Date</TableHead>
                            <TableHead className="text-muted-foreground/70">Method</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Loading transactions...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                    No transactions found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map((txn) => {
                                const isCompleted = txn.status === 'COMPLETED';
                                const isFailed = txn.status === 'FAILED';

                                return (
                                    <TableRow key={txn.id} className="hover:bg-white/5 border-white/5 transition-colors group">
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span title={txn.id}>
                                                    {txn.id.length > 12 ? `${txn.id.slice(0, 10)}...` : txn.id}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(txn.id, txn.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white"
                                                    title="Copy ID"
                                                >
                                                    {copiedId === txn.id ? (
                                                        <Check className="h-3 w-3 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="font-medium text-sm text-foreground/90 max-w-[150px] truncate" title={txn.campaignName}>
                                                {txn.campaignName}
                                            </div>
                                            {txn.services && txn.services.length > 0 && (
                                                <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                                    {txn.services.join(", ")}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="font-bold text-base whitespace-nowrap">
                                            <span className={isCompleted ? "text-emerald-400" : "text-foreground"}>
                                                {formatCurrency(txn.amount)}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <div className="text-sm font-medium max-w-[130px] truncate" title={txn.payerName}>
                                                {txn.payerName}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground max-w-[130px] truncate" title={txn.payerEmail}>
                                                {txn.payerEmail}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="text-sm font-medium max-w-[130px] truncate" title={txn.payeeName}>
                                                {txn.payeeName}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground max-w-[130px] truncate" title={txn.payeeEmail}>
                                                {txn.payeeEmail}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(txn.date).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </TableCell>

                                        <TableCell>
                                            <Badge variant="outline" className="whitespace-nowrap rounded-full border-white/10 bg-white/5 text-[11px]">
                                                {txn.method}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border-none ${
                                                    isCompleted
                                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                                        : isFailed
                                                            ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                                            : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                                }`}
                                            >
                                                {isCompleted ? "COMPLETED" : isFailed ? "FAILED" : txn.status}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="rounded-full hover:bg-white/10 text-xs gap-1.5"
                                                onClick={() => openReceipt(txn)}
                                            >
                                                <FileText className="h-3.5 w-3.5" />
                                                View Bill
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Bill / Transaction Receipt Dialog */}
            <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
                <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-2xl border-white/10 shadow-2xl p-6 rounded-3xl">
                    <DialogHeader className="border-b border-white/10 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl font-bold">Transaction Receipt</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Ad.Agen Official Financial Record
                                </DialogDescription>
                            </div>
                            {selectedTxn && (
                                <Badge
                                    className={`rounded-full px-3 py-0.5 text-xs font-semibold border-none ${
                                        selectedTxn.status === 'COMPLETED'
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    }`}
                                >
                                    {selectedTxn.status}
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>

                    {selectedTxn && (
                        <div className="space-y-4 py-2 text-sm">
                            {/* Key Identifiers */}
                            <div className="grid grid-cols-2 gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/5 text-xs">
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Transaction ID</span>
                                    <div className="font-mono font-medium truncate flex items-center gap-1" title={selectedTxn.id}>
                                        <span>{selectedTxn.id}</span>
                                        <button onClick={() => handleCopy(selectedTxn.id, 'modal-id')} className="hover:text-primary">
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Booking ID</span>
                                    <div className="font-mono font-medium truncate flex items-center gap-1" title={selectedTxn.bookingId}>
                                        <span>{selectedTxn.bookingId}</span>
                                        <button onClick={() => handleCopy(selectedTxn.bookingId, 'modal-bid')} className="hover:text-primary">
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center py-1 border-b border-white/5">
                                    <span className="text-muted-foreground text-xs">Campaign</span>
                                    <span className="font-semibold text-right">{selectedTxn.campaignName}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-white/5">
                                    <span className="text-muted-foreground text-xs">Date & Time</span>
                                    <span className="text-right text-xs">
                                        {new Date(selectedTxn.date).toLocaleString('en-IN', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-white/5">
                                    <span className="text-muted-foreground text-xs">Payment Method</span>
                                    <span className="font-medium text-right text-xs">{selectedTxn.method}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-white/5">
                                    <span className="text-muted-foreground text-xs">Payer (Client)</span>
                                    <div className="text-right">
                                        <div className="font-medium text-xs">{selectedTxn.payerName}</div>
                                        <div className="text-[11px] text-muted-foreground">{selectedTxn.payerEmail}</div>
                                        {selectedTxn.payerPhone && selectedTxn.payerPhone !== 'N/A' && (
                                            <div className="text-[10px] text-muted-foreground">{selectedTxn.payerPhone}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-white/5">
                                    <span className="text-muted-foreground text-xs">Payee (Vendor)</span>
                                    <div className="text-right">
                                        <div className="font-medium text-xs">{selectedTxn.payeeName}</div>
                                        <div className="text-[11px] text-muted-foreground">{selectedTxn.payeeEmail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Itemized Services (if available) */}
                            {selectedTxn.items && selectedTxn.items.length > 0 && (
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <span className="text-xs font-semibold text-muted-foreground block mb-2 uppercase tracking-wider">
                                        Booked Services ({selectedTxn.items.length})
                                    </span>
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                        {selectedTxn.items.map((it: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-none">
                                                <div className="truncate max-w-[260px]">
                                                    <span className="font-medium">{it.title || it.name || "Ad Space"}</span>
                                                    {it.location && <span className="text-muted-foreground ml-1">({it.location})</span>}
                                                </div>
                                                <div className="font-semibold text-right">
                                                    ₹{it.price || it.minSpend || 0}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Amount Summary */}
                            <div className="flex justify-between items-center bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Total Amount</span>
                                    <span className="text-xs text-emerald-400">
                                        {selectedTxn.status === 'COMPLETED' ? "Included in Total Revenue" : "Pending fulfillment"}
                                    </span>
                                </div>
                                <div className="text-2xl font-black text-primary">
                                    {formatCurrency(selectedTxn.amount)}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 pt-2 border-t border-white/10">
                        {selectedTxn && selectedTxn.status !== 'COMPLETED' && (
                            <Button 
                                variant="default" 
                                className="w-full sm:w-auto rounded-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                                onClick={() => handleMarkCompleted(selectedTxn.bookingId)}
                                disabled={updatingId === selectedTxn.bookingId}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {updatingId === selectedTxn.bookingId ? "Updating..." : "Mark as Completed"}
                            </Button>
                        )}
                        <Button 
                            variant="outline" 
                            className="w-full sm:w-auto rounded-full border-white/10 hover:bg-white/10 gap-2"
                            onClick={() => window.print()}
                        >
                            <Printer className="h-4 w-4" />
                            Print Receipt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
