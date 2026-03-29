export type ColumnType = 'numeric' | 'categorical' | 'text' | 'date' | 'boolean' | 'id';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  uniqueCount: number;
  nullCount: number;
  totalCount: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  topValues?: { value: string; count: number }[];
  minDate?: string;
  maxDate?: string;
}

export interface VisualizationConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'table' | 'keywords';
  title: string;
  description: string;
  data: any[];
  xKey?: string;
  yKey?: string;
  priority: number;
}

export interface ProcessedDataset {
  originalData: any[];
  columns: string[];
  columnProfiles: ColumnProfile[];
  visualizations: VisualizationConfig[];
  summary: string;
  insights: { title: string; value: string | number; change?: number }[];
  metadata: {
    totalResponses: number;
    totalQuestions: number;
    questionTypes: Record<string, number>;
  };
  classifiedQuestions: any[];
  beforeAfterPairs: any[];
  textAnalyses: Map<string, any>;
}

function detectColumnType(values: any[]): ColumnType {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'text';
  const boolSet = new Set(nonNull.map(v => String(v).toLowerCase()));
  if ([...boolSet].every(v => ['true','false','yes','no','0','1','y','n'].includes(v))) return 'boolean';
  const numericCount = nonNull.filter(v => !isNaN(Number(v)) && v !== '').length;
  if (numericCount / nonNull.length > 0.9) return 'numeric';
  const dateCount = nonNull.filter(v => {
    const d = new Date(String(v));
    return !isNaN(d.getTime()) && String(v).length > 4;
  }).length;
  if (dateCount / nonNull.length > 0.8) return 'date';
  const uniqueRatio = new Set(nonNull).size / nonNull.length;
  if (uniqueRatio > 0.95 && nonNull.length > 20) return 'id';
  const avgLen = nonNull.reduce((s, v) => s + String(v).length, 0) / nonNull.length;
  if (new Set(nonNull).size <= Math.min(20, nonNull.length * 0.5) && avgLen < 60) return 'categorical';
  return 'text';
}

function profileColumn(name: string, values: any[]): ColumnProfile {
  const type = detectColumnType(values);
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  const base: ColumnProfile = { name, type, uniqueCount: new Set(nonNull).size, nullCount: values.length - nonNull.length, totalCount: values.length };
  if (type === 'numeric') {
    const nums = nonNull.map(Number).filter(n => !isNaN(n));
    const sorted = [...nums].sort((a, b) => a - b);
    const mean = nums.reduce((s, v) => s + v, 0) / nums.length;
    base.min = sorted[0]; base.max = sorted[sorted.length-1]; base.mean = mean;
    base.median = sorted[Math.floor(sorted.length/2)];
    base.stdDev = Math.sqrt(nums.reduce((s,v) => s+(v-mean)**2, 0) / nums.length);
  }
  if (type === 'categorical' || type === 'boolean') {
    const counts = new Map<string, number>();
    nonNull.forEach(v => { const k = String(v); counts.set(k, (counts.get(k)||0)+1); });
    base.topValues = [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0,15).map(([value,count]) => ({value,count}));
  }
  if (type === 'date') {
    const dates = nonNull.map(v => new Date(String(v))).filter(d => !isNaN(d.getTime()));
    if (dates.length) {
      base.minDate = new Date(Math.min(...dates.map(d => d.getTime()))).toLocaleDateString();
      base.maxDate = new Date(Math.max(...dates.map(d => d.getTime()))).toLocaleDateString();
    }
  }
  return base;
}

function buildHistogram(values: number[], bins: number) {
  if (!values.length) return [];
  const min = Math.min(...values), max = Math.max(...values);
  const step = (max - min) / bins || 1;
  return Array.from({length: bins}, (_, i) => {
    const lo = min + i * step, hi = lo + step;
    return { range: `${lo.toFixed(1)}-${hi.toFixed(1)}`, count: values.filter(v => v >= lo && (i===bins-1 ? v<=hi : v<hi)).length };
  }).filter(b => b.count > 0);
}

const STOPWORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as','is','was','are','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','can','this','that','these','those','i','you','he','she','it','we','they','my','your','his','her','its','our','their','not','also','just','very','which','who','what','when']);

function extractKeywords(texts: string[], limit = 20) {
  const counts = new Map<string, number>();
  texts.forEach(t => t.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).forEach(w => {
    if (w.length > 3 && !STOPWORDS.has(w)) counts.set(w, (counts.get(w)||0)+1);
  }));
  return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0,limit).map(([word,count]) => ({word,count}));
}

const truncate = (s: string, max=40) => s.length <= max ? s : s.slice(0,max-3)+'...';

function generateVisualizations(data: any[], profiles: ColumnProfile[]): VisualizationConfig[] {
  const vizs: VisualizationConfig[] = [];
  const numCols = profiles.filter(p => p.type === 'numeric');
  const catCols = profiles.filter(p => p.type === 'categorical' || p.type === 'boolean');
  const dateCols = profiles.filter(p => p.type === 'date');
  const textCols = profiles.filter(p => p.type === 'text');

  catCols.slice(0,4).forEach((col,i) => {
    const chartData = (col.topValues||[]).map(tv => ({name: truncate(tv.value), value: tv.count}));
    vizs.push({ id:`cat_${i}`, type: col.uniqueCount<=6?'pie':'bar', title: col.name, description:`Distribution of ${col.name}`, data: chartData, xKey:'name', yKey:'value', priority: 10-i });
  });

  numCols.slice(0,3).forEach((col,i) => {
    const vals = data.map(r => Number(r[col.name])).filter(n => !isNaN(n));
    vizs.push({ id:`hist_${i}`, type:'histogram', title:`${col.name} Distribution`, description:`Range: ${col.min?.toFixed(2)} – ${col.max?.toFixed(2)}, Mean: ${col.mean?.toFixed(2)}`, data: buildHistogram(vals,10), xKey:'range', yKey:'count', priority: 8-i });
  });

  if (dateCols.length > 0 && numCols.length > 0) {
    const dc = dateCols[0];
    numCols.slice(0,2).forEach((nc,i) => {
      const grouped = new Map<string, number[]>();
      data.forEach(row => {
        const d = new Date(String(row[dc.name]));
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (!grouped.has(key)) grouped.set(key,[]);
        const val = Number(row[nc.name]);
        if (!isNaN(val)) grouped.get(key)!.push(val);
      });
      const lineData = [...grouped.entries()].sort((a,b) => a[0].localeCompare(b[0])).map(([date,vals]) => ({date, value: parseFloat((vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(2))}));
      if (lineData.length > 1) vizs.push({ id:`trend_${i}`, type:'line', title:`${nc.name} over Time`, description:`Monthly average`, data: lineData, xKey:'date', yKey:'value', priority: 12 });
    });
  }

  if (catCols.length > 0 && numCols.length > 0) {
    const cc = catCols[0], nc = numCols[0];
    const grouped = new Map<string,number[]>();
    data.forEach(row => {
      const cat = truncate(String(row[cc.name]??'Unknown'));
      const val = Number(row[nc.name]);
      if (!isNaN(val)) { if(!grouped.has(cat)) grouped.set(cat,[]); grouped.get(cat)!.push(val); }
    });
    const barData = [...grouped.entries()].map(([name,vals]) => ({name, avg: parseFloat((vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(2)), count: vals.length})).sort((a,b)=>b.avg-a.avg).slice(0,12);
    if (barData.length > 1) vizs.push({ id:'grouped_bar', type:'bar', title:`${nc.name} by ${cc.name}`, description:`Average ${nc.name} per ${cc.name}`, data: barData, xKey:'name', yKey:'avg', priority: 11 });
  }

  if (numCols.length >= 2) {
    const [xc,yc] = numCols;
    const scatterData = data.map(r => ({x: Number(r[xc.name]), y: Number(r[yc.name])})).filter(p => !isNaN(p.x)&&!isNaN(p.y)).slice(0,500);
    if (scatterData.length > 5) vizs.push({ id:'scatter', type:'scatter', title:`${xc.name} vs ${yc.name}`, description:'Correlation scatter plot', data: scatterData, xKey:'x', yKey:'y', priority: 7 });
  }

  textCols.slice(0,2).forEach((col,i) => {
    const responses = data.map(r => String(r[col.name]||'')).filter(s => s.trim().length>3);
    const keywords = extractKeywords(responses, 20);
    if (keywords.length >= 5) vizs.push({ id:`kw_${i}`, type:'keywords', title:`Keywords: ${truncate(col.name,30)}`, description:`Frequent words in ${col.name}`, data: keywords, xKey:'word', yKey:'count', priority: 5 });
  });

  if (numCols.length >= 2) {
    vizs.push({ id:'summary_table', type:'table', title:'Numeric Summary Statistics', description:'Statistical summary for all numeric columns', data: numCols.map(c => ({'Column':c.name,'Min':c.min?.toFixed(2)??'–','Max':c.max?.toFixed(2)??'–','Mean':c.mean?.toFixed(2)??'–','Std Dev':c.stdDev?.toFixed(2)??'–','Non-null':`${c.totalCount-c.nullCount}/${c.totalCount}`})), priority: 4 });
  }

  return vizs.sort((a,b) => b.priority-a.priority);
}

export class DataProcessor {
  processCSVData(data: any[]): ProcessedDataset {
    if (!data || data.length === 0) throw new Error('No data provided');
    const columns = Object.keys(data[0]);
    const columnProfiles = columns.map(col => profileColumn(col, data.map(r => r[col])));
    const visualizations = generateVisualizations(data, columnProfiles);

    const insights = [
      ...columnProfiles.filter(p => p.type==='numeric').slice(0,5).map(c => ({title:`Avg ${c.name}`, value: c.mean?.toFixed(2)??'–'})),
      ...columnProfiles.filter(p => p.type==='categorical'||p.type==='boolean').slice(0,3).map(c => {
        const top = c.topValues?.[0];
        return top ? {title:`Top ${c.name}`, value:`${top.value} (${top.count})`} : null;
      }).filter(Boolean) as any[],
    ];

    const questionTypes: Record<string,number> = {};
    columnProfiles.forEach(p => { questionTypes[p.type] = (questionTypes[p.type]||0)+1; });

    const numCols = columnProfiles.filter(p=>p.type==='numeric').length;
    const catCols = columnProfiles.filter(p=>p.type==='categorical'||p.type==='boolean').length;
    const txtCols = columnProfiles.filter(p=>p.type==='text').length;
    const datCols = columnProfiles.filter(p=>p.type==='date').length;
    const summaryParts = [`Dataset has ${data.length} rows and ${columns.length} columns.`];
    if (numCols) summaryParts.push(`${numCols} numeric column${numCols>1?'s':''} detected.`);
    if (catCols) summaryParts.push(`${catCols} categorical column${catCols>1?'s':''} detected.`);
    if (datCols) summaryParts.push(`${datCols} date column${datCols>1?'s':''} detected.`);
    if (txtCols) summaryParts.push(`${txtCols} free-text column${txtCols>1?'s':''} detected.`);

    return {
      originalData: data, columns, columnProfiles, visualizations,
      insights, summary: summaryParts.join(' '),
      metadata: { totalResponses: data.length, totalQuestions: columns.length, questionTypes },
      classifiedQuestions: [], beforeAfterPairs: [], textAnalyses: new Map(),
    };
  }

  generateVisualizationConfig(processed: ProcessedDataset): any[] {
    return processed.visualizations;
  }

  generateTextReport(processed: ProcessedDataset): string {
    return [
      'CSV INTELLIGENCE DASHBOARD — ANALYSIS REPORT', '='.repeat(60), '',
      `Total Rows: ${processed.metadata.totalResponses}`,
      `Total Columns: ${processed.metadata.totalQuestions}`, '',
      'Column Types:', ...Object.entries(processed.metadata.questionTypes).map(([t,c]) => `  ${t}: ${c}`), '',
      'SUMMARY:', processed.summary, '', 'COLUMN PROFILES:',
      ...processed.columnProfiles.map(p => {
        let l = `  ${p.name} (${p.type})`;
        if (p.type==='numeric') l += ` — min:${p.min?.toFixed(2)} max:${p.max?.toFixed(2)} mean:${p.mean?.toFixed(2)}`;
        if (p.type==='categorical') l += ` — top: ${p.topValues?.slice(0,3).map(v=>`${v.value}(${v.count})`).join(', ')??''}`;
        return l;
      }),
    ].join('\n');
  }
}

export const dataProcessor = new DataProcessor();
