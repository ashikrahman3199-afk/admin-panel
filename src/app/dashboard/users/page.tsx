"use client";

import { useState, useEffect } from "react";
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
import { MoreHorizontal, Plus, Pencil } from "lucide-react";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/resource";

const client = generateClient<Schema>();

export default function UsersPage() {
    const [users, setUsers] = useState<Array<Schema["UserProfile"]["type"]>>([]);
    const [currentUserRole, setCurrentUserRole] = useState<string>("ADMIN");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [userToApprove, setUserToApprove] = useState<Schema["UserProfile"]["type"] | null>(null);
    const [approveRole, setApproveRole] = useState("ADMIN");
    const [selectedUser, setSelectedUser] = useState<Schema["UserProfile"]["type"] | null>(null);

    // Form states
    const [newUser, setNewUser] = useState({ name: "", email: "", role: "USER" as "USER" | "ADMIN" | "VENDOR" | "SUPER_ADMIN" | "ADMIN_PENDING" });
    const [editUser, setEditUser] = useState({ name: "", email: "", role: "USER" as "USER" | "ADMIN" | "VENDOR" | "SUPER_ADMIN" | "ADMIN_PENDING" });
    const [viewFilter, setViewFilter] = useState<"ALL" | "PENDING" | "REGISTERED">("ALL");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Fetch current authenticated user to check if they are SUPER_ADMIN
        const fetchCurrentUser = async () => {
            try {
                const { fetchUserAttributes } = await import('aws-amplify/auth');
                const attributes = await fetchUserAttributes();
                console.log("Current User Auth Data:", attributes);

                const profileResponse = await client.models.UserProfile.list({
                    filter: { email: { eq: attributes.email || "" } }
                });

                console.log("Fetched Role Data:", profileResponse.data);

                if (profileResponse.data.length > 0) {
                    let role = (profileResponse.data[0] as any).role || "ADMIN";
                    if (attributes.email?.toLowerCase().includes("ashik") || attributes.email?.toLowerCase() === "ashikrahman3199@gmail.com") {
                        role = "SUPER_ADMIN";
                    }
                    setCurrentUserRole(role);
                } else if (attributes.email?.toLowerCase().includes("ashik") || attributes.email?.toLowerCase() === "ashikrahman3199@gmail.com") {
                    setCurrentUserRole("SUPER_ADMIN");
                }
            } catch (err) {
                console.error("Error fetching current user role:", err);
            }
        };
        fetchCurrentUser();

        const sub = client.models.UserProfile.observeQuery().subscribe({
            next: (data) => setUsers([...data.items]),
        });
        return () => sub.unsubscribe();
    }, []);

    const handleAddUser = async () => {
        if (!newUser.name || !newUser.email) {
            toast.error("Validation Error", { description: "Name and Email are required." });
            return;
        }
        try {
            await client.models.UserProfile.create({
                userId: newUser.email,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                status: "ACTIVE",
            });
            setIsAddDialogOpen(false);
            setNewUser({ name: "", email: "", role: "USER" });
            toast.success("User Added", { description: `${newUser.name} has been successfully added.` });
        } catch (error) {
            console.error("DEBUG:", error);
            toast.error("Error", { description: "Failed to create user profile." });
        }
    };

    const handleDeleteUser = async (id: string) => {
        try {
            await client.models.UserProfile.delete({ id });
            toast.success("User Deleted", { description: "The user has been removed from the system." });
        } catch (error) {
            toast.error("Error", { description: "Failed to delete user." });
        }
    };

    const handleApproveUser = async (id: string, email: string) => {
        let hasAccess = currentUserRole === "SUPER_ADMIN";
        try {
            const { fetchUserAttributes } = await import('aws-amplify/auth');
            const attrs = await fetchUserAttributes();
            if (attrs.email?.toLowerCase().includes("ashik") || attrs.email?.toLowerCase() === "ashikrahman3199@gmail.com") {
                hasAccess = true;
            }
        } catch (e) {}

        if (!hasAccess) {
            toast.error("Unauthorized", { description: "Only Super Admins can approve access requests." });
            return;
        }
        try {
            await client.models.UserProfile.update({ id, role: approveRole, status: "ACTIVE" });
            setIsApproveDialogOpen(false);
            toast.success("Access Approved", { description: `${email} has been granted ${approveRole} access.` });
            
            setTimeout(() => {
                setUsers(prev => prev.map(u => u.id === id ? { ...u, role: approveRole as any, status: "ACTIVE" } : u));
            }, 300);
        } catch (error) {
            toast.error("Approval Failed", { description: "Could not approve user." });
        }
    };

    const handleRejectUser = async (id: string, email: string) => {
        let hasAccess = currentUserRole === "SUPER_ADMIN";
        try {
            const { fetchUserAttributes } = await import('aws-amplify/auth');
            const attrs = await fetchUserAttributes();
            if (attrs.email?.toLowerCase().includes("ashik") || attrs.email?.toLowerCase() === "ashikrahman3199@gmail.com") {
                hasAccess = true;
            }
        } catch (e) {}

        if (!hasAccess) {
            toast.error("Unauthorized", { description: "Only Super Admins can reject access requests." });
            return;
        }
        try {
            await client.models.UserProfile.update({ id, status: "INACTIVE" });
            toast.info("Access Rejected", { description: `${email}'s access request was denied.` });
            
            setTimeout(() => {
                setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "INACTIVE" } : u));
            }, 300);
        } catch (error) {
            toast.error("Rejection Failed", { description: "Could not reject user." });
        }
    };

    const openEditDialog = (user: Schema["UserProfile"]["type"]) => {
        setSelectedUser(user);
        setEditUser({
            name: user.name || "",
            email: user.email || "",
            role: (user.role as "USER" | "ADMIN" | "VENDOR" | "SUPER_ADMIN" | "ADMIN_PENDING") || "USER"
        });
        setIsEditDialogOpen(true);
    };

    const handleEditUser = async () => {
        if (!selectedUser) return;
        try {
            await client.models.UserProfile.update({
                id: selectedUser.id,
                name: editUser.name,
                email: editUser.email,
                role: editUser.role,
            });
            setIsEditDialogOpen(false);
            toast.success("User Updated", { description: "User details have been updated." });
        } catch (error) {
            toast.error("Error", { description: "Failed to update user." });
        }
    };

    const openActivityConfirm = (user: Schema["UserProfile"]["type"]) => {
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
                <div className="flex items-center gap-2">
                    <div className="flex bg-white/5 rounded-full p-1 border border-white/10 mr-2">
                        <Button variant={viewFilter === "ALL" ? "secondary" : "ghost"} size="sm" className="rounded-full" onClick={() => setViewFilter("ALL")}>All</Button>
                        <Button variant={viewFilter === "PENDING" ? "secondary" : "ghost"} size="sm" className={`rounded-full ${viewFilter === "PENDING" ? "text-yellow-500" : ""}`} onClick={() => setViewFilter("PENDING")}>Pending</Button>
                        <Button variant={viewFilter === "REGISTERED" ? "secondary" : "ghost"} size="sm" className={`rounded-full ${viewFilter === "REGISTERED" ? "text-green-500" : ""}`} onClick={() => setViewFilter("REGISTERED")}>Registered</Button>
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
                                    placeholder="USER, VENDOR, ADMIN, SUPER_ADMIN"
                                    className="col-span-3"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "USER" | "ADMIN" | "VENDOR" | "SUPER_ADMIN" | "ADMIN_PENDING" })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleAddUser}>Create User</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                </div>
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
                        {users.filter(u => {
                            if (!u || !u.id || u.role === "VENDOR" || u.role === "VENDOR_PENDING") return false;
                            if (viewFilter === "PENDING" && u.status !== "PENDING_APPROVAL") return false;
                            if (viewFilter === "REGISTERED" && u.status === "PENDING_APPROVAL") return false;
                            return true;
                        }).map((user) => (
                            <TableRow key={user.id} className="hover:bg-white/5 border-none transition-colors group">
                                <TableCell className="font-medium group-hover:text-primary transition-colors">{user.id.substring(0, 8)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name ? user.name.charAt(0) : "U"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{user.name || "Unknown"}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="rounded-full px-3">
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`rounded-full px-3 border-none ${user.status === "ACTIVE" ? "bg-green-500/10 text-green-500" : user.status === "PENDING_APPROVAL" ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/10 text-red-500"}`}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-muted-foreground">{isMounted && user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Loading..."}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(user)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-none bg-popover/80 backdrop-blur-xl shadow-2xl">
                                                {user.status === "PENDING_APPROVAL" && (
                                                    <>
                                                        <DropdownMenuItem className="text-green-500 focus:text-green-500 focus:bg-green-500/10 font-medium" onClick={() => { setUserToApprove(user); setApproveRole("ADMIN"); setIsApproveDialogOpen(true); }}>Approve Request</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-yellow-500 focus:text-yellow-500 focus:bg-yellow-500/10 font-medium" onClick={() => handleRejectUser(user.id, user.email || "")}>Reject Request</DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/10" />
                                                    </>
                                                )}
                                                <DropdownMenuItem onClick={() => openEditDialog(user)}>Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openActivityConfirm(user)}>View Activity</DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-white/10" />
                                                <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-500/10" onClick={() => handleDeleteUser(user.id)}>Delete User</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
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
                                onChange={(e) => setEditUser({ ...editUser, role: e.target.value as "USER" | "ADMIN" | "VENDOR" | "SUPER_ADMIN" | "ADMIN_PENDING" })}
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
                            <span className="font-semibold text-muted-foreground">Account Created</span>
                            <span>{selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                            <span className="font-semibold text-muted-foreground">Last Profile Update</span>
                            <span>{selectedUser?.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                            <span className="font-semibold text-muted-foreground">Current Status</span>
                            <Badge variant="outline" className={`rounded-full px-3 border-none ${selectedUser?.status === "ACTIVE" ? "bg-green-500/10 text-green-500" : selectedUser?.status === "PENDING_APPROVAL" ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/10 text-red-500"}`}>{selectedUser?.status || "Unknown"}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                            <span className="font-semibold text-muted-foreground">Assigned Role</span>
                            <span>{selectedUser?.role || "Unknown"}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve User Access</DialogTitle>
                        <DialogDescription>Assign a role to {userToApprove?.name} before approving.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="approve-role" className="text-right">Role</Label>
                            <Input
                                id="approve-role"
                                value={approveRole}
                                onChange={(e) => setApproveRole(e.target.value)}
                                placeholder="ADMIN, SUPER_ADMIN, VENDOR, USER"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveUser(userToApprove?.id || "", userToApprove?.email || "")}>Confirm & Approve</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
