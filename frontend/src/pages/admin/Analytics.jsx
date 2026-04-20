import { useEffect, useState } from 'react'
import api from '../../api/api'
import Navbar from '../../components/Navbar'

function useFetch(url) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  useEffect(() => {
    api.get(url)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [url])
  return { data, loading, error }
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-xs text-slate-300 mt-0.5">{sub}</p>}
    </div>
  )
}

function Card({ title, subtitle, children, loading, error, accent = '#6366f1' }) {
  const corner = { width: 18, height: 18, borderWidth: 2.5, borderColor: accent }
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm relative">
      {/* top-left corner */}
      <span style={{ position:'absolute', top:10, left:10, width:corner.width, height:corner.height,
        borderTop:`${corner.borderWidth}px solid ${corner.borderColor}`,
        borderLeft:`${corner.borderWidth}px solid ${corner.borderColor}`,
        borderRadius:'4px 0 0 0', pointerEvents:'none' }} />
      {/* bottom-right corner */}
      <span style={{ position:'absolute', bottom:10, right:10, width:corner.width, height:corner.height,
        borderBottom:`${corner.borderWidth}px solid ${corner.borderColor}`,
        borderRight:`${corner.borderWidth}px solid ${corner.borderColor}`,
        borderRadius:'0 0 4px 0', pointerEvents:'none' }} />

      <div className="px-6 pt-5 pb-4">
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 pb-6">
        {loading && <p className="text-xs text-slate-400 py-6 text-center">Loading…</p>}
        {error   && <p className="text-xs text-red-400 py-6 text-center">{error}</p>}
        {!loading && !error && children}
      </div>
    </div>
  )
}

function HourlyChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const hasData = data.some(d => d.count > 0)
  return (
    <div>
      <div className="flex items-end gap-px h-28">
        {data.map(d => {
          const isPeak = d.count === max && hasData
          const pct = hasData ? Math.max((d.count / max) * 100, d.count > 0 ? 6 : 0) : 0
          return (
            <div key={d.hour} className="flex-1 flex flex-col items-center justify-end group relative">
              <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-slate-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                  {String(d.hour).padStart(2, '0')}:00 · {d.count}
                </div>
                <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-1" />
              </div>
              <div
                className="w-full rounded-t-sm transition-all duration-700"
                style={{
                  height: pct > 0 ? `${pct}%` : '2px',
                  background: isPeak ? '#6366f1' : '#e0e7ff',
                  minHeight: '2px',
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex mt-1.5">
        {data.map(d => (
          <div key={d.hour} className="flex-1 text-center">
            {[0, 6, 12, 18, 23].includes(d.hour) && (
              <span className="text-xs text-slate-300">{String(d.hour).padStart(2, '0')}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DailyChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const hasData = data.some(d => d.count > 0)
  return (
    <div className="flex flex-col gap-2.5">
      {data.map(d => {
        const isPeak = d.count === max && hasData
        return (
          <div key={d.day} className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400 w-7 shrink-0">{d.day}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(d.count / max) * 100}%`,
                  background: isPeak ? '#8b5cf6' : '#ddd6fe',
                }}
              />
            </div>
            <span className={`text-xs w-5 text-right shrink-0 font-semibold ${isPeak && hasData ? 'text-violet-600' : 'text-slate-400'}`}>
              {d.count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function Analytics() {
  const hourly    = useFetch('/api/admin/analytics/usage-by-hour')
  const daily     = useFetch('/api/admin/analytics/usage-by-day')
  const topUsers  = useFetch('/api/admin/analytics/top-users')
  const occupancy = useFetch('/api/admin/analytics/occupancy-duration')
  const longOcc   = useFetch('/api/admin/analytics/long-occupancy')

  const hourlyData = (hourly.data || []).map(d => ({ ...d, label: String(d.hour).padStart(2, '0') }))

  const totalEvents  = hourlyData.reduce((s, d) => s + d.count, 0)
  const busiestHourD = hourlyData.reduce((b, d) => d.count > b.count ? d : b, { hour: -1, count: 0 })
  const busiestDayD  = (daily.data || []).reduce((b, d) => d.count > b.count ? d : b, { day: '—', count: 0 })
  const topUser      = (topUsers.data || [])[0]

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <Navbar />

      <div className="bg-white border-b border-slate-100 px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800">Analytics</h2>
          <p className="text-sm text-slate-400 mt-0.5">Derived from locker usage history</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Events"
            value={hourly.loading ? '—' : totalEvents}
          />
          <StatCard
            label="Busiest Hour"
            value={busiestHourD.count > 0 ? `${String(busiestHourD.hour).padStart(2, '0')}:00` : '—'}
            sub={busiestHourD.count > 0 ? `${busiestHourD.count} events` : 'No data yet'}
          />
          <StatCard
            label="Busiest Day"
            value={busiestDayD.count > 0 ? busiestDayD.day : '—'}
            sub={busiestDayD.count > 0 ? `${busiestDayD.count} events` : 'No data yet'}
          />
          <StatCard
            label="Most Active"
            value={topUser ? topUser.name.split(' ')[0] : '—'}
            sub={topUser ? `${topUser.usageCount} uses` : 'No data yet'}
          />
        </div>

        {/* Hourly + Daily */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Usage by Hour" subtitle="Events per hour of day — hover for details" accent="#6366f1" loading={hourly.loading} error={hourly.error}>
            <HourlyChart data={hourlyData} />
          </Card>
          <Card title="Usage by Day" subtitle="Events per day of week" accent="#8b5cf6" loading={daily.loading} error={daily.error}>
            <DailyChart data={(daily.data || []).map(d => ({ day: d.day, count: d.count }))} />
          </Card>
        </div>

        {/* Top Users */}
        <Card title="Top Users" subtitle="Students ranked by total locker activity" accent="#10b981" loading={topUsers.loading} error={topUsers.error}>
          {topUsers.data && topUsers.data.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No registered-card usage recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {(topUsers.data || []).map((u, i) => {
                const maxCount = topUsers.data[0]?.usageCount || 1
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm w-6 shrink-0 text-center">{medals[i] || <span className="text-xs text-slate-300 font-bold">{i + 1}</span>}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-700">{u.name}</span>
                        <span className="text-xs text-slate-400">{u.usageCount} uses</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{ width: `${(u.usageCount / maxCount) * 100}%`, background: '#10b981' }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-300 font-mono shrink-0">{u.studentNumber}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Occupancy + Long Occupancy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Avg Occupancy Duration" subtitle="Average time a locker is held per session" accent="#6366f1" loading={occupancy.loading} error={occupancy.error}>
            <div className="flex flex-col divide-y divide-slate-50">
              {(occupancy.data || []).map(l => (
                <div key={l.lockerId} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{l.lockerId}</p>
                    <p className="text-xs text-slate-400">{l.location}</p>
                  </div>
                  {l.avgMinutes > 0 ? (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">{l.avgMinutes}<span className="text-xs font-normal text-slate-400 ml-1">min</span></p>
                      <p className="text-xs text-slate-400">avg per session</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 italic">No sessions yet</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Long Occupancy Alerts" subtitle="Lockers held longer than 2 hours" accent="#f59e0b" loading={longOcc.loading} error={longOcc.error}>
            {longOcc.data && longOcc.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-lg">✓</div>
                <p className="text-xs text-slate-400">No issues detected</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {(longOcc.data || []).map(l => (
                  <div key={l.lockerId} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-amber-800">{l.lockerId}</p>
                      <p className="text-xs text-amber-500">{l.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-amber-600">{l.minutesOccupied}<span className="text-xs font-normal ml-0.5">min</span></p>
                      <p className="text-xs text-amber-400">over threshold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
