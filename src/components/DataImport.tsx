import { useState } from 'react';
import { Upload, Sheet } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { GoogleSheetsImport } from './GoogleSheetsImport';

interface DataImportProps {
  onDataLoaded: (data: any[], fileName: string) => void;
}

type ImportMethod = 'csv' | 'sheets';

export function DataImport({ onDataLoaded }: DataImportProps) {
  const [activeTab, setActiveTab] = useState<ImportMethod>('csv');

  return (
    <div className="w-full">
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'csv'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload CSV</span>
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'sheets'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sheet className="w-4 h-4" />
            <span>Google Sheets</span>
          </button>
        </div>
      </div>

      <div className="mt-8">
        {activeTab === 'csv' ? (
          <FileUpload onDataLoaded={onDataLoaded} />
        ) : (
          <GoogleSheetsImport onDataLoaded={onDataLoaded} />
        )}
      </div>
    </div>
  );
}
