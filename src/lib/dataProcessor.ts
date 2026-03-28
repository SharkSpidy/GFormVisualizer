import { intelligenceEngine, ClassifiedQuestion, BeforeAfterPair, Insight } from './intelligenceEngine';
import { textAnalyzer, TextAnalysisResult } from './textAnalysis';

export interface ProcessedDataset {
  originalData: any[];
  columns: string[];
  classifiedQuestions: ClassifiedQuestion[];
  beforeAfterPairs: BeforeAfterPair[];
  insights: Insight[];
  textAnalyses: Map<string, TextAnalysisResult>;
  summary: string;
  metadata: {
    totalResponses: number;
    totalQuestions: number;
    questionTypes: Record<string, number>;
  };
}

export class DataProcessor {

  processCSVData(data: any[]): ProcessedDataset {
    if (!data || data.length === 0) {
      throw new Error('No data provided');
    }

    const columns = Object.keys(data[0]);

    const classifiedQuestions = columns.map(column => {
      const responses = data.map(row => row[column]);
      return intelligenceEngine.classifyQuestion(column, responses);
    });

    const beforeAfterPairs = intelligenceEngine.findBeforeAfterPairs(classifiedQuestions, data);

    const insights = intelligenceEngine.generateInsights(classifiedQuestions, data, beforeAfterPairs);

    const textAnalyses = new Map<string, TextAnalysisResult>();
    classifiedQuestions
      .filter(q => q.type === 'text')
      .forEach(q => {
        const textResponses = data
          .map(row => row[q.question])
          .filter(r => r && String(r).trim().length > 0);

        if (textResponses.length > 0) {
          const analysis = textAnalyzer.analyzeTextResponses(textResponses);
          textAnalyses.set(q.question, analysis);
        }
      });

    const summary = intelligenceEngine.generateSummary(insights, beforeAfterPairs);

    const questionTypes: Record<string, number> = {};
    classifiedQuestions.forEach(q => {
      questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
    });

    return {
      originalData: data,
      columns,
      classifiedQuestions,
      beforeAfterPairs,
      insights,
      textAnalyses,
      summary,
      metadata: {
        totalResponses: data.length,
        totalQuestions: columns.length,
        questionTypes
      }
    };
  }

  generateVisualizationConfig(processedData: ProcessedDataset): any[] {
    const visualizations: any[] = [];

    if (processedData.beforeAfterPairs.length > 0) {
      const improvementData = processedData.beforeAfterPairs.map(pair => {
        const beforeAvg = intelligenceEngine.calculateAverageScore(pair.beforeData);
        const afterAvg = intelligenceEngine.calculateAverageScore(pair.afterData);

        return {
          question: this.truncateLabel(pair.baseQuestion),
          before: Number(beforeAvg.toFixed(2)),
          after: Number(afterAvg.toFixed(2)),
          improvement: Number((afterAvg - beforeAvg).toFixed(2))
        };
      });

      visualizations.push({
        type: 'improvement',
        title: 'Before vs After Comparison',
        data: improvementData
      });
    }

    const scaleQuestions = processedData.classifiedQuestions.filter(
      q => (q.type === 'scale' || q.type === 'likert') && !q.isBeforeAfter
    );

    if (scaleQuestions.length > 0) {
      const scoresData = scaleQuestions
        .map(q => {
          const values = processedData.originalData.map(row => row[q.question]);
          const avg = intelligenceEngine.calculateAverageScore(values);
          return {
            question: this.truncateLabel(q.question),
            score: Number(avg.toFixed(2))
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      visualizations.push({
        type: 'scores',
        title: 'Top Scoring Areas',
        data: scoresData
      });
    }

    const multipleChoiceQuestions = processedData.classifiedQuestions.filter(
      q => q.type === 'multiple_choice' || q.type === 'checkbox'
    );

    multipleChoiceQuestions.slice(0, 3).forEach(q => {
      const distribution = this.calculateDistribution(processedData.originalData, q.question);

      visualizations.push({
        type: 'distribution',
        title: this.truncateLabel(q.question),
        data: distribution
      });
    });

    processedData.textAnalyses.forEach((analysis, question) => {
      if (analysis.keywords.length > 0) {
        visualizations.push({
          type: 'keywords',
          title: `Keywords: ${this.truncateLabel(question)}`,
          data: analysis.keywords.slice(0, 15)
        });
      }
    });

    return visualizations;
  }

  calculateDistribution(data: any[], questionKey: string): any[] {
    const counts = new Map<string, number>();

    data.forEach(row => {
      const value = row[questionKey];
      if (!value) return;

      if (String(value).includes(',')) {
        String(value).split(',').forEach(item => {
          const trimmed = item.trim();
          counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
        });
      } else {
        counts.set(String(value), (counts.get(String(value)) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([name, value]) => ({
        name: this.truncateLabel(name),
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  truncateLabel(label: string, maxLength: number = 50): string {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + '...';
  }

  exportToJSON(processedData: ProcessedDataset): string {
    return JSON.stringify(processedData, null, 2);
  }

  generateTextReport(processedData: ProcessedDataset): string {
    const lines: string[] = [];

    lines.push('FORM INTELLIGENCE DASHBOARD - ANALYSIS REPORT');
    lines.push('='.repeat(60));
    lines.push('');

    lines.push(`Total Responses: ${processedData.metadata.totalResponses}`);
    lines.push(`Total Questions: ${processedData.metadata.totalQuestions}`);
    lines.push('');

    lines.push('Question Type Distribution:');
    Object.entries(processedData.metadata.questionTypes).forEach(([type, count]) => {
      lines.push(`  - ${type}: ${count}`);
    });
    lines.push('');

    lines.push('SUMMARY:');
    lines.push(processedData.summary);
    lines.push('');

    if (processedData.beforeAfterPairs.length > 0) {
      lines.push('BEFORE/AFTER ANALYSIS:');
      processedData.beforeAfterPairs.forEach(pair => {
        const beforeAvg = intelligenceEngine.calculateAverageScore(pair.beforeData);
        const afterAvg = intelligenceEngine.calculateAverageScore(pair.afterData);
        const improvement = afterAvg - beforeAvg;

        lines.push(`  ${pair.baseQuestion}:`);
        lines.push(`    Before: ${beforeAvg.toFixed(2)}`);
        lines.push(`    After: ${afterAvg.toFixed(2)}`);
        lines.push(`    Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}`);
        lines.push('');
      });
    }

    if (processedData.insights.length > 0) {
      lines.push('TOP INSIGHTS:');
      processedData.insights.slice(0, 10).forEach((insight, idx) => {
        const value = typeof insight.value === 'number' ? insight.value.toFixed(2) : insight.value;
        const change = insight.change ? ` (${insight.change > 0 ? '+' : ''}${insight.change.toFixed(2)})` : '';
        lines.push(`  ${idx + 1}. ${insight.title}: ${value}${change}`);
      });
      lines.push('');
    }

    if (processedData.textAnalyses.size > 0) {
      lines.push('TEXT ANALYSIS:');
      processedData.textAnalyses.forEach((analysis, question) => {
        lines.push(`  ${question}:`);
        const summary = textAnalyzer.generateTextSummary(analysis);
        lines.push(`    ${summary}`);
        lines.push('');
      });
    }

    return lines.join('\n');
  }
}

export const dataProcessor = new DataProcessor();
