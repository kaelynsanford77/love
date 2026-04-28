import { useState, useEffect } from 'react'
import { usageApi } from '../lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Loader2, TrendingUp, DollarSign, Hash, Zap } from 'lucide-react'

interface UsageDashboardProps {
  projectId?: string
  onClose: () => void
}

export default function UsageDashboard({ projectId, onClose }: UsageDashboardProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [projectId])

  async function loadData() {
    setLoading(true)
    try {
      const result = await usageApi.get(projectId)
      setData(result)
    } catch {}
    finally { setLoading(false) }
  }

  const totals = data?.totals || {}
  const timeline = data?.timeline || []
  const byModel = data?.byModel || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#888]" />
            <h2 className="text-base font-semibold">Usage Dashboard</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#e8e8e8]">✕</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#555]" size={24} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Turns', value: totals.turn_count || 0, icon: Hash, color: '#6b9fff' },
                { label: 'Tokens In', value: (totals.total_tokens_in || 0).toLocaleString(), icon: Zap, color: '#6bcb77' },
                { label: 'Tokens Out', value: (totals.total_tokens_out || 0).toLocaleString(), icon: Zap, color: '#ffd166' },
                { label: 'Total Cost', value: `$${(totals.total_cost_usd || 0).toFixed(4)}`, icon: DollarSign, color: '#c77dff' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} style={{ color }} />
                    <span className="text-xs text-[#555]">{label}</span>
                  </div>
                  <p className="text-xl font-semibold text-[#e8e8e8]">{value}</p>
                </div>
              ))}
            </div>

            {/* Timeline chart */}
            {timeline.length > 0 && (
              <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
                <h3 className="text-sm font-medium text-[#888] mb-4">Daily Cost (30 days)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={timeline}>
                    <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#555', fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(3)}`} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
                      labelStyle={{ color: '#888' }}
                      itemStyle={{ color: '#e8e8e8' }}
                    />
                    <Bar dataKey="daily_cost" fill="oklch(0.55 0.18 265)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* By model */}
            {byModel.length > 0 && (
              <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
                <h3 className="text-sm font-medium text-[#888] mb-4">Usage by Model</h3>
                <div className="space-y-3">
                  {byModel.map((row: any) => (
                    <div key={row.model} className="flex items-center gap-3">
                      <span className="text-xs text-[#888] font-mono w-36 truncate">{row.model || 'unknown'}</span>
                      <div className="flex-1 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (row.model_turns / (totals.turn_count || 1)) * 100)}%`,
                            background: 'oklch(0.55 0.18 265)',
                          }}
                        />
                      </div>
                      <span className="text-xs text-[#555] w-16 text-right">{row.model_turns} turns</span>
                      <span className="text-xs text-[#555] w-20 text-right">${(row.total_cost_usd || 0).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
