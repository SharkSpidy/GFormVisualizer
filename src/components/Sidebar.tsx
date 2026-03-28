import { useState } from 'react';
import { FileText, Plus, Trash2, Database } from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  created_at: string;
  metadata: {
    totalResponses: number;
    totalQuestions: number;
  };
}

interface SidebarProps {
  datasets: Dataset[];
  currentDatasetId: string | null;
  onSelectDataset: (id: string) => void;
  onDeleteDataset: (id: string) => void;
  onNewDataset: () => void;
}

export function Sidebar({
  datasets,
  currentDatasetId,
  onSelectDataset,
  onDeleteDataset,
  onNewDataset
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-gray-100">Datasets</h2>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={onNewDataset}
          className={`w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${
            isCollapsed ? 'justify-center p-3' : 'px-4 py-2'
          }`}
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span className="font-medium">New Dataset</span>}
        </button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        {datasets.length === 0 ? (
          !isCollapsed && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No datasets yet. Upload a CSV to get started.
            </div>
          )
        ) : (
          <div className="space-y-2 px-4">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className={`group relative rounded-lg transition-all cursor-pointer ${
                  currentDatasetId === dataset.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 hover:bg-gray-750 text-gray-300'
                } ${isCollapsed ? 'p-3' : 'p-3'}`}
                onClick={() => onSelectDataset(dataset.id)}
              >
                <div className="flex items-start gap-3">
                  <FileText className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isCollapsed ? '' : ''}`} />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{dataset.name}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {dataset.metadata.totalResponses} responses
                      </p>
                      <p className="text-xs opacity-60 mt-0.5">
                        {new Date(dataset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDataset(dataset.id);
                    }}
                    className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      currentDatasetId === dataset.id
                        ? 'hover:bg-blue-700'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
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
