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
import { CheckCircle2, XCircle, Eye } from "lucide-react";
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

function ServiceOptionsList({ serviceId }: { serviceId: string }) {
    const [options, setOptions] = React.useState<Array<Schema["ServiceOption"]["type"]>>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!serviceId) return;
        setLoading(true);
        // Ensure the model exists before querying (just in case types are syncing)
        if (!client.models.ServiceOption) {
            setLoading(false);
            return;
        }

        const sub = client.models.ServiceOption.observeQuery({
            filter: { serviceId: { eq: serviceId } }
        }).subscribe({
            next: (data) => {
                setOptions([...data.items]);
                setLoading(false);
            },
            error: (err) => {
                console.error("Error fetching options:", err);
                setLoading(false);
            }
        });
        return () => sub.unsubscribe();
    }, [serviceId]);

    if (loading) return <div className="text-sm text-muted-foreground animate-pulse">Loading options...</div>;

    if (options.length === 0) return (
        <div className="text-sm text-muted-foreground italic bg-white/5 p-3 rounded-xl border border-white/10">
            No options provided for this service.
        </div>
    );

    return (
        <div className="space-y-2 mt-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service Options</h4>
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {options.map(opt => (
                    <div key={opt.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
                        <div>
                            <p className="font-semibold">{opt.name}</p>
                            <p className="text-xs text-muted-foreground">{opt.duration}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">₹{opt.price}</p>
                            {opt.status && (
                                <Badge variant="secondary" className="mt-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] px-2 py-0">
                                    {opt.status}
                                </Badge>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function VerificationPage() {
    const [services, setServices] = React.useState<Array<Schema["Service"]["type"]>>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const fetchPendingServices = async () => {
        setIsLoading(true);
        try {
            const { data, errors } = await client.models.Service.list({
                filter: { approvalStatus: { eq: "pending" } }
            });
            if (errors) {
                console.warn("GraphQL Errors fetching services (likely schema mismatch):", errors);
            }
            // Filter out nulls safely in case of GraphQL translation errors (e.g. missing updatedAt)
            const validServices = data.filter((s): s is NonNullable<typeof s> => s !== null);
            validServices.sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
            });
            setServices(validServices);
        } catch (error) {
            console.error("Error fetching pending services:", error);
            toast.error("Failed to load services");
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPendingServices();
        if (!client.models.Service) return;

        const sub = client.models.Service.observeQuery({
            filter: {
                approvalStatus: {
                    eq: "pending"
                }
            }
        }).subscribe({
            next: (data) => {
                setServices([...data.items]);
            },
        });
        return () => sub.unsubscribe();
    }, []);

    const handleApprove = async (id: string, name: string) => {
        try {
            setServices(prev => prev.filter(s => s && s.id !== id));
            await client.models.Service.update({ id, approvalStatus: "approved" });
            toast.success("Service Approved", { description: `${name} has been approved.` });
        } catch {
            toast.error("Error", { description: "Failed to approve service." });
        }
    };

    const handleReject = async (id: string, name: string) => {
        try {
            setServices(prev => prev.filter(s => s && s.id !== id));
            await client.models.Service.update({ id, approvalStatus: "rejected" });
            toast.error("Service Rejected", { description: `${name} has been rejected.` });
        } catch {
            toast.error("Error", { description: "Failed to reject service." });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Service Verification</h1>
                    <p className="text-muted-foreground">
                        Review and approve new services added by vendors.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="default"
                        className="rounded-full shadow-lg shadow-primary/20"
                        onClick={async () => {
                            toast.promise(fetchPendingServices(), {
                                loading: "Refreshing list...",
                                success: "List refreshed successfully!",
                                error: "Failed to refresh list"
                            });
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? "Refreshing..." : "Refresh List"}
                    </Button>
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[100px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Service Name</TableHead>
                            <TableHead className="text-muted-foreground/70">Vendor</TableHead>
                            <TableHead className="text-muted-foreground/70">Type</TableHead>
                            <TableHead className="text-muted-foreground/70">Price</TableHead>
                            <TableHead className="text-muted-foreground/70">Submitted</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.filter(s => s && s.id).map((service) => (
                            <TableRow key={service.id} className="hover:bg-white/5 border-none transition-colors group">
                                <TableCell className="font-medium group-hover:text-primary transition-colors">{service.id.substring(0, 8)}</TableCell>
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell>{service.vendorId ? service.vendorId.substring(0, 8) : "Unknown"}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="rounded-full bg-white/5 border-none">{service.type}</Badge>
                                </TableCell>
                                <TableCell className="font-bold">₹{service.price}</TableCell>
                                <TableCell>{service.createdAt ? new Date(service.createdAt).toLocaleDateString() : "-"}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2 items-center min-h-[40px]">
                                        {/* Status is always PENDING_REVIEW here based on filter, but handling others just in case */}
                                        {service.approvalStatus === "pending" ? (
                                            <>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" title="View Details" className="rounded-full hover:bg-white/10 border border-transparent hover:border-white/20">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-card/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>{service.name}</DialogTitle>
                                                            <DialogDescription>
                                                                Review service details before approval.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid grid-cols-4 items-center gap-4 text-sm">
                                                                <span className="font-bold text-muted-foreground">Vendor ID:</span>
                                                                <span className="col-span-3 font-medium">{service.vendorId}</span>
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4 text-sm">
                                                                <span className="font-bold text-muted-foreground">Type:</span>
                                                                <span className="col-span-3">{service.type}</span>
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4 text-sm">
                                                                <span className="font-bold text-muted-foreground">Price:</span>
                                                                <span className="col-span-3 font-medium">₹{service.price}</span>
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4 text-sm">
                                                                <span className="font-bold text-muted-foreground">Description:</span>
                                                                <span className="col-span-3">{service.description || "No description provided."}</span>
                                                            </div>
                                                            <div className="pt-2 border-t border-white/10">
                                                                <ServiceOptionsList serviceId={service.id} />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="destructive" className="gap-2 rounded-full shadow-lg shadow-red-500/20" onClick={() => handleReject(service.id, service.name)}>
                                                                <XCircle className="h-4 w-4" /> Reject
                                                            </Button>
                                                            <Button className="gap-2 bg-green-600 hover:bg-green-700 rounded-full shadow-lg shadow-green-500/20" onClick={() => handleApprove(service.id, service.name)}>
                                                                <CheckCircle2 className="h-4 w-4" /> Approve
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>

                                                <Button variant="ghost" size="icon" title="Approve" className="rounded-full hover:bg-green-500/10 hover:text-green-500 text-green-500" onClick={() => handleApprove(service.id, service.name)}>
                                                    <CheckCircle2 className="h-5 w-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Reject" className="rounded-full hover:bg-red-500/10 hover:text-red-500 text-destructive" onClick={() => handleReject(service.id, service.name)}>
                                                    <XCircle className="h-5 w-5" />
                                                </Button>
                                            </>
                                        ) : null}
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
