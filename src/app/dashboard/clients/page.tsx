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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Mail, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
    id: string;
    name: string;
    email: string;
    status: "active" | "suspended";
    location: string;
    joinDate: string;
}

const initialClients: Client[] = [
    {
        id: "CL-001",
        name: "Acme Corp",
        email: "contact@acme.com",
        status: "active",
        location: "Adyar, Chennai",
        joinDate: "2023-01-15",
    },
    {
        id: "CL-002",
        name: "Globex Inc",
        email: "info@globex.com",
        status: "active",
        location: "T. Nagar, Chennai",
        joinDate: "2023-03-10",
    },
    {
        id: "CL-003",
        name: "Soylent Corp",
        email: "support@soylent.com",
        status: "suspended",
        location: "OMR, Chennai",
        joinDate: "2023-05-22",
    },
];

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [search, setSearch] = useState("");

    const handleStatusToggle = (id: string) => {
        setClients(clients.map(client =>
            client.id === id
                ? { ...client, status: client.status === "active" ? "suspended" : "active" }
                : client
        ));
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">
                        Manage client applications and access.
                    </p>
                </div>
                <div className="w-72">
                    <Input
                        placeholder="Search clients..."
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
                            <TableHead>Client Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                        <span>{client.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                        <span>{client.location}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={client.status === "active" ? "success" : "destructive"}>
                                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                                    </Badge>
                                </TableCell>
                                <TableCell>{client.joinDate}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-xs font-medium",
                                                client.status === "active" ? "text-green-600" : "text-red-600"
                                            )}>
                                                {client.status === "active" ? "Active" : "Suspended"}
                                            </span>
                                            <Switch
                                                checked={client.status === "active"}
                                                onCheckedChange={() => handleStatusToggle(client.id)}
                                                className={cn(
                                                    "data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600"
                                                )}
                                            />
                                        </div>
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
        </div>
    );
}
