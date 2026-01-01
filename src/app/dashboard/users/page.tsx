import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const users = [
    {
        id: "USR001",
        name: "Alice Johnson",
        email: "alice@example.com",
        role: "Client",
        status: "Active",
        joined: "2023-10-15",
    },
    {
        id: "USR002",
        name: "Bob Smith",
        email: "bob@example.com",
        role: "Vendor",
        status: "Pending Verified",
        joined: "2023-10-18",
    },
    {
        id: "USR003",
        name: "Charlie Brown",
        email: "charlie@example.com",
        role: "Client",
        status: "Inactive",
        joined: "2023-09-21",
    },
    {
        id: "USR004",
        name: "Dana White",
        email: "dana@example.com",
        role: "Admin",
        status: "Active",
        joined: "2023-01-10",
    },
];

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">
                        Manage system users, roles, and access permissions.
                    </p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">Add New User</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>Create a new user account.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right text-sm font-medium">Name</span>
                                <Input id="name" placeholder="John Doe" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right text-sm font-medium">Email</span>
                                <Input id="email" placeholder="john@example.com" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right text-sm font-medium">Role</span>
                                <Input id="role" placeholder="Client" className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Create User</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white/5 rounded-3xl p-1 backdrop-blur-2xl shadow-2xl">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[100px] text-muted-foreground/70">ID</TableHead>
                            <TableHead className="text-muted-foreground/70">User</TableHead>
                            <TableHead className="text-muted-foreground/70">Role</TableHead>
                            <TableHead className="text-muted-foreground/70">Status</TableHead>
                            <TableHead className="text-muted-foreground/70">Joined</TableHead>
                            <TableHead className="text-right text-muted-foreground/70">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-white/5 border-none transition-colors group">
                                <TableCell className="font-medium group-hover:text-primary transition-colors">{user.id}</TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{user.name}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === "Admin" ? "default" : "secondary"} className="rounded-full px-3">
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`rounded-full px-3 border-none ${user.status === "Active" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-muted-foreground">{user.joined}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-none bg-popover/80 backdrop-blur-xl shadow-2xl">
                                            <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                            <DropdownMenuItem>View Activity</DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-500/10">Delete User</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
