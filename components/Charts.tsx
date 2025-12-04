
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, Legend
} from 'recharts';
import { DataItem } from '../types';

interface ChartProps {
  data: DataItem[];
  xKey: string;
  yKey: string;
  categoryKey: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#EF4444', '#8B5CF6'];

export const SalesTrendChart: React.FC<ChartProps> = ({ data, xKey, yKey }) => {
  if (!xKey || !yKey) return <div className="text-slate-500 flex items-center justify-center h-full">Insufficient data for chart</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey={xKey} 
          stroke="#94a3b8" 
          fontSize={12} 
          tickFormatter={(val) => typeof val === 'string' && val.length > 10 ? val.substring(0, 10) : val}
        />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
          itemStyle={{ color: '#f8fafc' }}
        />
        <Line type="monotone" dataKey={yKey} stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8' }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const CategoryPieChart: React.FC<ChartProps> = ({ data, categoryKey, yKey }) => {
  if (!categoryKey || !yKey) return <div className="text-slate-500 flex items-center justify-center h-full">Insufficient data for chart</div>;

  // Aggregate data by category
  const aggregated = data.reduce((acc: any, curr) => {
    const cat = String(curr[categoryKey] || 'Unknown');
    const val = Number(curr[yKey] || 0);
    acc[cat] = (acc[cat] || 0) + val;
    return acc;
  }, {});
  
  const chartData = Object.keys(aggregated).map(key => ({
    name: key,
    value: aggregated[key]
  })).sort((a, b) => b.value - a.value).slice(0, 8); // Top 8

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const RegionBarChart: React.FC<ChartProps> = ({ data, categoryKey, yKey }) => {
  if (!categoryKey || !yKey) return <div className="text-slate-500 flex items-center justify-center h-full">Insufficient data for chart</div>;

  // Aggregate by category
   const aggregated = data.reduce((acc: any, curr) => {
    const cat = String(curr[categoryKey] || 'Unknown');
    const val = Number(curr[yKey] || 0);
    acc[cat] = (acc[cat] || 0) + val;
    return acc;
  }, {});
  
  const chartData = Object.keys(aggregated).map(key => ({
    name: key,
    value: aggregated[key]
  })).slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} cursor={{fill: '#334155', opacity: 0.4}}/>
        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const SalesDistributionChart: React.FC<ChartProps> = ({ data, xKey, yKey }) => {
  if (!yKey) return <div className="text-slate-500 flex items-center justify-center h-full">Insufficient data for chart</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey={xKey || 'index'} stroke="#94a3b8" hide />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
        <Area type="monotone" dataKey={yKey} stroke="#14b8a6" fillOpacity={1} fill="url(#colorValue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};
