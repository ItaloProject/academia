'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { AccessChart } from '@/components/dashboard/AccessChart'
import { Users, Dumbbell, AlertCircle, DoorOpen } from 'lucide-react'
import type { AccessLog } from '@/types'

interface Stats {
  totalMembers: number
  activeMembers: number
  activePlans: number
  overduePayments: number
  todayAccess: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const today = new Date().toISOString().slice(0, 10)

      const [membersRes, activePlansRes, overdueRes, accessRes, logsRes] = await Promise.all([
        supabase.from('members').select('id, status'),
        supabase.from('member_plans').select('id', { count: 'exact' }).eq('status', 'active').gte('end_date', today),
        supabase.from('payments').select('id', { count: 'exact' }).eq('status', 'overdue'),
        supabase.from('access_logs').select('id', { count: 'exact' }).gte('accessed_at', today + 'T00:00:00').eq('allowed', true),
        supabase.from('access_logs').select('*').order('accessed_at', { ascending: false }).limit(100),
      ])

      const members = membersRes.data ?? []
      setStats({
        totalMembers: members.length,
        activeMembers: members.filter(m => m.status === 'active').length,
        activePlans: activePlansRes.count ?? 0,
        overduePayments: overdueRes.count ?? 0,
        todayAccess: accessRes.count ?? 0,
      })
      setLogs((logsRes.data as AccessLog[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total de Membros" value={stats?.totalMembers ?? 0} icon={Users} loading={loading} />
          <StatsCard title="Membros Ativos" value={stats?.activeMembers ?? 0} icon={Users} loading={loading} />
          <StatsCard title="Planos Ativos" value={stats?.activePlans ?? 0} icon={Dumbbell} loading={loading} />
          <StatsCard
            title="Pagamentos Vencidos"
            value={stats?.overduePayments ?? 0}
            icon={AlertCircle}
            loading={loading}
            className={stats?.overduePayments ? 'border-destructive/50' : ''}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <AccessChart logs={logs} />
          </div>
          <StatsCard
            title="Entradas Hoje"
            value={stats?.todayAccess ?? 0}
            description="Reconhecimentos autorizados"
            icon={DoorOpen}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
