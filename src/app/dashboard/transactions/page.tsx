"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Filter } from "lucide-react";
import { toast } from "sonner";

// Mock data
const transactions = [
    {
        id: "TXN001",
        amount: "$1,200.00",
        payer: "Alice Johnson",
        payee: "City Billboards Co.",
        status: "Completed",
        date: "2023-10-25",
        method: "Paid through App",
    },
    {
        id: "TXN002",
        amount: "$500.00",
        payer: "Bob Smith",
        payee: "Metro Ads",
        status: "Pending",
        date: "2023-10-26",
        method: "Paid directly to Vendor",
    },
    {
        id: "TXN003",
        amount: "$3,450.00",
        payer: "Charlie Brown",
        payee: "Skyline Media",
        status: "Completed",
        date: "2023-10-24",
        method: "Paid through App",
    },
    {
        id: "TXN004",
        amount: "$150.00",
        payer: "Dana White",
        payee: "City Billboards Co.",
        status: "Failed",
        date: "2023-10-26",
        method: "Paid through App",
    },
    {
        id: "TXN005",
        amount: "$2,000.00",
        payer: "Eve Black",
        payee: "Metro Ads",
        status: "Completed",
        date: "2023-10-23",
        method: "Paid directly to Vendor",
    },
];

export default function TransactionsPage() {
    const [filterMethod, setFilterMethod] = useState<string | null>(null);

    const filteredTransactions = filterMethod
        ? transactions.filter((t) => t.method === filterMethod)
        : transactions;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transaction Reports</h1>
                    <p className="text-muted-foreground">
                        View and filter all financial transactions.
                    </p>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Filter className="h-4 w-4" />
                                Filter by Method
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Payment Method</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={filterMethod === null}
                                onCheckedChange={() => setFilterMethod(null)}
                            >
                                All Transactions
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={filterMethod === "Paid through App"}
                                onCheckedChange={() => setFilterMethod(filterMethod === "Paid through App" ? null : "Paid through App")}
                            >
                                Paid through App
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={filterMethod === "Paid directly to Vendor"}
                                onCheckedChange={() => setFilterMethod(filterMethod === "Paid directly to Vendor" ? null : "Paid directly to Vendor")}
                            >
                                Paid directly to Vendor
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="default" className="rounded-full shadow-lg shadow-primary/20" onClick={() => toast.success("Report Exported", { description: "The transaction report has been downloaded." })}>Export Report</Button>
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[100px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">Amount (INR)</TableHead>
                            <TableHead className="text-muted-foreground/70">Payer</TableHead>
                            <TableHead className="text-muted-foreground/70">Payee (Vendor)</TableHead>
                            <TableHead className="text-muted-foreground/70">Date</TableHead>
                            <TableHead className="text-muted-foreground/70">Method</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.map((txn) => (
                            <TableRow key={txn.id} className="hover:bg-white/5 border-none transition-colors group">
                                <TableCell className="font-medium group-hover:text-primary transition-colors">{txn.id}</TableCell>
                                <TableCell className="font-bold text-lg">{txn.amount.replace('$', '₹')}</TableCell>
                                <TableCell>{txn.payer}</TableCell>
                                <TableCell>{txn.payee}</TableCell>
                                <TableCell>{txn.date}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="whitespace-nowrap rounded-full border-none bg-white/5">
                                        {txn.method}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            txn.status === "Completed"
                                                ? "default"
                                                : txn.status === "Pending"
                                                    ? "secondary"
                                                    : "destructive"
                                        }
                                        className={
                                            `rounded-full px-3 border-none ${txn.status === "Completed" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}`
                                        }
                                    >
                                        {txn.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10">
                                                View Bill
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-xl border-none shadow-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Transaction Receipt</DialogTitle>
                                                <DialogDescription>
                                                    Receipt for transaction {txn.id}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="flex justify-between border-b border-white/10 pb-2">
                                                    <span className="font-medium">Transaction ID</span>
                                                    <span>{txn.id}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/10 pb-2">
                                                    <span className="font-medium">Date</span>
                                                    <span>{txn.date}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/10 pb-2">
                                                    <span className="font-medium">Amount</span>
                                                    <span className="font-bold text-lg text-primary">{txn.amount.replace('$', '₹')}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/10 pb-2">
                                                    <span className="font-medium">Method</span>
                                                    <span>{txn.method}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Status</span>
                                                    <span className="text-green-500 font-bold">{txn.status}</span>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" className="w-full rounded-full">Download PDF</Button>
                                            </DialogFooter>
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
