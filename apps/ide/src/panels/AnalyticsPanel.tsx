import React from 'react';
import { useStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart2, TrendingUp, Users, Zap, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AnalyticsData {
  pageViews: { date: string; views: number; unique: number }[];
  topRoutes: { route: string; count: number }[];
  buildTimes: { label: string; ms: number }[];
  apiCalls: { hour: string; count: number }[];
  stats: {
    totalViews: number;
    uniqueVisitors: number;
    avgResponseMs: number;
    buildCount: number;
  };
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const mockData: AnalyticsData = {
  pageViews: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    views: Math.floor(Math.random() * 200 + 50),
    unique: Math.floor(Math.random() * 120 + 20),
  })),
  topRoutes: [
    { route: '/', count: 345 },
    { route: '/about', count: 120 },
    { route: '/dashboard', count: 89 },
    { route: '/settings', count: 45 },
    { route: '/api/users', count: 210 },
  ],
  buildTimes: Array.from({ length: 10 }, (_, i) => ({
    label: `#${i + 1}`,
    ms: Math.floor(Math.random() * 4000 + 800),
  })),
  apiCalls: Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    count: Math.floor(Math.random() * 80 + 5),
  })),
  stats: {
    totalViews: 1847,
    uniqueVisitors: 432,
    avgResponseMs: 124,
    buildCount: 28,
  },
};

function StatCard({
  icon,
  label,
  value,
  sub,
  color = 'text-primary',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function AnalyticsPanel() {
  const { projectId } = useStore();

  const { data = mockData, isLoading, refetch } = useQuery({
    queryKey: ['analytics', projectId],
    queryFn: async () => {
      try {
        const res = await api.get<AnalyticsData>(
          `/analytics?projectId=${encodeURIComponent(projectId)}`
        );
        return res ?? mockData;
      } catch {
        return mockData;
      }
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="flex flex-col h-full bg-background overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Analytics</span>
          <Badge variant="secondary" className="text-xs">
            {projectId}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Total Views"
            value={data.stats.totalViews.toLocaleString()}
            sub="Last 14 days"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Unique Visitors"
            value={data.stats.uniqueVisitors.toLocaleString()}
            color="text-green-400"
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Avg Response"
            value={`${data.stats.avgResponseMs}ms`}
            color="text-yellow-400"
          />
          <StatCard
            icon={<Zap className="h-4 w-4" />}
            label="Total Builds"
            value={data.stats.buildCount}
            color="text-purple-400"
          />
        </div>

        {/* Page views chart */}
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm font-semibold mb-4">Page Views (14 days)</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data.pageViews}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="uniqueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#viewsGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="unique" stroke="#8b5cf6" fill="url(#uniqueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top routes */}
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm font-semibold mb-4">Top Routes</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.topRoutes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                dataKey="route"
                type="category"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Build times */}
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm font-semibold mb-4">Build Times (ms)</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data.buildTimes}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line type="monotone" dataKey="ms" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
