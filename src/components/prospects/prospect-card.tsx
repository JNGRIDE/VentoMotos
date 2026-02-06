import { useState } from "react";
import { MoreHorizontal, Pencil, Trash, Phone, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Prospect, UserProfile } from "@/lib/data";
import { EditProspectDialog } from "./edit-prospect-dialog";
import { DeleteProspectDialog } from "./delete-prospect-dialog";

interface ProspectCardProps {
  prospect: Prospect;
  userProfile?: UserProfile; // The assigned salesperson
  currentUserProfile: UserProfile | null; // The logged-in user
  onUpdate: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, prospectId: string) => void;
}

export function ProspectCard({ prospect, userProfile, currentUserProfile, onUpdate, onDragStart }: ProspectCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const sourceColor =
    prospect.source === "Advertising" ? "bg-accent/20 text-accent-foreground" : "bg-primary/20 text-primary-foreground";

  return (
    <>
      <Card
        className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-200 group relative cursor-move"
        draggable
        onDragStart={(e) => onDragStart(e, prospect.id)}
      >
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold truncate max-w-[150px]">{prospect.name}</CardTitle>
              <div className="flex items-center gap-1">
                 <Badge className={cn("text-xs mr-1", sourceColor)} variant="outline">
                    {prospect.source}
                 </Badge>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowEditDialog(true); }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowDeleteDialog(true); }} className="text-destructive focus:text-destructive">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
           {/* Quick Info Icons */}
           {(prospect.phone || prospect.email) && (
              <div className="flex gap-2 text-muted-foreground">
                  {prospect.phone && <Phone className="h-3 w-3" />}
                  {prospect.email && <Mail className="h-3 w-3" />}
              </div>
           )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={userProfile?.avatarUrl} />
                <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[80px]">{userProfile?.name || "Unassigned"}</span>
            </div>
            <span>{new Date(prospect.lastContact).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      <EditProspectDialog
        prospect={prospect}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onProspectUpdated={onUpdate}
        currentUserProfile={currentUserProfile}
      />

      <DeleteProspectDialog
        prospectId={prospect.id}
        prospectName={prospect.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onProspectDeleted={onUpdate}
      />
    </>
  );
}
