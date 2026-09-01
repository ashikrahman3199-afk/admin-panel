"use client";

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Clock, ShoppingCart } from "lucide-react";

export default function CartsPage() {
    const [carts, setCarts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCarts = async () => {
            try {
                const res = await fetch('/api/carts');
                const data = await res.json();
                if (data.success) {
                    setCarts(data.carts);
                }
            } catch (err) {
                console.error("Error fetching carts:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCarts();
    }, []);

    const parseItems = (itemsJson?: string) => {
        if (!itemsJson) return [];
        try {
            return JSON.parse(itemsJson);
        } catch (e) {
            return [];
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Active Carts</h2>
                    <p className="text-muted-foreground mt-1">
                        Monitor items that users have added to their cart but not yet booked.
                    </p>
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[150px] text-muted-foreground/70">Cart ID</TableHead>
                            <TableHead className="text-muted-foreground/70">User Details</TableHead>
                            <TableHead className="text-muted-foreground/70">Total Items</TableHead>
                            <TableHead className="text-muted-foreground/70">Last Updated</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Review</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                    Loading carts...
                                </TableCell>
                            </TableRow>
                        ) : carts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                    No active carts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            carts.map((cart) => {
                                const items = parseItems(cart.itemsJson);
                                return (
                                    <TableRow key={cart.id} className="hover:bg-white/5 border-none transition-colors group">
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {cart.id?.substring(0, 15)}...
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{cart.userName || cart.userId?.split('@')[0] || "Unknown User"}</span>
                                                <span className="text-xs text-muted-foreground">{cart.userPhone || cart.userId || "No phone"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="rounded-full bg-white/5 border-none flex w-fit items-center gap-1">
                                                <ShoppingCart className="h-3 w-3" />
                                                {items.length} Services
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {new Date(cart._lastChangedAt || cart.orderDate || Date.now()).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl bg-card/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Cart Details</DialogTitle>
                                                        <DialogDescription>
                                                            Viewing cart for {cart.userName || cart.userId} ({cart.userPhone || "No phone"})
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    
                                                    <div className="mt-4 space-y-4">
                                                        {items.length > 0 ? items.map((item: any, idx: number) => (
                                                            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-4 items-center">
                                                                {item.image ? (
                                                                    <img src={item.image} alt="Service" className="w-16 h-16 rounded-lg object-cover bg-white/10" />
                                                                ) : (
                                                                    <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                                                                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1">
                                                                    <h4 className="font-bold text-sm">{item.title || item.name}</h4>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {item.category} • {item.location}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-sm">₹{item.price}</div>
                                                                    <div className="text-xs text-muted-foreground mt-1">Qty: {item.quantity || 1}</div>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="text-center py-10 text-muted-foreground">Cart is empty or items data is missing.</div>
                                                        )}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
