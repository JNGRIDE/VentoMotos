"use client";

import { memo } from "react";
import { MoreHorizontal, Pencil, Trash, Phone, Mail, ArrowRight, MessageCircle, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, areFlatObjectsEqual } from "@/lib/utils";
import { type Prospect, type UserProfile, PROSPECT_STAGES } from "@/lib/data";

interface ProspectCardProps {
  prospect: Prospect;
  userProfile?: UserProfile; // The assigned salesperson
  currentUserProfile: UserProfile | null; // The logged-in user
  onDragStart: (e: React.DragEvent<HTMLDivElement>, prospectId: string) => void;
  onMoveStage: (prospectId: string, newStage: Prospect["stage"]) => Promise<void>;
  onEdit: (prospect: Prospect) => void;
  onDelete: (prospect: Prospect) => void;
}

function arePropsEqual(prevProps: ProspectCardProps, nextProps: ProspectCardProps) {
  return (
    prevProps.userProfile === nextProps.userProfile &&
    prevProps.currentUserProfile === nextProps.currentUserProfile &&
    prevProps.onDragStart === nextProps.onDragStart &&
    prevProps.onMoveStage === nextProps.onMoveStage &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    (prevProps.prospect === nextProps.prospect || areFlatObjectsEqual(prevProps.prospect, nextProps.prospect))
  );
}

export const ProspectCard = memo(function ProspectCard({ prospect, userProfile, currentUserProfile, onDragStart, onMoveStage, onEdit, onDelete }: ProspectCardProps) {
  const sourceColor =
    prospect.source === "Advertising" ? "bg-accent/20 text-accent-foreground" : "bg-primary/20 text-primary-foreground";

  const borderColor = prospect.source === "Advertising" ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-green-500";

  // Alerta de estancamiento (Notion-like logic)
  const daysInStage = prospect.stageUpdatedAt
      ? Math.floor((new Date().getTime() - new Date(prospect.stageUpdatedAt).getTime()) / (1000 * 3600 * 24))
      : null;

  const whatsappLink = prospect.phone ? `https://wa.me/52${prospect.phone.replace(/\D/g, '')}` : null;
  const phoneLink = prospect.phone ? `tel:${prospect.phone}` : null;

  return (
    <Card
      className={cn("mb-4 shadow-sm hover:shadow-md transition-shadow duration-200 group relative cursor-move", borderColor)}
      draggable
      onDragStart={(e) => onDragStart(e, prospect.id)}
    >
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="text-base font-semibold truncate max-w-[150px] cursor-help outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0}>{prospect.name}</CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p>{prospect.name}</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-1">
               <Badge className={cn("text-xs mr-1", sourceColor)} variant="outline">
                  {prospect.source.substring(0, 3)}
               </Badge>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-opacity">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEdit(prospect); }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Ver / Editar Bitácora
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Mover a
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {PROSPECT_STAGES.filter((stage) => stage !== prospect.stage).map((stage) => (
                          <DropdownMenuItem
                            key={stage}
                            onSelect={() => onMoveStage(prospect.id, stage)}
                          >
                            {stage}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onDelete(prospect); }} className="text-destructive focus:text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
         <div className="flex items-center justify-between">
            <div className="flex gap-2">
                {phoneLink && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" asChild>
                                <a href={phoneLink} aria-label={`Call ${prospect.name}`}>
                                    <Phone className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Llamar: {prospect.phone}</p></TooltipContent>
                    </Tooltip>
                )}
                {whatsappLink && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-green-600" asChild>
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${prospect.name}`}>
                                    <MessageCircle className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>WhatsApp: {prospect.phone}</p></TooltipContent>
                    </Tooltip>
                )}
            </div>

            {daysInStage !== null && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn("flex items-center text-[10px] px-1.5 py-0.5 rounded-full cursor-help outline-none transition-colors", 
                            daysInStage > 7 ? "bg-destructive/10 text-destructive font-bold" : "bg-muted text-muted-foreground")} tabIndex={0}>
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{daysInStage} días aquí</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Días en esta etapa actual</p>
                    </TooltipContent>
                </Tooltip>
            )}
         </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border border-border/40">
              <AvatarImage src={userProfile?.avatarUrl} />
              <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[80px] text-[11px] font-medium">{userProfile?.name || "Sin asignar"}</span>
          </div>
          <span className="text-[10px]">{new Date(prospect.lastContact).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}, arePropsEqual);
