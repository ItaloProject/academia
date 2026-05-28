'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AccessLog } from '@/types'

export function useAccessLogs() {
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const result = await supabase
      .from('access_logs')
      .select('*, member:members(id,name,photo_url)')
      .order('accessed_at', { ascending: false })
      .limit(200)
    setLogs((result.data as AccessLog[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return { logs, loading, refetch: fetchLogs }
}
