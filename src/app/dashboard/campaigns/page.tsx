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
import { Eye } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const campaigns = [
    {
        id: "CMP001",
        name: "Summer Sale 2024",
        client: "Nike",
        budget: "$50,000",
        spent: "$12,400",
        status: "Active",
        progress: 25,
    },
    {
        id: "CMP002",
        name: "Product Launch X",
        client: "Apple",
        budget: "$150,000",
        spent: "$0",
        status: "Pending Approval",
        progress: 0,
    },
    {
        id: "CMP003",
        name: "Holiday Special",
        client: "Starbucks",
        budget: "$25,000",
        spent: "$25,000",
        status: "Completed",
        progress: 100,
    },
];

export default function CampaignsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaign Oversight</h1>
                    <p className="text-muted-foreground">
                        Monitor active campaigns and approve new requests.
                    </p>
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[100px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Campaign Name</TableHead>
                            <TableHead className="text-muted-foreground/70">Client</TableHead>
                            <TableHead className="text-muted-foreground/70">Budget</TableHead>
                            <TableHead className="w-[200px] text-muted-foreground/70">Progress</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns.map((campaign) => (
                            <TableRow key={campaign.id} className="hover:bg-white/5 border-none transition-colors group">
                                <TableCell className="font-medium group-hover:text-primary transition-colors">{campaign.id}</TableCell>
                                <TableCell className="font-medium">{campaign.name}</TableCell>
                                <TableCell>{campaign.client}</TableCell>
                                <TableCell className="font-bold">{campaign.budget}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <Progress
                                            value={campaign.progress}
                                            className="h-2 bg-secondary/30"
                                            indicatorClassName={cn(
                                                "bg-gradient-to-r",
                                                campaign.progress === 100 ? "from-green-400 to-emerald-600" :
                                                    campaign.progress > 50 ? "from-blue-400 to-indigo-600" :
                                                        "from-orange-400 to-red-600"
                                            )}
                                        />
                                        <span className="text-xs text-muted-foreground font-medium">{campaign.progress}%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={campaign.status === "Active" ? "default" : "outline"} className={`rounded-full px-3 border-none ${campaign.status === "Active" ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-white/5"}`}>
                                        {campaign.status}
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
                                                    Client Requirements and Details
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4 border-b border-white/5 pb-2">
                                                    <span className="font-bold text-muted-foreground">Client:</span>
                                                    <span className="col-span-3 font-medium">{campaign.client}</span>
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4 border-b border-white/5 pb-2">
                                                    <span className="font-bold text-muted-foreground">Budget:</span>
                                                    <span className="col-span-3 font-medium">{campaign.budget}</span>
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4 border-b border-white/5 pb-2">
                                                    <span className="font-bold text-muted-foreground">Objective:</span>
                                                    <span className="col-span-3">Increase brand awareness among Gen Z demographic.</span>
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4 border-b border-white/5 pb-2">
                                                    <span className="font-bold text-muted-foreground">Locations:</span>
                                                    <span className="col-span-3">New York, Los Angeles, Chicago</span>
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <span className="font-bold text-muted-foreground">Assets:</span>
                                                    <span className="col-span-3 text-primary hover:underline cursor-pointer font-medium">View Creative Assets</span>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
