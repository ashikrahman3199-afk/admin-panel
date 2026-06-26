"use client";

import { useState, useEffect } from "react";
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
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Array<any>>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => setIsMounted(true), 0);
        if (!client.models.Booking) return;
        const sub = client.models.Booking.observeQuery().subscribe({
            next: (data) => setTransactions([...data.items]),
        });
        return () => {
            clearTimeout(timeoutId);
            sub.unsubscribe();
        };
    }, []);

    const [filterMethod, setFilterMethod] = useState<string | null>(null);

    const filteredTransactions = transactions;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transaction Reports</h1>
                    <p className="text-muted-foreground">
                        View and filter all financial transactions.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="default" className="rounded-full shadow-lg shadow-primary/20" onClick={() => toast.success("Report Exported", { description: "The transaction report has been downloaded." })}>Export Report</Button>
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[100px] text-muted-foreground/70">ID</TableHead>
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
                        {filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.filter(t => t && t.id).map((txn) => (
                                <TableRow key={txn.id} className="hover:bg-white/5 border-none transition-colors group">
                                    <TableCell className="font-medium group-hover:text-primary transition-colors">{txn.id.slice(0, 8)}...</TableCell>
                                    <TableCell className="font-bold text-lg">₹{txn.amount}</TableCell>
                                    <TableCell>{txn.customerId ? txn.customerId.slice(0, 8) + '...' : 'Unknown'}</TableCell>
                                    <TableCell>{txn.vendorId ? txn.vendorId.slice(0, 8) + '...' : 'Unknown'}</TableCell>
                                    <TableCell>{txn.date || (isMounted ? new Date(txn.createdAt).toLocaleDateString() : 'Loading...')}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="whitespace-nowrap rounded-full border-none bg-white/5">
                                            Standard
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                txn.status === "SUCCESS"
                                                    ? "default"
                                                    : txn.status === "PENDING"
                                                        ? "secondary"
                                                        : "destructive"
                                            }
                                            className={
                                                `rounded-full px-3 border-none ${txn.status === "SUCCESS" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}`
                                            }
                                        >
                                            {txn.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10">
                                                    View Bill
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-xl border-none shadow-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Transaction Receipt</DialogTitle>
                                                    <DialogDescription>
                                                        Receipt for transaction {txn.id}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                                        <span className="font-medium">Transaction ID</span>
                                                        <span>{txn.id}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                                        <span className="font-medium">Date</span>
                                                        <span>{txn.date || (isMounted ? new Date(txn.createdAt).toLocaleDateString() : 'Loading...')}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                                        <span className="font-medium">Amount</span>
                                                        <span className="font-bold text-lg text-primary">₹{txn.amount}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Status</span>
                                                        <span className={txn.status === 'SUCCESS' ? "text-green-500 font-bold" : "text-yellow-500 font-bold"}>{txn.status}</span>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit" className="w-full rounded-full" onClick={() => toast.success("Download Started", { description: `Receipt for ${txn.id} is downloading.` })}>Download PDF</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
