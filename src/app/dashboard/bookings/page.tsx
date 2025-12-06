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
import { Check, X, Eye, MessageSquare, Send, MapPin, Calendar, CreditCard, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BookingStatus = "new" | "enquiring" | "sent_to_vendor" | "approved" | "rejected";

interface Booking {
    id: string;
    clientName: string;
    clientEmail: string;
    adSpace: string;
    vendorName: string;
    location: string;
    dates: string;
    status: BookingStatus;
    price: string;
    history: { date: string; action: string }[];
}

const initialBookings: Booking[] = [
    {
        id: "BK-001",
        clientName: "Acme Corp",
        clientEmail: "marketing@acme.com",
        adSpace: "Anna Nagar Arch Billboard",
        vendorName: "Chennai Ads",
        location: "Anna Nagar, Chennai",
        dates: "Nov 1 - Nov 30, 2023",
        status: "new",
        price: "₹1,50,000",
        history: [
            { date: "2023-10-25", action: "Request Created" }
        ]
    },
    {
        id: "BK-002",
        clientName: "Globex Inc",
        clientEmail: "ads@globex.com",
        adSpace: "Phoenix Mall Digital Screen",
        vendorName: "Digital Displays",
        location: "Velachery, Chennai",
        dates: "Oct 25 - Oct 27, 2023",
        status: "enquiring",
        price: "₹7,500",
        history: [
            { date: "2023-10-20", action: "Request Created" },
            { date: "2023-10-21", action: "Admin started enquiry" }
        ]
    },
    {
        id: "BK-003",
        clientName: "Soylent Corp",
        clientEmail: "growth@soylent.com",
        adSpace: "OMR IT Corridor Bus Shelter",
        vendorName: "Transit Media",
        location: "OMR, Chennai",
        dates: "Dec 1 - Dec 15, 2023",
        status: "sent_to_vendor",
        price: "₹18,000",
        history: [
            { date: "2023-10-15", action: "Request Created" },
            { date: "2023-10-16", action: "Sent to Vendor" }
        ]
    },
];

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);
    const [search, setSearch] = useState("");
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [enquiryNote, setEnquiryNote] = useState("");
    const [detailsOpen, setDetailsOpen] = useState(false);

    const handleStatusChange = (id: string, newStatus: BookingStatus) => {
        setBookings(bookings.map(booking =>
            booking.id === id ? { ...booking, status: newStatus } : booking
        ));
        setDetailsOpen(false);
    };

    const filteredBookings = bookings.filter(booking =>
        booking.clientName.toLowerCase().includes(search.toLowerCase()) ||
        booking.adSpace.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: BookingStatus) => {
        switch (status) {
            case "new": return <Badge variant="secondary">New Request</Badge>;
            case "enquiring": return <Badge variant="warning">Enquiring</Badge>;
            case "sent_to_vendor": return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Sent to Vendor</Badge>;
            case "approved": return <Badge variant="success">Approved</Badge>;
            case "rejected": return <Badge variant="destructive">Rejected</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
                    <p className="text-muted-foreground">
                        Manage ad space booking requests from clients.
                    </p>
                </div>
                <div className="w-72">
                    <Input
                        placeholder="Search bookings..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-card/50"
                    />
                </div>
            </div>

            <div className="rounded-md border border-border bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Ad Space</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBookings.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell className="font-medium">{booking.id}</TableCell>
                                <TableCell>{booking.clientName}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{booking.adSpace}</span>
                                        <span className="text-xs text-muted-foreground">by {booking.vendorName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{booking.dates}</TableCell>
                                <TableCell>{booking.price}</TableCell>
                                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Dialog open={detailsOpen && selectedBooking?.id === booking.id} onOpenChange={(open) => {
                                            setDetailsOpen(open);
                                            if (open) setSelectedBooking(booking);
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" title="View Details">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Booking Details - {booking.id}</DialogTitle>
                                                    <DialogDescription>Full details of the booking request.</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid grid-cols-2 gap-6 py-4">
                                                    <div className="space-y-4">
                                                        <div className="space-y-1">
                                                            <Label className="text-muted-foreground">Client Information</Label>
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4 text-primary" />
                                                                <span className="font-medium">{booking.clientName}</span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground pl-6">{booking.clientEmail}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-muted-foreground">Ad Space</Label>
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="h-4 w-4 text-primary" />
                                                                <span className="font-medium">{booking.adSpace}</span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground pl-6">{booking.location}</p>
                                                            <p className="text-sm text-muted-foreground pl-6">Vendor: {booking.vendorName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="space-y-1">
                                                            <Label className="text-muted-foreground">Campaign Schedule</Label>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4 text-primary" />
                                                                <span className="font-medium">{booking.dates}</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-muted-foreground">Financials</Label>
                                                            <div className="flex items-center gap-2">
                                                                <CreditCard className="h-4 w-4 text-primary" />
                                                                <span className="font-medium text-lg">{booking.price}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border-t pt-4">
                                                    <Label className="mb-2 block">History</Label>
                                                    <div className="space-y-2">
                                                        {booking.history.map((item, i) => (
                                                            <div key={i} className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">{item.date}</span>
                                                                <span>{item.action}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <DialogFooter className="gap-2 sm:gap-0">
                                                    {booking.status === "new" && (
                                                        <Button onClick={() => handleStatusChange(booking.id, "enquiring")} className="w-full sm:w-auto">
                                                            Start Enquiry
                                                        </Button>
                                                    )}
                                                    {booking.status === "enquiring" && (
                                                        <Button onClick={() => handleStatusChange(booking.id, "sent_to_vendor")} className="w-full sm:w-auto">
                                                            Send to Vendor
                                                        </Button>
                                                    )}
                                                    {(booking.status === "new" || booking.status === "enquiring") && (
                                                        <Button variant="destructive" onClick={() => handleStatusChange(booking.id, "rejected")} className="w-full sm:w-auto">
                                                            Reject Request
                                                        </Button>
                                                    )}
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        {booking.status === "new" && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                                                        title="Start Enquiry"
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Start Enquiry</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label>Internal Notes</Label>
                                                            <Textarea
                                                                placeholder="Add notes about client requirements..."
                                                                value={enquiryNote}
                                                                onChange={(e) => setEnquiryNote(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button onClick={() => handleStatusChange(booking.id, "enquiring")}>
                                                            Mark as Enquiring
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}

                                        {booking.status === "enquiring" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                                onClick={() => handleStatusChange(booking.id, "sent_to_vendor")}
                                                title="Send to Vendor"
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        )}

                                        {(booking.status === "new" || booking.status === "enquiring") && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() => handleStatusChange(booking.id, "rejected")}
                                                title="Reject"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
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
