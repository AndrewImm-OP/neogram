import axios from 'axios';
import fs from 'fs';

/**
 * Client for the OnlySQ API - text and image generation.
 * Get API key at https://my.onlysq.ru/
 */
export class OnlySQ {
  /**
   * @param {Object} [options]
   * @param {string} [options.apiKey='openai'] - API key for OnlySQ
   */
  constructor(options = {}) {
    this.apiKey = typeof options === 'string' ? options : (options.apiKey || 'openai');
    this._baseUrl = 'https://api.onlysq.ru';
  }

  /**
   * Get and filter available models.
   * @param {Object} [options]
   * @param {string|string[]} [options.modality] - 'text', 'image', or array
   * @param {boolean} [options.can_tools] - Filter by tool support
   * @param {boolean} [options.can_think] - Filter by thinking mode support
   * @param {boolean} [options.can_stream] - Filter by streaming support
   * @param {string} [options.status] - Filter by status ('work', 'beta', etc.)
   * @param {number} [options.max_cost] - Maximum cost filter
   * @param {boolean} [options.return_names=false] - Return readable names instead of keys
   * @returns {Promise<string[]>}
   */
  async getModels(options = {}) {
    try {
      const response = await axios.get(`${this._baseUrl}/ai/models`, { timeout: 15000 });
      const data = response.data;
      const filtered = [];

      for (const [modelKey, modelData] of Object.entries(data.models || {})) {
        if (options.modality !== undefined) {
          const modalities = Array.isArray(options.modality) ? options.modality : [options.modality];
          if (!modalities.includes(modelData.modality)) continue;
        }
        if (options.can_tools !== undefined && (modelData['can-tools'] || false) !== options.can_tools) continue;
        if (options.can_think !== undefined && (modelData['can-think'] || false) !== options.can_think) continue;
        if (options.can_stream !== undefined && (modelData['can-stream'] || false) !== options.can_stream) continue;
        if (options.status !== undefined && (modelData.status || '') !== options.status) continue;
        if (options.max_cost !== undefined) {
          const cost = parseFloat(modelData.cost);
          if (isNaN(cost) || cost > options.max_cost) continue;
        }
        filtered.push(options.return_names ? (modelData.name || modelKey) : modelKey);
      }
      return filtered;
    } catch (error) {
      console.error(`OnlySQ.getModels: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate a text answer.
   * @param {string} [model='gpt-5.2-chat'] - Model key
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @returns {Promise<string>}
   */
  async generateAnswer(model = 'gpt-5.2-chat', messages = []) {
    if (!messages || !messages.length) {
      throw new Error('OnlySQ.generateAnswer: messages is required');
    }
    try {
      const payload = { model, request: { messages } };
      const response = await axios.post(`${this._baseUrl}/ai/v2`, payload, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 60000,
      });
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error(`OnlySQ.generateAnswer: ${error.message}`);
      return `Error: ${error.message}`;
    }
  }

  /**
   * Generate an image and save to file.
   * @param {string} [model='flux'] - Model key
   * @param {string} prompt - Image description
   * @param {string} [ratio='16:9'] - Aspect ratio
   * @param {string} [filename='image.png'] - Output file path
   * @returns {Promise<boolean>}
   */
  async generateImage(model = 'flux', prompt = '', ratio = '16:9', filename = 'image.png') {
    if (!prompt) {
      throw new Error('OnlySQ.generateImage: prompt is required');
    }
    try {
      const payload = { model, prompt, ratio };
      const response = await axios.post(`${this._baseUrl}/ai/imagen`, payload, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 120000,
      });
      if (response.status === 200) {
        const files = response.data.files || [];
        if (!files.length) return false;
        const imgBuffer = Buffer.from(files[0], 'base64');
        fs.writeFileSync(filename, imgBuffer);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`OnlySQ.generateImage: ${error.message}`);
      return false;
    }
  }
}
