import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { candidateApi } from '../api/client.js';
import { Card, Button, Badge, Alert, LoadingSpinner } from '../components/UI.jsx';

export const ResumeUploadPage = () => {
  const { candidate, email, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const currentResume = candidate?.resume;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setErrorMsg('');
    const validTypes = ['application/pdf', 'text/plain'];
    const isTxtExt = file.name.endsWith('.txt');
    const isPdfExt = file.name.endsWith('.pdf');

    if (!validTypes.includes(file.type) && !isTxtExt && !isPdfExt) {
      setErrorMsg('Invalid file format. Only PDF and plain-text (.txt) resumes are supported.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 5MB ceiling. Please upload a smaller file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setErrorMsg('');
    setUploadResult(null);

    try {
      const res = await candidateApi.uploadResume(email, selectedFile);
      console.log('UPLOAD_RESPONSE:', res);
      setUploadResult(res?.data || res);
      await refreshProfile();
      setSelectedFile(null);
    } catch (err) {
      console.error('UPLOAD_ERROR:', err.message);
      setErrorMsg(err.message || 'Resume upload and parsing failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" /> Resume Intelligence & Parsing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Securely upload your resume. Text is extracted in RAM and stored directly in MongoDB without public disk persistence.
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <Badge variant={currentResume?.extractedText ? 'success' : 'warning'}>
            {currentResume?.extractedText ? 'Resume Active' : 'No Resume'}
          </Badge>
        </div>
      </div>

      {errorMsg && <Alert type="danger" message={errorMsg} />}

      {/* Upload Box */}
      <Card>
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-sm font-semibold text-white mb-1">
            {selectedFile ? selectedFile.name : 'Click to select or drag and drop your resume'}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Supports text-based PDF and plain-text (.txt) up to 5MB.
          </p>

          {selectedFile && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-200 font-medium">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>{(selectedFile.size / 1024).toFixed(1)} KB ready for upload</span>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedFile(null)}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleUpload}
              isLoading={uploading}
              icon={UploadCloud}
              className="w-full sm:w-auto"
            >
              Upload & Extract Resume Text
            </Button>
          </div>
        )}
      </Card>

      {/* Fresh Upload Confirmation */}
      {uploadResult && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-emerald-200">
                  Resume Parsed & Persisted Successfully!
                </h4>
                <Link to="/analysis" className="w-full sm:w-auto">
                  <Button size="sm" variant="success" icon={ArrowRight} className="w-full sm:w-auto">
                    Run Skill Gap Analysis
                  </Button>
                </Link>
              </div>
              <div className="text-xs text-slate-300">
                Extracted <span className="font-semibold text-white">{uploadResult.parsedMeta?.wordCount}</span> words
                across <span className="font-semibold text-white">{uploadResult.parsedMeta?.charCount}</span> characters.
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono italic break-words">
                "{uploadResult.textPreview}"
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Existing Active Resume Display */}
      {currentResume?.extractedText && (
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Active Resume Document in MongoDB
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Original filename: <span className="text-slate-200 font-medium">{currentResume.originalName}</span> (
                {(currentResume.sizeBytes / 1024).toFixed(1)} KB)
              </p>
            </div>
            <Link to="/analysis">
              <Button size="sm" icon={ArrowRight}>
                Analyze Against Job
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
              <div>
                Word Count:{' '}
                <span className="font-semibold text-slate-200">
                  {currentResume.parsedMeta?.wordCount || 0}
                </span>
              </div>
              <div>
                Character Count:{' '}
                <span className="font-semibold text-slate-200">
                  {currentResume.parsedMeta?.charCount || 0}
                </span>
              </div>
              <div>
                MIME Type:{' '}
                <span className="font-semibold text-slate-200">{currentResume.mimeType}</span>
              </div>
            </div>

            <div className="relative">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Extracted Resume Plain Text Preview
              </div>
              <div className="max-h-60 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {currentResume.extractedText}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Security Architecture Note */}
      <div className="border border-slate-800/80 bg-slate-900/30 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-400">
        <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200 block mb-0.5">Zero Public File Serving Protection</span>
          Files are processed in ephemeral server RAM via Multer MemoryStorage. Extracted text is stored in MongoDB,
          preventing public directory traversal, executable malware execution, or unrestricted document downloads.
        </div>
      </div>
    </div>
  );
};

