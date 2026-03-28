import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { parseCSVFile, validateCSVData } from '../lib/csvParser';

interface FileUploadProps {
  onDataLoaded: (data: any[], fileName: string) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await parseCSVFile(file);

      if (result.errors.length > 0) {
        setError(`Error parsing CSV: ${result.errors[0].message}`);
        setIsProcessing(false);
        return;
      }

      const validation = validateCSVData(result.data);
      if (!validation.valid) {
        setError(validation.error || 'Invalid CSV data');
        setIsProcessing(false);
        return;
      }

      onDataLoaded(result.data, file.name);
      setIsProcessing(false);
    } catch (err) {
      setError(`Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-300 text-lg">Processing your file...</p>
            </>
          ) : (
            <>
              <Upload className="w-16 h-16 text-gray-400" />
              <div>
                <p className="text-xl text-gray-200 mb-2">Upload CSV File</p>
                <p className="text-sm text-gray-400">
                  Drag and drop your CSV file here, or click to browse
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>Supports Google Forms exports and any CSV dataset</span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-200 mb-2">Supported Features:</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Automatic question type detection</li>
          <li>• Before/after pattern recognition</li>
          <li>• Dynamic insight generation</li>
          <li>• Text analysis and keyword extraction</li>
          <li>• Adaptive visualizations</li>
        </ul>
      </div>
    </div>
  );
}
