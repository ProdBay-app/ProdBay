const OpenAI = require('openai');

/**
 * Brief Highlight Service
 * Extracts key project information from a brief using OpenAI GPT-4o-mini
 */
class BriefHighlightService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Extract key highlights from a project brief
   * @param {string} briefText - The project brief text
   * @returns {Promise<Object>} Extracted highlights
   */
  async extractHighlights(briefText) {
    const startTime = Date.now();
    
    try {
      if (!briefText || briefText.trim().length === 0) {
        throw new Error('Brief text is required');
      }

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = `You are an expert project management assistant. Your task is to analyze project briefs and extract key information.

You must respond with ONLY a valid JSON object. Do not include any explanatory text, markdown formatting, code blocks, or any characters outside of the JSON structure.

The JSON object must conform to this exact schema:
{
  "projectName": string | null,
  "clientName": string | null,
  "budget": number | null,
  "deadline": string | null,
  "physicalParameters": string | null
}

Rules:
- If information cannot be found in the brief, set the value to null
- For projectName: Extract the project/event name
- For clientName: Extract the client/company/organization name
- For budget: Extract only numeric values (convert from any currency format to a number)
- For deadline: Extract dates in YYYY-MM-DD format. If only month/year is given, use the last day of that month
- For physicalParameters: Extract any physical specifications like dimensions, venue details, capacity, etc.
- Be precise and extract only information that is explicitly stated or clearly implied`;

      const userPrompt = `Analyze this project brief and extract the key information:\n\n${briefText}`;

      console.log('Calling OpenAI API for brief highlight extraction...');

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        response_format: { type: "json_object" }, // Force JSON output
        temperature: 0.3, // Low temperature for consistent extraction
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      console.log('Raw AI response:', content);

      // Parse the JSON response
      const highlights = JSON.parse(content);

      const processingTime = Date.now() - startTime;
      console.log(`Brief highlights extracted in ${processingTime}ms`);

      // Validate the response structure
      const validatedHighlights = {
        projectName: highlights.projectName || null,
        clientName: highlights.clientName || null,
        budget: typeof highlights.budget === 'number' ? highlights.budget : null,
        deadline: highlights.deadline || null,
        physicalParameters: highlights.physicalParameters || null
      };

      return {
        success: true,
        data: validatedHighlights,
        processingTime
      };

    } catch (error) {
      console.error('Brief highlight extraction failed:', error);
      const processingTime = Date.now() - startTime;

      return {
        success: false,
        error: {
          message: error.message,
          type: error.name
        },
        processingTime
      };
    }
  }

  /**
   * Check if AI service is healthy
   */
  async checkHealth() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          healthy: false,
          error: 'OpenAI API key not configured'
        };
      }

      // Test with a simple request
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      });

      return {
        healthy: true,
        model: "gpt-4o-mini",
        service: 'briefHighlights'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

module.exports = BriefHighlightService;

