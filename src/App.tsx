import { useState, useEffect } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { DataImport } from './components/DataImport';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Sidebar';
import { dataProcessor, ProcessedDataset } from './lib/dataProcessor';
import { supabase, Dataset } from './lib/supabase';

type ViewState = 'upload' | 'dashboard';

function App() {
  const [viewState, setViewState] = useState<ViewState>('upload');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedDataset | null>(null);
  const [visualizations, setVisualizations] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      loadDatasets();
    }
  }, [isAuthenticated, userId]);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setIsAuthenticated(true);
      setUserId(data.session.user.id);
    } else {
      await signInAnonymously();
    }
  };

  const signInAnonymously = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (!error && data.user) {
      setIsAuthenticated(true);
      setUserId(data.user.id);
    } else {
      console.error("Auth error:", error);
    }
  };

  const loadDatasets = async () => {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDatasets(data);
    }
  };

  const handleDataLoaded = async (data: any[], fileName: string) => {
    if (!userId) return;

    setIsProcessing(true);

    try {
      const processed = dataProcessor.processCSVData(data);
      const vizConfig = dataProcessor.generateVisualizationConfig(processed);

      const { data: newDataset, error } = await supabase
        .from('datasets')
        .insert({
          user_id: userId,
          name: fileName,
          source_type: 'csv',
          raw_data: data,
          processed_data: processed,
          metadata: processed.metadata
        })
        .select()
        .single();

      if (!error && newDataset) {
        await supabase.from('analyses').insert({
          dataset_id: newDataset.id,
          analysis_type: 'automatic',
          results: processed.insights,
          visualizations: vizConfig
        });

        setCurrentDataset(newDataset);
        setProcessedData(processed);
        setVisualizations(vizConfig);
        setViewState('dashboard');
        await loadDatasets();
      }
    } catch (err) {
      console.error('Error processing data:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectDataset = async (id: string) => {
    const dataset = datasets.find((d) => d.id === id);
    if (!dataset) return;

    setCurrentDataset(dataset);
    setProcessedData(dataset.processed_data);

    const { data: analyses } = await supabase
      .from('analyses')
      .select('*')
      .eq('dataset_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analyses) {
      setVisualizations(analyses.visualizations || []);
    }

    setViewState('dashboard');
  };

  const handleDeleteDataset = async (id: string) => {
    await supabase.from('datasets').delete().eq('id', id);
    await loadDatasets();

    if (currentDataset?.id === id) {
      setCurrentDataset(null);
      setProcessedData(null);
      setVisualizations([]);
      setViewState('upload');
    }
  };

  const handleNewDataset = () => {
    setViewState('upload');
    setCurrentDataset(null);
    setProcessedData(null);
    setVisualizations([]);
  };

  const handleExport = () => {
    if (!processedData) return;

    const report = dataProcessor.generateTextReport(processedData);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar
        datasets={datasets}
        currentDatasetId={currentDataset?.id || null}
        onSelectDataset={handleSelectDataset}
        onDeleteDataset={handleDeleteDataset}
        onNewDataset={handleNewDataset}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-6">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Form Intelligence Dashboard</h1>
              <p className="text-sm text-gray-400">
                AI-powered analysis for any dataset
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-300 text-lg">Analyzing your data...</p>
              <p className="text-gray-500 text-sm mt-2">
                Classifying questions, detecting patterns, and generating insights
              </p>
            </div>
          ) : viewState === 'upload' ? (
            <div className="max-w-4xl mx-auto py-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-100 mb-4">
                  Welcome to Form Intelligence
                </h2>
                <p className="text-gray-400 text-lg">
                  Upload CSV or connect Google Sheets to unlock powerful insights automatically
                </p>
              </div>
              <DataImport onDataLoaded={handleDataLoaded} />
            </div>
          ) : processedData ? (
            <Dashboard
              processedData={processedData}
              visualizations={visualizations}
              onExport={handleExport}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default App;
