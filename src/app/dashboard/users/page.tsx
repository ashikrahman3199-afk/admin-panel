"use client";

import { useState } from "react";
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
import { MoreHorizontal, Plus } from "lucide-react";
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
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const initialUsers = [
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
    const [users, setUsers] = useState(initialUsers);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<typeof initialUsers[0] | null>(null);

    // Form states
    const [newUser, setNewUser] = useState({ name: "", email: "", role: "Client" });
    const [editUser, setEditUser] = useState({ name: "", email: "", role: "" });

    const handleAddUser = () => {
        if (!newUser.name || !newUser.email) {
            toast.error("Validation Error", { description: "Name and Email are required." });
            return;
        }
        const id = `USR00${users.length + 1}`;
        const date = new Date().toISOString().split('T')[0];
        setUsers([...users, { ...newUser, id, status: "Active", joined: date }]);
        setIsAddDialogOpen(false);
        setNewUser({ name: "", email: "", role: "Client" });
        toast.success("User Added", { description: `${newUser.name} has been successfully added.` });
    };

    const handleDeleteUser = (id: string) => {
        setUsers(users.filter(u => u.id !== id));
        toast.success("User Deleted", { description: "The user has been removed from the system." });
    };

    const openEditDialog = (user: typeof initialUsers[0]) => {
        setSelectedUser(user);
        setEditUser({ name: user.name, email: user.email, role: user.role });
        setIsEditDialogOpen(true);
    };

    const handleEditUser = () => {
        if (!selectedUser) return;
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...editUser } : u));
        setIsEditDialogOpen(false);
        toast.success("User Updated", { description: "User details have been updated." });
    };

    const openActivityConfirm = (user: typeof initialUsers[0]) => {
        setSelectedUser(user);
        setIsActivityDialogOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">
                        Manage system users, roles, and access permissions.
                    </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                            <Plus className="mr-2 h-4 w-4" /> Add New User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>Create a new user account.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    className="col-span-3"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="john@example.com"
                                    className="col-span-3"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">Role</Label>
                                <Input
                                    id="role"
                                    placeholder="Client"
                                    className="col-span-3"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleAddUser}>Create User</Button>
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
                                            <DropdownMenuItem onClick={() => openEditDialog(user)}>Edit Details</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openActivityConfirm(user)}>View Activity</DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-500/10" onClick={() => handleDeleteUser(user.id)}>Delete User</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user information.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">Name</Label>
                            <Input
                                id="edit-name"
                                value={editUser.name}
                                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email" className="text-right">Email</Label>
                            <Input
                                id="edit-email"
                                value={editUser.email}
                                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-role" className="text-right">Role</Label>
                            <Input
                                id="edit-role"
                                value={editUser.role}
                                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleEditUser}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Activity Dialog */}
            <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>User Activity</DialogTitle>
                        <DialogDescription>Recent activity for {selectedUser?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                            <span>Logged In</span>
                            <span className="text-muted-foreground">Today at 9:00 AM</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                            <span>Updated Profile</span>
                            <span className="text-muted-foreground">Yesterday</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                            <span>Created Campaign</span>
                            <span className="text-muted-foreground">2 days ago</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
