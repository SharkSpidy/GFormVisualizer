import { useMemo } from 'react';
import { ProcessedDataset, ColumnProfile } from '../lib/dataProcessor';
import {
  CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown,
  Minus, Lightbulb, Award, AlertCircle, ChevronRight
} from 'lucide-react';

interface InsightLayerProps {
  processedData: ProcessedDataset;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface NarrativeInsight {
  id: string;
  category: 'improvement' | 'stagnation' | 'decline' | 'standout' | 'concern' | 'engagement';
  headline: string;       // e.g. "Students improved 35% in concept clarity"
  detail: string;         // 1-2 sentence elaboration
  metric?: string;        // e.g. "3.1 → 4.2 / 5"
  delta?: number;         // signed change
  deltaPct?: number;      // as percentage
  priority: number;
}

interface WorkshopVerdict {
  label: 'Highly Effective' | 'Effective' | 'Mixed Results' | 'Needs Improvement' | 'Insufficient Data';
  score: number;          // 0–100
  color: string;
  bgColor: string;
  borderColor: string;
  icon: 'check' | 'warn' | 'cross' | 'info';
  rationale: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNum(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!isNaN(n)) return n;
  const map: Record<string, number> = {
    'strongly agree': 5, 'agree': 4, 'neutral': 3, 'disagree': 2, 'strongly disagree': 1,
    'very satisfied': 5, 'satisfied': 4, 'dissatisfied': 2, 'very dissatisfied': 1,
    'excellent': 5, 'good': 4, 'fair': 3, 'poor': 1,
    'always': 5, 'often': 4, 'sometimes': 3, 'rarely': 2, 'never': 1,
    'yes': 1, 'no': 0,
  };
  const lower = String(v).toLowerCase().trim();
  for (const [k, val] of Object.entries(map)) {
    if (lower.includes(k)) return val;
  }
  return null;
}

function avg(vals: any[]): number | null {
  const nums = vals.map(toNum).filter((n): n is number => n !== null);
  if (!nums.length) return null;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

function pct(n: number, decimals = 0): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

function isBeforeCol(name: string) {
  return /\bbefore\b/i.test(name);
}
function isAfterCol(name: string) {
  return /\bafter\b/i.test(name);
}

function normalize(s: string) {
  return s.toLowerCase()
    .replace(/\b(before|after|pre|post)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Core analysis ────────────────────────────────────────────────────────────

function analyzeDataset(processedData: ProcessedDataset): {
  insights: NarrativeInsight[];
  verdict: WorkshopVerdict;
} {
  const { originalData: data, columnProfiles } = processedData;
  const insights: NarrativeInsight[] = [];

  const numericCols = columnProfiles.filter(c => c.type === 'numeric');
  const catCols = columnProfiles.filter(c => c.type === 'categorical' || c.type === 'boolean');

  // ── 1. Before/After pairs ────────────────────────────────────────────────
  const beforeCols = columnProfiles.filter(c => isBeforeCol(c.name));
  const afterCols  = columnProfiles.filter(c => isAfterCol(c.name));

  const pairs: { base: string; before: ColumnProfile; after: ColumnProfile }[] = [];

  beforeCols.forEach(bc => {
    const baseB = normalize(bc.name);
    const match = afterCols.find(ac => normalize(ac.name) === baseB);
    if (match) pairs.push({ base: baseB, before: bc, after: match });
  });

  // Also try matching by stripping before/after from both ends
  if (pairs.length === 0 && beforeCols.length > 0 && afterCols.length > 0) {
    beforeCols.forEach(bc => {
      afterCols.forEach(ac => {
        const already = pairs.find(p => p.before.name === bc.name);
        if (!already) pairs.push({ base: normalize(bc.name), before: bc, after: ac });
      });
    });
  }

  pairs.forEach((pair, i) => {
    const beforeVals = data.map(r => r[pair.before.name]);
    const afterVals  = data.map(r => r[pair.after.name]);
    const bAvg = avg(beforeVals);
    const aAvg = avg(afterVals);
    if (bAvg === null || aAvg === null) return;

    const delta = aAvg - bAvg;
    const scale = Math.max(
      ...data.map(r => toNum(r[pair.before.name]) ?? 0),
      ...data.map(r => toNum(r[pair.after.name]) ?? 0),
      5
    );
    const deltaPct = bAvg !== 0 ? delta / bAvg : 0;
    const label = pair.base
      .replace(/\b\w/g, l => l.toUpperCase())
      .slice(0, 50);

    if (delta > 0.15) {
      const magnitude = deltaPct > 0.3 ? 'significantly' : deltaPct > 0.15 ? 'noticeably' : 'slightly';
      insights.push({
        id: `ba_imp_${i}`,
        category: 'improvement',
        headline: `${label} improved ${pct(Math.abs(deltaPct), 0)} after the session`,
        detail: `Average scores rose ${magnitude} from ${bAvg.toFixed(1)} to ${aAvg.toFixed(1)} out of ${scale.toFixed(0)}. This suggests the session had a measurable positive effect on this dimension.`,
        metric: `${bAvg.toFixed(1)} → ${aAvg.toFixed(1)} / ${scale.toFixed(0)}`,
        delta, deltaPct,
        priority: 20 + Math.abs(deltaPct) * 10,
      });
    } else if (delta < -0.15) {
      insights.push({
        id: `ba_dec_${i}`,
        category: 'decline',
        headline: `${label} dropped ${pct(Math.abs(deltaPct), 0)} — worth investigating`,
        detail: `Scores fell from ${bAvg.toFixed(1)} to ${aAvg.toFixed(1)}. This may indicate increased critical awareness, realistic self-assessment, or unmet expectations.`,
        metric: `${bAvg.toFixed(1)} → ${aAvg.toFixed(1)} / ${scale.toFixed(0)}`,
        delta, deltaPct,
        priority: 18,
      });
    } else {
      insights.push({
        id: `ba_flat_${i}`,
        category: 'stagnation',
        headline: `${label} showed little change (${delta > 0 ? '+' : ''}${delta.toFixed(2)} pts)`,
        detail: `Before and after averages were nearly identical (${bAvg.toFixed(1)} vs ${aAvg.toFixed(1)}). The session may not have moved the needle on this dimension, or participants were already at ceiling.`,
        metric: `${bAvg.toFixed(1)} → ${aAvg.toFixed(1)} / ${scale.toFixed(0)}`,
        delta, deltaPct,
        priority: 10,
      });
    }
  });

  // ── 2. High/low performing numeric columns (no before/after) ─────────────
  const standaloneCols = numericCols.filter(c =>
    !isBeforeCol(c.name) && !isAfterCol(c.name) && c.mean !== undefined
  );

  standaloneCols.forEach((col, i) => {
    if (col.mean === undefined || col.min === undefined || col.max === undefined) return;
    const scale = col.max <= 5 ? 5 : col.max <= 10 ? 10 : col.max;
    const pctScore = col.mean / scale;
    const label = col.name.replace(/\b\w/g, l => l.toUpperCase()).slice(0, 50);

    if (pctScore >= 0.8) {
      insights.push({
        id: `high_${i}`,
        category: 'standout',
        headline: `Strong scores on "${label}" — avg ${col.mean.toFixed(1)}/${scale}`,
        detail: `${pct(pctScore, 0)} of the maximum possible score. This is a standout area — participants rated it consistently high.`,
        metric: `${col.mean.toFixed(1)} / ${scale} (${pct(pctScore, 0)})`,
        priority: 15 + pctScore,
      });
    } else if (pctScore < 0.5) {
      insights.push({
        id: `low_${i}`,
        category: 'concern',
        headline: `Low scores on "${label}" — avg ${col.mean.toFixed(1)}/${scale}`,
        detail: `Only ${pct(pctScore, 0)} of the maximum possible. This dimension may need more attention or redesign in future sessions.`,
        metric: `${col.mean.toFixed(1)} / ${scale} (${pct(pctScore, 0)})`,
        priority: 14,
      });
    }
  });

  // ── 3. Categorical standouts ─────────────────────────────────────────────
  catCols.forEach((col, i) => {
    if (!col.topValues?.length) return;
    const total = col.totalCount - col.nullCount;
    const top = col.topValues[0];
    const topPct = top.count / total;
    const label = col.name.replace(/\b\w/g, l => l.toUpperCase()).slice(0, 50);
    const isPositive = /yes|good|excel|great|satisf|agree|helpful|effective/i.test(top.value);
    const isNegative = /no|poor|bad|disagree|unsatisf|ineffect/i.test(top.value);

    if (topPct >= 0.6 && isPositive) {
      insights.push({
        id: `cat_pos_${i}`,
        category: 'standout',
        headline: `${pct(topPct, 0)} chose "${top.value}" for ${label}`,
        detail: `Strong majority agreement on this question. This is a high-confidence signal about participant sentiment.`,
        metric: `${top.count} / ${total} responses`,
        priority: 12 + topPct,
      });
    } else if (topPct >= 0.5 && isNegative) {
      insights.push({
        id: `cat_neg_${i}`,
        category: 'concern',
        headline: `${pct(topPct, 0)} responded "${top.value}" for ${label}`,
        detail: `A majority negative signal. This area deserves attention in post-workshop review and future redesign.`,
        metric: `${top.count} / ${total} responses`,
        priority: 16,
      });
    }
  });

  // ── 4. Completion / engagement signal ────────────────────────────────────
  const totalCells = data.length * columnProfiles.length;
  const nullCells = columnProfiles.reduce((s, c) => s + c.nullCount, 0);
  const completionRate = 1 - nullCells / totalCells;

  if (completionRate < 0.7) {
    insights.push({
      id: 'completion',
      category: 'concern',
      headline: `Only ${pct(completionRate, 0)} of responses were complete`,
      detail: `High blank rate may indicate survey fatigue, confusing questions, or low engagement. Consider shortening or redesigning the feedback form.`,
      metric: `${pct(completionRate, 0)} completion`,
      priority: 13,
    });
  } else if (completionRate >= 0.95) {
    insights.push({
      id: 'completion',
      category: 'engagement',
      headline: `High engagement — ${pct(completionRate, 0)} of responses fully completed`,
      detail: `Near-complete responses suggest participants were engaged and found the survey straightforward. This increases confidence in the data quality.`,
      metric: `${pct(completionRate, 0)} completion`,
      priority: 8,
    });
  }

  // ── 5. Score variance signal ─────────────────────────────────────────────
  standaloneCols.forEach((col, i) => {
    if (!col.stdDev || !col.mean || col.mean === 0) return;
    const cv = col.stdDev / col.mean; // coefficient of variation
    if (cv > 0.4) {
      const label = col.name.replace(/\b\w/g, l => l.toUpperCase()).slice(0, 40);
      insights.push({
        id: `variance_${i}`,
        category: 'concern',
        headline: `Split opinions on "${label}" — high score variance`,
        detail: `Standard deviation of ${col.stdDev.toFixed(2)} relative to mean of ${col.mean.toFixed(2)} indicates participants had very different experiences. Consider segmenting results by group.`,
        metric: `σ = ${col.stdDev.toFixed(2)}, mean = ${col.mean.toFixed(2)}`,
        priority: 9,
      });
    }
  });

  // ── Compute verdict ──────────────────────────────────────────────────────
  const verdict = computeVerdict(insights, pairs, standaloneCols, completionRate);

  return {
    insights: insights.sort((a, b) => b.priority - a.priority).slice(0, 8),
    verdict,
  };
}

function computeVerdict(
  insights: NarrativeInsight[],
  pairs: any[],
  standaloneCols: ColumnProfile[],
  completionRate: number
): WorkshopVerdict {
  if (insights.length === 0 && pairs.length === 0 && standaloneCols.length === 0) {
    return {
      label: 'Insufficient Data',
      score: 0,
      color: 'text-gray-400',
      bgColor: 'bg-gray-800',
      borderColor: 'border-gray-600',
      icon: 'info',
      rationale: 'Not enough numeric or before/after data to evaluate workshop effectiveness. Try uploading a dataset with rating scales or before/after columns.',
    };
  }

  let score = 50; // start neutral

  // Before/after improvements add weight
  const impCount   = insights.filter(i => i.category === 'improvement').length;
  const decCount   = insights.filter(i => i.category === 'decline').length;
  const flatCount  = insights.filter(i => i.category === 'stagnation').length;
  const highCount  = insights.filter(i => i.category === 'standout').length;
  const lowCount   = insights.filter(i => i.category === 'concern').length;

  score += impCount  * 12;
  score -= decCount  * 10;
  score -= flatCount *  4;
  score += highCount *  8;
  score -= lowCount  *  6;
  score += (completionRate - 0.8) * 20;

  // Average delta across pairs
  const avgDelta = insights
    .filter(i => i.delta !== undefined)
    .reduce((s, i) => s + (i.deltaPct ?? 0), 0) / (insights.filter(i => i.delta !== undefined).length || 1);
  score += avgDelta * 30;

  score = Math.max(0, Math.min(100, score));

  if (score >= 78) return {
    label: 'Highly Effective',
    score,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950',
    borderColor: 'border-emerald-700',
    icon: 'check',
    rationale: `Strong improvements across multiple dimensions and consistently high participant scores indicate the workshop achieved its goals.`,
  };
  if (score >= 58) return {
    label: 'Effective',
    score,
    color: 'text-blue-400',
    bgColor: 'bg-blue-950',
    borderColor: 'border-blue-700',
    icon: 'check',
    rationale: `Positive overall signals — most participants showed gains or rated the session highly. A few areas can still be refined.`,
  };
  if (score >= 38) return {
    label: 'Mixed Results',
    score,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-950',
    borderColor: 'border-yellow-700',
    icon: 'warn',
    rationale: `Some dimensions showed improvement while others stagnated or declined. Review individual insights below to identify where the session fell short.`,
  };
  return {
    label: 'Needs Improvement',
    score,
    color: 'text-red-400',
    bgColor: 'bg-red-950',
    borderColor: 'border-red-700',
    icon: 'cross',
    rationale: `Several key indicators suggest the session did not meet expectations. Use the insights below as a starting point for redesign.`,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<NarrativeInsight['category'], {
  bg: string; border: string; badge: string; badgeText: string; icon: any; iconColor: string;
}> = {
  improvement: {
    bg: 'bg-emerald-950/60', border: 'border-emerald-800',
    badge: 'bg-emerald-900 text-emerald-300', badgeText: 'Improvement',
    icon: TrendingUp, iconColor: 'text-emerald-400',
  },
  stagnation: {
    bg: 'bg-gray-900', border: 'border-gray-700',
    badge: 'bg-gray-800 text-gray-400', badgeText: 'No Change',
    icon: Minus, iconColor: 'text-gray-400',
  },
  decline: {
    bg: 'bg-red-950/50', border: 'border-red-800',
    badge: 'bg-red-900 text-red-300', badgeText: 'Decline',
    icon: TrendingDown, iconColor: 'text-red-400',
  },
  standout: {
    bg: 'bg-blue-950/50', border: 'border-blue-800',
    badge: 'bg-blue-900 text-blue-300', badgeText: 'Standout',
    icon: Award, iconColor: 'text-blue-400',
  },
  concern: {
    bg: 'bg-amber-950/50', border: 'border-amber-800',
    badge: 'bg-amber-900 text-amber-300', badgeText: 'Concern',
    icon: AlertCircle, iconColor: 'text-amber-400',
  },
  engagement: {
    bg: 'bg-purple-950/50', border: 'border-purple-800',
    badge: 'bg-purple-900 text-purple-300', badgeText: 'Engagement',
    icon: Lightbulb, iconColor: 'text-purple-400',
  },
};

function VerdictBadge({ verdict }: { verdict: WorkshopVerdict }) {
  const VIcon = verdict.icon === 'check' ? CheckCircle
    : verdict.icon === 'warn'  ? AlertTriangle
    : verdict.icon === 'cross' ? XCircle
    : AlertCircle;

  const arcR = 40;
  const circ = 2 * Math.PI * arcR;
  const dash = (verdict.score / 100) * circ;

  return (
    <div className={`rounded-xl p-6 border ${verdict.bgColor} ${verdict.borderColor} flex flex-col md:flex-row items-center gap-6`}>
      {/* Gauge */}
      <div className="relative flex-shrink-0 w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={arcR} fill="none" stroke="#1f2937" strokeWidth="10"/>
          <circle
            cx="50" cy="50" r={arcR} fill="none"
            stroke={verdict.score >= 78 ? '#10b981' : verdict.score >= 58 ? '#3b82f6' : verdict.score >= 38 ? '#f59e0b' : '#ef4444'}
            strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${verdict.color}`}>{verdict.score.toFixed(0)}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 text-center md:text-left">
        <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
          <VIcon className={`w-5 h-5 ${verdict.color}`}/>
          <span className={`text-xl font-bold ${verdict.color}`}>{verdict.label}</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{verdict.rationale}</p>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: NarrativeInsight }) {
  const s = CATEGORY_STYLES[insight.category];
  const Icon = s.icon;

  return (
    <div className={`rounded-xl p-4 border ${s.bg} ${s.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${s.iconColor}`}/>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.badge}`}>
              {s.badgeText}
            </span>
            {insight.metric && (
              <span className="text-[11px] text-gray-500 font-mono">{insight.metric}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-100 mb-1 leading-snug">{insight.headline}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{insight.detail}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function InsightLayer({ processedData }: InsightLayerProps) {
  const { insights, verdict } = useMemo(
    () => analyzeDataset(processedData),
    [processedData]
  );

  const improvements = insights.filter(i => i.category === 'improvement');
  const concerns     = insights.filter(i => i.category === 'concern' || i.category === 'decline');
  const positives    = insights.filter(i => i.category === 'standout' || i.category === 'engagement');
  const neutral      = insights.filter(i => i.category === 'stagnation');

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-400"/>
          <h3 className="text-lg font-semibold text-gray-100">Workshop Effectiveness Analysis</h3>
        </div>
        <VerdictBadge verdict={verdict}/>
      </div>

      {/* Insight cards */}
      {insights.length > 0 ? (
        <div className="p-6 space-y-6">

          {improvements.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5"/> What Improved
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {improvements.map(i => <InsightCard key={i.id} insight={i}/>)}
              </div>
            </section>
          )}

          {positives.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5"/> Strengths
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {positives.map(i => <InsightCard key={i.id} insight={i}/>)}
              </div>
            </section>
          )}

          {concerns.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5"/> Areas to Address
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {concerns.map(i => <InsightCard key={i.id} insight={i}/>)}
              </div>
            </section>
          )}

          {neutral.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
                <Minus className="w-3.5 h-3.5"/> No Significant Change
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {neutral.map(i => <InsightCard key={i.id} insight={i}/>)}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="p-10 text-center">
          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2"/>
          <p className="text-gray-500 text-sm">No actionable insights detected.</p>
          <p className="text-xs text-gray-600 mt-1">
            For best results, include columns with numeric ratings, or name columns with "before" / "after" to enable improvement tracking.
          </p>
        </div>
      )}

      {/* Tips callout */}
      <div className="px-6 pb-5">
        <div className="rounded-lg bg-gray-900 border border-gray-700 p-3 flex gap-2.5">
          <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="text-gray-400 font-medium">Pro tip:</span> Name paired columns like{' '}
            <code className="text-blue-400 font-mono">"Confidence (Before)"</code> and{' '}
            <code className="text-blue-400 font-mono">"Confidence (After)"</code> to unlock before/after improvement tracking automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
