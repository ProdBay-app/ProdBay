const OpenAI = require('openai');
const { supabase } = require('../config/database');

/**
 * AI Allocation Service
 * Handles AI-powered asset allocation using OpenAI GPT-5 nano
 */
class AIAllocationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Clean and parse JSON response from OpenAI
   * Handles markdown code blocks and other formatting issues
   */
  parseAIResponse(content) {
    // Declare cleanedContent outside try block to avoid ReferenceError in catch
    let cleanedContent = null;
    
    try {
      // Validate input
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid content: content must be a non-empty string');
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
      
      // Try to find JSON object in the content
      const jsonStart = cleanedContent.indexOf('{');
      const jsonEnd = cleanedContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
      }
      
      // Additional JSON cleaning - handle common AI response issues
      cleanedContent = this.cleanJsonResponse(cleanedContent);
      
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
   * Sanitize string values within JSON to handle special characters, LaTeX, and escape sequences
   * This method processes JSON string values to ensure they are properly escaped
   * Uses regex to find string values and sanitize them properly
   */
  sanitizeJsonStringValues(jsonString) {
    let sanitized = jsonString;
    
    // Step 1: Convert LaTeX notation to plain text before processing escapes
    // This handles cases like $360^{\circ}$ that appear in the raw JSON
    // Note: \^? matches optional caret (^) for superscript notation
    sanitized = sanitized.replace(/\$(\d+)\s*\^?\\?\{?\s*\\circ\s*\}?\s*\$/g, '$1 degrees');
    sanitized = sanitized.replace(/(\d+)\s*\^?\\?\{?\s*\\circ\s*\}?/g, '$1 degrees');
    sanitized = sanitized.replace(/\$(\d+)\s*°\s*\$/g, '$1 degrees');
    
    // Step 2: Find and fix string values (not keys)
    // Pattern: ": "value" - matches string values after colons
    // This regex handles escaped quotes within strings: "([^"\\]|\\.)*"
    sanitized = sanitized.replace(/:\s*"((?:[^"\\]|\\.)*)"/g, (match, content) => {
      let sanitizedContent = content;
      
      // Fix invalid escape sequences - escape backslashes not part of valid sequences
      // Valid JSON escapes: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
      sanitizedContent = sanitizedContent.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\');
      
      // Escape control characters - handle both literal control chars and already-escaped sequences
      // First, we need to track if we're in an escape sequence
      let processed = '';
      let inEscapeSequence = false;
      
      for (let i = 0; i < sanitizedContent.length; i++) {
        const char = sanitizedContent[i];
        const prevChar = i > 0 ? sanitizedContent[i - 1] : '';
        
        // If we're in an escape sequence, add the character and reset the flag
        if (inEscapeSequence) {
          processed += char;
          inEscapeSequence = false;
          continue;
        }
        
        // If current char is a backslash, mark that we're entering an escape sequence
        if (char === '\\') {
          processed += char;
          inEscapeSequence = true;
          continue;
        }
        
        // Escape unescaped control characters (literal newlines, tabs, etc.)
        if (char === '\n') {
          processed += '\\n';
        } else if (char === '\r') {
          processed += '\\r';
        } else if (char === '\t') {
          processed += '\\t';
        } else if (char === '\f') {
          processed += '\\f';
        } else if (char === '\b') {
          processed += '\\b';
        } else {
          processed += char;
        }
      }
      sanitizedContent = processed;
      
      // Remove any remaining problematic LaTeX patterns
      sanitizedContent = sanitizedContent.replace(/\$[^$]*\$/g, (latexMatch) => {
        return latexMatch.replace(/\$/g, '').replace(/\\/g, '\\\\');
      });
      
      return `: "${sanitizedContent}"`;
    });
    
    return sanitized;
  }

  /**
   * Clean common JSON formatting issues from AI responses
   * Now includes comprehensive string value sanitization
   */
  cleanJsonResponse(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
      return jsonString;
    }
    
    let cleaned = jsonString;
    
    // Step 1: Sanitize string values (handle LaTeX, backslashes, special characters)
    cleaned = this.sanitizeJsonStringValues(cleaned);
    
    // Step 2: Remove any trailing commas before closing brackets/braces
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Step 3: Fix incomplete arrays by removing trailing commas
    cleaned = cleaned.replace(/,(\s*])/g, '$1');
    
    // Step 4: Fix incomplete objects by removing trailing commas
    cleaned = cleaned.replace(/,(\s*})/g, '$1');
    
    // Step 5: Remove any incomplete property definitions at the end
    cleaned = cleaned.replace(/,\s*"[^"]*":\s*"[^"]*$/, '');
    
    // Step 6: Handle duplicate properties within objects - keep only the last occurrence
    cleaned = this.removeDuplicateProperties(cleaned);
    
    // Step 7: Ensure proper array closing
    if (cleaned.includes('"assets": [') && !cleaned.includes(']')) {
      cleaned = cleaned.replace(/"assets": \[([^]]*)$/, '"assets": [$1]');
    }
    
    // Step 8: Final pass to fix any remaining escape sequence issues
    // This handles cases where the regex might have missed nested strings
    cleaned = this.fixRemainingEscapeIssues(cleaned);
    
    return cleaned;
  }

  /**
   * Fix remaining escape sequence issues in JSON strings
   * This is a more aggressive approach that processes the entire JSON string
   * Uses regex to find and fix any remaining problematic escape sequences
   */
  fixRemainingEscapeIssues(jsonString) {
    let fixed = jsonString;
    
    // Pattern to match string values (not keys) - look for ": "value""
    // This regex tries to match string values more carefully
    const stringValuePattern = /:\s*"((?:[^"\\]|\\.)*)"/g;
    
    fixed = fixed.replace(stringValuePattern, (match, content) => {
      let fixedContent = content;
      
      // Fix invalid escape sequences that weren't caught earlier
      // Replace \ followed by invalid character (not in ["\\/bfnrtu] or \uXXXX) with \\
      fixedContent = fixedContent.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\');
      
      // Ensure any remaining LaTeX patterns are converted
      // Note: \^? matches optional caret (^) for superscript notation
      fixedContent = fixedContent.replace(/\$(\d+)\s*\^?\\?\{?\s*\\circ\s*\}?\s*\$/g, '$1 degrees');
      fixedContent = fixedContent.replace(/(\d+)\s*\^?\\?\{?\s*\\circ\s*\}?/g, '$1 degrees');
      
      return `: "${fixedContent}"`;
    });
    
    return fixed;
  }

  /**
   * Remove duplicate properties within JSON objects
   */
  removeDuplicateProperties(jsonString) {
    let cleaned = jsonString;
    
    // Handle the specific case where properties are duplicated within the same object
    // This is a simpler approach that focuses on the most common issues
    
    // Remove duplicate specifications
    cleaned = cleaned.replace(/"specifications":\s*"[^"]*",\s*"specifications":\s*"[^"]*"/g, (match) => {
      const specs = match.match(/"specifications":\s*"([^"]*)"/g);
      return specs ? specs[specs.length - 1] : match;
    });
    
    // Remove duplicate source_text
    cleaned = cleaned.replace(/"source_text":\s*"[^"]*",\s*"source_text":\s*"[^"]*"/g, (match) => {
      const sources = match.match(/"source_text":\s*"([^"]*)"/g);
      return sources ? sources[sources.length - 1] : match;
    });
    
    // Remove duplicate asset_name
    cleaned = cleaned.replace(/"asset_name":\s*"[^"]*",\s*"asset_name":\s*"[^"]*"/g, (match) => {
      const names = match.match(/"asset_name":\s*"([^"]*)"/g);
      return names ? names[names.length - 1] : match;
    });
    
    return cleaned;
  }

  /**
   * Extract assets from malformed JSON using multiple strategies
   */
  extractAssetsFromMalformedJson(rawContent) {
    const assets = [];
    
    try {
      // Strategy 1: Try to find complete asset objects using regex
      const assetPattern = /{\s*"asset_name":\s*"[^"]*"[^}]*}/g;
      const assetMatches = rawContent.match(assetPattern);
      
      if (assetMatches) {
        for (const assetMatch of assetMatches) {
          try {
            // Clean and parse each asset object
            const cleanedAsset = this.cleanJsonResponse(assetMatch);
            const asset = JSON.parse(cleanedAsset);
            
            // Validate that it has required fields
            if (asset.asset_name && asset.specifications) {
              assets.push({
                asset_name: asset.asset_name,
                specifications: asset.specifications,
                source_text: asset.source_text || '',
                tags: asset.tags || []
              });
            }
          } catch (parseError) {
            // Skip malformed individual assets
            continue;
          }
        }
      }
      
      // Strategy 2: If no complete assets found, try to extract from partial JSON
      if (assets.length === 0) {
        const partialMatch = rawContent.match(/"assets":\s*\[([\s\S]*?)(?:\]|$)/);
        if (partialMatch) {
          const assetsContent = partialMatch[1];
          const assetObjects = assetsContent.split(/(?<=})\s*,(?=\s*{)/);
          
          for (const assetObj of assetObjects) {
            try {
              const cleanedAsset = this.cleanJsonResponse(assetObj.trim());
              const asset = JSON.parse(cleanedAsset);
              
              if (asset.asset_name && asset.specifications) {
                assets.push({
                  asset_name: asset.asset_name,
                  specifications: asset.specifications,
                  source_text: asset.source_text || '',
                  tags: asset.tags || []
                });
              }
            } catch (parseError) {
              continue;
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error extracting assets from malformed JSON:', error);
    }
    
    return assets;
  }

  /**
   * Analyze project brief and suggest assets using AI
   * @param {string} briefDescription - The project brief text
   * @param {Object} projectContext - Additional project context (budget, timeline, etc.)
   * @returns {Promise<Object>} AI-generated asset suggestions
   */
  async analyzeBriefForAssets(briefDescription, projectContext = {}) {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildAssetAnalysisPrompt(briefDescription, projectContext);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-5-nano",
        messages: [
          {
            role: "system",
            content: "You are an expert event production manager. Analyze project briefs and identify required assets with detailed specifications. You must respond with ONLY valid JSON - no markdown formatting, no code blocks, no explanations outside the JSON structure. CRITICAL JSON REQUIREMENTS: 1) All string values must have proper escape sequences - use \\\\ for backslashes, \\n for newlines, \\\" for quotes. 2) Do NOT include LaTeX notation (like $360^{\\circ}$) - convert to plain text (e.g., '360 degrees'). 3) Ensure all JSON arrays and objects are properly closed with correct brackets and braces. 4) Do not include trailing commas. 5) Each property in an object must appear only once - no duplicate properties within the same object. 6) All special characters in string values must be properly escaped according to JSON standards."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_completion_tokens: 16000, // Increased from 8000 to provide ample headroom for complex asset lists with multiple assets, tags, and detailed specifications
        response_format: { type: "json_object" } // Force JSON output for consistency
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
      
      // Log the raw response for debugging
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
      // Note: OpenAI SDK handles timeouts and retries automatically
      // For large payloads (>200k chars), processing may take longer but is within gpt-5-nano's 400k token capacity

      const aiResponse = this.parseAIResponse(content);
      const processingTime = Date.now() - startTime;

      // Log the AI processing
      await this.logAIProcessing('asset_creation', {
        briefDescription,
        projectContext
      }, aiResponse, processingTime, true);

      return {
        success: true,
        assets: aiResponse.assets,
        reasoning: aiResponse.reasoning,
        confidence: aiResponse.confidence,
        processingTime
      };

    } catch (error) {
      console.error('AI asset analysis failed:', error);
      const processingTime = Date.now() - startTime;
      
      await this.logAIProcessing('asset_creation', {
        briefDescription,
        projectContext
      }, null, processingTime, false, error.message);

      // Try to extract partial assets from malformed JSON
      let fallbackAssets = [];
      try {
        const rawContent = error.rawContent || '';
        if (rawContent) {
          // Try multiple strategies to extract assets
          fallbackAssets = this.extractAssetsFromMalformedJson(rawContent);
          if (fallbackAssets.length > 0) {
            console.log(`Extracted ${fallbackAssets.length} partial assets from malformed JSON`);
          }
        }
      } catch (fallbackError) {
        console.error('Failed to extract partial assets:', fallbackError);
      }

      return {
        success: false,
        error: error.message,
        fallbackAssets: fallbackAssets.length > 0 ? fallbackAssets : this.getFallbackAssets(briefDescription)
      };
    }
  }



  /**
   * Get the comprehensive list of available asset tags for event production
   */
  getAvailableAssetTags() {
    return [
      // AUDIO & SOUND
      'Audio Equipment', 'Microphones', 'Sound Reinforcement', 'Audio Recording', 
      'Wireless Systems', 'Audio Visual', 'Backstage Audio',
      // VISUAL & DISPLAYS
      'LED Screens', 'Projection', 'Video Production', 'Photography', 
      'Graphics & Banners', 'Signage', 'Digital Displays', 'Exhibition Displays',
      // LIGHTING
      'Stage Lighting', 'Atmospheric Lighting', 'LED Lighting', 'Special Effects',
      'Power & Distribution', 'Lighting Design',
      // STAGING & STRUCTURES
      'Stages', 'Rigging', 'Scenic Elements', 'Platforms & Risers', 'Tents & Structures',
      // CATERING & FOOD SERVICE
      'Catering', 'Beverages', 'Tableware', 'Food Stations',
      // STAFFING & SERVICES
      'Event Staff', 'Security', 'Hospitality', 'Technical Staff', 'Medical Services',
      // LOGISTICS & OPERATIONS
      'Transportation', 'Loading & Setup', 'Storage', 'Permits & Licenses', 'Waste Management',
      // BRANDING & MARKETING
      'Branding', 'Print Materials', 'Promotional Items', 'Social Media',
      // DECOR & FLORAL
      'Floral', 'Decor', 'Furniture', 'Linens & Draping',
      // DIGITAL & TECHNOLOGY
      'Digital Assets', 'Technology Infrastructure'
    ];
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
    // gpt-5-nano supports 400,000 tokens (~1.6M characters), so 200k chars is safe
    if (sanitized.length > 200000) {
      console.warn(`[warn] Processing Massive Brief: ${sanitized.length} characters. Monitoring for latency.`);
    }
    
    return sanitized;
  }

  /**
   * Build prompt for asset analysis with industry-specific categories and examples
   */
  buildAssetAnalysisPrompt(briefDescription, projectContext) {
    // Sanitize the brief description before including in prompt
    const sanitizedBrief = this.sanitizeBriefText(briefDescription);
    
    const availableTags = this.getAvailableAssetTags();
    const tagsList = availableTags.map((tag, index) => `${index + 1}. ${tag}`).join('\n');
    return `
You are a senior event production manager with 15+ years of experience specializing in:

CORPORATE EVENTS & CONFERENCES:
- Main stage setups (40x20 stages, LED walls, professional AV systems, wireless microphones)
- Breakout rooms (projection systems, screens, audio for 20-100 people, flip charts)
- Registration areas (check-in stations, badge printing, directional signage, welcome desks)
- Networking spaces (cocktail tables, bar setups, ambient lighting, background music)
- Presentation equipment (laptops, clickers, laser pointers, confidence monitors)

TRADE SHOWS & EXHIBITIONS:
- Booth construction (modular displays, custom builds, lighting packages, carpeting)
- Graphics & signage (banners, backdrops, floor graphics, wayfinding, hanging signs)
- Technology integration (touchscreens, interactive displays, charging stations, WiFi)
- Demo stations (product displays, sample stations, interactive kiosks)
- Lead capture systems (badge scanners, lead retrieval, data collection)

SOCIAL EVENTS & WEDDINGS:
- Ceremony setups (altars, arches, seating arrangements, aisle runners, floral arrangements)
- Reception spaces (dance floors, DJ booths, photo booths, lighting effects)
- Catering infrastructure (buffet stations, bar setups, table settings, linens)
- Entertainment areas (stages, sound systems, lighting, special effects)
- Guest services (coat check, gift tables, guest books, transportation)

VENUE-SPECIFIC CONSIDERATIONS:
- Convention centers: Rigging points, power distribution, loading docks, union requirements
- Hotels: Ballroom setups, breakout rooms, guest services, catering restrictions
- Outdoor venues: Weather protection, power generation, site preparation, permits
- Museums/Galleries: Art protection, climate control, security requirements
- Stadiums/Arenas: Large-scale AV, crowd management, security, parking

Analyze this project brief and identify ALL required assets with detailed specifications.

Project Brief: "${sanitizedBrief}"

Additional Context:
- Budget: ${projectContext.financial_parameters || 'Not specified'}
- Timeline: ${projectContext.timeline_deadline || 'Not specified'}
- Venue: ${projectContext.physical_parameters || 'Not specified'}

CRITICAL REQUIREMENT: For each asset you identify, you MUST extract the exact text snippet from the brief that indicates this asset is needed. This will be used to create interactive links in the UI.

AVAILABLE ASSET TAGS:
You must assign 1-4 relevant tags to each asset from the following comprehensive list. Tags must match EXACTLY (case-sensitive):

${tagsList}

TAG SELECTION RULES:
- Select 1-4 tags per asset that best categorize its purpose and function
- Tags must match EXACTLY the names listed above (case-sensitive)
- Consider the primary domain (Audio, Visual, Lighting, Staging, Catering, etc.)
- Choose tags that help with organization, filtering, and categorization
- Example: For "Main Stage Audio System" use tags: ["Audio Equipment", "Sound Reinforcement"]
- Example: For "LED Video Wall" use tags: ["LED Screens", "Video Production"]
- Example: For "Catering Service" use tags: ["Catering", "Event Staff"]

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "assets": [
    {
      "asset_name": "Specific Asset Name",
      "specifications": "Detailed technical requirements including quantities, dimensions, power needs, setup requirements",
      "source_text": "The exact sentence or phrase from the brief that mentions this asset requirement",
      "tags": ["TagName1", "TagName2"]
    }
  ],
  "reasoning": "Explanation of why these assets were identified based on event type, scale, and venue requirements",
  "confidence": 0.85
}

IMPORTANT GUIDELINES:
- The source_text field should contain the precise text from the brief (verbatim) that led you to identify this asset
- Extract complete sentences or meaningful phrases, not single words
- If an asset is implied by multiple brief sections, choose the most specific/relevant excerpt
- The source_text will be highlighted in the UI when users interact with the asset
- Be specific about quantities, dimensions, and technical requirements
- Consider the event type and scale when identifying assets
- Include both explicitly mentioned and industry-standard requirements
- MANDATORY: Every asset MUST have at least 1 tag, and up to 4 tags maximum
- Tag names must match EXACTLY from the available tags list (case-sensitive, no typos)

FOCUS ON IDENTIFYING:
- Production equipment (audio, lighting, staging, AV systems)
- Marketing materials (printing, graphics, banners, signage, displays)
- Services (catering, transport, security, cleaning, staffing)
- Design and creative assets (decorations, floral, photography, videography)
- Logistics and support services (registration, networking, seating, power)
- Venue-specific requirements (rigging, power distribution, access, permits)
- Entertainment and special effects (music, lighting effects, interactive elements)

Be specific and practical in your asset identification, considering the event type, scale, and venue requirements.
`;
  }


  /**
   * Get fallback assets using rule-based approach
   */
  getFallbackAssets(briefDescription) {
    // Use existing BriefProcessor logic as fallback
    const BriefProcessor = require('./briefProcessor');
    const assetNames = BriefProcessor.parseAssetsFromBrief(briefDescription);
    
    return assetNames.map(name => ({
      asset_name: name,
      specifications: `Requirements for ${name.toLowerCase()} based on project brief`,
      tags: [] // Empty tags for fallback assets
    }));
  }


  /**
   * Log AI processing for monitoring and debugging
   */
  async logAIProcessing(type, inputData, outputData, processingTime, success, errorMessage = null) {
    try {
      await supabase
        .from('ai_processing_logs')
        .insert({
          processing_type: type,
          input_data: inputData,
          output_data: outputData,
          processing_time_ms: processingTime,
          success,
          error_message: errorMessage
        });
    } catch (error) {
      console.error('Failed to log AI processing:', error);
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
        model: "gpt-5-nano",
        messages: [{ role: "user", content: "Hello" }],
        max_completion_tokens: 5
      });

      return {
        healthy: true,
        model: "gpt-5-nano",
        responseTime: Date.now()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

module.exports = AIAllocationService;
