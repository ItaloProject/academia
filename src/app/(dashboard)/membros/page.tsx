'use client'
import { Header } from '@/components/layout/Header'
import { MemberTable } from '@/components/members/MemberTable'
import { useMembers } from '@/hooks/useMembers'
import { Skeleton } from '@/components/ui/skeleton'

export default function MembrosPage() {
  const { members, loading, refetch } = useMembers()

  return (
    <div>
      <Header title="Membros" />
      <div className="p-4 lg:p-6">
        {loading
          ? <div className="space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-12 w-full"/>)}</div>
          : <MemberTable members={members} onRefetch={refetch} />
        }
      </div>
    </div>
  )
}
