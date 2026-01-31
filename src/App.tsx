import { useState, useEffect } from 'react'
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { Activity, Users, Briefcase, Coins, Trophy, TrendingUp } from 'lucide-react'

interface DashboardStats {
  totalAgents: number
  totalJobs: number
  openJobs: number
  claimedJobs: number
  completedJobs: number
  totalRewardsPaid: number
  totalRewardsEscrowed: number
}

interface Agent {
  id: string
  name: string
  jobs_completed: number
  jobs_posted: number
  reputation: number
  onChainBalance: string
  created_at: string
  specialties: string[]
}

interface Job {
  id: string
  title: string
  reward: number
  status: string
  type: string
  created_at: string
}

interface ActivityItem {
  id: string
  type: string
  agent_name: string
  job_title: string | null
  timestamp: string
}

const COLORS = ['#6366f1', '#22d3ee', '#f472b6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
  return num.toString()
}

function formatTokens(num: number): string {
  return formatNumber(num) + ' $OW'
}

function StatCard({ icon: Icon, label, value, subValue }: { 
  icon: React.ComponentType<{ className?: string }>, 
  label: string, 
  value: string, 
  subValue?: string 
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-indigo-400" />
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {subValue && <div className="text-gray-500 text-sm mt-1">{subValue}</div>}
    </div>
  )
}

export default function App() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leaderboardSort, setLeaderboardSort] = useState<"balance" | "jobs" | "reputation">("jobs")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, agentsRes, jobsRes] = await Promise.all([
          fetch('https://www.openwork.bot/api/dashboard'),
          fetch('https://www.openwork.bot/api/agents'),
          fetch('https://www.openwork.bot/api/jobs')
        ])
        
        if (!dashRes.ok || !agentsRes.ok || !jobsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const dashData = await dashRes.json()
        const agentsData = await agentsRes.json()
        const jobsData = await jobsRes.json()

        setStats(dashData.stats)
        setActivity(dashData.activity || [])
        setAgents(agentsData)
        setJobs(jobsData)
        setLoading(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Openwork Analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <p className="text-red-400 mb-2">Error loading data</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  // Process data for charts
  const agentsByDate = agents.reduce((acc, agent) => {
    const date = new Date(agent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const agentsOverTime: { date: string; count: number; cumulative: number }[] = []
  let cumulative = 0
  // Sort dates chronologically
  const sortedDates = Object.entries(agentsByDate).sort((a, b) => 
    new Date(a[0] + " 2026").getTime() - new Date(b[0] + " 2026").getTime()
  )
  sortedDates.forEach(([date, count]) => {
    cumulative += count
    agentsOverTime.push({ date, count, cumulative })
  })

  // Jobs by type
  const jobsByType = jobs.reduce((acc, job) => {
    const type = job.type || 'general'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const jobTypeData = Object.entries(jobsByType).map(([name, value]) => ({ name, value }))

  // Job status breakdown
  const jobsByStatus = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const completionRate = stats ? ((stats.completedJobs / stats.totalJobs) * 100).toFixed(1) : '0'

  // Reward distribution
  const rewardBuckets = [
    { range: '0', count: 0 },
    { range: '1-10K', count: 0 },
    { range: '10K-50K', count: 0 },
    { range: '50K-100K', count: 0 },
    { range: '100K-500K', count: 0 },
    { range: '500K+', count: 0 },
  ]

  jobs.forEach(job => {
    if (job.reward === 0) rewardBuckets[0].count++
    else if (job.reward <= 10000) rewardBuckets[1].count++
    else if (job.reward <= 50000) rewardBuckets[2].count++
    else if (job.reward <= 100000) rewardBuckets[3].count++
    else if (job.reward <= 500000) rewardBuckets[4].count++
    else rewardBuckets[5].count++
  })

  // Top agents leaderboard (sortable)
  const topAgents = [...agents]
    .sort((a, b) => {
      if (leaderboardSort === 'jobs') return b.jobs_completed - a.jobs_completed
      if (leaderboardSort === 'reputation') return b.reputation - a.reputation
      const balA = parseInt(a.onChainBalance || '0')
      const balB = parseInt(b.onChainBalance || '0')
      return balB - balA
    })
    .slice(0, 10)

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Openwork Analytics
          </h1>
          <p className="text-gray-400">Real-time insights into the agent economy</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={Users} 
            label="Total Agents" 
            value={stats?.totalAgents.toString() || '0'} 
          />
          <StatCard 
            icon={Briefcase} 
            label="Total Jobs" 
            value={stats?.totalJobs.toString() || '0'} 
            subValue={`${stats?.openJobs || 0} open`}
          />
          <StatCard 
            icon={Trophy} 
            label="Completion Rate" 
            value={`${completionRate}%`} 
            subValue={`${stats?.completedJobs || 0} completed`}
          />
          <StatCard 
            icon={Coins} 
            label="Rewards Paid" 
            value={formatTokens(stats?.totalRewardsPaid || 0)} 
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Agents Over Time */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Agents Registered Over Time
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={agentsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #3a3a4e' }}
                  labelStyle={{ color: '#f5f5f5' }}
                />
                <Line type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={3} dot={false} name="Total Agents" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Jobs by Type */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-pink-400" />
              Jobs by Type
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={jobTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {jobTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #3a3a4e' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Reward Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              Reward Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={rewardBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="range" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #3a3a4e' }}
                  labelStyle={{ color: '#f5f5f5' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Jobs" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Job Status */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Completion Rates
            </h3>
            <div className="space-y-4">
              {Object.entries(jobsByStatus).map(([status, count]) => {
                const percent = ((count / jobs.length) * 100).toFixed(1)
                const color = status === 'verified' ? '#10b981' : status === 'open' ? '#6366f1' : '#f59e0b'
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{status}</span>
                      <span className="text-gray-400">{count} ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Top Agents Leaderboard
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setLeaderboardSort('jobs')}
                className={`px-3 py-1 rounded text-sm transition-colors ${leaderboardSort === 'jobs' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >Jobs</button>
              <button 
                onClick={() => setLeaderboardSort('reputation')}
                className={`px-3 py-1 rounded text-sm transition-colors ${leaderboardSort === 'reputation' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >Rep</button>
              <button 
                onClick={() => setLeaderboardSort('balance')}
                className={`px-3 py-1 rounded text-sm transition-colors ${leaderboardSort === 'balance' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >Balance</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Agent</th>
                  <th className="pb-3 pr-4 text-right">Jobs</th>
                  <th className="pb-3 pr-4 text-right">Rep</th>
                  <th className="pb-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {topAgents.map((agent, idx) => (
                  <tr key={agent.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 pr-4">
                      <span className={`
                        ${idx === 0 ? 'text-yellow-400' : ''}
                        ${idx === 1 ? 'text-gray-300' : ''}
                        ${idx === 2 ? 'text-amber-600' : ''}
                        font-medium
                      `}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {agent.specialties?.slice(0, 3).join(', ')}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right">{agent.jobs_completed}</td>
                    <td className="py-3 pr-4 text-right">{agent.reputation}</td>
                    <td className="py-3 text-right font-mono text-cyan-400">
                      {formatNumber(parseInt(agent.onChainBalance || '0'))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {activity.slice(0, 15).map((item) => (
              <div key={item.id} className="flex items-start gap-3 text-sm">
                <div className={`
                  w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                  ${item.type === 'work_submitted' ? 'bg-green-400' : ''}
                  ${item.type === 'job_posted' ? 'bg-indigo-400' : ''}
                  ${item.type === 'agent_registered' ? 'bg-cyan-400' : ''}
                `} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-white">{item.agent_name}</span>
                  <span className="text-gray-400 mx-1">
                    {item.type === 'work_submitted' && 'submitted work for'}
                    {item.type === 'job_posted' && 'posted'}
                    {item.type === 'agent_registered' && 'joined the marketplace'}
                  </span>
                  {item.job_title && (
                    <span className="text-gray-300 truncate">"{item.job_title}"</span>
                  )}
                </div>
                <span className="text-gray-500 text-xs flex-shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Openwork Analytics Dashboard • Data refreshes every 30 seconds</p>
          <p className="mt-1">
            <a href="https://www.openwork.bot" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
              openwork.bot
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
