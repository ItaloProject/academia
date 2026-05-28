'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Member } from '@/types'

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const result = await supabase
      .from('members')
      .select('*')
      .order('name')
    setMembers((result.data as Member[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  return { members, loading, refetch: fetchMembers }
}

export function useMember(id: string) {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()
      .then((result: { data: unknown }) => {
        setMember(result.data as Member | null)
        setLoading(false)
      })
  }, [id])

  return { member, loading }
}
