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
      
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Raw content:', content);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
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
            content: "You are an expert event production manager. Analyze project briefs and identify required assets with detailed specifications. You must respond with ONLY valid JSON - no markdown formatting, no code blocks, no explanations outside the JSON structure."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
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

      return {
        success: false,
        error: error.message,
        fallbackAssets: this.getFallbackAssets(briefDescription)
      };
    }
  }

  /**
   * Suggest optimal suppliers for assets using AI
   * @param {Array} assets - Array of asset objects
   * @param {Array} availableSuppliers - Array of available suppliers
   * @returns {Promise<Object>} AI-generated supplier suggestions
   */
  async suggestSuppliersForAssets(assets, availableSuppliers) {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildSupplierSuggestionPrompt(assets, availableSuppliers);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert supplier relationship manager. Match suppliers to assets based on capabilities, expertise, and optimal allocation. You must respond with ONLY valid JSON - no markdown formatting, no code blocks, no explanations outside the JSON structure."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2500
      });

      // Log the raw response for debugging
      console.log('Raw AI response:', response.choices[0].message.content);

      const aiResponse = this.parseAIResponse(response.choices[0].message.content);
      const processingTime = Date.now() - startTime;

      await this.logAIProcessing('supplier_matching', {
        assets,
        availableSuppliers: availableSuppliers.map(s => ({ id: s.id, name: s.supplier_name, categories: s.service_categories }))
      }, aiResponse, processingTime, true);

      return {
        success: true,
        allocations: aiResponse.allocations,
        reasoning: aiResponse.reasoning,
        confidence: aiResponse.confidence,
        processingTime
      };

    } catch (error) {
      console.error('AI supplier suggestion failed:', error);
      const processingTime = Date.now() - startTime;
      
      await this.logAIProcessing('supplier_matching', {
        assets,
        availableSuppliers: availableSuppliers.map(s => ({ id: s.id, name: s.supplier_name, categories: s.service_categories }))
      }, null, processingTime, false, error.message);

      return {
        success: false,
        error: error.message,
        fallbackAllocations: this.getFallbackSupplierAllocations(assets, availableSuppliers)
      };
    }
  }

  /**
   * Complete AI allocation for a project
   * @param {string} projectId - Project ID
   * @param {string} briefDescription - Project brief
   * @param {Object} projectContext - Additional context
   * @returns {Promise<Object>} Complete AI allocation result
   */
  async performCompleteAllocation(projectId, briefDescription, projectContext = {}) {
    const startTime = Date.now();
    
    try {
      // Step 1: Analyze brief for assets
      const assetAnalysis = await this.analyzeBriefForAssets(briefDescription, projectContext);
      
      if (!assetAnalysis.success) {
        throw new Error(`Asset analysis failed: ${assetAnalysis.error}`);
      }

      // Step 2: Get available suppliers
      const { data: suppliers, error: supplierError } = await supabase
        .from('suppliers')
        .select('*');

      if (supplierError || !suppliers) {
        throw new Error('Failed to fetch suppliers');
      }

      // Step 3: Suggest supplier allocations
      const supplierSuggestions = await this.suggestSuppliersForAssets(assetAnalysis.assets, suppliers);
      
      if (!supplierSuggestions.success) {
        throw new Error(`Supplier suggestion failed: ${supplierSuggestions.error}`);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        projectId,
        assets: assetAnalysis.assets,
        allocations: supplierSuggestions.allocations,
        reasoning: {
          assetReasoning: assetAnalysis.reasoning,
          allocationReasoning: supplierSuggestions.reasoning
        },
        confidence: Math.min(assetAnalysis.confidence, supplierSuggestions.confidence),
        processingTime
      };

    } catch (error) {
      console.error('Complete AI allocation failed:', error);
      const processingTime = Date.now() - startTime;
      
      await this.logAIProcessing('allocation', {
        projectId,
        briefDescription,
        projectContext
      }, null, processingTime, false, error.message);

      return {
        success: false,
        error: error.message,
        processingTime
      };
    }
  }

  /**
   * Build prompt for asset analysis
   */
  buildAssetAnalysisPrompt(briefDescription, projectContext) {
    return `
Analyze this event/project brief and identify all required assets with detailed specifications.

Project Brief: "${briefDescription}"

Additional Context:
- Budget: ${projectContext.financial_parameters || 'Not specified'}
- Timeline: ${projectContext.timeline_deadline || 'Not specified'}
- Physical Parameters: ${projectContext.physical_parameters || 'Not specified'}

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "assets": [
    {
      "asset_name": "Asset Name",
      "specifications": "Detailed specifications and requirements",
      "priority": "high|medium|low",
      "estimated_cost_range": "low|medium|high"
    }
  ],
  "reasoning": "Explanation of why these assets were identified",
  "confidence": 0.85
}

Focus on identifying:
- Production equipment (audio, lighting, staging)
- Marketing materials (printing, graphics, banners)
- Services (catering, transport, security)
- Design and creative assets
- Logistics and support services

Be specific and practical in your asset identification.
`;
  }

  /**
   * Build prompt for supplier suggestions
   */
  buildSupplierSuggestionPrompt(assets, suppliers) {
    const supplierInfo = suppliers.map(s => ({
      id: s.id,
      name: s.supplier_name,
      categories: s.service_categories,
      email: s.contact_email
    })).join('\n');

    const assetInfo = assets.map(a => ({
      name: a.asset_name,
      specifications: a.specifications,
      priority: a.priority
    })).join('\n');

    return `
Match suppliers to assets for optimal allocation.

Assets to allocate:
${assetInfo}

Available Suppliers:
${supplierInfo}

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "allocations": [
    {
      "asset_name": "Asset Name",
      "recommended_supplier_id": "supplier-uuid",
      "recommended_supplier_name": "Supplier Name",
      "confidence": 0.9,
      "reasoning": "Why this supplier is recommended"
    }
  ],
  "reasoning": "Overall allocation strategy explanation",
  "confidence": 0.85
}

Consider:
- Supplier expertise and service categories
- Asset requirements and specifications
- Optimal distribution of work
- Supplier capacity and availability
- Cost-effectiveness
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
      estimated_cost_range: 'medium'
    }));
  }

  /**
   * Get fallback supplier allocations
   */
  getFallbackSupplierAllocations(assets, suppliers) {
    const allocations = [];
    
    for (const asset of assets) {
      // Find suppliers that match asset categories
      const matchingSuppliers = suppliers.filter(supplier => 
        supplier.service_categories.some(category => 
          category.toLowerCase().includes(asset.asset_name.toLowerCase()) ||
          asset.asset_name.toLowerCase().includes(category.toLowerCase())
        )
      );

      if (matchingSuppliers.length > 0) {
        allocations.push({
          asset_name: asset.asset_name,
          recommended_supplier_id: matchingSuppliers[0].id,
          recommended_supplier_name: matchingSuppliers[0].supplier_name,
          confidence: 0.6,
          reasoning: 'Fallback matching based on service categories'
        });
      }
    }

    return allocations;
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
