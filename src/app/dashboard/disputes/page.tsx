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
import { AlertCircle, CheckCircle, MessageSquare } from "lucide-react";
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

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/resource";

const client = generateClient<Schema>();

export default function DisputesPage() {
    const [disputes, setDisputes] = useState<Array<any>>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => setIsMounted(true), 0);
        if (!(client.models as any).Dispute) return;
        const sub = (client.models as any).Dispute.observeQuery().subscribe({
            next: (data: any) => setDisputes([...data.items]),
        });
        return () => {
            clearTimeout(timeoutId);
            sub.unsubscribe();
        };
    }, []);
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dispute Management</h1>
                    <p className="text-muted-foreground">
                        Resolve conflicts between clients and vendors.
                    </p>
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[120px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Issue</TableHead>
                            <TableHead className="text-muted-foreground/70">Raised By</TableHead>
                            <TableHead className="text-muted-foreground/70">Against Vendor</TableHead>
                            <TableHead className="text-muted-foreground/70">Date</TableHead>
                            <TableHead className="text-muted-foreground/70">Severity</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {disputes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No disputes found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            disputes.filter(d => d && d.id).map((dispute) => (
                                <TableRow key={dispute.id} className="hover:bg-white/5 border-none transition-colors group">
                                    <TableCell className="font-medium group-hover:text-primary transition-colors">{dispute.id.slice(0, 8)}...</TableCell>
                                    <TableCell className="font-medium">{dispute.reason}</TableCell>
                                    <TableCell>{dispute.raisedBy ? dispute.raisedBy.slice(0, 8) + '...' : 'Unknown'}</TableCell>
                                    <TableCell>{dispute.transactionId ? dispute.transactionId.slice(0, 8) + '...' : 'N/A'}</TableCell>
                                    <TableCell>{isMounted ? new Date(dispute.createdAt).toLocaleDateString() : "Loading..."}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-white/10 rounded-full border-none">
                                            Standard
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={dispute.status === "OPEN" ? "outline" : "default"} className={`rounded-full px-3 border-none ${dispute.status === "OPEN" ? "bg-red-500/10 text-red-500" : "bg-green-500/20 text-green-500"}`}>
                                            {dispute.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" title="View Details" className="rounded-full hover:bg-white/10">
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-card/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Dispute Details: {dispute.id}</DialogTitle>
                                                        <DialogDescription>
                                                            Review dispute information and take action.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="space-y-2">
                                                            <span className="font-bold block text-sm text-muted-foreground">Issue Description:</span>
                                                            <p className="p-3 rounded-xl text-sm bg-white/5 border border-white/5">
                                                                {dispute.reason}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <span className="font-bold text-sm text-muted-foreground">Raised By:</span>
                                                                <div className="text-sm font-medium">{dispute.raisedBy || "N/A"}</div>
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-sm text-muted-foreground">Against TXN:</span>
                                                                <div className="text-sm font-medium">{dispute.transactionId || "N/A"}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" className="rounded-full border-none bg-white/5 hover:bg-white/10" onClick={() => toast.info("Info Requested", { description: "Request sent to client." })}>Request More Info</Button>
                                                        <Button className="rounded-full shadow-lg shadow-primary/20" onClick={() => toast.success("Dispute Resolved", { description: "The dispute has been marked as resolved." })}>Resolve Dispute</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                            <Button variant="ghost" size="icon" title="Resolve" className="rounded-full hover:bg-green-500/10 hover:text-green-500" onClick={() => toast.success("Dispute Resolved", { description: "The dispute has been marked as resolved." })}>
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            </Button>
                                        </div>
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
