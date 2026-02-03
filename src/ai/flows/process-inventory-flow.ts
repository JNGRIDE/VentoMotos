'use server';
/**
 * @fileOverview An AI flow to process inventory documents.
 *
 * - processInventory - A function that extracts motorcycle data from a PDF.
 * - ProcessInventoryInput - The input type for the processInventory function.
 * - ProcessInventoryOutput - The return type for the processInventory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { NewMotorcycle } from '@/lib/data';

const ProcessInventoryInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file of an inventory list, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ProcessInventoryInput = z.infer<typeof ProcessInventoryInputSchema>;


const MotorcycleSchema = z.object({
    model: z.string().describe("The model name from the 'Articulo' column."),
    sku: z.string().describe("The SKU from the 'Número' column."),
    stock: z.number().describe("The quantity from the 'fisico' column."),
});

const ProcessInventoryOutputSchema = z.array(MotorcycleSchema);
export type ProcessInventoryOutput = z.infer<typeof ProcessInventoryOutputSchema>;


export async function processInventory(input: ProcessInventoryInput): Promise<ProcessInventoryOutput> {
  return processInventoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processInventoryPrompt',
  input: { schema: ProcessInventoryInputSchema },
  output: { schema: ProcessInventoryOutputSchema },
  prompt: `You are an expert data entry specialist. Your task is to analyze the provided document, which is a list of motorcycles, and extract the information for each motorcycle into a JSON array.

For each item in the list, you must extract the following fields:
1.  'model': Use the value from the 'Articulo' column.
2.  'sku': Use the value from the 'Número' column.
3.  'stock': Use the value from the 'fisico' column. This should be a number.

- Ignore the 'Numero de motor' column completely.
- Ensure the final output is only the JSON array of objects, with no other text or explanation.

Document to process: {{media url=pdfDataUri}}`,
});

const processInventoryFlow = ai.defineFlow(
  {
    name: 'processInventoryFlow',
    inputSchema: ProcessInventoryInputSchema,
    outputSchema: ProcessInventoryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || [];
  }
);
