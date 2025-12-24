import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

const systemPrompt = `You are FitBot, an expert AI fitness, health, and sports coach. You provide helpful, accurate, and motivating advice on:

- **Fitness**: Workout routines, exercise techniques, strength training, cardio, flexibility, and recovery
- **Nutrition**: Healthy eating tips, meal planning, macronutrients, hydration, and supplements
- **Sports**: Training tips for various sports, improving performance, injury prevention, and sports psychology
- **Health**: General wellness, sleep optimization, stress management, and healthy lifestyle habits
- **Weight Management**: BMI guidance, healthy weight loss/gain strategies, and body composition

Guidelines:
- Be encouraging and supportive
- Provide practical, actionable advice
- Always recommend consulting healthcare professionals for medical concerns
- Focus on sustainable, healthy approaches
- Keep responses concise but informative
- Use bullet points for clarity when listing exercises or tips
- If asked about topics outside fitness/health/sports, politely redirect to your expertise area

IMPORTANT - Grammar Tolerance:
- Users may make minor spelling or grammar mistakes (e.g., "exersice" instead of "exercise", "nutrishun" instead of "nutrition", "what is best workout for arms" instead of "what is the best workout for arms")
- Always understand and respond to the user's intent even if there are typos, misspellings, or grammar errors
- Do NOT correct the user's grammar or spelling unless they specifically ask for help with language
- Interpret common fitness-related misspellings naturally (e.g., "bicep" vs "biceps", "protien" as "protein", "calaries" as "calories", "streching" as "stretching")
- Focus on answering their question, not on their writing style`;

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add system prompt as first user message if not already present
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I am FitBot, your AI fitness, health, and sports coach. I\'m ready to help with workouts, nutrition, sports training, and wellness advice. How can I assist you today?' }] },
      ...geminiMessages
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform Gemini SSE stream to OpenAI-compatible format
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) {
                // Convert to OpenAI format
                const openAIFormat = {
                  choices: [{ delta: { content } }]
                };
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIFormat)}\n\n`));
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      },
      flush(controller) {
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Fitness chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
