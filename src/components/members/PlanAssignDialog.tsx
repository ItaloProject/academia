'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePlans } from '@/hooks/usePlans'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { addDays, format } from 'date-fns'

interface Props {
  memberId: string
  onClose: () => void
  onDone: () => void
}

export function PlanAssignDialog({ memberId, onClose, onDone }: Props) {
  const { plans } = usePlans(true)
  const [planId, setPlanId] = useState('')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)

  const selectedPlan = plans.find(p => p.id === planId)
  const endDate = selectedPlan
    ? format(addDays(new Date(startDate), selectedPlan.duration_days), 'yyyy-MM-dd')
    : ''

  async function handleSubmit() {
    if (!planId) { toast.error('Selecione um plano'); return }
    setLoading(true)
    const supabase = createClient()

    const { data: mp, error: mpErr } = await supabase
      .from('member_plans')
      .insert({ member_id: memberId, plan_id: planId, start_date: startDate, end_date: endDate })
      .select()
      .single()

    if (mpErr) { toast.error('Erro ao vincular plano'); setLoading(false); return }

    await supabase.from('payments').insert({
      member_id: memberId,
      member_plan_id: mp.id,
      amount: selectedPlan!.price,
      due_date: startDate,
    })

    toast.success('Plano vinculado e cobrança gerada!')
    onDone()
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Vincular Plano</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Plano</Label>
            <Select value={planId} onValueChange={v => setPlanId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — R$ {Number(p.price).toFixed(2).replace('.', ',')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Data de início</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          {endDate && (
            <p className="text-sm text-muted-foreground">
              Vencimento: <strong>{format(new Date(endDate), 'dd/MM/yyyy')}</strong>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
