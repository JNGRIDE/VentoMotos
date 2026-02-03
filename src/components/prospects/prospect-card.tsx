import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Prospect, UserProfile } from "@/lib/data";

interface ProspectCardProps {
  prospect: Prospect;
  userProfile?: UserProfile; // Make it optional in case it's not found
}

export function ProspectCard({ prospect, userProfile }: ProspectCardProps) {
  const sourceColor =
    prospect.source === "Advertising" ? "bg-accent/20 text-accent-foreground" : "bg-primary/20 text-primary-foreground";

  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">{prospect.name}</CardTitle>
            <Badge className={cn("text-xs", sourceColor)} variant="outline">
                {prospect.source}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={userProfile?.avatarUrl} />
              <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{userProfile?.name || "Unassigned"}</span>
          </div>
          <span>{new Date(prospect.lastContact).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}