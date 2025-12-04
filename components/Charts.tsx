import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, Legend
} from 'recharts';
import { DataItem } from '../types';

interface ChartProps {
  data: DataItem[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const SalesTrendChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => val.substring(5)} />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
          itemStyle={{ color: '#f8fafc' }}
        />
        <Line type="monotone" dataKey="sales" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8' }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const CategoryPieChart: React.FC<ChartProps> = ({ data }) => {
  // Aggregate data by category
  const aggregated = data.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.sales;
    return acc;
  }, {});
  
  const chartData = Object.keys(aggregated).map(key => ({
    name: key,
    value: aggregated[key]
  }));

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

export const RegionBarChart: React.FC<ChartProps> = ({ data }) => {
  // Aggregate by region
   const aggregated = data.reduce((acc: any, curr) => {
    acc[curr.region] = (acc[curr.region] || 0) + curr.units_sold;
    return acc;
  }, {});
  
  const chartData = Object.keys(aggregated).map(key => ({
    name: key,
    units: aggregated[key]
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} cursor={{fill: '#334155', opacity: 0.4}}/>
        <Bar dataKey="units" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const SalesDistributionChart: React.FC<ChartProps> = ({ data }) => {
  // Just showing sales over time as an area chart for distribution feel
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#94a3b8" hide />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
        <Area type="monotone" dataKey="sales" stroke="#14b8a6" fillOpacity={1} fill="url(#colorSales)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};
