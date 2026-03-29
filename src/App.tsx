import { useState } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { DataImport } from './components/DataImport';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Sidebar';
import { dataProcessor, ProcessedDataset } from './lib/dataProcessor';

interface LocalDataset {
  id: string;
  name: string;
  created_at: string;
  processedData: ProcessedDataset;
  metadata: { totalResponses: number; totalQuestions: number };
}

function App() {
  const [datasets, setDatasets] = useState<LocalDataset[]>([]);
  const [currentDataset, setCurrentDataset] = useState<LocalDataset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewState, setViewState] = useState<'upload' | 'dashboard'>('upload');

  const handleDataLoaded = async (data: any[], fileName: string) => {
    setIsProcessing(true);
    try {
      // Small delay so spinner shows
      await new Promise(r => setTimeout(r, 50));
      const processed = dataProcessor.processCSVData(data);
      const newDataset: LocalDataset = {
        id: `ds_${Date.now()}`,
        name: fileName,
        created_at: new Date().toISOString(),
        processedData: processed,
        metadata: {
          totalResponses: processed.metadata.totalResponses,
          totalQuestions: processed.metadata.totalQuestions,
        },
      };
      setDatasets(prev => [newDataset, ...prev]);
      setCurrentDataset(newDataset);
      setViewState('dashboard');
    } catch (err) {
      console.error('Error processing data:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectDataset = (id: string) => {
    const ds = datasets.find(d => d.id === id);
    if (ds) { setCurrentDataset(ds); setViewState('dashboard'); }
  };

  const handleDeleteDataset = (id: string) => {
    setDatasets(prev => prev.filter(d => d.id !== id));
    if (currentDataset?.id === id) {
      setCurrentDataset(null);
      setViewState('upload');
    }
  };

  const handleNewDataset = () => {
    setViewState('upload');
    setCurrentDataset(null);
  };

  const handleExport = () => {
    if (!currentDataset) return;
    const report = dataProcessor.generateTextReport(currentDataset.processedData);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${currentDataset.name}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar
        datasets={datasets}
        currentDatasetId={currentDataset?.id || null}
        onSelectDataset={handleSelectDataset}
        onDeleteDataset={handleDeleteDataset}
        onNewDataset={handleNewDataset}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-5">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-500 flex-shrink-0"/>
            <div>
              <h1 className="text-xl font-bold text-gray-100">CSV Intelligence Dashboard</h1>
              <p className="text-xs text-gray-400">Upload any CSV — charts are auto-generated</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4"/>
              <p className="text-gray-300 text-lg">Analyzing your data…</p>
              <p className="text-gray-500 text-sm mt-2">Detecting column types and generating visualizations</p>
            </div>
          ) : viewState === 'upload' ? (
            <div className="max-w-3xl mx-auto py-12">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-100 mb-3">Welcome to CSV Intelligence</h2>
                <p className="text-gray-400">Upload any CSV file and get instant charts, distributions, trends and keyword insights</p>
              </div>
              <DataImport onDataLoaded={handleDataLoaded}/>
            </div>
          ) : currentDataset ? (
            <Dashboard
              processedData={currentDataset.processedData}
              visualizations={currentDataset.processedData.visualizations}
              onExport={handleExport}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default App;
