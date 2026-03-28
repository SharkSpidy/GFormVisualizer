import { ProcessedDataset } from '../lib/dataProcessor';
import { ImprovementChart, ScoresChart, DistributionChart, KeywordsChart } from './Charts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, MessageSquare, Download } from 'lucide-react';

interface DashboardProps {
  processedData: ProcessedDataset;
  visualizations: any[];
  onExport?: () => void;
}

export function Dashboard({ processedData, visualizations, onExport }: DashboardProps) {
  const renderVisualization = (viz: any, index: number) => {
    switch (viz.type) {
      case 'improvement':
        return (
          <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-100">{viz.title}</h3>
            </div>
            <ImprovementChart data={viz.data} />
          </div>
        );

      case 'scores':
        return (
          <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-100">{viz.title}</h3>
            </div>
            <ScoresChart data={viz.data} />
          </div>
        );

      case 'distribution':
        return (
          <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-100">{viz.title}</h3>
            </div>
            <DistributionChart data={viz.data} />
          </div>
        );

      case 'keywords':
        return (
          <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-100">{viz.title}</h3>
            </div>
            <KeywordsChart data={viz.data} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Analysis Summary</h2>
        <p className="text-blue-100 leading-relaxed">{processedData.summary}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-blue-100 mb-1">Total Responses</p>
            <p className="text-3xl font-bold">{processedData.metadata.totalResponses}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-blue-100 mb-1">Total Questions</p>
            <p className="text-3xl font-bold">{processedData.metadata.totalQuestions}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-blue-100 mb-1">Insights Generated</p>
            <p className="text-3xl font-bold">{processedData.insights.length}</p>
          </div>
        </div>

        {onExport && (
          <button
            onClick={onExport}
            className="mt-4 flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        )}
      </div>

      {processedData.insights.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Top Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedData.insights.slice(0, 9).map((insight, idx) => (
              <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">{insight.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-100">
                    {typeof insight.value === 'number' ? insight.value.toFixed(2) : insight.value}
                  </p>
                  {insight.change !== undefined && (
                    <span
                      className={`text-sm font-medium ${
                        insight.change > 0 ? 'text-green-500' : insight.change < 0 ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      {insight.change > 0 ? '+' : ''}
                      {insight.change.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {visualizations.map((viz, idx) => renderVisualization(viz, idx))}
      </div>

      {processedData.textAnalyses.size > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Text Analysis Summary</h3>
          <div className="space-y-4">
            {Array.from(processedData.textAnalyses.entries()).map(([question, analysis]) => (
              <div key={question} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <p className="text-sm font-medium text-gray-300 mb-2">{question}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Words: </span>
                    <span className="text-gray-200">{analysis.totalWords}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg Length: </span>
                    <span className="text-gray-200">{Math.round(analysis.averageLength)} chars</span>
                  </div>
                  {analysis.sentimentScore !== undefined && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Sentiment: </span>
                      <span
                        className={`font-medium ${
                          analysis.sentimentScore > 20
                            ? 'text-green-500'
                            : analysis.sentimentScore < -20
                            ? 'text-red-500'
                            : 'text-gray-400'
                        }`}
                      >
                        {analysis.sentimentScore > 20
                          ? 'Positive'
                          : analysis.sentimentScore < -20
                          ? 'Negative'
                          : 'Neutral'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
