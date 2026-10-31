/**
 * resumeParser.js
 *
 * Extracts plain text from an uploaded resume buffer.
 *
 * Supported types:
 *   - application/pdf  → PDFParse (pdf-parse v2, free, local, no external API)
 *   - text/plain       → buffer.toString()
 *
 * Design principles:
 *   - Zero network calls — all parsing is local.
 *   - Never fabricate content; throws if extraction yields nothing meaningful.
 *   - Always cleans up parser resources via parser.destroy().
 */

import { PDFParse } from "pdf-parse";

const MIN_CONTENT_LENGTH = 20; // characters — guards against blank / image-only PDFs

/**
 * @param {Buffer} buffer     Raw file buffer from multer memoryStorage
 * @param {string} mimeType   MIME type of the uploaded file
 * @returns {Promise<{ text: string, wordCount: number, charCount: number, extractedAt: Date }>}
 */
export const extractTextFromBuffer = async (buffer, mimeType) => {
  let rawText = "";

  if (mimeType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      rawText = result.text || "";
    } finally {
      await parser.destroy();
    }
  } else if (mimeType === "text/plain") {
    rawText = buffer.toString("utf-8");
  } else {
    throw new Error(`Unsupported file type: ${mimeType}. Upload a PDF or plain-text file.`);
  }

  // Normalise whitespace: collapse runs of whitespace/newlines to a single space.
  const text = rawText.replace(/\s+/g, " ").trim();

  if (text.length < MIN_CONTENT_LENGTH) {
    throw new Error(
      "Resume appears to be empty or contains no extractable text (e.g. scanned image). " +
      "Please upload a text-based PDF or a .txt file."
    );
  }

  const words = text.split(/\s+/).filter(Boolean);

  return {
    text,
    wordCount:   words.length,
    charCount:   text.length,
    extractedAt: new Date(),
  };
};
