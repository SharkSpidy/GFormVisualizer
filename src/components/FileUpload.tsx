import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseCSVFile, validateCSVData } from '../lib/csvParser';

interface FileUploadProps {
  onDataLoaded: (data: any[], fileName: string) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewInfo, setPreviewInfo] = useState<{ rows: number; cols: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setPreviewInfo(null);
    try {
      const result = await parseCSVFile(file);
      if (result.errors.length > 0) {
        setError(`CSV parse error: ${result.errors[0].message}`);
        return;
      }
      const validation = validateCSVData(result.data);
      if (!validation.valid) {
        setError(validation.error || 'Invalid CSV');
        return;
      }
      setPreviewInfo({ rows: result.data.length, cols: Object.keys(result.data[0] || {}).length, name: file.name });
      onDataLoaded(result.data, file.name);
    } catch (err) {
      setError(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if(f) handleFile(f); }}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`relative border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500 bg-gray-800/40'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input ref={fileInputRef} type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f); }} className="hidden"/>
        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
              <p className="text-gray-300">Reading file…</p>
            </>
          ) : previewInfo ? (
            <>
              <CheckCircle2 className="w-14 h-14 text-green-500"/>
              <p className="text-gray-200 font-medium">{previewInfo.name}</p>
              <p className="text-sm text-gray-400">{previewInfo.rows.toLocaleString()} rows × {previewInfo.cols} columns</p>
            </>
          ) : (
            <>
              <Upload className="w-14 h-14 text-gray-400"/>
              <div>
                <p className="text-xl text-gray-200 mb-1">Drop your CSV here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FileText className="w-4 h-4"/>
                <span>Any CSV — sales data, surveys, analytics, or any structured data</span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"/>
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="mt-5 p-4 bg-gray-800/40 rounded-xl border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">What gets auto-detected:</h3>
        <div className="grid grid-cols-2 gap-1 text-sm text-gray-400">
          <span>• Numeric columns → histograms</span>
          <span>• Categorical → pie / bar charts</span>
          <span>• Date columns → trend lines</span>
          <span>• Text columns → keyword charts</span>
          <span>• Multi-numeric → scatter plots</span>
          <span>• Cat × Numeric → grouped bars</span>
        </div>
      </div>
    </div>
  );
}
