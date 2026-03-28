export type QuestionType =
  | 'scale'
  | 'likert'
  | 'matrix'
  | 'multiple_choice'
  | 'checkbox'
  | 'text'
  | 'unknown';

export interface ClassifiedQuestion {
  question: string;
  type: QuestionType;
  options?: string[];
  baseQuestion?: string;
  isBeforeAfter?: boolean;
  timing?: 'before' | 'after';
}

export interface BeforeAfterPair {
  baseQuestion: string;
  before: string;
  after: string;
  beforeData: any[];
  afterData: any[];
}

export interface Insight {
  title: string;
  value: number | string;
  change?: number;
  type: 'improvement' | 'score' | 'metric' | 'text';
}

const LIKERT_PATTERNS = [
  'strongly agree',
  'agree',
  'neutral',
  'disagree',
  'strongly disagree',
  'very satisfied',
  'satisfied',
  'dissatisfied',
  'very dissatisfied',
  'excellent',
  'good',
  'fair',
  'poor'
];

const SCALE_PATTERNS = /^[1-5]$|^[0-9]0?$/;

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your',
  'his', 'her', 'its', 'our', 'their'
]);

export class IntelligenceEngine {

  classifyQuestion(question: string, responses: any[]): ClassifiedQuestion {
    const lowerQuestion = question.toLowerCase();
    const uniqueResponses = [...new Set(responses.filter(r => r !== null && r !== undefined && r !== ''))];

    const result: ClassifiedQuestion = {
      question,
      type: 'unknown',
    };

    const beforeAfterInfo = this.detectBeforeAfter(question);
    if (beforeAfterInfo) {
      result.baseQuestion = beforeAfterInfo.baseQuestion;
      result.isBeforeAfter = true;
      result.timing = beforeAfterInfo.timing;
    }

    if (uniqueResponses.length === 0) {
      result.type = 'text';
      return result;
    }

    const allNumeric = uniqueResponses.every(r => !isNaN(Number(r)));
    if (allNumeric) {
      const numericValues = uniqueResponses.map(r => Number(r));
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);

      if (max <= 10 && min >= 0) {
        result.type = 'scale';
        result.options = Array.from(new Set(numericValues.sort((a, b) => a - b))).map(String);
        return result;
      }
    }

    const hasLikert = uniqueResponses.some(r =>
      LIKERT_PATTERNS.some(pattern =>
        String(r).toLowerCase().includes(pattern)
      )
    );

    if (hasLikert) {
      result.type = 'likert';
      result.options = uniqueResponses;
      return result;
    }

    if (uniqueResponses.length <= 10 && uniqueResponses.length > 1) {
      const avgLength = uniqueResponses.reduce((sum, r) => sum + String(r).length, 0) / uniqueResponses.length;

      if (avgLength < 50) {
        result.type = 'multiple_choice';
        result.options = uniqueResponses;
        return result;
      }
    }

    const hasCommaDelimited = uniqueResponses.some(r => String(r).includes(','));
    if (hasCommaDelimited) {
      result.type = 'checkbox';
      const allOptions = new Set<string>();
      uniqueResponses.forEach(r => {
        String(r).split(',').forEach(opt => allOptions.add(opt.trim()));
      });
      result.options = Array.from(allOptions);
      return result;
    }

    result.type = 'text';
    return result;
  }

  detectBeforeAfter(question: string): { baseQuestion: string; timing: 'before' | 'after' } | null {
    const lowerQuestion = question.toLowerCase();

    const beforeMatch = lowerQuestion.match(/(.+?)\s*(?:\()?before(?:\))?/i);
    const afterMatch = lowerQuestion.match(/(.+?)\s*(?:\()?after(?:\))?/i);

    if (beforeMatch) {
      return {
        baseQuestion: beforeMatch[1].trim(),
        timing: 'before'
      };
    }

    if (afterMatch) {
      return {
        baseQuestion: afterMatch[1].trim(),
        timing: 'after'
      };
    }

    return null;
  }

  findBeforeAfterPairs(classifiedQuestions: ClassifiedQuestion[], data: any[]): BeforeAfterPair[] {
    const pairs: BeforeAfterPair[] = [];
    const beforeQuestions = classifiedQuestions.filter(q => q.timing === 'before');
    const afterQuestions = classifiedQuestions.filter(q => q.timing === 'after');

    beforeQuestions.forEach(before => {
      const matching = afterQuestions.find(after =>
        this.normalizeQuestion(after.baseQuestion || after.question) ===
        this.normalizeQuestion(before.baseQuestion || before.question)
      );

      if (matching) {
        pairs.push({
          baseQuestion: before.baseQuestion || before.question,
          before: before.question,
          after: matching.question,
          beforeData: data.map(row => row[before.question]).filter(v => v !== null && v !== undefined),
          afterData: data.map(row => row[matching.question]).filter(v => v !== null && v !== undefined)
        });
      }
    });

    return pairs;
  }

  normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .replace(/\(before\)|\(after\)|before|after/gi, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  convertToNumeric(value: any): number | null {
    if (typeof value === 'number') return value;

    const strValue = String(value).toLowerCase().trim();

    const numericValue = Number(strValue);
    if (!isNaN(numericValue)) return numericValue;

    const likertMap: Record<string, number> = {
      'strongly disagree': 1,
      'disagree': 2,
      'neutral': 3,
      'agree': 4,
      'strongly agree': 5,
      'very dissatisfied': 1,
      'dissatisfied': 2,
      'satisfied': 4,
      'very satisfied': 5,
      'poor': 1,
      'fair': 2,
      'good': 4,
      'excellent': 5,
    };

    for (const [key, val] of Object.entries(likertMap)) {
      if (strValue.includes(key)) return val;
    }

    return null;
  }

  calculateAverageScore(values: any[]): number {
    const numericValues = values
      .map(v => this.convertToNumeric(v))
      .filter((v): v is number => v !== null);

    if (numericValues.length === 0) return 0;

    return numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
  }

  generateInsights(
    classifiedQuestions: ClassifiedQuestion[],
    data: any[],
    beforeAfterPairs: BeforeAfterPair[]
  ): Insight[] {
    const insights: Insight[] = [];

    beforeAfterPairs.forEach(pair => {
      const beforeAvg = this.calculateAverageScore(pair.beforeData);
      const afterAvg = this.calculateAverageScore(pair.afterData);
      const improvement = afterAvg - beforeAvg;

      insights.push({
        title: pair.baseQuestion,
        value: afterAvg,
        change: improvement,
        type: 'improvement'
      });
    });

    const scaleQuestions = classifiedQuestions.filter(q =>
      (q.type === 'scale' || q.type === 'likert') && !q.isBeforeAfter
    );

    scaleQuestions.forEach(q => {
      const values = data.map(row => row[q.question]).filter(v => v !== null && v !== undefined);
      const avg = this.calculateAverageScore(values);

      insights.push({
        title: q.question,
        value: avg,
        type: 'score'
      });
    });

    return insights.sort((a, b) => {
      if (a.type === 'improvement' && b.type !== 'improvement') return -1;
      if (a.type !== 'improvement' && b.type === 'improvement') return 1;
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        return b.value - a.value;
      }
      return 0;
    });
  }

  extractKeywords(textResponses: string[]): { word: string; count: number }[] {
    const wordCounts = new Map<string, number>();

    textResponses.forEach(response => {
      if (!response) return;

      const words = String(response)
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !STOPWORDS.has(word));

      words.forEach(word => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      });
    });

    return Array.from(wordCounts.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }

  generateSummary(insights: Insight[], beforeAfterPairs: BeforeAfterPair[]): string {
    const parts: string[] = [];

    if (beforeAfterPairs.length > 0) {
      const avgImprovement = beforeAfterPairs.reduce((sum, pair) => {
        const beforeAvg = this.calculateAverageScore(pair.beforeData);
        const afterAvg = this.calculateAverageScore(pair.afterData);
        return sum + (afterAvg - beforeAvg);
      }, 0) / beforeAfterPairs.length;

      parts.push(
        `Analysis of ${beforeAfterPairs.length} before/after pairs shows an average improvement of ${avgImprovement.toFixed(2)} points.`
      );

      const topImprovement = beforeAfterPairs.reduce((max, pair) => {
        const beforeAvg = this.calculateAverageScore(pair.beforeData);
        const afterAvg = this.calculateAverageScore(pair.afterData);
        const improvement = afterAvg - beforeAvg;
        return improvement > (max.improvement || 0)
          ? { question: pair.baseQuestion, improvement }
          : max;
      }, { question: '', improvement: 0 });

      if (topImprovement.improvement > 0) {
        parts.push(
          `The highest improvement was seen in "${topImprovement.question}" with a ${topImprovement.improvement.toFixed(2)} point increase.`
        );
      }
    }

    const topScores = insights
      .filter(i => i.type === 'score' && typeof i.value === 'number')
      .slice(0, 3);

    if (topScores.length > 0) {
      parts.push(
        `Top performing areas include: ${topScores.map(s => `"${s.title}" (${(s.value as number).toFixed(2)})`).join(', ')}.`
      );
    }

    return parts.join(' ') || 'No significant insights detected in this dataset.';
  }
}

export const intelligenceEngine = new IntelligenceEngine();
