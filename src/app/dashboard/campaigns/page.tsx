"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Eye, RefreshCw } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/resource";

const client = generateClient<Schema>();

export default function CampaignsPage() {
    const [mounted, setMounted] = useState(false);
    const [campaigns, setCampaigns] = useState<Array<any>>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchCampaigns = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await client.models.Campaign.list();
            setCampaigns(data);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
        if (!client.models.Campaign) return;
        const sub = client.models.Campaign.observeQuery().subscribe({
            next: (data) => setCampaigns([...data.items]),
        });
        return () => sub.unsubscribe();
    }, [fetchCampaigns]);

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaign Oversight</h1>
                    <p className="text-muted-foreground">
                        Monitor active campaigns from the shared backend.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 bg-white/5 border-none"
                    onClick={fetchCampaigns}
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
                            <TableHead className="text-muted-foreground/70">Campaign Name</TableHead>
                            <TableHead className="text-muted-foreground/70">User ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Budget</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    Loading campaigns...
                                </TableCell>
                            </TableRow>
                        ) : campaigns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    No campaigns found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            campaigns.map((campaign) => (
                                <TableRow key={campaign.id} className="hover:bg-white/5 border-none transition-colors group">
                                    <TableCell className="font-medium text-xs text-muted-foreground">{campaign.id.slice(0, 8)}...</TableCell>
                                    <TableCell className="font-bold">{campaign.name || "Unnamed"}</TableCell>
                                    <TableCell className="text-xs">{campaign.userId ? campaign.userId.slice(0, 8) + '...' : 'Unknown'}</TableCell>
                                    <TableCell className="font-bold">₹{campaign.budget || 0}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant="secondary" 
                                            className={`rounded-full px-3 border-none ${
                                                campaign.status === "ACTIVE" 
                                                    ? "bg-primary/20 text-primary" 
                                                    : "bg-white/5"
                                            }`}
                                        >
                                            {campaign.status || "UNKNOWN"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-card/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl">{campaign.name}</DialogTitle>
                                                    <DialogDescription>
                                                        {campaign.objective || "No objective provided."}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4 text-sm">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <span className="font-bold text-muted-foreground">User:</span>
                                                        <span className="col-span-3">{campaign.userId}</span>
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <span className="font-bold text-muted-foreground">Budget:</span>
                                                        <span className="col-span-3 font-bold">₹{campaign.budget || 0}</span>
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <span className="font-bold text-muted-foreground">Style:</span>
                                                        <span className="col-span-3">{campaign.designStyle || "Standard"}</span>
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <span className="font-bold text-muted-foreground">Dates:</span>
                                                        <span className="col-span-3">{campaign.startDate} - {campaign.endDate}</span>
                                                    </div>
                                                </div>
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
