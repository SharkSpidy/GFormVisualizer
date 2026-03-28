import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface ImprovementChartProps {
  data: any[];
}

export function ImprovementChart({ data }: ImprovementChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="question"
          angle={-45}
          textAnchor="end"
          height={100}
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
        />
        <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Legend wrapperStyle={{ color: '#9ca3af' }} />
        <Bar dataKey="before" fill="#ef4444" name="Before" />
        <Bar dataKey="after" fill="#10b981" name="After" />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ScoresChartProps {
  data: any[];
}

export function ScoresChart({ data }: ScoresChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 150, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
        <YAxis
          type="category"
          dataKey="question"
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          width={140}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Bar dataKey="score" fill="#3b82f6" name="Average Score" />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DistributionChartProps {
  data: any[];
}

export function DistributionChart({ data }: DistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface KeywordsChartProps {
  data: { word: string; count: number }[];
}

export function KeywordsChart({ data }: KeywordsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="word"
          angle={-45}
          textAnchor="end"
          height={100}
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
        />
        <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Bar dataKey="count" fill="#8b5cf6" name="Frequency" />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface TrendChartProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
}

export function TrendChart({ data, dataKey, xAxisKey }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey={xAxisKey} stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
        <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
