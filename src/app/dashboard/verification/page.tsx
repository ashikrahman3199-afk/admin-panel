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
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Eye, RefreshCw } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/resource";

const client = generateClient<Schema>();

// Removed legacy server actions

export default function VerificationPage() {
    const [mounted, setMounted] = React.useState(false);
    const [adSpaces, setAdSpaces] = React.useState<Array<any>>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [selectedSpaceForRejection, setSelectedSpaceForRejection] = React.useState<any>(null);
    const [isRejectionDialogOpen, setIsRejectionDialogOpen] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const fetchPendingAdSpaces = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await client.models.AdSpace.list();
            
            // Sort: Pending first, then by date
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
    }, []);

    React.useEffect(() => {
        fetchPendingAdSpaces();
        // Removed AppSync subscriptions since we are directly using DynamoDB Server Actions for now
    }, [fetchPendingAdSpaces]);

    const handleUpdateStatus = async (id: string, name: string, status: "Active" | "Rejected" | "Pending", reason?: string) => {
        try {
            // Map "Active" to "APPROVED" to match schema
            const mappedStatus = status === "Active" ? "APPROVED" : status.toUpperCase();
            
            const { data, errors } = await client.models.AdSpace.update({
                id,
                approvalStatus: mappedStatus,
                ...(reason ? { rejectionReason: reason } : {})
            });
            
            if (errors) {
                throw new Error("GraphQL Error: " + errors[0].message);
            }
            
            toast.success(`Listing ${status}`, { description: `${name} has been ${status.toLowerCase()}.` });
            setIsRejectionDialogOpen(false);
            setRejectionReason("");
            fetchPendingAdSpaces(); // Refresh data
        } catch (error) {
            toast.error("Error", { description: error instanceof Error ? error.message : `Failed to ${status.toLowerCase()} listing.` });
        }
    };

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Listing Verification</h1>
                    <p className="text-muted-foreground">
                        Review and approve new ad spaces added by vendors.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 bg-white/5 border-none"
                    onClick={fetchPendingAdSpaces}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/5">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[100px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Title</TableHead>
                            <TableHead className="text-muted-foreground/70">Category</TableHead>
                            <TableHead className="text-muted-foreground/70">Location</TableHead>
                            <TableHead className="text-muted-foreground/70">Price</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    Loading listings...
                                </TableCell>
                            </TableRow>
                        ) : adSpaces.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    No pending listings found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            adSpaces.map((space) => (
                                <TableRow key={space.id} className="hover:bg-white/5 border-none transition-colors group">
                                    <TableCell className="font-medium text-xs text-muted-foreground">{space.id.substring(0, 8)}</TableCell>
                                    <TableCell className="font-bold">{space.name || space.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="rounded-full bg-white/5 border-none">{space.categoryId || space.category}</Badge>
                                    </TableCell>
                                    <TableCell>{space.location}</TableCell>
                                    <TableCell className="font-bold">₹{space.price}/day</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant="secondary" 
                                            className={`rounded-full px-3 border-none ${
                                                (space.status === "Active" || space.status === "APPROVED")
                                                    ? "bg-green-500/10 text-green-500" 
                                                    : (space.status === "Rejected" || space.status === "REJECTED")
                                                        ? "bg-red-500/10 text-red-500"
                                                        : "bg-yellow-500/10 text-yellow-500"
                                            }`}
                                        >
                                            {space.status || space.approvalStatus || "Pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 items-center">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-card/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>{space.name || space.title}</DialogTitle>
                                                        <DialogDescription>
                                                            {space.description || "No description provided."}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-muted-foreground">Category</span>
                                                                <span>{space.categoryId || space.category}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-muted-foreground">Price</span>
                                                                <span>₹{space.price}/day</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-muted-foreground">Location</span>
                                                                <span>{space.location}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-muted-foreground">Reach</span>
                                                                <span>{space.reach || "N/A"}</span>
                                                            </div>
                                                        </div>
                                                        {(space.status === "Rejected" || space.approvalStatus === "REJECTED") && space.rejectionReason && (
                                                            <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                                                <span className="text-xs font-bold text-red-500 uppercase">Rejection Reason</span>
                                                                <p className="text-sm text-red-700 mt-1">{space.rejectionReason}</p>
                                                            </div>
                                                        )}
                                                        {space.features && space.features.length > 0 && (
                                                            <div className="space-y-2">
                                                                <span className="font-bold text-xs text-muted-foreground uppercase">Features</span>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {space.features.map((f: string, i: number) => (
                                                                        <Badge key={i} variant="secondary" className="rounded-full bg-white/5">{f}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {space.optionsJson && (
                                                            <div className="space-y-2">
                                                                <span className="font-bold text-xs text-muted-foreground uppercase">Add-on Services (Options)</span>
                                                                <div className="grid gap-2">
                                                                    {(() => {
                                                                        try {
                                                                            const options = JSON.parse(space.optionsJson);
                                                                            return options.map((opt: any, i: number) => (
                                                                                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-bold text-sm">{opt.name}</span>
                                                                                        <span className="text-xs text-muted-foreground">Min Duration: {opt.duration} day(s)</span>
                                                                                    </div>
                                                                                    <span className="font-bold text-green-500">₹{opt.price}</span>
                                                                                </div>
                                                                            ));
                                                                        } catch (e) {
                                                                            return <span className="text-xs text-red-500">Error parsing options</span>;
                                                                        }
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <DialogFooter className="gap-2">
                                                        <Button variant="destructive" className="rounded-full px-6" onClick={() => {
                                                            setSelectedSpaceForRejection(space);
                                                            setIsRejectionDialogOpen(true);
                                                        }}>
                                                            Reject
                                                        </Button>
                                                        <Button className="rounded-full px-6 bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(space.id, space.name || space.title, "Active")}>
                                                            Approve
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            {(space.status === "Pending" || space.approvalStatus === "PENDING") && (
                                                <>
                                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-green-500/10 text-green-500" onClick={() => handleUpdateStatus(space.id, space.name || space.title, "Active")}>
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-red-500/10 text-red-500" onClick={() => {
                                                        setSelectedSpaceForRejection(space);
                                                        setIsRejectionDialogOpen(true);
                                                    }}>
                                                        <XCircle className="h-5 w-5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Rejection Reason Dialog */}
            <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
                <DialogContent className="bg-card/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl max-w-sm">
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
                            className="bg-white/5 border-none rounded-xl"
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
        </div>
    );
}
