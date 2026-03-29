import { useState } from 'react';
import { FileText, Plus, Trash2, Database } from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  created_at: string;
  metadata: { totalResponses: number; totalQuestions: number };
}

interface SidebarProps {
  datasets: Dataset[];
  currentDatasetId: string | null;
  onSelectDataset: (id: string) => void;
  onDeleteDataset: (id: string) => void;
  onNewDataset: () => void;
}

export function Sidebar({ datasets, currentDatasetId, onSelectDataset, onDeleteDataset, onNewDataset }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'w-14' : 'w-60'}`}>
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500"/>
            <h2 className="font-semibold text-gray-100 text-sm">Datasets</h2>
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-500 hover:text-gray-200 transition-colors text-xs ml-auto">
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <div className="p-3">
        <button onClick={onNewDataset} className={`w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'}`}>
          <Plus className="w-4 h-4 flex-shrink-0"/>
          {!isCollapsed && <span className="font-medium">New Upload</span>}
        </button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {datasets.length === 0 ? (
          !isCollapsed && <div className="px-4 py-6 text-center text-xs text-gray-500">No datasets yet.</div>
        ) : (
          <div className="space-y-1 px-2 pb-4">
            {datasets.map(dataset => (
              <div key={dataset.id} className={`group relative rounded-lg cursor-pointer transition-all ${currentDatasetId === dataset.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'} ${isCollapsed ? 'p-2.5' : 'p-2.5'}`} onClick={() => onSelectDataset(dataset.id)}>
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-xs font-medium truncate">{dataset.name}</p>
                      <p className="text-xs opacity-60 mt-0.5">{dataset.metadata.totalResponses} rows</p>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <button onClick={e => { e.stopPropagation(); onDeleteDataset(dataset.id); }} className={`absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${currentDatasetId === dataset.id ? 'hover:bg-blue-700' : 'hover:bg-gray-700'}`}>
                    <Trash2 className="w-3 h-3"/>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
