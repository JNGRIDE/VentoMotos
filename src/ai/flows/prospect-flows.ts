'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema for Summary
const SummarizeNotesInputSchema = z.object({
  notes: z.array(z.string()).describe("A list of historical notes about the prospect interaction."),
});
export type SummarizeNotesInput = z.infer<typeof SummarizeNotesInputSchema>;

// Output Schema for Summary
const SummarizeNotesOutputSchema = z.string();
export type SummarizeNotesOutput = z.infer<typeof SummarizeNotesOutputSchema>;

// Input Schema for Next Step
const SuggestNextStepInputSchema = z.object({
  notes: z.array(z.string()).describe("A list of historical notes about the prospect interaction."),
  currentStage: z.string().describe("The current stage of the prospect in the sales pipeline."),
});
export type SuggestNextStepInput = z.infer<typeof SuggestNextStepInputSchema>;

// Output Schema for Next Step
const SuggestNextStepOutputSchema = z.string();
export type SuggestNextStepOutput = z.infer<typeof SuggestNextStepOutputSchema>;

// Input Schema for Personalized Message
const GenerateMessageInputSchema = z.object({
  salespersonName: z.string().describe("The name of the salesperson handling the prospect."),
  prospectName: z.string().describe("The name of the prospect."),
  motorcycleInterest: z.string().optional().describe("The motorcycle model the prospect is interested in."),
  stage: z.string().describe("The current stage of the prospect in the sales pipeline."),
});
export type GenerateMessageInput = z.infer<typeof GenerateMessageInputSchema>;

// Output Schema for Personalized Message
const GenerateMessageOutputSchema = z.string();
export type GenerateMessageOutput = z.infer<typeof GenerateMessageOutputSchema>;


// 1. Summary Flow
const summarizeNotesPrompt = ai.definePrompt({
  name: 'summarizeNotesPrompt',
  input: { schema: SummarizeNotesInputSchema },
  output: { schema: SummarizeNotesOutputSchema },
  prompt: `You are a sales assistant. Your task is to summarize the interaction history with a prospect to prepare the salesperson for a meeting.

  Interaction History:
  {{#each notes}}
  - {{this}}
  {{/each}}

  Please provide a concise summary of the key points discussed, the prospect's needs, and any pending actions. Keep it professional and brief.`,
});

const summarizeNotesFlow = ai.defineFlow(
  {
    name: 'summarizeNotesFlow',
    inputSchema: SummarizeNotesInputSchema,
    outputSchema: SummarizeNotesOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeNotesPrompt(input);
    return output || "Unable to generate summary.";
  }
);

export async function summarizeNotes(input: SummarizeNotesInput): Promise<SummarizeNotesOutput> {
  return summarizeNotesFlow(input);
}


// 2. Next Step Flow
const suggestNextStepPrompt = ai.definePrompt({
  name: 'suggestNextStepPrompt',
  input: { schema: SuggestNextStepInputSchema },
  output: { schema: SuggestNextStepOutputSchema },
  prompt: `You are a sales strategy expert. Analyze the following interaction history and the current stage of the prospect to suggest the best next action to move them forward in the pipeline.

  Current Stage: {{currentStage}}

  Interaction History:
  {{#each notes}}
  - {{this}}
  {{/each}}

  Based on this, what is the single most effective next step? Be specific (e.g., "Schedule a test drive", "Send financing options", "Follow up on document submission").`,
});

const suggestNextStepFlow = ai.defineFlow(
  {
    name: 'suggestNextStepFlow',
    inputSchema: SuggestNextStepInputSchema,
    outputSchema: SuggestNextStepOutputSchema,
  },
  async (input) => {
     const { output } = await suggestNextStepPrompt(input);
     return output || "Unable to suggest next step.";
  }
);

export async function suggestNextStep(input: SuggestNextStepInput): Promise<SuggestNextStepOutput> {
  return suggestNextStepFlow(input);
}


// 3. Personalized Message Flow
const generateMessagePrompt = ai.definePrompt({
  name: 'generateMessagePrompt',
  input: { schema: GenerateMessageInputSchema },
  output: { schema: GenerateMessageOutputSchema },
  prompt: `You are a professional salesperson named {{salespersonName}}. Write a personalized message to a prospect named {{prospectName}}.

  Context:
  - Interested Model: {{motorcycleInterest}}
  - Current Stage: {{stage}}

  The message should be suitable for WhatsApp or Email. It should be friendly, professional, and encourage the prospect to take the next step relevant to their stage.
  If the model is known, mention it. If not, ask about their preferences.

  Keep it concise and engaging. do not use placeholders like [Your Name], use the provided name {{salespersonName}}.`,
});

const generateMessageFlow = ai.defineFlow(
  {
    name: 'generateMessageFlow',
    inputSchema: GenerateMessageInputSchema,
    outputSchema: GenerateMessageOutputSchema,
  },
  async (input) => {
    const { output } = await generateMessagePrompt(input);
    return output || "Unable to generate message.";
  }
);

export async function generateMessage(input: GenerateMessageInput): Promise<GenerateMessageOutput> {
  return generateMessageFlow(input);
}
