"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Phone, MoreHorizontal, Check, X, Eye, Image as ImageIcon, Mail, Calendar, Shield, DollarSign, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Vendor {
    id: string;
    name: string;
    email: string;
    phone: string;
    serviceType: string;
    status: "active" | "pending" | "inactive";
    rating: number;
    location: string;
    joinedDate: string;
    totalListings: number;
}

interface AdSpace {
    id: string;
    vendorId: string;
    vendorName: string;
    type: "Billboard" | "Digital" | "Transit" | "Cinema";
    location: string;
    price: string;
    status: "pending" | "approved" | "rejected";
    image: string;
    dimensions: string;
    availability: string;
}

const initialVendors: Vendor[] = [
    {
        id: "VEN-001",
        name: "Chennai Ads",
        email: "contact@chennaiads.com",
        phone: "+91 98765 43210",
        serviceType: "Billboard",
        status: "active",
        rating: 4.8,
        location: "Anna Nagar, Chennai",
        joinedDate: "2023-01-10",
        totalListings: 12,
    },
    {
        id: "VEN-002",
        name: "Transit Media",
        email: "info@transitmedia.in",
        phone: "+91 98765 12345",
        serviceType: "Transit",
        status: "pending",
        rating: 0,
        location: "Guindy, Chennai",
        joinedDate: "2023-11-05",
        totalListings: 5,
    },
    {
        id: "VEN-003",
        name: "Digital Displays",
        email: "sales@digitaldisplays.com",
        phone: "+91 98765 67890",
        serviceType: "Digital Screen",
        status: "active",
        rating: 4.5,
        location: "T. Nagar, Chennai",
        joinedDate: "2023-06-15",
        totalListings: 8,
    },
];

const initialAdSpaces: AdSpace[] = [
    {
        id: "AD-001",
        vendorId: "VEN-001",
        vendorName: "Chennai Ads",
        type: "Billboard",
        location: "Anna Nagar Arch, Chennai",
        price: "₹1,50,000/month",
        status: "pending",
        image: "/placeholder-ad.jpg",
        dimensions: "40ft x 20ft",
        availability: "Immediate",
    },
    {
        id: "AD-002",
        vendorId: "VEN-003",
        vendorName: "Digital Displays",
        type: "Digital",
        location: "Phoenix Marketcity, Velachery",
        price: "₹75,000/week",
        status: "approved",
        image: "/placeholder-ad.jpg",
        dimensions: "1920x1080 px",
        availability: "From Nov 1st",
    },
    {
        id: "AD-003",
        vendorId: "VEN-002",
        vendorName: "Transit Media",
        type: "Transit",
        location: "OMR IT Corridor Bus Shelter",
        price: "₹25,000/month",
        status: "pending",
        image: "/placeholder-ad.jpg",
        dimensions: "Standard Bus Shelter",
        availability: "Immediate",
    },
];

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
    const [adSpaces, setAdSpaces] = useState<AdSpace[]>(initialAdSpaces);
    const [search, setSearch] = useState("");
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [selectedAdSpace, setSelectedAdSpace] = useState<AdSpace | null>(null);
    const [vendorDetailsOpen, setVendorDetailsOpen] = useState(false);
    const [adSpaceDetailsOpen, setAdSpaceDetailsOpen] = useState(false);

    const filteredVendors = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(search.toLowerCase()) ||
        vendor.serviceType.toLowerCase().includes(search.toLowerCase())
    );

    const filteredAdSpaces = adSpaces.filter(space =>
        space.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        space.location.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdSpaceStatus = (id: string, newStatus: "approved" | "rejected") => {
        setAdSpaces(adSpaces.map(space =>
            space.id === id ? { ...space, status: newStatus } : space
        ));
        setAdSpaceDetailsOpen(false);
    };

    const handleVendorStatus = (id: string, newStatus: "active" | "inactive") => {
        setVendors(vendors.map(vendor =>
            vendor.id === id ? { ...vendor, status: newStatus } : vendor
        ));
        setVendorDetailsOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
                    <p className="text-muted-foreground">
                        Manage vendors and approve their ad space listings.
                    </p>
                </div>
                <div className="w-72">
                    <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-card/50"
                    />
                </div>
            </div>

            <Tabs defaultValue="listings" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="listings">Ad Space Listings</TabsTrigger>
                    <TabsTrigger value="vendors">All Vendors</TabsTrigger>
                </TabsList>

                <TabsContent value="listings" className="space-y-4">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Pending Approvals</CardTitle>
                            <CardDescription>Review and approve ad spaces submitted by vendors.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAdSpaces.map((space) => (
                                        <TableRow key={space.id}>
                                            <TableCell>
                                                <div className="h-10 w-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{space.vendorName}</TableCell>
                                            <TableCell>{space.type}</TableCell>
                                            <TableCell>{space.location}</TableCell>
                                            <TableCell>{space.price}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    space.status === "approved" ? "success" :
                                                        space.status === "rejected" ? "destructive" : "warning"
                                                }>
                                                    {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Dialog open={adSpaceDetailsOpen && selectedAdSpace?.id === space.id} onOpenChange={(open) => {
                                                        setAdSpaceDetailsOpen(open);
                                                        if (open) setSelectedAdSpace(space);
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" title="View Details">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-md">
                                                            <DialogHeader>
                                                                <DialogTitle>Ad Space Verification</DialogTitle>
                                                                <DialogDescription>Review listing details before approval.</DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                                                                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-muted-foreground text-xs">Vendor</Label>
                                                                        <p className="font-medium">{space.vendorName}</p>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-muted-foreground text-xs">Type</Label>
                                                                        <div className="flex items-center gap-1">
                                                                            <Layers className="h-3 w-3" />
                                                                            <span className="font-medium">{space.type}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1 col-span-2">
                                                                        <Label className="text-muted-foreground text-xs">Location</Label>
                                                                        <div className="flex items-center gap-1">
                                                                            <MapPin className="h-3 w-3" />
                                                                            <span className="font-medium">{space.location}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-muted-foreground text-xs">Price</Label>
                                                                        <div className="flex items-center gap-1">
                                                                            <DollarSign className="h-3 w-3" />
                                                                            <span className="font-medium">{space.price}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-muted-foreground text-xs">Dimensions</Label>
                                                                        <p className="font-medium">{space.dimensions}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <DialogFooter className="gap-2 sm:gap-0">
                                                                {space.status === "pending" && (
                                                                    <>
                                                                        <Button variant="destructive" onClick={() => handleAdSpaceStatus(space.id, "rejected")} className="w-full sm:w-auto">
                                                                            Reject
                                                                        </Button>
                                                                        <Button onClick={() => handleAdSpaceStatus(space.id, "approved")} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                                                                            Approve Listing
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>

                                                    {space.status === "pending" && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                                                onClick={() => handleAdSpaceStatus(space.id, "approved")}
                                                                title="Approve"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                                onClick={() => handleAdSpaceStatus(space.id, "rejected")}
                                                                title="Reject"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="vendors">
                    <div className="rounded-md border border-border bg-card/50 backdrop-blur-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vendor Name</TableHead>
                                    <TableHead>Service Type</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVendors.map((vendor) => (
                                    <TableRow key={vendor.id}>
                                        <TableCell className="font-medium">{vendor.name}</TableCell>
                                        <TableCell>{vendor.serviceType}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                <span className="text-xs">{vendor.location}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                vendor.status === "active" ? "success" :
                                                    vendor.status === "pending" ? "warning" : "secondary"
                                            }>
                                                {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                                <span>{vendor.rating > 0 ? vendor.rating : "N/A"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Dialog open={vendorDetailsOpen && selectedVendor?.id === vendor.id} onOpenChange={(open) => {
                                                    setVendorDetailsOpen(open);
                                                    if (open) setSelectedVendor(vendor);
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" title="View Details">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Vendor Details - {vendor.name}</DialogTitle>
                                                            <DialogDescription>Comprehensive vendor information and status.</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid grid-cols-2 gap-6 py-4">
                                                            <div className="space-y-4">
                                                                <div className="space-y-1">
                                                                    <Label className="text-muted-foreground">Contact Information</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <Mail className="h-4 w-4 text-primary" />
                                                                        <span className="font-medium">{vendor.email}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 pl-6">
                                                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                                                        <span className="text-sm text-muted-foreground">{vendor.phone}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-muted-foreground">Location & Service</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin className="h-4 w-4 text-primary" />
                                                                        <span className="font-medium">{vendor.location}</span>
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground pl-6">Type: {vendor.serviceType}</p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <div className="space-y-1">
                                                                    <Label className="text-muted-foreground">Performance</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                                        <span className="font-medium">{vendor.rating} / 5.0</span>
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground pl-6">Total Listings: {vendor.totalListings}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-muted-foreground">Account Status</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <Shield className="h-4 w-4 text-primary" />
                                                                        <Badge variant={
                                                                            vendor.status === "active" ? "success" :
                                                                                vendor.status === "pending" ? "warning" : "secondary"
                                                                        }>
                                                                            {vendor.status.toUpperCase()}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 pl-6 mt-1">
                                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                                        <span className="text-xs text-muted-foreground">Joined: {vendor.joinedDate}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            {vendor.status === "active" ? (
                                                                <Button variant="destructive" onClick={() => handleVendorStatus(vendor.id, "inactive")}>
                                                                    Suspend Vendor
                                                                </Button>
                                                            ) : (
                                                                <Button onClick={() => handleVendorStatus(vendor.id, "active")}>
                                                                    Activate Vendor
                                                                </Button>
                                                            )}
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
