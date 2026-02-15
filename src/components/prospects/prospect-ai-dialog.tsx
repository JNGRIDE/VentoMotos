"use client";

import { useState } from "react";
import { Sparkles, Loader2, FileText, Lightbulb, MessageSquare, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { type Prospect, type UserProfile } from "@/lib/data";
import { summarizeNotes, suggestNextStep, generateMessage } from "@/ai/flows/prospect-flows";

interface ProspectAIInsightsDialogProps {
  prospect: Prospect;
  userProfile?: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProspectAIInsightsDialog({
  prospect,
  userProfile,
  open,
  onOpenChange,
}: ProspectAIInsightsDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("summary");

  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [nextStep, setNextStep] = useState<string | null>(null);
  const [loadingNextStep, setLoadingNextStep] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
        const notes = prospect.notesList?.map(n => `[${new Date(n.date).toLocaleDateString()}] ${n.author || 'Unknown'}: ${n.content}`) || [];
        if (prospect.notes && (!prospect.notesList || prospect.notesList.length === 0)) {
            notes.push(`[Legacy Note]: ${prospect.notes}`);
        }

        if (notes.length === 0) {
            setSummary("No interaction history available to summarize.");
            return;
        }

        const result = await summarizeNotes({ notes });
        setSummary(result);
    } catch (error) {
        console.error("Error generating summary:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to generate summary.",
        });
    } finally {
        setLoadingSummary(false);
    }
  };

  const handleSuggestNextStep = async () => {
    setLoadingNextStep(true);
    try {
        const notes = prospect.notesList?.map(n => `[${new Date(n.date).toLocaleDateString()}] ${n.author || 'Unknown'}: ${n.content}`) || [];
        if (prospect.notes && (!prospect.notesList || prospect.notesList.length === 0)) {
            notes.push(`[Legacy Note]: ${prospect.notes}`);
        }

        const result = await suggestNextStep({
            notes,
            currentStage: prospect.stage
        });
        setNextStep(result);
    } catch (error) {
        console.error("Error suggesting next step:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to suggest next step.",
        });
    } finally {
        setLoadingNextStep(false);
    }
  };

  const handleGenerateMessage = async () => {
    if (!userProfile) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Salesperson profile not found.",
        });
        return;
    }
    setLoadingMessage(true);
    try {
        const result = await generateMessage({
            salespersonName: userProfile.name,
            prospectName: prospect.name,
            motorcycleInterest: prospect.motorcycleInterest,
            stage: prospect.stage,
        });
        setMessage(result);
        setMessageCopied(false);
    } catch (error) {
        console.error("Error generating message:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to generate message.",
        });
    } finally {
        setLoadingMessage(false);
    }
  };

  const copyMessageToClipboard = () => {
      if (message) {
          navigator.clipboard.writeText(message);
          setMessageCopied(true);
          setTimeout(() => setMessageCopied(false), 2000);
          toast({
              title: "Copied",
              description: "Message copied to clipboard.",
          });
      }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI Insights for {prospect.name}
          </DialogTitle>
          <DialogDescription>
            Use AI to summarize history, suggest next steps, and draft messages.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="nextStep">Next Step</TabsTrigger>
            <TabsTrigger value="message">Message</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 mt-4 border rounded-md p-4 bg-muted/20 overflow-hidden flex flex-col relative">

            {/* Summary Tab */}
            <TabsContent value="summary" className="flex-1 flex flex-col mt-0 h-full data-[state=inactive]:hidden">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Interaction Summary
                 </h3>
                 {!summary && (
                     <Button size="sm" onClick={handleGenerateSummary} disabled={loadingSummary}>
                        {loadingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Generate
                     </Button>
                 )}
                 {summary && (
                      <Button size="sm" variant="outline" onClick={handleGenerateSummary} disabled={loadingSummary}>
                        <Loader2 className={`mr-2 h-4 w-4 ${loadingSummary ? 'animate-spin' : 'hidden'}`} />
                        Regenerate
                     </Button>
                 )}
              </div>

              <ScrollArea className="flex-1 pr-4">
                  {loadingSummary ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                          <Loader2 className="h-8 w-8 animate-spin mb-2" />
                          <p>Analyzing history...</p>
                      </div>
                  ) : summary ? (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{summary}</div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm text-center">
                          <p>Click Generate to analyze the interaction history.</p>
                      </div>
                  )}
              </ScrollArea>
            </TabsContent>

            {/* Next Step Tab */}
            <TabsContent value="nextStep" className="flex-1 flex flex-col mt-0 h-full data-[state=inactive]:hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Suggested Action
                    </h3>
                     {!nextStep && (
                        <Button size="sm" onClick={handleSuggestNextStep} disabled={loadingNextStep}>
                            {loadingNextStep ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Suggest
                        </Button>
                     )}
                      {nextStep && (
                      <Button size="sm" variant="outline" onClick={handleSuggestNextStep} disabled={loadingNextStep}>
                        <Loader2 className={`mr-2 h-4 w-4 ${loadingNextStep ? 'animate-spin' : 'hidden'}`} />
                        Regenerate
                     </Button>
                 )}
                </div>

                 <ScrollArea className="flex-1 pr-4">
                    {loadingNextStep ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <p>Thinking...</p>
                        </div>
                    ) : nextStep ? (
                         <div className="space-y-4">
                             <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                                 <p className="text-sm font-medium text-primary mb-1">Recommended Action</p>
                                 <p className="text-lg font-semibold">{nextStep}</p>
                             </div>
                             <div className="text-xs text-muted-foreground">
                                 Based on stage: <Badge variant="outline">{prospect.stage}</Badge>
                             </div>
                         </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm text-center">
                             <p>Click Suggest to get AI recommendation for the next step.</p>
                        </div>
                    )}
                 </ScrollArea>
            </TabsContent>

            {/* Message Tab */}
            <TabsContent value="message" className="flex-1 flex flex-col mt-0 h-full data-[state=inactive]:hidden">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Draft Message
                     </h3>
                     {!message && (
                        <Button size="sm" onClick={handleGenerateMessage} disabled={loadingMessage}>
                            {loadingMessage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Draft
                        </Button>
                     )}
                     {message && (
                      <Button size="sm" variant="outline" onClick={handleGenerateMessage} disabled={loadingMessage}>
                        <Loader2 className={`mr-2 h-4 w-4 ${loadingMessage ? 'animate-spin' : 'hidden'}`} />
                        Regenerate
                     </Button>
                    )}
                </div>

                <ScrollArea className="flex-1 pr-4">
                     {loadingMessage ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <p>Writing message...</p>
                        </div>
                    ) : message ? (
                        <div className="space-y-4">
                             <div className="bg-background border rounded-md p-4 text-sm whitespace-pre-wrap shadow-sm">
                                 {message}
                             </div>
                             <div className="flex justify-end">
                                 <Button size="sm" variant="secondary" onClick={copyMessageToClipboard}>
                                     {messageCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                     {messageCopied ? "Copied" : "Copy to Clipboard"}
                                 </Button>
                             </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm text-center">
                             <p>Click Draft to generate a personalized message.</p>
                        </div>
                    )}
                </ScrollArea>
            </TabsContent>

          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
