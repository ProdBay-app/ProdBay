const OpenAI = require('openai');

/**
 * Brief Highlight Service
 * Extracts key project information from a brief using OpenAI GPT-4.1 nano
 */
class BriefHighlightService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Sanitize brief description text before including in prompt
   * This prevents special characters from causing issues in the AI response
   * Aggressively filters noise patterns from PDF extraction artifacts
   */
  sanitizeBriefText(briefText) {
    if (!briefText || typeof briefText !== 'string') {
      return '';
    }
    
    let sanitized = briefText;
    
    // STEP 1: Remove ASCII character maps (PDF font encoding artifacts)
    // Pattern: Sequences of 90+ printable ASCII characters in order
    // Matches: !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~
    sanitized = sanitized.replace(/[!-~]{90,}/g, '');
    
    // STEP 2: Remove repeated character sequences (PDF rendering artifacts)
    // Pattern: Single character repeated 20+ times (with optional spaces between)
    // Matches: 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1...
    sanitized = sanitized.replace(/(.)\s*\1{19,}/g, '');
    
    // STEP 3: Remove high-entropy blocks (non-human-readable character sequences)
    // Pattern: 30+ consecutive non-alphanumeric, non-whitespace characters
    // Matches: ÇüéãààçéëéííiÃÂÉæÆõöòùùýÖÜç£¥RfáíóúñÑao¿r~½¼i«»
    sanitized = sanitized.replace(/[^\w\s]{30,}/g, '');
    
    // STEP 4: Decode HTML entities (common in PDF text extraction)
    // Convert HTML entities back to their actual characters
    const htmlEntityMap = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'"
    };
    Object.entries(htmlEntityMap).forEach(([entity, char]) => {
      sanitized = sanitized.replace(new RegExp(entity, 'g'), char);
    });
    
    // STEP 5: Normalize whitespace (convert all line breaks to spaces)
    sanitized = sanitized.replace(/\r\n/g, ' ');
    sanitized = sanitized.replace(/\n/g, ' ');
    sanitized = sanitized.replace(/\r/g, ' ');
    
    // STEP 6: Remove or convert LaTeX notation to plain text
    // Note: \^? matches optional caret (^) for superscript notation (e.g., $360^{\circ}$)
    sanitized = sanitized.replace(/\$(\d+)\s*\^?\\?\{?\s*\\circ\s*\}?\s*\$/g, '$1 degrees');
    sanitized = sanitized.replace(/(\d+)\s*\^?\\?\{?\s*\\circ\s*\}?/g, '$1 degrees');
    
    // STEP 7: Escape backslashes that might be interpreted as escape sequences
    // But preserve valid escape sequences if they exist
    sanitized = sanitized.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\');
    
    // STEP 8: Escape quotes to prevent breaking JSON structure in prompt
    sanitized = sanitized.replace(/"/g, '\\"');
    
    // STEP 9: Clean up multiple spaces created by removals
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // STEP 10: Trim and apply soft limit for monitoring (no truncation - zero data loss)
    sanitized = sanitized.trim();
    
    // Soft limit: Log warning for very large briefs but allow full processing
    // gpt-4.1-nano supports 400,000 tokens (~1.6M characters), so 200k chars is safe
    if (sanitized.length > 200000) {
      console.warn(`[warn] Processing Massive Brief: ${sanitized.length} characters. Monitoring for latency.`);
    }
    
    return sanitized;
  }

  /**
   * Clean and parse JSON response from OpenAI
   * Handles markdown code blocks, empty responses, and extracts JSON from within text
   */
  parseAIResponse(content) {
    // Declare cleanedContent outside try block to avoid ReferenceError in catch
    let cleanedContent = null;
    
    try {
      // Validate input
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('AI returned empty or invalid response');
      }
      
      // Remove markdown code blocks if present
      cleanedContent = content.trim();
      
      // Remove ```json and ``` markers
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing whitespace
      cleanedContent = cleanedContent.trim();
      
      // Try to find JSON object in the content (handles cases where AI adds explanatory text)
      const jsonStart = cleanedContent.indexOf('{');
      const jsonEnd = cleanedContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
      } else {
        // No JSON found in response
        throw new Error('No valid JSON object found in AI response');
      }
      
      // Remove trailing commas before closing braces (common AI mistake)
      cleanedContent = cleanedContent.replace(/,(\s*[}\]])/g, '$1');
      
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Raw content length:', content ? content.length : 0);
      console.error('Raw content preview:', content ? content.substring(0, 500) : 'null');
      if (cleanedContent !== null) {
        console.error('Cleaned content length:', cleanedContent.length);
        console.error('Cleaned content preview:', cleanedContent.substring(0, 500));
      } else {
        console.error('Cleaned content: null (not initialized)');
      }
      
      const parseError = new Error(`Failed to parse AI response: ${error.message}`);
      parseError.rawContent = content;
      parseError.cleanedContent = cleanedContent;
      throw parseError;
    }
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

      const systemPrompt = `You are an expert event production project manager. Your task is to extract key data from project briefs while ignoring PDF artifacts like headers, footers, page numbers, and legal boilerplate.

CRITICAL RULES:
1. FOCUS: Prioritize Event Specifications, Dimensions (Spatial Layout), and Talent (DJs/Headline Acts).
2. SANITIZE: Always convert LaTeX (e.g., 360^{\\circ}) into plain text (e.g., '360 degrees').
3. FORMAT: Output ONLY valid JSON. All backslashes and quotes must be properly escaped according to JSON standards.
4. DIMENSIONS: Standardize spatial data as 'Length m x Width m' (e.g., '50 m x 40 m') whenever possible.
5. NOISE: Ignore repeated branding, document metadata, and table of contents.

You must respond with ONLY a valid JSON object. Do not include any explanatory text, markdown formatting, code blocks, or any characters outside of the JSON structure.

The JSON object must conform to this exact schema:
{
  "projectName": string | null,
  "clientName": string | null,
  "budget": number | null,
  "deadline": string | null,
  "physicalParameters": string | null
}

Extraction Rules:
- If information cannot be found in the brief, set the value to null
- For projectName: Extract the project/event name (ignore document titles and headers)
- For clientName: Extract the client/company/organization name (ignore repeated branding)
- For budget: Extract only numeric values (convert from any currency format to a number)
- For deadline: Extract dates in YYYY-MM-DD format. If only month/year is given, use the last day of that month
- For physicalParameters: Extract dimensions (standardize as 'X m x Y m'), venue details, capacity, and spatial layout. Focus on Event Specifications section.`;

      // Sanitize the brief text before sending to API
      const sanitizedBriefText = this.sanitizeBriefText(briefText);
      const userPrompt = `Analyze this project brief and extract the key information:\n\n${sanitizedBriefText}`;

      console.log('Calling OpenAI API for brief highlight extraction...');
      // Note: OpenAI SDK handles timeouts and retries automatically
      // For large payloads (>200k chars), processing may take longer but is within gpt-4.1-nano's 400k token capacity

      const response = await this.openai.chat.completions.create({
        model: "gpt-4.1-nano",
        temperature: 0.0,
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
        max_completion_tokens: 4000 // Increased from 2000 to provide ample headroom for JSON responses
      });

      // Validate response structure before accessing content
      if (!response || !response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        throw new Error('Invalid API response structure: missing choices array');
      }

      if (!response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid API response structure: missing message in choices[0]');
      }

      const content = response.choices[0].message.content;
      
      // Handle null/undefined/empty content explicitly
      if (content === null || content === undefined) {
        const finishReason = response.choices[0]?.finish_reason;
        throw new Error(`AI returned null/undefined content. Finish reason: ${finishReason || 'unknown'}. This may indicate the model hit a limit or encountered an error.`);
      }
      
      // Handle empty string content (often caused by 'length' finish reason with very low token limits)
      if (content.trim().length === 0) {
        const finishReason = response.choices[0]?.finish_reason;
        if (finishReason === 'length') {
          throw new Error(`AI response was cut off due to token limit (finish_reason: 'length'). Content is empty, suggesting max_completion_tokens may be too low. Consider increasing the limit.`);
        }
        throw new Error(`AI returned empty content. Finish reason: ${finishReason || 'unknown'}. This may indicate the model encountered an error or the response was filtered.`);
      }
      
      console.log('Raw AI response:', content);
      console.log('Response structure:', {
        hasResponse: !!response,
        choicesCount: response.choices?.length || 0,
        hasMessage: !!response.choices[0]?.message,
        contentLength: content?.length || 0,
        contentType: typeof content,
        finishReason: response.choices[0]?.finish_reason,
        usage: response.usage || 'not provided',
        promptTokens: response.usage?.prompt_tokens || 'unknown',
        completionTokens: response.usage?.completion_tokens || 'unknown',
        totalTokens: response.usage?.total_tokens || 'unknown'
      });

      // Parse the JSON response using robust parsing method
      const highlights = this.parseAIResponse(content);

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
        model: "gpt-4.1-nano",
        temperature: 0.0,
        messages: [{ role: "user", content: "Hello" }],
        max_completion_tokens: 5
      });

      return {
        healthy: true,
        model: "gpt-4.1-nano",
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

