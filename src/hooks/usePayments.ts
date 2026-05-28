'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Payment } from '@/types'

export function usePayments(memberId?: string) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('payments')
      .select('*, member:members(id,name,photo_url), member_plan:member_plans(id,start_date,end_date,plan:plans(name))')
      .order('due_date', { ascending: false })
    if (memberId) q = q.eq('member_id', memberId)
    const result = await q
    setPayments((result.data as Payment[]) ?? [])
    setLoading(false)
  }, [memberId])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  return { payments, loading, refetch: fetchPayments }
}
