import axios from 'axios';
import FormData from 'form-data';

/**
 * Client for OpenAI-compatible APIs.
 * Also exported as 'OpenAI' (alias).
 */
export class ChatGPT {
  /**
   * @param {string} url - Base API URL (without /chat/completions)
   * @param {Object} headers - HTTP headers (e.g. { Authorization: 'Bearer KEY' })
   */
  constructor(url, headers = {}) {
    this.url = url.replace(/\/+$/, '');
    this.headers = headers;
    this._client = axios.create({
      baseURL: this.url,
      headers,
      timeout: 120000,
    });
  }

  async _makeRequest(method, endpoint, data = null, files = null) {
    const url = endpoint.replace(/^\//, '');
    try {
      if (files) {
        const form = new FormData();
        for (const [key, value] of Object.entries(files)) {
          form.append(key, value);
        }
        if (data) {
          for (const [key, value] of Object.entries(data)) {
            if (value !== undefined && value !== null) form.append(key, String(value));
          }
        }
        const response = await this._client.request({
          method, url, data: form, headers: form.getHeaders(),
        });
        return response.data;
      } else {
        const response = await this._client.request({ method, url, data });
        return response.data;
      }
    } catch (error) {
      console.error(`ChatGPT(${endpoint}): ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Generate chat completion.
   */
  async generateChatCompletion(model, messages, temperature = null, max_tokens = null, stream = false, kwargs = {}) {
    const data = { model, messages, stream, ...kwargs };
    if (temperature !== null) data.temperature = temperature;
    if (max_tokens !== null) data.max_tokens = max_tokens;
    return this._makeRequest('POST', 'chat/completions', data);
  }

  /**
   * Generate image.
   */
  async generateImage(prompt, n = 1, size = '1024x1024', response_format = 'url', kwargs = {}) {
    return this._makeRequest('POST', 'images/generations', { prompt, n, size, response_format, ...kwargs });
  }

  /**
   * Generate embedding vector.
   */
  async generateEmbedding(model, input_data, user = null, kwargs = {}) {
    const data = { model, input: input_data, ...kwargs };
    if (user) data.user = user;
    return this._makeRequest('POST', 'embeddings', data);
  }

  /**
   * Transcribe audio (Whisper).
   */
  async generateTranscription(file, model, language = null, prompt = null, response_format = 'json', temperature = 0, kwargs = {}) {
    const data = { model, response_format, temperature: String(temperature), ...kwargs };
    if (language) data.language = language;
    if (prompt) data.prompt = prompt;
    return this._makeRequest('POST', 'audio/transcriptions', data, { file });
  }

  /**
   * Translate audio to text.
   */
  async generateTranslation(file, model, prompt = null, response_format = 'json', temperature = 0, kwargs = {}) {
    const data = { model, response_format, temperature: String(temperature), ...kwargs };
    if (prompt) data.prompt = prompt;
    return this._makeRequest('POST', 'audio/translations', data, { file });
  }

  /**
   * List available models.
   */
  async getModels() {
    return this._makeRequest('GET', 'models');
  }
}

// Alias
export const OpenAI = ChatGPT;
