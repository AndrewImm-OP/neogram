import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import crypto from 'crypto';

/**
 * Utility toolkit: translation, URL shortening, AI queries, base64, background tasks.
 */
export class Deef {
  /**
   * Translate text via Google Translate.
   * @param {string} text - Text to translate
   * @param {string} [lang='en'] - Target language code
   * @returns {Promise<string>}
   */
  async translate(text, lang = 'en') {
    if (!text) return text || '';
    try {
      const url = `https://translate.google.com/m?tl=${lang}&sl=auto&q=${encodeURIComponent(text)}`;
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      const result = $('div.result-container').text();
      return result || text;
    } catch (error) {
      console.warn(`Deef.translate: ${error.message}`);
      return text;
    }
  }

  /**
   * Shorten a URL via clck.ru.
   * @param {string} longUrl - URL to shorten
   * @returns {Promise<string>}
   */
  async shortUrl(longUrl) {
    if (!longUrl) return longUrl || '';
    try {
      const response = await axios.get(`https://clck.ru/--?url=${encodeURIComponent(longUrl)}`, { timeout: 10000 });
      return response.data.trim();
    } catch (error) {
      console.warn(`Deef.shortUrl: ${error.message}`);
      return longUrl;
    }
  }

  /**
   * Run a function asynchronously in background (fire-and-forget).
   * @param {Function} func - Async or sync function
   * @param {...*} args - Arguments to pass
   */
  runInBg(func, ...args) {
    Promise.resolve().then(() => func(...args)).catch(error => {
      console.error(`Deef.runInBg(${func.name || '?'}): ${error.message}`);
    });
  }

  /**
   * Encode a file to base64.
   * @param {string} filePath - Path to file
   * @returns {string|null}
   */
  encodeBase64(filePath) {
    if (!filePath) throw new Error('Deef.encodeBase64: path is required');
    try {
      const data = fs.readFileSync(filePath);
      return data.toString('base64');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error(`Deef.encodeBase64: file not found: ${filePath}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Query Perplexity AI (free tier, no API key needed).
   * @param {string} prompt - Question text
   * @param {string} [model='auto'] - Model name
   * @returns {Promise<{text: string, urls: string[]}>}
   */
  async perplexityAsk(prompt, model = 'auto') {
    const ERROR_RESULT = { text: 'Error', urls: [] };
    const BASE_URL = 'https://www.perplexity.ai';
    const MODE_API_MAP = {
      search: 'copilot', research: 'research', agentic_research: 'agentic_research',
      studio: 'studio', study: 'study', document_review: 'document_review',
      browser_agent: 'browser_agent', asi: 'asi',
    };

    if (!prompt) throw new Error('perplexityAsk: prompt is required');

    try {
      // Fetch model config
      let configJson = {};
      try {
        const configResp = await axios.get(`${BASE_URL}/rest/models/config`, {
          params: { config_schema: 'v1', version: '2.18', source: 'default' },
          timeout: 15000,
          headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36' },
        });
        configJson = configResp.data || {};
      } catch { /* ignore */ }

      const modelsMap = configJson.models || {};
      const defaultModels = configJson.default_models || {};
      const availableModels = Object.keys(modelsMap);

      const resolveMode = (modelName) => {
        const info = modelsMap[modelName] || {};
        return MODE_API_MAP[info.mode || 'search'] || 'copilot';
      };

      if (!availableModels.includes(model)) {
        model = defaultModels.search || (availableModels[0] || 'turbo');
      }

      let apiMode = resolveMode(model);
      const frontendUid = crypto.randomUUID();
      const frontendContextUuid = crypto.randomUUID();
      const visitorId = crypto.randomUUID();

      // Get session
      let userId = null;
      try {
        const sessResp = await axios.get(`${BASE_URL}/api/auth/session`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36',
          },
        });
        userId = sessResp.data?.user?.id || null;
      } catch { /* ignore */ }

      if (model === 'auto') {
        model = userId ? 'pplx_pro' : (defaultModels.search || 'turbo');
        apiMode = resolveMode(model);
      }

      const payload = {
        params: {
          attachments: [], language: 'en-US', timezone: 'America/New_York',
          followup_source: 'link', search_focus: 'internet', source: 'default',
          sources: ['edgar', 'social', 'web', 'scholar'],
          frontend_uuid: frontendUid, mode: apiMode, model_preference: model,
          visitor_id: visitorId, frontend_context_uuid: frontendContextUuid,
          prompt_source: 'user', query_source: 'followup', use_schematized_api: true,
          supported_block_use_cases: [
            'answer_modes', 'media_items', 'knowledge_cards', 'inline_entity_cards',
            'place_widgets', 'finance_widgets', 'prediction_market_widgets',
            'sports_widgets', 'flight_status_widgets', 'news_widgets', 'shopping_widgets',
            'jobs_widgets', 'search_result_widgets', 'inline_images', 'inline_assets',
            'placeholder_cards', 'diff_blocks', 'inline_knowledge_cards', 'entity_group_v2',
            'refinement_filters', 'canvas_mode', 'maps_preview', 'answer_tabs',
            'price_comparison_widgets', 'preserve_latex', 'generic_onboarding_widgets',
            'in_context_suggestions',
          ],
          version: '2.18',
        },
        query_str: prompt,
      };

      const response = await axios.post(`${BASE_URL}/rest/sse/perplexity_ask`, payload, {
        timeout: 300000,
        headers: {
          'accept': 'text/event-stream',
          'content-type': 'application/json',
          'origin': BASE_URL,
          'referer': `${BASE_URL}/`,
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36',
          'x-perplexity-request-reason': 'perplexity-query-state-provider',
        },
        responseType: 'text',
      });

      if (response.status >= 400) return ERROR_RESULT;

      let fullText = '';
      const urls = [];
      const content = typeof response.data === 'string' ? response.data : String(response.data);

      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.substring(6);
        if (!dataStr || dataStr === '[DONE]') continue;

        let jsonData;
        try { jsonData = JSON.parse(dataStr); } catch { continue; }

        for (const block of (jsonData.blocks || [])) {
          const usage = block.intended_usage || '';
          if (usage === 'sources_answer_mode') {
            const webResults = block.sources_mode_block?.web_results || [];
            for (const wr of webResults) {
              if (wr.url && !urls.includes(wr.url)) urls.push(wr.url);
            }
            continue;
          }
          if (usage !== 'ask_text_0_markdown') continue;
          const diffBlock = block.diff_block || {};
          if (diffBlock.field !== 'markdown_block') continue;
          for (const patch of (diffBlock.patches || [])) {
            const value = patch.value;
            if (value && typeof value === 'object' && value.chunks) {
              const text = (value.chunks || []).join('');
              if (text && text.length > fullText.length) fullText = text;
            } else if (patch.op === 'add' && typeof value === 'string' && value) {
              fullText += value;
            }
          }
        }
      }

      return { text: fullText || 'Error', urls };
    } catch (error) {
      console.error(`Deef.perplexityAsk: ${error.message}`);
      return ERROR_RESULT;
    }
  }

  /**
   * Generate a response using Toolbaz AI.
   * Models: gemini-3-flash, deepseek-v3.1, gpt-5.2, claude-sonnet-4, toolbaz-v4.5-fast, etc.
   * @param {string} prompt - Text prompt
   * @param {string} [model='toolbaz-v4.5-fast'] - Model name
   * @returns {Promise<string>}
   */
  async toolchat(prompt, model = 'toolbaz-v4.5-fast') {
    if (!prompt) throw new Error('Deef.toolchat: prompt is required');
    try {
      const HEADERS = {
        'accept': '*/*',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://toolbaz.com',
        'referer': 'https://toolbaz.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/134.0.0.0 Safari/537.36',
      };

      const randomStr = (len) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      };

      const createToken = () => {
        const data = {
          bR6wF: {
            nV5kP: HEADERS['user-agent'], lQ9jX: 'ru-RU', sD2zR: '1920x1080',
            tY4hL: 'Europe/Moscow', pL8mC: 'Win32', cQ3vD: 24, hK7jN: 8,
          },
          uT4bX: {
            mM9wZ: Array.from({ length: 20 }, () => ({ x: Math.floor(Math.random() * 1920), y: Math.floor(Math.random() * 1080) })),
            kP8jY: Array.from({ length: 10 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))),
          },
          tuTcS: Math.floor(Date.now() / 1000),
          tDfxy: -7,
          RtyJt: randomStr(36),
          extra: { random_str: randomStr(50), timestamp: new Date().toISOString(), version: '1.0.0' },
        };
        return randomStr(6) + Buffer.from(JSON.stringify(data)).toString('base64');
      };

      const sessionId = 'ERfvMHDEY5Fo1TTJu1W7hIZSA9dHcVyJCb5m';

      // Get token
      const tokenResp = await axios.post('https://data.toolbaz.com/token.php',
        new URLSearchParams({ session_id: sessionId, token: createToken() }).toString(),
        { headers: { ...HEADERS, Cookie: `SessionID=${sessionId}` }, timeout: 30000 }
      );

      if (!tokenResp.data?.token) return 'Error';

      // Generate response
      const resp = await axios.post('https://data.toolbaz.com/writing.php',
        new URLSearchParams({ text: prompt, capcha: tokenResp.data.token, model, session_id: sessionId }).toString(),
        { headers: { ...HEADERS, Cookie: `SessionID=${sessionId}` }, timeout: 60000 }
      );

      return resp.status === 200 ? resp.data : 'Error';
    } catch (error) {
      console.error(`Deef.toolchat: ${error.message}`);
      return 'Error';
    }
  }
}
