const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/verification/page.tsx', 'utf8');

if (!content.includes('import { CheckCircle2, XCircle, Eye, RefreshCw, Trash2, Pencil, Plus, Trash }')) {
    content = content.replace('import { CheckCircle2, XCircle, Eye, RefreshCw, Trash2, Pencil } from "lucide-react";', 'import { CheckCircle2, XCircle, Eye, RefreshCw, Trash2, Pencil, Plus, Trash } from "lucide-react";');
}

// update openEditDialog
const oldOpenEditDialog = `    const openEditDialog = (space: any) => {
        setEditSpace({ ...space });
        setIsEditDialogOpen(true);
    };`;

const newOpenEditDialog = `    const openEditDialog = (space: any) => {
        let imgs = space.images || [];
        if (imgs.length === 0 && space.image) {
            imgs = [space.image];
        }
        setEditSpace({ ...space, images: imgs });
        setIsEditDialogOpen(true);
    };`;
content = content.replace(oldOpenEditDialog, newOpenEditDialog);

// update handleUpdateDetails
const oldBodyStr = `body: JSON.stringify({
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
                })`;
const newBodyStr = `body: JSON.stringify({
                    id: editSpace.id,
                    updates: {
                        name: editSpace.name,
                        title: editSpace.title,
                        category: editSpace.category,
                        price: Number(editSpace.price),
                        location: editSpace.location,
                        description: editSpace.description,
                        image: (editSpace.images && editSpace.images.length > 0) ? editSpace.images[0] : editSpace.image,
                        images: editSpace.images || [],
                        details: editSpace.details
                    }
                })`;
content = content.replace(oldBodyStr, newBodyStr);


// update Edit Dialog UI
const oldUI = `<div className="grid gap-2">
                                <Label>Main Image URL</Label>
                                <Input value={editSpace.image || ""} onChange={(e) => setEditSpace({...editSpace, image: e.target.value})} className="bg-white/5 border-white/10" />
                            </div>`;

const newUI = `<div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Images</Label>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs rounded-full" onClick={() => setEditSpace({...editSpace, images: [...(editSpace.images || []), ""]})}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Image
                                    </Button>
                                </div>
                                {(editSpace.images || []).map((imgUrl: string, idx: number) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <Input 
                                            value={imgUrl} 
                                            onChange={(e) => {
                                                const newImgs = [...editSpace.images];
                                                newImgs[idx] = e.target.value;
                                                setEditSpace({...editSpace, images: newImgs});
                                            }} 
                                            placeholder="https://..." 
                                            className="bg-white/5 border-white/10" 
                                        />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500 hover:bg-red-500/10" onClick={() => {
                                            const newImgs = [...editSpace.images];
                                            newImgs.splice(idx, 1);
                                            setEditSpace({...editSpace, images: newImgs});
                                        }}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            
                            {editSpace.details && Object.keys(editSpace.details).length > 0 && (
                                <div className="grid gap-2 mt-2 pt-4 border-t border-white/10">
                                    <Label className="font-bold text-muted-foreground">Specific Details (JSON)</Label>
                                    <Textarea 
                                        value={JSON.stringify(editSpace.details, null, 2)} 
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                setEditSpace({...editSpace, details: parsed});
                                            } catch (err) {
                                                // Invalid JSON, don't update state yet or handle differently
                                            }
                                        }} 
                                        className="bg-white/5 border-white/10 h-32 font-mono text-xs" 
                                    />
                                </div>
                            )}`;

content = content.replace(oldUI, newUI);

fs.writeFileSync('src/app/dashboard/verification/page.tsx', content);
