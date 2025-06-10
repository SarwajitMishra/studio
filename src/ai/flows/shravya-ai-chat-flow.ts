
'use server';
/**
 * @fileOverview A chatbot flow for Shravya AI to answer game-related questions,
 * with server-side Text-to-Speech generation.
 *
 * - shravyaAIChat - A function that handles user queries about games in Shravya Playhouse.
 * - ShravyaAIChatInput - The input type for the shravyaAIChat function.
 * - ShravyaAIChatOutput - The return type for the shravyaAIChat function.
 */

import { ai } from '@/ai/genkit';
import { GAMES } from '@/lib/constants'; // Import game data
import { z } from 'genkit';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

const ShravyaAIChatInputSchema = z.object({
  userInput: z.string().describe('The user question about games in Shravya Playhouse.'),
});
export type ShravyaAIChatInput = z.infer<typeof ShravyaAIChatInputSchema>;

const ShravyaAIChatOutputSchema = z.object({
  response: z.string().describe("Shravya AI's answer to the user's question."),
  responseLanguage: z.string().describe("The BCP-47 language code of the response (e.g., 'en' for English, 'hi' for Hindi)."),
  audioContent: z.string().optional().describe("Base64 encoded audio data of the AI's spoken response."),
});
export type ShravyaAIChatOutput = z.infer<typeof ShravyaAIChatOutputSchema>;

export async function shravyaAIChat(input: ShravyaAIChatInput): Promise<ShravyaAIChatOutput> {
  return shravyaAIChatFlow(input);
}

const gameInfoForPrompt = GAMES.map(game => ({
    title: game.title,
    description: game.description,
    category: game.category,
}));

const chatPrompt = ai.definePrompt({
  name: 'shravyaAIChatPrompt',
  input: { schema: ShravyaAIChatInputSchema.extend({ games: z.any() }) },
  output: { schema: ShravyaAIChatOutputSchema.omit({ audioContent: true }) }, // TTS is handled after this prompt
  prompt: `You are Shravya AI, a friendly and helpful assistant for Shravya Playhouse.
Your role is to answer questions specifically about the games available in the playhouse.
Be concise, informative, and maintain a positive tone suitable for all ages.

Detect the primary language of the "User's question".
- If the primary language of the "User's question" is Hindi, then your entire "Your answer" MUST be in Hindi. You should translate game titles and relevant details from the provided game list into Hindi accurately for your response. Set "responseLanguage" to "hi".
- Otherwise, "Your answer" MUST be in English. Set "responseLanguage" to "en".

If the question is not about the games in the provided list, or if you don't know the answer, politely state that you can only answer game-related questions or that you don't have the information, using the detected language (Hindi or English).

Here are the games currently available in Shravya Playhouse (use this information for your answers):
{{#each games}}
- Title: {{this.title}} (Category: {{this.category}})
  Description: {{this.description}}
{{/each}}

User's question: {{{userInput}}}

Your answer:`,
});

const ttsClient = new TextToSpeechClient();

async function generateSpeech(text: string, languageCode: string): Promise<string | null> {
  try {
    let voiceName: string;
    let langCodeForTTS: string;

    if (languageCode.toLowerCase().startsWith('hi')) {
      langCodeForTTS = 'hi-IN';
      voiceName = 'hi-IN-Standard-A'; // Female, Standard
    } else {
      langCodeForTTS = 'en-IN';
      voiceName = 'en-IN-Standard-A'; // Female, Standard
    }

    const request = {
      input: { text: text },
      voice: { languageCode: langCodeForTTS, name: voiceName, ssmlGender: 'FEMALE' as const },
      audioConfig: { audioEncoding: 'MP3' as const },
    };

    console.log('[ShravyaAI TTS Server] Requesting speech for:', text.substring(0, 30), 'Lang:', langCodeForTTS, 'Voice:', voiceName);
    const [response] = await ttsClient.synthesizeSpeech(request);

    if (response.audioContent) {
      console.log('[ShravyaAI TTS Server] Speech synthesis successful.');
      return (response.audioContent as Uint8Array).toString('base64');
    }
    console.warn('[ShravyaAI TTS Server] No audio content in TTS response.');
    return null;
  } catch (error) {
    console.error('[ShravyaAI TTS Server] Error during speech synthesis:', error);
    return null;
  }
}

const shravyaAIChatFlow = ai.defineFlow(
  {
    name: 'shravyaAIChatFlow',
    inputSchema: ShravyaAIChatInputSchema,
    outputSchema: ShravyaAIChatOutputSchema,
  },
  async (input): Promise<ShravyaAIChatOutput> => {
    const { output: llmOutput } = await chatPrompt({ userInput: input.userInput, games: gameInfoForPrompt });

    if (!llmOutput || !llmOutput.response) {
      return { response: "I'm sorry, I couldn't generate a response right now. Please try again.", responseLanguage: 'en' };
    }

    let audioContent: string | null = null;
    if (llmOutput.response) {
      audioContent = await generateSpeech(llmOutput.response, llmOutput.responseLanguage);
    }

    return {
      response: llmOutput.response,
      responseLanguage: llmOutput.responseLanguage,
      audioContent: audioContent || undefined,
    };
  }
);
