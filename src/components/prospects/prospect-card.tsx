"use client";

import { memo } from "react";
import { MoreHorizontal, Pencil, Trash, Phone, ArrowRight, MessageCircle, Clock, FileText } from "lucide-react";
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
  userProfile?: UserProfile; 
  currentUserProfile: UserProfile | null;
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
    prospect.source === "Advertising" ? "bg-blue-500/10 text-blue-600" : "bg-green-500/10 text-green-600";

  const borderColor = prospect.source === "Advertising" ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-green-500";

  const daysInStage = prospect.stageUpdatedAt
      ? Math.floor((new Date().getTime() - new Date(prospect.stageUpdatedAt).getTime()) / (1000 * 3600 * 24))
      : null;

  const whatsappLink = prospect.phone ? `https://wa.me/52${prospect.phone.replace(/\D/g, '')}` : null;
  const phoneLink = prospect.phone ? `tel:${prospect.phone}` : null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Evitar que el clic en botones o dropdown abra la bitácora
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    onEdit(prospect);
  };

  return (
    <Card
      className={cn(
        "mb-1 shadow-soft hover:shadow-premium transition-all duration-300 group relative cursor-pointer border-none rounded-2xl active:scale-[0.98] overflow-hidden",
        borderColor,
        prospect.stage === 'Caído' ? 'opacity-60 saturate-50' : ''
      )}
      draggable
      onDragStart={(e) => onDragStart(e, prospect.id)}
      onClick={handleCardClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="text-sm font-bold truncate leading-tight group-hover:text-primary transition-colors">{prospect.name}</CardTitle>
                <div className="flex items-center gap-1.5">
                   <Badge className={cn("text-[9px] px-1.5 h-4 border-none font-black uppercase tracking-wider", sourceColor)} variant="outline">
                      {prospect.source}
                   </Badge>
                   {prospect.motorcycleInterest && (
                     <span className="text-[10px] text-muted-foreground truncate italic">
                       • {prospect.motorcycleInterest}
                     </span>
                   )}
                </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0 rounded-full hover:bg-secondary transition-colors shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl shadow-premium border-none p-1 min-w-[160px]">
                <DropdownMenuItem onSelect={() => onEdit(prospect)} className="rounded-lg gap-2 font-semibold">
                  <FileText className="h-4 w-4" /> Abrir Bitácora
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="rounded-lg gap-2 font-semibold">
                    <ArrowRight className="h-4 w-4" /> Mover a...
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="rounded-xl shadow-premium border-none">
                      {PROSPECT_STAGES.filter((stage) => stage !== prospect.stage).map((stage) => (
                        <DropdownMenuItem
                          key={stage}
                          onSelect={() => onMoveStage(prospect.id, stage)}
                          className="rounded-lg font-medium"
                        >
                          {stage}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onDelete(prospect); }} className="text-destructive focus:text-destructive rounded-lg gap-2 font-semibold">
                  <Trash className="h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-3">
         <div className="flex items-center justify-between">
            <div className="flex gap-1">
                {phoneLink && (
                    <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-all" asChild>
                        <a href={phoneLink} aria-label={`Call ${prospect.name}`}>
                            <Phone className="h-3.5 w-3.5" />
                        </a>
                    </Button>
                )}
                {whatsappLink && (
                    <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg hover:bg-green-500/10 hover:text-green-600 transition-all" asChild>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${prospect.name}`}>
                            <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                    </Button>
                )}
            </div>

            {daysInStage !== null && (
                <div className={cn("flex items-center text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight", 
                    daysInStage > 7 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    <span>{daysInStage} {daysInStage === 1 ? 'día' : 'días'}</span>
                </div>
            )}
         </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Avatar className="h-5 w-5 border border-border/20">
              <AvatarImage src={userProfile?.avatarUrl} />
              <AvatarFallback className="text-[8px]">{userProfile?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-[10px] font-bold text-muted-foreground/80">{userProfile?.name?.split(' ')[0] || "Sin asignar"}</span>
          </div>
          <span className="text-[9px] font-medium text-muted-foreground/60">{new Date(prospect.lastContact).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</span>
        </div>
      </CardContent>
    </Card>
  );
}, arePropsEqual);
