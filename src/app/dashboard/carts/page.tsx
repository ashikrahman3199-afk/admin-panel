"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Clock, ShoppingCart, RefreshCw, Search, Copy, Check, User, Phone, Mail, IndianRupee } from "lucide-react";
import { toast } from "sonner";

export default function CartsPage() {
    const [carts, setCarts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCart, setSelectedCart] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchCarts = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/carts');
            const data = await res.json();
            if (data.success) {
                setCarts(data.carts || []);
            } else {
                toast.error("Error", { description: data.error || "Failed to load carts." });
            }
        } catch (err) {
            console.error("Error fetching carts:", err);
            toast.error("Error", { description: "Failed to connect to cart services." });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCarts();
    }, [fetchCarts]);

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

    const openReview = (cart: any) => {
        setSelectedCart(cart);
        setIsDialogOpen(true);
    };

    const totalPotentialValue = carts.reduce((acc, c) => {
        const cTotal = (c.items && c.items.length > 0)
            ? c.items.reduce((sum: number, it: any) => sum + ((Number(it.price) || Number(it.minSpend) || 0) * (Number(it.quantity) || 1)), 0)
            : Number(c.budget || 0);
        return acc + cTotal;
    }, 0);
    const totalServicesCount = carts.reduce((acc, c) => acc + (c.totalItems || (c.items?.length || 0)), 0);

    const filteredCarts = carts.filter(cart => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (cart.id && cart.id.toLowerCase().includes(q)) ||
            (cart.userName && cart.userName.toLowerCase().includes(q)) ||
            (cart.userPhone && cart.userPhone.toLowerCase().includes(q)) ||
            (cart.userEmail && cart.userEmail.toLowerCase().includes(q)) ||
            (cart.items && cart.items.some((it: any) => (it.title || it.name || '').toLowerCase().includes(q)))
        );
    });

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Active Carts</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor services that users have added to their cart but not yet checked out.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full gap-2 border-white/10 hover:bg-white/10"
                        onClick={fetchCarts}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active User Carts</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{carts.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Users currently holding services in cart
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Potential Value</CardTitle>
                        <IndianRupee className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">
                            {formatCurrency(totalPotentialValue)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Estimated gross pipeline value
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Carted Services</CardTitle>
                        <Clock className="h-4 w-4 text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-400">
                            {totalServicesCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Individual ad space units selected
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search client, phone, or service..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 rounded-full bg-white/5 border-white/10 text-sm focus:border-primary"
                    />
                </div>
            </div>

            {/* Carts Table */}
            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl border border-white/5 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-white/10">
                            <TableHead className="w-[180px] text-muted-foreground/70">Cart ID</TableHead>
                            <TableHead className="text-muted-foreground/70">User Details</TableHead>
                            <TableHead className="text-muted-foreground/70">Cart Items</TableHead>
                            <TableHead className="text-muted-foreground/70">Est. Value</TableHead>
                            <TableHead className="text-muted-foreground/70">Last Updated</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Review</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Loading active carts...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredCarts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                                    No active carts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCarts.map((cart) => {
                                const items = cart.items || [];
                                return (
                                    <TableRow key={cart.id} className="hover:bg-white/5 border-white/5 transition-colors group">
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span title={cart.id} className="text-muted-foreground">
                                                    {cart.id.length > 20 ? `${cart.id.slice(0, 18)}...` : cart.id}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(cart.id, cart.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white"
                                                    title="Copy ID"
                                                >
                                                    {copiedId === cart.id ? (
                                                        <Check className="h-3 w-3 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-foreground/90">{cart.userName}</span>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                    <span>{cart.userPhone}</span>
                                                    {cart.userEmail && cart.userEmail !== cart.userName && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate max-w-[140px]" title={cart.userEmail}>{cart.userEmail}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <Badge variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary flex w-fit items-center gap-1.5 py-1 px-3">
                                                <ShoppingCart className="h-3 w-3" />
                                                <span>{items.length} {items.length === 1 ? 'Service' : 'Services'}</span>
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="font-semibold text-sm text-emerald-400">
                                            {formatCurrency(
                                                items.length > 0
                                                    ? items.reduce((sum: number, it: any) => sum + ((Number(it.price) || Number(it.minSpend) || 0) * (Number(it.quantity) || 1)), 0)
                                                    : Number(cart.budget || 0)
                                            )}
                                        </TableCell>

                                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                            {new Date(cart.updatedAt).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="rounded-full hover:bg-white/10 gap-1.5 text-xs"
                                                onClick={() => openReview(cart)}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Review Cart Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl max-h-[85vh] overflow-y-auto p-6">
                    <DialogHeader className="border-b border-white/10 pb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Active Cart Review
                        </DialogTitle>
                        {selectedCart && (
                            <DialogDescription className="text-xs text-muted-foreground mt-1">
                                Cart for {selectedCart.userName} ({selectedCart.userPhone})
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    
                    {selectedCart && (
                        <div className="mt-4 space-y-4">
                            {/* User Info Card */}
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Customer Name</span>
                                    <span className="font-semibold text-sm">{selectedCart.userName}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Phone Number</span>
                                    <span className="font-semibold text-sm">{selectedCart.userPhone}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Email / Account</span>
                                    <span className="text-muted-foreground">{selectedCart.userEmail}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Last Updated</span>
                                    <span className="text-muted-foreground">
                                        {new Date(selectedCart.updatedAt).toLocaleString('en-IN', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Cart Items List */}
                            <div className="space-y-3">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Services in Cart ({selectedCart.items?.length || 0})
                                </span>
                                {selectedCart.items && selectedCart.items.length > 0 ? (
                                    selectedCart.items.map((item: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-center">
                                            {item.image ? (
                                                <img 
                                                    src={item.image} 
                                                    alt="Service" 
                                                    className="w-16 h-16 rounded-xl object-cover bg-white/10 shrink-0" 
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                                    <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm truncate">{item.title || item.name || "Ad Space Service"}</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {item.category || "Advertising"} • {item.location || "Multiple Locations"}
                                                </p>
                                                {item.vendorId && (
                                                    <p className="text-[11px] text-muted-foreground/80 mt-1 truncate">
                                                        Vendor: {item.vendorId}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="font-bold text-base text-primary">
                                                    {formatCurrency((Number(item.price || item.minSpend || 0)) * (Number(item.quantity) || 1))}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Qty: {item.quantity || 1} • {item.duration || 30} days
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground text-sm">
                                        No item details found for this cart.
                                    </div>
                                )}
                            </div>

                            {/* Estimated Total */}
                            <div className="flex justify-between items-center bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Estimated Cart Total</span>
                                    <span className="text-xs text-muted-foreground">Pending customer checkout</span>
                                </div>
                                <div className="text-2xl font-black text-primary">
                                    {formatCurrency(
                                        selectedCart.items && selectedCart.items.length > 0
                                            ? selectedCart.items.reduce((sum: number, it: any) => sum + ((Number(it.price) || Number(it.minSpend) || 0) * (Number(it.quantity) || 1)), 0)
                                            : Number(selectedCart.budget || 0)
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
