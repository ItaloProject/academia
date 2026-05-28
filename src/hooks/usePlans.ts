'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Plan } from '@/types'

const DEMO_PLANS: Plan[] = [
  { id: 'demo-mensal',    name: 'Mensal',    description: 'Acesso por 30 dias',   duration_days: 30,  price: 89.90,  active: true, created_at: '' },
  { id: 'demo-trimestral',name: 'Trimestral',description: 'Acesso por 90 dias',   duration_days: 90,  price: 239.90, active: true, created_at: '' },
  { id: 'demo-semestral', name: 'Semestral', description: 'Acesso por 180 dias',  duration_days: 180, price: 419.90, active: true, created_at: '' },
  { id: 'demo-anual',     name: 'Anual',     description: 'Acesso por 365 dias',  duration_days: 365, price: 749.90, active: true, created_at: '' },
]

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL

export function usePlans(onlyActive = false) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    if (IS_DEMO) {
      setPlans(DEMO_PLANS)
      setLoading(false)
      return
    }
    const supabase = createClient()
    let q = supabase.from('plans').select('*').order('price')
    if (onlyActive) q = q.eq('active', true)
    const result = await q
    setPlans((result.data as Plan[]) ?? [])
    setLoading(false)
  }, [onlyActive])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  return { plans, loading, refetch: fetchPlans }
}
