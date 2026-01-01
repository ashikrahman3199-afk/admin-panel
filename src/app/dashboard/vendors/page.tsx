"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const vendors = [
    {
        id: "VND001",
        businessName: "City Billboards Co.",
        contact: "John Doe",
        location: "New York, NY",
        status: "Verified",
        inventory: 15,
    },
    {
        id: "VND002",
        businessName: "Metro Ads",
        contact: "Jane Smith",
        location: "Chicago, IL",
        status: "Pending",
        inventory: 8,
    },
    {
        id: "VND003",
        businessName: "Skyline Media",
        contact: "Mike Jones",
        location: "Los Angeles, CA",
        status: "Verified",
        inventory: 24,
    },
];

export default function VendorsPage() {
    const [vendorsList, setVendorsList] = React.useState(vendors);

    const handleApprove = (id: string, name: string) => {
        setVendorsList(prev => prev.map(vendor =>
            vendor.id === id ? { ...vendor, status: "Verified" } : vendor
        ));
        toast.success("Vendor Approved", { description: `${name} has been approved.` });
    };

    const handleReject = (id: string, name: string) => {
        setVendorsList(prev => prev.map(vendor =>
            vendor.id === id ? { ...vendor, status: "Rejected" } : vendor
        ));
        toast.error("Vendor Rejected", { description: `${name} has been rejected.` });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
                    <p className="text-muted-foreground">
                        Oversee vendor accounts, verification, and inventory.
                    </p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">Onboard Vendor</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Onboard New Vendor</DialogTitle>
                            <DialogDescription>Register a new vendor and their primary location.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right text-sm font-medium">Business</span>
                                <Input id="business" placeholder="Vendor Co." className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right text-sm font-medium">Contact</span>
                                <Input id="contact" placeholder="Jane Doe" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right text-sm font-medium">Location</span>
                                <Input id="location" placeholder="City, State" className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Complete Onboarding</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[100px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Business Name</TableHead>
                            <TableHead className="text-muted-foreground/70">Contact</TableHead>
                            <TableHead className="text-muted-foreground/70">Location</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-center text-muted-foreground/70">Inventory</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vendorsList.map((vendor) => (
                            <TableRow key={vendor.id} className="hover:bg-white/5 border-none transition-colors group">
                                <TableCell className="font-medium group-hover:text-primary transition-colors">{vendor.id}</TableCell>
                                <TableCell className="font-bold">{vendor.businessName}</TableCell>
                                <TableCell>{vendor.contact}</TableCell>
                                <TableCell>{vendor.location}</TableCell>
                                <TableCell>
                                    <Badge variant={vendor.status === "Verified" ? "default" : vendor.status === "Rejected" ? "destructive" : "secondary"} className={`rounded-full px-3 border-none ${vendor.status === "Verified" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : vendor.status === "Rejected" ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"}`}>
                                        {vendor.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="link" className="text-primary hover:underline font-bold">
                                                {vendor.inventory} Units
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl bg-card/90 backdrop-blur-xl border-none shadow-2xl">
                                            <DialogHeader>
                                                <DialogTitle>{vendor.businessName} - Inventory</DialogTitle>
                                                <DialogDescription>
                                                    Manage services and inventory units provided by this vendor.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="bg-white/5 rounded-2xl mt-4 overflow-hidden border-none ring-1 ring-white/5">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="border-none hover:bg-transparent">
                                                            <TableHead className="text-muted-foreground/70">Service Name</TableHead>
                                                            <TableHead className="text-muted-foreground/70">Type</TableHead>
                                                            <TableHead className="text-muted-foreground/70">Price</TableHead>
                                                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        <TableRow className="border-none hover:bg-white/5">
                                                            <TableCell className="font-medium">Times Square LED</TableCell>
                                                            <TableCell>Digital</TableCell>
                                                            <TableCell className="font-bold">₹50,000</TableCell>
                                                            <TableCell><Badge className="bg-green-500 rounded-full">Live</Badge></TableCell>
                                                        </TableRow>
                                                        <TableRow className="border-none hover:bg-white/5">
                                                            <TableCell className="font-medium">Broadway Banner</TableCell>
                                                            <TableCell>Print</TableCell>
                                                            <TableCell className="font-bold">₹20,000</TableCell>
                                                            <TableCell><Badge variant="secondary" className="rounded-full">In Review</Badge></TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                            <DialogFooter className="mt-4">
                                                <Button variant="outline" className="rounded-full border-none bg-white/5 hover:bg-white/10">Close</Button>
                                                <Button variant="default" className="rounded-full">View All Services</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2 items-center min-h-[40px]">
                                        {vendor.status === "Pending" ? (
                                            <>
                                                <Button variant="ghost" size="icon" title="Approve" className="rounded-full hover:bg-green-500/10 hover:text-green-500" onClick={() => handleApprove(vendor.id, vendor.businessName)}>
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Reject" className="rounded-full hover:bg-red-500/10 hover:text-red-500" onClick={() => handleReject(vendor.id, vendor.businessName)}>
                                                    <XCircle className="h-5 w-5 text-destructive" />
                                                </Button>
                                            </>
                                        ) : vendor.status === "Verified" ? (
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
