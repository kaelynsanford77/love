import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { TokenUsage } from '../../types';

interface TokenDashboardProps {
  usage: TokenUsage[];
}

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

export default function TokenDashboard({ usage }: TokenDashboardProps) {
  // Aggregate by date
  const dailyData = usage.reduce<Record<string, { date: string; tokens: number; cost: number }>>((acc, u) => {
    if (!acc[u.date]) acc[u.date] = { date: u.date, tokens: 0, cost: 0 };
    acc[u.date].tokens += u.promptTokens + u.completionTokens;
    acc[u.date].cost += u.cost;
    return acc;
  }, {});
  const dailyChart = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

  // Aggregate by model
  const modelData = usage.reduce<Record<string, { model: string; tokens: number; cost: number }>>((acc, u) => {
    if (!acc[u.model]) acc[u.model] = { model: u.model, tokens: 0, cost: 0 };
    acc[u.model].tokens += u.promptTokens + u.completionTokens;
    acc[u.model].cost += u.cost;
    return acc;
  }, {});
  const modelChart = Object.values(modelData);

  const totalTokens = usage.reduce((s, u) => s + u.promptTokens + u.completionTokens, 0);
  const totalCost = usage.reduce((s, u) => s + u.cost, 0);

  return (
    <div className="h-full bg-gray-900 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 size={20} /> Token Usage Dashboard
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-500">Total Tokens</p>
          <p className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-500">Total Cost</p>
          <p className="text-2xl font-bold text-green-400">${totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-500">Models Used</p>
          <p className="text-2xl font-bold text-purple-400">{modelChart.length}</p>
        </div>
      </div>

      {/* Daily usage chart */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Tokens per Day</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Bar dataKey="tokens" fill="#8b5cf6" name="Tokens" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost per day */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Cost per Day ($)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#e5e7eb' }}
              formatter={(value) => [`$${Number(value).toFixed(4)}`, 'Cost']}
            />
            <Bar dataKey="cost" fill="#10b981" name="Cost ($)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Model breakdown */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Model Breakdown</h3>
        <div className="flex items-center gap-8">
          <ResponsiveContainer width="50%" height={200}>
            <PieChart>
              <Pie data={modelChart} dataKey="tokens" nameKey="model" cx="50%" cy="50%" outerRadius={80} label>
                {modelChart.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {modelChart.map((m, i) => (
              <div key={m.model} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm text-gray-300">{m.model}</span>
                <span className="text-xs text-gray-500">({m.tokens.toLocaleString()} tokens)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
