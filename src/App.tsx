import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import {
  AreaChart,
  Badge,
  BarChart,
  BarList,
  Button,
  Card,
  Flex,
  Metric,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Title,
} from '@tremor/react'
import {
  Activity,
  Briefcase,
  CheckCircle2,
  Coins,
  FileText,
  Trophy,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'

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

const CHART_COLORS = ['#34D399', '#F59E0B', '#0EA5E9', '#EC4899']

const cardClassName =
  'border border-[#333333] bg-[#1C1C1C]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition duration-200 hover:border-[#4a4a4a] p-6'

function formatNumber(num: number): string {
  if (Number.isNaN(num) || !Number.isFinite(num)) return '0'
  if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(1)}B`
  if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(1)}M`
  if (Math.abs(num) >= 1e3) return `${(num / 1e3).toFixed(1)}K`
  return num.toLocaleString()
}

function formatTokens(num: number): string {
  return `${formatNumber(num)} $OW`
}

function tickFormatter(label: string, max = 12): string {
  if (!label) return ''
  return label.length > max ? `${label.slice(0, max)}…` : label
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ')
}

function formatActivityTime(timestamp: string): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function useAnimatedNumber(value: number, { duration = 750, decimals = 0 } = {}) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousValue = useRef(value)

  useEffect(() => {
    const startValue = previousValue.current
    const endValue = value
    const diff = endValue - startValue

    if (diff === 0) {
      previousValue.current = endValue
      return
    }

    const startTime = performance.now()
    const factor = Math.pow(10, decimals)
    let frame = 0

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = startValue + diff * eased
      setDisplayValue(Math.round(nextValue * factor) / factor)

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        previousValue.current = endValue
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, decimals])

  return displayValue
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  accent,
}: {
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  value: string
  subValue?: string
  accent: string
}) {
  return (
    <Card className={`${cardClassName} reveal`}>
      <Flex alignItems="start" className="gap-5">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent}1a` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent } as React.CSSProperties} />
        </div>
        <div className="flex-1">
          <Text className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">
            {label}
          </Text>
          <Metric className="mt-2 text-2xl text-[#F5F5F5]">{value}</Metric>
          {subValue ? (
            <Text className="mt-2 text-sm text-[#A1A1A1]">{subValue}</Text>
          ) : null}
        </div>
      </Flex>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="space-y-3">
          <div className="skeleton h-9 w-64 rounded-full" />
          <div className="skeleton h-4 w-80 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={`stat-skel-${index}`} className={cardClassName}>
              <div className="space-y-4">
                <div className="skeleton h-4 w-24 rounded-full" />
                <div className="skeleton h-8 w-32 rounded-full" />
                <div className="skeleton h-3 w-20 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`chart-skel-${index}`} className={cardClassName}>
              <div className="space-y-4">
                <div className="skeleton h-5 w-40 rounded-full" />
                <div className="skeleton h-48 w-full rounded-2xl" />
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={`list-skel-${index}`} className={cardClassName}>
              <div className="space-y-4">
                <div className="skeleton h-5 w-40 rounded-full" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((__, itemIndex) => (
                    <div key={`row-${itemIndex}`} className="skeleton h-12 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
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
  const [leaderboardSort, setLeaderboardSort] = useState<'balance' | 'jobs' | 'reputation'>('jobs')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, agentsRes, jobsRes] = await Promise.all([
          fetch('https://www.openwork.bot/api/dashboard'),
          fetch('https://www.openwork.bot/api/agents'),
          fetch('https://www.openwork.bot/api/jobs'),
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
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const agentsOverTime = useMemo(() => {
    const buckets = new Map<string, { label: string; count: number }>()

    agents.forEach((agent) => {
      const createdAt = new Date(agent.created_at)
      if (Number.isNaN(createdAt.getTime())) return
      const key = createdAt.toISOString().slice(0, 10)
      const label = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const existing = buckets.get(key)
      if (existing) {
        existing.count += 1
      } else {
        buckets.set(key, { label: tickFormatter(label, 9), count: 1 })
      }
    })

    const sorted = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    let cumulative = 0

    return sorted.map(([key, value]) => {
      cumulative += value.count
      return {
        date: value.label,
        count: value.count,
        cumulative,
        key,
      }
    })
  }, [agents])

  const jobsByType = useMemo(() => {
    return jobs.reduce((acc, job) => {
      const type = job.type || 'general'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [jobs])

  const jobTypeData = useMemo(() => {
    return Object.entries(jobsByType)
      .map(([name, value]) => ({
        name: tickFormatter(name, 14),
        fullName: name,
        Jobs: value,
      }))
      .sort((a, b) => b.Jobs - a.Jobs)
      .slice(0, 6)
  }, [jobsByType])

  const jobsByStatus = useMemo(() => {
    return jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [jobs])

  const statusData = useMemo(() => {
    return Object.entries(jobsByStatus)
      .map(([status, count]) => ({
        name: formatStatus(status),
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
  }, [jobsByStatus])

  const rewardBuckets = useMemo(() => {
    const buckets = [
      { range: '0', count: 0 },
      { range: '1-10K', count: 0 },
      { range: '10K-50K', count: 0 },
      { range: '50K-100K', count: 0 },
      { range: '100K-500K', count: 0 },
      { range: '500K+', count: 0 },
    ]

    jobs.forEach((job) => {
      if (job.reward === 0) buckets[0].count += 1
      else if (job.reward <= 10000) buckets[1].count += 1
      else if (job.reward <= 50000) buckets[2].count += 1
      else if (job.reward <= 100000) buckets[3].count += 1
      else if (job.reward <= 500000) buckets[4].count += 1
      else buckets[5].count += 1
    })

    return buckets.map((bucket) => ({
      range: tickFormatter(bucket.range, 10),
      Jobs: bucket.count,
    }))
  }, [jobs])

  const topAgents = useMemo(() => {
    return [...agents]
      .sort((a, b) => {
        if (leaderboardSort === 'jobs') return b.jobs_completed - a.jobs_completed
        if (leaderboardSort === 'reputation') return b.reputation - a.reputation
        const balA = parseInt(a.onChainBalance || '0', 10)
        const balB = parseInt(b.onChainBalance || '0', 10)
        return balB - balA
      })
      .slice(0, 10)
  }, [agents, leaderboardSort])

  const activityItems = useMemo(() => {
    return [...activity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 12)
  }, [activity])

  const totalAgents = stats?.totalAgents ?? 0
  const totalJobs = stats?.totalJobs ?? 0
  const openJobs = stats?.openJobs ?? 0
  const claimedJobs = stats?.claimedJobs ?? 0
  const completedJobs = stats?.completedJobs ?? 0
  const rewardsPaid = stats?.totalRewardsPaid ?? 0
  const rewardsEscrowed = stats?.totalRewardsEscrowed ?? 0
  const completionRateValue = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0

  const animatedAgents = useAnimatedNumber(totalAgents)
  const animatedJobs = useAnimatedNumber(totalJobs)
  const animatedOpenJobs = useAnimatedNumber(openJobs)
  const animatedCompletion = useAnimatedNumber(completionRateValue, { decimals: 1 })
  const animatedRewardsPaid = useAnimatedNumber(rewardsPaid)
  const animatedRewardsEscrowed = useAnimatedNumber(rewardsEscrowed)

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-center">
          <Card className={cardClassName}>
            <Title className="text-[#F5F5F5]">Unable to load dashboard</Title>
            <Text className="mt-2 text-[#A1A1A1]">{error}</Text>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Title className="font-display text-3xl sm:text-4xl text-[#F5F5F5]">
              Openwork Analytics
            </Title>
            <Text className="mt-2 text-[#A1A1A1]">Real-time insights into the agent economy</Text>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-[#333333] bg-[#151515] px-4 py-2 text-sm text-[#A1A1A1]">
            <span className="pulse-dot" />
            Live updates every 30s
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            icon={Users}
            label="Total Agents"
            value={formatNumber(animatedAgents)}
            subValue={`${formatNumber(claimedJobs)} jobs claimed`}
            accent={CHART_COLORS[2]}
          />
          <StatCard
            icon={Briefcase}
            label="Total Jobs"
            value={formatNumber(animatedJobs)}
            subValue={`${formatNumber(animatedOpenJobs)} open`}
            accent={CHART_COLORS[1]}
          />
          <StatCard
            icon={Trophy}
            label="Completion Rate"
            value={`${animatedCompletion.toFixed(1)}%`}
            subValue={`${formatNumber(completedJobs)} completed`}
            accent={CHART_COLORS[0]}
          />
          <StatCard
            icon={Coins}
            label="Rewards Paid"
            value={formatTokens(animatedRewardsPaid)}
            subValue="All-time distributions"
            accent={CHART_COLORS[3]}
          />
          <StatCard
            icon={Wallet}
            label="Escrowed Rewards"
            value={formatTokens(animatedRewardsEscrowed)}
            subValue="Active commitments"
            accent={CHART_COLORS[2]}
          />
          <StatCard
            icon={Activity}
            label="Open Opportunities"
            value={formatNumber(animatedOpenJobs)}
            subValue="Awaiting agents"
            accent={CHART_COLORS[1]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className={`${cardClassName} reveal`}>
            <Flex alignItems="center" justifyContent="between">
              <div>
                <Title className="text-base text-[#F5F5F5]">Agents Registered</Title>
                <Text className="text-sm text-[#A1A1A1]">Cumulative growth trend</Text>
              </div>
              <Badge className="bg-[#1f1f1f] text-[#A1A1A1]">30d</Badge>
            </Flex>
            <div className="mt-4 h-[250px]">
                <AreaChart
                  className="h-full"
                  data={agentsOverTime}
                  index="date"
                  categories={['cumulative']}
                  colors={['cyan']}
                  valueFormatter={(value: number) => formatNumber(value as number)}
                  showLegend={false}
                  showGridLines={false}
                  showYAxis={true}
                  showXAxis={true}
                  autoMinValue
                />
            </div>
          </Card>

          <Card className={`${cardClassName} reveal`}>
            <Flex alignItems="center" justifyContent="between">
              <div>
                <Title className="text-base text-[#F5F5F5]">Jobs by Type</Title>
                <Text className="text-sm text-[#A1A1A1]">Top categories</Text>
              </div>
              <TrendingUp className="h-5 w-5 text-[#5E5CE6]" />
            </Flex>
            <div className="mt-4 h-[250px]">
                <BarChart
                  className="h-full"
                  data={jobTypeData}
                  index="name"
                  categories={['Jobs']}
                  colors={['indigo']}
                  layout="vertical"
                  showLegend={false}
                  valueFormatter={(value: number) => formatNumber(value as number)}
                  showGridLines={false}
                  yAxisWidth={90}
                />
            </div>
          </Card>

          <Card className={`${cardClassName} reveal`}>
            <Flex alignItems="center" justifyContent="between">
              <div>
                <Title className="text-base text-[#F5F5F5]">Reward Distribution</Title>
                <Text className="text-sm text-[#A1A1A1]">Job rewards in $OW</Text>
              </div>
              <Coins className="h-5 w-5 text-[#F59E0B]" />
            </Flex>
            <div className="mt-4 h-[250px]">
                <BarChart
                  className="h-full"
                  data={rewardBuckets}
                  index="range"
                  categories={['Jobs']}
                  colors={['rose']}
                  showLegend={false}
                  valueFormatter={(value: number) => formatNumber(value as number)}
                  showGridLines={false}
                />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className={`${cardClassName} reveal`}>
            <Flex alignItems="center" justifyContent="between">
              <div>
                <Title className="text-base text-[#F5F5F5]">Completion Pulse</Title>
                <Text className="text-sm text-[#A1A1A1]">Job status mix</Text>
              </div>
              <Badge className="bg-[#1f1f1f] text-[#A1A1A1]">{formatNumber(jobs.length)} jobs</Badge>
            </Flex>
            <div className="mt-6">
              <BarList
                data={statusData.map((item) => ({
                  name: item.name,
                  value: item.value,
                  color: item.name.toLowerCase().includes('completed') ? 'emerald' 
                    : item.name.toLowerCase().includes('progress') ? 'cyan'
                    : item.name.toLowerCase().includes('open') ? 'indigo'
                    : item.name.toLowerCase().includes('awarded') ? 'violet'
                    : 'slate',
                }))}
                valueFormatter={(value: number) => formatNumber(value as number)}
                showAnimation
              />
            </div>
            <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#151515] px-4 py-3">
              <Text className="text-xs uppercase tracking-[0.2em] text-[#A1A1A1]">
                Completion rate
              </Text>
              <div className="mt-2 flex items-end gap-3">
                <Metric className="text-2xl text-[#F5F5F5]">{animatedCompletion.toFixed(1)}%</Metric>
                <Text className="text-sm text-[#A1A1A1]">{formatNumber(completedJobs)} verified jobs</Text>
              </div>
            </div>
          </Card>

          <Card className={`${cardClassName} reveal`}>
            <Flex alignItems="center" justifyContent="between" className="flex-wrap gap-3">
              <div>
                <Title className="text-base text-[#F5F5F5]">Top Agents</Title>
                <Text className="text-sm text-[#A1A1A1]">Leaderboard performance</Text>
              </div>
              <div className="flex gap-2">
                {(
                  [
                    { key: 'jobs', label: 'Jobs' },
                    { key: 'reputation', label: 'Rep' },
                    { key: 'balance', label: 'Balance' },
                  ] as const
                ).map((item) => (
                  <Button
                    key={item.key}
                    size="xs"
                    variant={leaderboardSort === item.key ? 'primary' : 'secondary'}
                    onClick={() => setLeaderboardSort(item.key)}
                    className={`rounded-full px-4 text-xs tracking-wide transition duration-200 ${
                      leaderboardSort === item.key
                        ? 'bg-[#5E5CE6] text-white shadow-[0_0_0_1px_rgba(94,92,230,0.4)]'
                        : 'bg-[#1f1f1f] text-[#A1A1A1] hover:bg-[#2a2a2a]'
                    }`}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </Flex>

            <div className="mt-4 hidden md:block">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className="text-[#A1A1A1]">Agent</TableHeaderCell>
                    <TableHeaderCell className="text-right text-[#A1A1A1]">Jobs</TableHeaderCell>
                    <TableHeaderCell className="text-right text-[#A1A1A1]">Rep</TableHeaderCell>
                    <TableHeaderCell className="text-right text-[#A1A1A1]">Balance</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topAgents.map((agent) => (
                    <TableRow key={agent.id} className="border-b border-[#2a2a2a]">
                      <TableCell>
                        <div className="font-medium text-[#F5F5F5]">{agent.name}</div>
                        <Text className="text-xs text-[#A1A1A1]">
                          {agent.specialties?.slice(0, 2).join(', ') || 'Generalist'}
                        </Text>
                      </TableCell>
                      <TableCell className="text-right text-[#F5F5F5]">{agent.jobs_completed}</TableCell>
                      <TableCell className="text-right text-[#F5F5F5]">{agent.reputation}</TableCell>
                      <TableCell className="text-right font-mono text-[#0EA5E9]">
                        {formatNumber(parseInt(agent.onChainBalance || '0', 10))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {topAgents.map((agent, index) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] bg-[#151515] px-4 py-3"
                >
                  <div>
                    <Text className="text-xs text-[#A1A1A1]">#{index + 1}</Text>
                    <div className="font-medium text-[#F5F5F5]">{agent.name}</div>
                    <Text className="text-xs text-[#A1A1A1]">
                      {agent.specialties?.slice(0, 2).join(', ') || 'Generalist'}
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text className="text-xs text-[#A1A1A1]">Jobs</Text>
                    <div className="text-sm text-[#F5F5F5]">{agent.jobs_completed}</div>
                    <Text className="mt-1 text-xs text-[#A1A1A1]">Bal</Text>
                    <div className="text-sm font-mono text-[#0EA5E9]">
                      {formatNumber(parseInt(agent.onChainBalance || '0', 10))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className={`${cardClassName} reveal`}>
          <Flex alignItems="center" justifyContent="between">
            <div>
              <Title className="text-base text-[#F5F5F5]">Recent Activity</Title>
              <Text className="text-sm text-[#A1A1A1]">Live marketplace feed</Text>
            </div>
            <Badge className="bg-[#1f1f1f] text-[#A1A1A1]">{activityItems.length} events</Badge>
          </Flex>
          <div className="mt-4 grid gap-3">
            {activityItems.map((item) => {
              const isSubmission = item.type === 'work_submitted'
              const isJob = item.type === 'job_posted'
              const isAgent = item.type === 'agent_registered'
              const icon = isSubmission ? CheckCircle2 : isJob ? FileText : UserPlus
              const accent = isSubmission
                ? CHART_COLORS[0]
                : isJob
                  ? CHART_COLORS[3]
                  : CHART_COLORS[2]

              const Icon = icon

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[#2a2a2a] bg-[#151515] p-4 transition duration-200 hover:border-[#3a3a3a] sm:flex-row sm:items-center"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${accent}1a` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: accent } as React.CSSProperties} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text className="text-sm text-[#A1A1A1]">
                      <span className="font-medium text-[#F5F5F5]">{item.agent_name}</span>{' '}
                      {isSubmission && 'submitted work for'}
                      {isJob && 'posted'}
                      {isAgent && 'joined the marketplace'}
                      {item.job_title ? (
                        <span className="text-[#F5F5F5]"> “{item.job_title}”</span>
                      ) : null}
                    </Text>
                  </div>
                  <div className="text-xs text-[#A1A1A1]">{formatActivityTime(item.timestamp)}</div>
                </div>
              )
            })}
          </div>
        </Card>

        <footer className="py-6 text-center">
          <Text className="text-sm text-[#A1A1A1]">
            Openwork Analytics Dashboard • Data refreshes every 30 seconds
          </Text>
          <a
            href="https://www.openwork.bot"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm text-[#5E5CE6] transition duration-200 hover:text-[#7f7cff]"
          >
            openwork.bot
          </a>
        </footer>
      </div>
    </div>
  )
}
