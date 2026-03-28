import { useState } from 'react';
import { Sheet, AlertCircle, ExternalLink } from 'lucide-react';
import { parseCSVText } from '../lib/csvParser';

interface GoogleSheetsImportProps {
  onDataLoaded: (data: any[], fileName: string) => void;
}

export function GoogleSheetsImport({ onDataLoaded }: GoogleSheetsImportProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractSheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleImport = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const sheetId = extractSheetId(url);
      if (!sheetId) {
        setError('Invalid Google Sheets URL. Please provide a valid URL.');
        setIsLoading(false);
        return;
      }

      const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      const response = await fetch(csvExportUrl);

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          setError(
            'Unable to access the spreadsheet. Please make sure the sheet is publicly accessible (Anyone with the link can view).'
          );
        } else {
          setError(`Failed to fetch data: ${response.statusText}`);
        }
        setIsLoading(false);
        return;
      }

      const csvText = await response.text();
      const result = parseCSVText(csvText);

      if (result.data.length === 0) {
        setError('No data found in the spreadsheet.');
        setIsLoading(false);
        return;
      }

      onDataLoaded(result.data, `Google Sheet ${sheetId}`);
      setUrl('');
      setIsLoading(false);
    } catch (err) {
      setError(`Error importing data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <Sheet className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-semibold text-gray-100">Import from Google Sheets</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Google Sheets URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleImport}
            disabled={!url || isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                <span>Import Data</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-200 mb-2">How to use:</h4>
          <ol className="text-sm text-blue-300 space-y-2 list-decimal list-inside">
            <li>Open your Google Sheet</li>
            <li>
              Click <span className="font-medium">Share</span> and set to{' '}
              <span className="font-medium">Anyone with the link can view</span>
            </li>
            <li>Copy the URL from your browser</li>
            <li>Paste it above and click Import Data</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
