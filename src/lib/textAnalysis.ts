export interface KeywordInsight {
  word: string;
  count: number;
  percentage: number;
}

export interface TextAnalysisResult {
  keywords: KeywordInsight[];
  totalWords: number;
  averageLength: number;
  sentimentScore?: number;
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your',
  'his', 'her', 'its', 'our', 'their', 'am', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out',
  'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'what', 'which', 'who',
  'whom', 'yes', 'also', 'just', 'like', 'get', 'got', 'make', 'made'
]);

const POSITIVE_WORDS = new Set([
  'great', 'excellent', 'good', 'amazing', 'wonderful', 'fantastic',
  'love', 'best', 'helpful', 'enjoyed', 'learned', 'improved',
  'better', 'valuable', 'informative', 'engaging', 'useful', 'clear'
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'poor', 'terrible', 'awful', 'disappointing', 'confused',
  'difficult', 'hard', 'unclear', 'boring', 'waste', 'worse',
  'lacking', 'insufficient', 'inadequate', 'unhelpful'
]);

export class TextAnalyzer {

  analyzeTextResponses(responses: string[]): TextAnalysisResult {
    const validResponses = responses.filter(r => r && String(r).trim().length > 0);

    if (validResponses.length === 0) {
      return {
        keywords: [],
        totalWords: 0,
        averageLength: 0
      };
    }

    const keywords = this.extractKeywords(validResponses);
    const totalWords = this.countTotalWords(validResponses);
    const averageLength = this.calculateAverageLength(validResponses);
    const sentimentScore = this.calculateSentiment(validResponses);

    return {
      keywords,
      totalWords,
      averageLength,
      sentimentScore
    };
  }

  extractKeywords(responses: string[]): KeywordInsight[] {
    const wordCounts = new Map<string, number>();
    let totalKeywords = 0;

    responses.forEach(response => {
      const words = this.tokenize(String(response));
      words.forEach(word => {
        if (word.length > 3 && !STOPWORDS.has(word)) {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
          totalKeywords++;
        }
      });
    });

    return Array.from(wordCounts.entries())
      .map(([word, count]) => ({
        word,
        count,
        percentage: (count / totalKeywords) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  }

  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  countTotalWords(responses: string[]): number {
    return responses.reduce((total, response) => {
      return total + this.tokenize(String(response)).length;
    }, 0);
  }

  calculateAverageLength(responses: string[]): number {
    const totalLength = responses.reduce((sum, r) => sum + String(r).length, 0);
    return totalLength / responses.length;
  }

  calculateSentiment(responses: string[]): number {
    let positiveCount = 0;
    let negativeCount = 0;

    responses.forEach(response => {
      const words = this.tokenize(String(response));
      words.forEach(word => {
        if (POSITIVE_WORDS.has(word)) positiveCount++;
        if (NEGATIVE_WORDS.has(word)) negativeCount++;
      });
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return 0;

    return ((positiveCount - negativeCount) / total) * 100;
  }

  generateTextSummary(analysis: TextAnalysisResult): string {
    const parts: string[] = [];

    if (analysis.keywords.length > 0) {
      const topKeywords = analysis.keywords.slice(0, 5).map(k => k.word);
      parts.push(`Most frequent themes: ${topKeywords.join(', ')}`);
    }

    if (analysis.sentimentScore !== undefined) {
      if (analysis.sentimentScore > 20) {
        parts.push('Overall sentiment is positive');
      } else if (analysis.sentimentScore < -20) {
        parts.push('Overall sentiment is negative');
      } else {
        parts.push('Overall sentiment is neutral');
      }
    }

    parts.push(`Average response length: ${Math.round(analysis.averageLength)} characters`);

    return parts.join('. ') + '.';
  }

  categorizeResponses(responses: string[]): Map<string, string[]> {
    const categories = new Map<string, string[]>();

    responses.forEach(response => {
      const words = this.tokenize(String(response));
      const hasPositive = words.some(w => POSITIVE_WORDS.has(w));
      const hasNegative = words.some(w => NEGATIVE_WORDS.has(w));

      let category = 'neutral';
      if (hasPositive && !hasNegative) category = 'positive';
      else if (hasNegative && !hasPositive) category = 'negative';
      else if (hasPositive && hasNegative) category = 'mixed';

      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(response);
    });

    return categories;
  }
}

export const textAnalyzer = new TextAnalyzer();
