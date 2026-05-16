import fs from 'fs';
import path from 'path';

/**
 * Represents a file to be uploaded to Telegram.
 * Accepts: file path (string), Buffer, ReadableStream, or URL string.
 */
export class InputFile {
  /**
   * @param {string|Buffer|ReadableStream} source - File path, buffer, or stream
   * @param {string} [filename] - Override filename
   */
  constructor(source, filename = null) {
    this.source = source;
    if (!filename && typeof source === 'string' && !source.startsWith('http')) {
      filename = path.basename(source);
    }
    this.filename = filename || 'file';
  }

  /**
   * Opens the file and returns [filename, stream/buffer] tuple for upload.
   * @returns {[string, ReadableStream|Buffer]}
   */
  open() {
    if (typeof this.source === 'string') {
      if (this.source.startsWith('http://') || this.source.startsWith('https://')) {
        return [this.filename, this.source];
      }
      return [this.filename, fs.createReadStream(this.source)];
    }
    if (Buffer.isBuffer(this.source)) {
      return [this.filename, this.source];
    }
    // ReadableStream or file-like object
    return [this.filename, this.source];
  }

  /**
   * Check if a value is a file-like object that needs multipart upload.
   * @param {*} value
   * @returns {boolean}
   */
  static isFileLike(value) {
    if (value instanceof InputFile) return true;
    if (Buffer.isBuffer(value)) return true;
    if (value && typeof value === 'object' && typeof value.pipe === 'function') return true;
    if (value && typeof value === 'object' && typeof value.read === 'function') return true;
    return false;
  }
}
