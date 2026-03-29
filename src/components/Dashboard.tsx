import { useState, useMemo } from 'react';
import { ProcessedDataset, ColumnProfile, VisualizationConfig } from '../lib/dataProcessor';
import { UniversalChart } from './Charts';
import { Download, TrendingUp, BarChart3, Hash, Calendar, Type, Binary, Fingerprint, GitCompareArrows, ChevronDown } from 'lucide-react';

interface DashboardProps {
  processedData: ProcessedDataset;
  visualizations: any[];
  onExport?: () => void;
}

const TYPE_ICON: Record<string, any> = {
  numeric: BarChart3,
  categorical: Hash,
  date: Calendar,
  text: Type,
  boolean: Binary,
  id: Fingerprint,
};

const TYPE_COLOR: Record<string, string> = {
  numeric: 'text-blue-400',
  categorical: 'text-green-400',
  date: 'text-purple-400',
  text: 'text-orange-400',
  boolean: 'text-pink-400',
  id: 'text-gray-400',
};

function buildComparisonViz(
  colA: ColumnProfile,
  colB: ColumnProfile,
  data: any[]
): VisualizationConfig | null {
  const a = colA, b = colB;

  // numeric vs numeric → scatter
  if (a.type === 'numeric' && b.type === 'numeric') {
    const pts = data
      .map(r => ({ x: Number(r[a.name]), y: Number(r[b.name]) }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y))
      .slice(0, 500);
    if (pts.length < 2) return null;
    return { id: 'cmp', type: 'scatter', title: `${a.name} vs ${b.name}`,
      description: 'Scatter — each dot is one row', data: pts, xKey: a.name, yKey: b.name, priority: 0 };
  }

  // categorical vs numeric → grouped bar (avg numeric per category)
  const [catCol, numCol] =
    (a.type === 'categorical' || a.type === 'boolean') && b.type === 'numeric' ? [a, b] :
    (b.type === 'categorical' || b.type === 'boolean') && a.type === 'numeric' ? [b, a] :
    [null, null];

  if (catCol && numCol) {
    const grouped = new Map<string, number[]>();
    data.forEach(r => {
      const cat = String(r[catCol.name] ?? 'Unknown').slice(0, 30);
      const val = Number(r[numCol.name]);
      if (!isNaN(val)) { if (!grouped.has(cat)) grouped.set(cat, []); grouped.get(cat)!.push(val); }
    });
    const barData = [...grouped.entries()]
      .map(([name, vals]) => ({ name, avg: parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)), count: vals.length }))
      .sort((a, b) => b.avg - a.avg).slice(0, 15);
    if (barData.length < 2) return null;
    return { id: 'cmp', type: 'bar', title: `Avg ${numCol.name} by ${catCol.name}`,
      description: `Average of "${numCol.name}" for each "${catCol.name}" value`, data: barData, xKey: 'name', yKey: 'avg', priority: 0 };
  }

  // categorical vs categorical → stacked / grouped counts as bar
  if ((a.type === 'categorical' || a.type === 'boolean') && (b.type === 'categorical' || b.type === 'boolean')) {
    const topA = (a.topValues ?? []).slice(0, 8).map(t => t.value);
    const topB = (b.topValues ?? []).slice(0, 6).map(t => t.value);
    const matrix: Record<string, Record<string, number>> = {};
    topA.forEach(v => { matrix[v] = {}; topB.forEach(w => { matrix[v][w] = 0; }); });
    data.forEach(r => {
      const va = String(r[a.name] ?? ''), vb = String(r[b.name] ?? '');
      if (matrix[va] && topB.includes(vb)) matrix[va][vb]++;
    });
    const tableData = topA.map(va => ({ name: va, ...matrix[va] }));
    if (tableData.length < 2) return null;
    return { id: 'cmp', type: 'table', title: `${a.name} × ${b.name} Cross-tab`,
      description: `Counts for each combination`, data: tableData, xKey: 'name', yKey: '', priority: 0 };
  }

  return null;
}

export function Dashboard({ processedData, visualizations, onExport }: DashboardProps) {
  const vizList = processedData.visualizations?.length
    ? processedData.visualizations
    : (visualizations || []);

  const columns = processedData.columnProfiles ?? [];
  const comparableColumns = columns.filter(c => c.type !== 'id' && c.type !== 'text' && c.type !== 'date');
  const [colA, setColA] = useState<string>('');
  const [colB, setColB] = useState<string>('');

  const comparisonViz = useMemo(() => {
    if (!colA || !colB || colA === colB) return null;
    const profA = columns.find(c => c.name === colA);
    const profB = columns.find(c => c.name === colB);
    if (!profA || !profB) return null;
    return buildComparisonViz(profA, profB, processedData.originalData);
  }, [colA, colB, columns, processedData.originalData]);

  return (
    <div className="w-full space-y-6">
      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Analysis Summary</h2>
            <p className="text-blue-100 leading-relaxed max-w-2xl">{processedData.summary}</p>
          </div>
          {onExport && (
            <button onClick={onExport} className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm whitespace-nowrap ml-4">
              <Download className="w-4 h-4"/>Export Report
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <StatCard label="Total Rows" value={processedData.metadata.totalResponses}/>
          <StatCard label="Columns" value={processedData.metadata.totalQuestions}/>
          <StatCard label="Charts" value={vizList.length}/>
          <StatCard label="Insights" value={processedData.insights.length}/>
        </div>
      </div>

      {/* Column Type Overview */}
      {processedData.columnProfiles?.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Column Overview</h3>
          <div className="flex flex-wrap gap-2">
            {processedData.columnProfiles.map((col, i) => {
              const Icon = TYPE_ICON[col.type] || Hash;
              const color = TYPE_COLOR[col.type] || 'text-gray-400';
              return (
                <div key={i} className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5">
                  <Icon className={`w-3.5 h-3.5 ${color}`}/>
                  <span className="text-sm text-gray-200">{col.name}</span>
                  <span className={`text-xs ${color} opacity-75`}>{col.type}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Column Comparison */}
      {comparableColumns.length >= 2 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <GitCompareArrows className="w-5 h-5 text-blue-400"/>
            <h3 className="text-lg font-semibold text-gray-100">Compare Columns</h3>
            <span className="text-xs text-gray-500 ml-1">— pick any two columns to visualize their relationship</span>
          </div>

          <div className="flex flex-wrap gap-3 items-end mb-5">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Column A</label>
              <div className="relative">
                <select
                  value={colA}
                  onChange={e => setColA(e.target.value)}
                  className="w-full appearance-none bg-gray-900 border border-gray-600 text-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select column…</option>
                  {comparableColumns.map(c => (
                    <option key={c.name} value={c.name} disabled={c.name === colB}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
              </div>
            </div>

            <div className="text-gray-600 font-bold text-lg pb-1 select-none">×</div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Column B</label>
              <div className="relative">
                <select
                  value={colB}
                  onChange={e => setColB(e.target.value)}
                  className="w-full appearance-none bg-gray-900 border border-gray-600 text-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select column…</option>
                  {comparableColumns.map(c => (
                    <option key={c.name} value={c.name} disabled={c.name === colA}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
              </div>
            </div>

            {(colA || colB) && (
              <button
                onClick={() => { setColA(''); setColB(''); }}
                className="pb-0.5 text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2 whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>

          {/* Result area */}
          {!colA || !colB ? (
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center">
              <GitCompareArrows className="w-8 h-8 text-gray-600 mx-auto mb-2"/>
              <p className="text-gray-500 text-sm">Select two columns above to generate a comparison chart</p>
            </div>
          ) : colA === colB ? (
            <div className="border-2 border-dashed border-yellow-800 rounded-xl p-6 text-center">
              <p className="text-yellow-600 text-sm">Please select two <span className="font-semibold">different</span> columns</p>
            </div>
          ) : comparisonViz ? (
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-100">{comparisonViz.title}</h4>
                {comparisonViz.description && <p className="text-xs text-gray-500 mt-0.5">{comparisonViz.description}</p>}
              </div>
              <UniversalChart viz={comparisonViz}/>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center">
              <p className="text-gray-500 text-sm">
                Can't generate a meaningful comparison for these two column types yet.
                Try combining a <span className="text-gray-300">numeric</span> column with a <span className="text-gray-300">categorical</span> one, or two <span className="text-gray-300">numeric</span> columns.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      {processedData.insights.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400"/>
            <h3 className="text-lg font-semibold text-gray-100">Key Insights</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {processedData.insights.slice(0,8).map((insight, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1 truncate">{insight.title}</p>
                <p className="text-xl font-bold text-gray-100 truncate">{String(insight.value)}</p>
                {insight.change !== undefined && (
                  <span className={`text-xs font-medium ${insight.change > 0 ? 'text-green-400' : insight.change < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {insight.change > 0 ? '▲' : '▼'} {Math.abs(insight.change).toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visualizations */}
      {vizList.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {vizList.map((viz: any, i: number) => (
            <div key={viz.id||i} className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${viz.type === 'table' || viz.type === 'keywords' ? 'lg:col-span-2' : ''}`}>
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-100">{viz.title}</h3>
                {viz.description && <p className="text-xs text-gray-500 mt-0.5">{viz.description}</p>}
              </div>
              <UniversalChart viz={viz}/>
            </div>
          ))}
        </div>
      )}

      {vizList.length === 0 && (
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400">No visualizations could be generated from this data.</p>
          <p className="text-sm text-gray-600 mt-1">Try uploading a CSV with numeric or categorical columns.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
      <p className="text-xs text-blue-200 mb-0.5">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
