import { Badge } from '@/components/ui/badge'
import type { MemberStatus } from '@/types'

const map: Record<MemberStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active:    { label: 'Ativo',      variant: 'default' },
  inactive:  { label: 'Inativo',    variant: 'secondary' },
  suspended: { label: 'Suspenso',   variant: 'destructive' },
}

export function StatusBadge({ status }: { status: MemberStatus }) {
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}
