/**
 * upload.js — Multer configuration for resume uploads.
 *
 * Security decisions:
 *  - memoryStorage: files are held in RAM as a Buffer; never written to disk.
 *    The Buffer is parsed immediately and the extracted text is stored in MongoDB.
 *    This eliminates directory-traversal and unrestricted file-serve risks.
 *  - Strict MIME allowlist: only PDF and plain-text accepted.
 *  - 5 MB hard ceiling — sufficient for any realistic resume.
 *  - Single-file-only (`upload.single`): prevents multi-file flooding.
 */

import multer from "multer";

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "text/plain"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type "${file.mimetype}". Only PDF and plain-text (.txt) files are accepted.`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

export default upload;

