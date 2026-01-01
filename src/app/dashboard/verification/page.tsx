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

const pendingServices = [
    {
        id: "SRV-001",
        vendor: "City Billboards Co.",
        serviceName: "LED Wall - Times Square",
        type: "Digital Billboard",
        price: "₹50,000/day",
        submitted: "2023-10-28",
        status: "Pending Review",
    },
    {
        id: "SRV-002",
        vendor: "Metro Ads",
        serviceName: "Subway Station Posters",
        type: "Poster",
        price: "₹5,000/week",
        submitted: "2023-10-27",
        status: "Pending Review",
    },
    {
        id: "SRV-003",
        vendor: "Skyline Media",
        serviceName: "Rooftop Giant Banner",
        type: "Banner",
        price: "₹1,20,000/month",
        submitted: "2023-10-26",
        status: "Pending Review",
    },
];

export default function VerificationPage() {
    const [services, setServices] = React.useState(pendingServices);

    const handleApprove = (id: string, name: string) => {
        setServices(prev => prev.map(service =>
            service.id === id ? { ...service, status: "Approved" } : service
        ));
        toast.success("Service Approved", { description: `${name} has been approved.` });
    };

    const handleReject = (id: string, name: string) => {
        setServices(prev => prev.map(service =>
            service.id === id ? { ...service, status: "Rejected" } : service
        ));
        toast.error("Service Rejected", { description: `${name} has been rejected.` });
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
                        {services.map((service) => (
                            <TableRow key={service.id} className="hover:bg-white/5 border-none transition-colors group">
                                <TableCell className="font-medium group-hover:text-primary transition-colors">{service.id}</TableCell>
                                <TableCell className="font-medium">{service.serviceName}</TableCell>
                                <TableCell>{service.vendor}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="rounded-full bg-white/5 border-none">{service.type}</Badge>
                                </TableCell>
                                <TableCell className="font-bold">{service.price}</TableCell>
                                <TableCell>{service.submitted}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2 items-center min-h-[40px]">
                                        {service.status === "Pending Review" ? (
                                            <>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" title="View Details" className="rounded-full hover:bg-white/10 border border-transparent hover:border-white/20">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-card/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>{service.serviceName}</DialogTitle>
                                                            <DialogDescription>
                                                                Review service details before approval.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid grid-cols-4 items-center gap-4 text-sm">
                                                                <span className="font-bold text-muted-foreground">Vendor:</span>
                                                                <span className="col-span-3 font-medium">{service.vendor}</span>
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4 text-sm">
                                                                <span className="font-bold text-muted-foreground">Type:</span>
                                                                <span className="col-span-3">{service.type}</span>
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4 text-sm">
                                                                <span className="font-bold text-muted-foreground">Price:</span>
                                                                <span className="col-span-3 font-medium">{service.price}</span>
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4 text-sm">
                                                                <span className="font-bold text-muted-foreground">Dimensions:</span>
                                                                <span className="col-span-3">20ft x 10ft (Mock Data)</span>
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4 text-sm">
                                                                <span className="font-bold text-muted-foreground">Description:</span>
                                                                <span className="col-span-3">High visibility LED screen in prime location.</span>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="destructive" className="gap-2 rounded-full shadow-lg shadow-red-500/20" onClick={() => handleReject(service.id, service.serviceName)}>
                                                                <XCircle className="h-4 w-4" /> Reject
                                                            </Button>
                                                            <Button className="gap-2 bg-green-600 hover:bg-green-700 rounded-full shadow-lg shadow-green-500/20" onClick={() => handleApprove(service.id, service.serviceName)}>
                                                                <CheckCircle2 className="h-4 w-4" /> Approve
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>

                                                <Button variant="ghost" size="icon" title="Approve" className="rounded-full hover:bg-green-500/10 hover:text-green-500 text-green-500" onClick={() => handleApprove(service.id, service.serviceName)}>
                                                    <CheckCircle2 className="h-5 w-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Reject" className="rounded-full hover:bg-red-500/10 hover:text-red-500 text-destructive" onClick={() => handleReject(service.id, service.serviceName)}>
                                                    <XCircle className="h-5 w-5" />
                                                </Button>
                                            </>
                                        ) : service.status === "Approved" ? (
                                            <div className="flex items-center gap-2 text-green-500 font-medium px-3 py-1 rounded-full bg-green-500/10">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Approved
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-500 font-medium px-3 py-1 rounded-full bg-red-500/10">
                                                <XCircle className="h-4 w-4" />
                                                Rejected
                                            </div>
                                        )}
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
