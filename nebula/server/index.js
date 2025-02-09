import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the dist directory
app.use(express.static(join(__dirname, '../dist')));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Input validation schema
const querySchema = z.object({
  query: z.string().min(1).max(1000)
});

// System prompt for consistent AI responses
const SYSTEM_PROMPT = `You are an advanced AI assistant for a space mission control system. Your role is to:
1. Monitor and analyze spacecraft systems
2. Interpret telemetry data
3. Provide mission recommendations
4. Detect and explain anomalies
5. Assist with resource management
6. Provide predictive insights

When responding:
1. Focus on the most critical information first
2. Highlight any anomalies or concerns
3. Provide specific recommendations when issues are detected
4. Use the provided system data to support your analysis
5. Be concise but thorough in your explanations

Format your responses in a clear, structured manner:
1. Current Status: Brief overview of relevant systems
2. Analysis: Detailed interpretation of the data
3. Recommendations: Actionable steps if needed
4. Predictions: Future trends or potential issues to watch

Respond in a professional, mission-control appropriate tone.`;

app.post('/api/query', async (req, res) => {
  try {
    // Validate request body exists
    if (!req.body) {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'Request body is missing'
      });
    }

    // Validate input
    const validationResult = querySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.message
      });
    }

    const { query } = validationResult.data;

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'Configuration error',
        details: 'OpenAI API key is not configured'
      });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      if (!completion.choices[0]?.message?.content) {
        throw new Error('No response from OpenAI');
      }

      res.json({ response: completion.choices[0].message.content });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      res.status(500).json({
        error: 'AI processing error',
        details: 'Failed to get response from AI service'
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});