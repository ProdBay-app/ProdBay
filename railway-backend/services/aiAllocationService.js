const OpenAI = require('openai');
const { supabase } = require('../config/database');

/**
 * AI Allocation Service
 * Handles AI-powered asset allocation using OpenAI GPT-4.1 nano
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
    try {
      // Remove markdown code blocks if present
      let cleanedContent = content.trim();
      
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
      console.error('Raw content:', content);
      console.error('Cleaned content:', cleanedContent);
      const parseError = new Error(`Failed to parse AI response: ${error.message}`);
      parseError.rawContent = content;
      throw parseError;
    }
  }

  /**
   * Clean common JSON formatting issues from AI responses
   */
  cleanJsonResponse(jsonString) {
    let cleaned = jsonString;
    
    // Remove any trailing commas before closing brackets/braces
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix incomplete arrays by removing trailing commas
    cleaned = cleaned.replace(/,(\s*])/g, '$1');
    
    // Fix incomplete objects by removing trailing commas
    cleaned = cleaned.replace(/,(\s*})/g, '$1');
    
    // Remove any incomplete property definitions at the end
    cleaned = cleaned.replace(/,\s*"[^"]*":\s*"[^"]*$/, '');
    
    // Handle duplicate properties within objects - keep only the last occurrence
    cleaned = this.removeDuplicateProperties(cleaned);
    
    // Ensure proper array closing
    if (cleaned.includes('"assets": [') && !cleaned.includes(']')) {
      cleaned = cleaned.replace(/"assets": \[([^]]*)$/, '"assets": [$1]');
    }
    
    return cleaned;
  }

  /**
   * Remove duplicate properties within JSON objects
   */
  removeDuplicateProperties(jsonString) {
    let cleaned = jsonString;
    
    // Handle the specific case where properties are duplicated within the same object
    // This is a simpler approach that focuses on the most common issues
    
    // Remove duplicate property patterns like: "priority": "high", "priority": "medium"
    cleaned = cleaned.replace(/"priority":\s*"[^"]*",\s*"priority":\s*"[^"]*"/g, (match) => {
      // Keep only the last occurrence
      const priorities = match.match(/"priority":\s*"([^"]*)"/g);
      return priorities ? priorities[priorities.length - 1] : match;
    });
    
    // Remove duplicate estimated_cost_range
    cleaned = cleaned.replace(/"estimated_cost_range":\s*"[^"]*",\s*"estimated_cost_range":\s*"[^"]*"/g, (match) => {
      const costs = match.match(/"estimated_cost_range":\s*"([^"]*)"/g);
      return costs ? costs[costs.length - 1] : match;
    });
    
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
                priority: asset.priority || 'medium',
                estimated_cost_range: asset.estimated_cost_range || 'medium',
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
                  priority: asset.priority || 'medium',
                  estimated_cost_range: asset.estimated_cost_range || 'medium',
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
        model: "gpt-4o-mini", // Using GPT-4o-mini (equivalent to 4.1 nano)
        messages: [
          {
            role: "system",
            content: "You are an expert event production manager. Analyze project briefs and identify required assets with detailed specifications. You must respond with ONLY valid JSON - no markdown formatting, no code blocks, no explanations outside the JSON structure. Ensure all JSON arrays and objects are properly closed with correct brackets and braces. Do not include trailing commas. Each property in an object must appear only once - no duplicate properties within the same object."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      // Log the raw response for debugging
      console.log('Raw AI response:', response.choices[0].message.content);

      const aiResponse = this.parseAIResponse(response.choices[0].message.content);
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
   * Build prompt for asset analysis with industry-specific categories and examples
   */
  buildAssetAnalysisPrompt(briefDescription, projectContext) {
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

Project Brief: "${briefDescription}"

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
      "priority": "high|medium|low",
      "estimated_cost_range": "low|medium|high",
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
      priority: 'medium',
      estimated_cost_range: 'medium',
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
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      });

      return {
        healthy: true,
        model: "gpt-4o-mini",
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
