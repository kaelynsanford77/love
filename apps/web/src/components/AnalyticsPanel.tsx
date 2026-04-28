import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PAGE_VIEWS = [
  { date: 'Jan 1', views: 120 },
  { date: 'Jan 2', views: 240 },
  { date: 'Jan 3', views: 180 },
  { date: 'Jan 4', views: 320 },
  { date: 'Jan 5', views: 410 },
  { date: 'Jan 6', views: 290 },
  { date: 'Jan 7', views: 380 },
];

const TOP_PAGES = [
  { page: '/', views: 410 },
  { page: '/dashboard', views: 280 },
  { page: '/settings', views: 150 },
  { page: '/profile', views: 120 },
  { page: '/about', views: 90 },
];

const EVENTS = [
  { name: 'page_view', count: 1940, last_seen: '2 min ago' },
  { name: 'button_click', count: 423, last_seen: '5 min ago' },
  { name: 'form_submit', count: 87, last_seen: '12 min ago' },
  { name: 'sign_up', count: 34, last_seen: '1 hr ago' },
];

export default function AnalyticsPanel() {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[oklch(0.13_0_0)] space-y-4">
      {/* Page views */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Page Views (7 days)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={PAGE_VIEWS}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.65 0 0)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'oklch(0.65 0 0)' }} />
            <Tooltip
              contentStyle={{ background: 'oklch(0.17 0 0)', border: '1px solid oklch(0.3 0 0)', borderRadius: '8px', fontSize: 12 }}
            />
            <Line type="monotone" dataKey="views" stroke="oklch(0.62 0.18 252)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top pages */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Top Pages</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={TOP_PAGES} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fill: 'oklch(0.65 0 0)' }} />
            <YAxis dataKey="page" type="category" tick={{ fontSize: 10, fill: 'oklch(0.65 0 0)' }} width={70} />
            <Tooltip
              contentStyle={{ background: 'oklch(0.17 0 0)', border: '1px solid oklch(0.3 0 0)', borderRadius: '8px', fontSize: 12 }}
            />
            <Bar dataKey="views" fill="oklch(0.62 0.18 252)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Events table */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Events</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left pb-2">Event</th>
              <th className="text-right pb-2">Count</th>
              <th className="text-right pb-2">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((ev) => (
              <tr key={ev.name} className="border-b border-border/50 hover:bg-accent/10 transition-colors">
                <td className="py-2 text-foreground font-mono">{ev.name}</td>
                <td className="py-2 text-right text-primary font-semibold">{ev.count}</td>
                <td className="py-2 text-right text-muted-foreground">{ev.last_seen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
