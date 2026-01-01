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

const disputes = [
    {
        id: "DSP-2024-001",
        issue: "Ad not displayed on scheduled time",
        raisedBy: "Nike",
        against: "City Billboards Co.",
        status: "Open",
        severity: "High",
        date: "2023-10-27",
    },
    {
        id: "DSP-2024-002",
        issue: "Image quality issue",
        raisedBy: "Starbucks",
        against: "Metro Ads",
        status: "In Progress",
        severity: "Medium",
        date: "2023-10-25",
    },
    {
        id: "DSP-2024-003",
        issue: "Incorrect billing amount",
        raisedBy: "Apple",
        against: "Skyline Media",
        status: "Resolved",
        severity: "Low",
        date: "2023-10-20",
    },
];

export default function DisputesPage() {
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
                        {disputes.map((dispute) => (
                            <TableRow key={dispute.id} className="hover:bg-white/5 border-none transition-colors group">
                                <TableCell className="font-medium group-hover:text-primary transition-colors">{dispute.id}</TableCell>
                                <TableCell className="font-medium">{dispute.issue}</TableCell>
                                <TableCell>{dispute.raisedBy}</TableCell>
                                <TableCell>{dispute.against}</TableCell>
                                <TableCell>{dispute.date}</TableCell>
                                <TableCell>
                                    <Badge variant={dispute.severity === "High" ? "destructive" : "secondary"} className={`rounded-full px-3 border-none ${dispute.severity === "High" ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/10"}`}>
                                        {dispute.severity}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={dispute.status === "Open" ? "outline" : "default"} className={`rounded-full px-3 border-none ${dispute.status === "Open" ? "bg-red-500/10 text-red-500" : "bg-green-500/20 text-green-500"}`}>
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
                                                            {dispute.raisedBy} claims that the ad service provided by {dispute.against} was not delivered as per the agreement. Specifically: "{dispute.issue}".
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="font-bold text-sm text-muted-foreground">Raised By:</span>
                                                            <div className="text-sm font-medium">{dispute.raisedBy}</div>
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-sm text-muted-foreground">Against:</span>
                                                            <div className="text-sm font-medium">{dispute.against}</div>
                                                        </div>
                                                    </div>
                                                    <div className="pt-4 border-t border-white/10">
                                                        <span className="font-bold block mb-2 text-sm text-muted-foreground">Evidence:</span>
                                                        <div className="flex gap-2">
                                                            <div className="h-16 w-16 bg-white/5 rounded-lg flex items-center justify-center text-xs border border-white/5">IMG_001</div>
                                                            <div className="h-16 w-16 bg-white/5 rounded-lg flex items-center justify-center text-xs border border-white/5">Log.txt</div>
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
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
