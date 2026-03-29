import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { VisualizationConfig } from '../lib/dataProcessor';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16'];

const tooltipStyle = { contentStyle: { backgroundColor:'#1f2937', border:'1px solid #374151', borderRadius:'8px', color:'#fff' } };
const axisProps = { stroke:'#9ca3af', tick:{ fill:'#9ca3af', fontSize:11 } };

export function UniversalChart({ viz }: { viz: VisualizationConfig }) {
  switch (viz.type) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={viz.data} margin={{top:10,right:20,left:10,bottom:60}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
            <XAxis dataKey={viz.xKey} angle={-40} textAnchor="end" height={80} {...axisProps}/>
            <YAxis {...axisProps}/>
            <Tooltip {...tooltipStyle}/>
            <Bar dataKey={viz.yKey||'value'} fill="#3b82f6" radius={[4,4,0,0]}>
              {viz.data.map((_:any,i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );

    case 'histogram':
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={viz.data} margin={{top:10,right:20,left:10,bottom:70}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
            <XAxis dataKey="range" angle={-40} textAnchor="end" height={90} {...axisProps}/>
            <YAxis {...axisProps}/>
            <Tooltip {...tooltipStyle}/>
            <Bar dataKey="count" fill="#6366f1" radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={viz.data} margin={{top:10,right:20,left:10,bottom:30}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
            <XAxis dataKey={viz.xKey} {...axisProps}/>
            <YAxis {...axisProps}/>
            <Tooltip {...tooltipStyle}/>
            <Line type="monotone" dataKey={viz.yKey||'value'} stroke="#3b82f6" strokeWidth={2} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      );

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={viz.data} cx="50%" cy="50%" outerRadius={110} dataKey="value"
              label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
              {viz.data.map((_:any,i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Pie>
            <Tooltip {...tooltipStyle}/>
          </PieChart>
        </ResponsiveContainer>
      );

    case 'scatter':
      return (
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{top:10,right:20,left:10,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
            <XAxis dataKey="x" name={viz.xKey} {...axisProps}/>
            <YAxis dataKey="y" name={viz.yKey} {...axisProps}/>
            <Tooltip cursor={{strokeDasharray:'3 3'}} {...tooltipStyle}/>
            <Scatter data={viz.data} fill="#8b5cf6" opacity={0.7}/>
          </ScatterChart>
        </ResponsiveContainer>
      );

    case 'keywords':
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={viz.data} layout="vertical" margin={{top:10,right:20,left:100,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
            <XAxis type="number" {...axisProps}/>
            <YAxis type="category" dataKey="word" width={90} {...axisProps}/>
            <Tooltip {...tooltipStyle}/>
            <Bar dataKey="count" fill="#f59e0b" radius={[0,4,4,0]}/>
          </BarChart>
        </ResponsiveContainer>
      );

    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-700">
                {Object.keys(viz.data[0]||{}).map(k => (
                  <th key={k} className="py-2 px-3 text-gray-400 font-medium">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {viz.data.map((row:any, i:number) => (
                <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                  {Object.values(row).map((val:any, j:number) => (
                    <td key={j} className="py-2 px-3 text-gray-200">{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return <p className="text-gray-500 text-sm">Unsupported chart type: {viz.type}</p>;
  }
}

// Legacy exports (kept for compat)
export function ImprovementChart({ data }: { data: any[] }) {
  return <UniversalChart viz={{ id:'imp', type:'bar', title:'', description:'', data, xKey:'question', yKey:'after', priority:0 }}/>;
}
export function ScoresChart({ data }: { data: any[] }) {
  return <UniversalChart viz={{ id:'sc', type:'bar', title:'', description:'', data, xKey:'question', yKey:'score', priority:0 }}/>;
}
export function DistributionChart({ data }: { data: any[] }) {
  return <UniversalChart viz={{ id:'dist', type:'pie', title:'', description:'', data, xKey:'name', yKey:'value', priority:0 }}/>;
}
export function KeywordsChart({ data }: { data: any[] }) {
  return <UniversalChart viz={{ id:'kw', type:'keywords', title:'', description:'', data, xKey:'word', yKey:'count', priority:0 }}/>;
}
