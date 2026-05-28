'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Plan } from '@/types'

export function usePlans(onlyActive = false) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
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
