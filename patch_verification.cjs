const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/verification/page.tsx', 'utf8');

if (!content.includes('import { Pencil }')) {
    content = content.replace('import { Eye, CheckCircle2, XCircle, Clock, Search, ExternalLink, AlertCircle, Trash2 } from "lucide-react";', 
    'import { Eye, CheckCircle2, XCircle, Clock, Search, ExternalLink, AlertCircle, Trash2, Pencil } from "lucide-react";');
}

if (!content.includes('const [isEditDialogOpen, setIsEditDialogOpen]')) {
    content = content.replace('const [searchQuery, setSearchQuery] = useState("");',
    `const [searchQuery, setSearchQuery] = useState("");\n    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);\n    const [editSpace, setEditSpace] = useState<any>(null);`);
}

if (!content.includes('const handleUpdateDetails =')) {
    const fn = `
    const openEditDialog = (space: any) => {
        setEditSpace({ ...space });
        setIsEditDialogOpen(true);
    };

    const handleUpdateDetails = async () => {
        try {
            const res = await fetch('/api/adspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editSpace.id,
                    updates: {
                        name: editSpace.name,
                        title: editSpace.title,
                        category: editSpace.category,
                        price: Number(editSpace.price),
                        location: editSpace.location,
                        description: editSpace.description,
                        image: editSpace.image,
                        images: editSpace.images || []
                    }
                })
            });
            if (!res.ok) throw new Error("API Request Failed");
            
            setAdSpaces(prev => prev.map(s => s.id === editSpace.id ? { ...s, ...editSpace } : s));
            toast.success("Service Updated", { description: "The service details have been successfully updated." });
            setIsEditDialogOpen(false);
        } catch (error) {
            toast.error("Error", { description: "Failed to update service." });
        }
    };
`;
    content = content.replace('const handleApprove = async () => {', fn + '\n    const handleApprove = async () => {');
}

// Add edit button next to eye button
const eyeButton = `<Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>`;
const newButtons = `<Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(space)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>`;

content = content.replace(`<DialogTrigger asChild>\n                                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">\n                                                        <Eye className="h-4 w-4" />\n                                                    </Button>\n                                                </DialogTrigger>`, newButtons);

// Add Dialog for Editing at the end
const editDialog = `
            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md bg-card/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Service</DialogTitle>
                        <DialogDescription>Modify the service details and images.</DialogDescription>
                    </DialogHeader>
                    {editSpace && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Title</Label>
                                <Input value={editSpace.name || editSpace.title || ""} onChange={(e) => setEditSpace({...editSpace, name: e.target.value, title: e.target.value})} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Input value={editSpace.category || ""} onChange={(e) => setEditSpace({...editSpace, category: e.target.value})} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Price (₹/day)</Label>
                                    <Input type="number" value={editSpace.price || 0} onChange={(e) => setEditSpace({...editSpace, price: e.target.value})} className="bg-white/5 border-white/10" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Location</Label>
                                    <Input value={editSpace.location || ""} onChange={(e) => setEditSpace({...editSpace, location: e.target.value})} className="bg-white/5 border-white/10" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea value={editSpace.description || ""} onChange={(e) => setEditSpace({...editSpace, description: e.target.value})} className="bg-white/5 border-white/10 h-24" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Main Image URL</Label>
                                <Input value={editSpace.image || ""} onChange={(e) => setEditSpace({...editSpace, image: e.target.value})} className="bg-white/5 border-white/10" />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl border-white/10 hover:bg-white/5">Cancel</Button>
                        <Button onClick={handleUpdateDetails} className="rounded-xl">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
`;

if (!content.includes('Edit Service</DialogTitle>')) {
    content = content.replace('</main>', editDialog + '\n        </main>');
}

fs.writeFileSync('src/app/dashboard/verification/page.tsx', content);
