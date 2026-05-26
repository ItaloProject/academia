'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { usePayments } from '@/hooks/usePayments'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { Payment, PaymentStatus } from '@/types'

const statusConfig: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  paid:      { label: 'Pago',      variant: 'default' },
  pending:   { label: 'Pendente',  variant: 'secondary' },
  overdue:   { label: 'Vencido',   variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'outline' },
}

export default function PagamentosPage() {
  const { payments, loading, refetch } = usePayments()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [payDialog, setPayDialog] = useState<Payment | null>(null)
  const [payMethod, setPayMethod] = useState('pix')
  const [saving, setSaving] = useState(false)

  const filtered = statusFilter === 'all'
    ? payments
    : payments.filter(p => p.status === statusFilter)

  async function markPaid() {
    if (!payDialog) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('payments')
      .update({ status: 'paid', paid_date: format(new Date(), 'yyyy-MM-dd'), payment_method: payMethod })
      .eq('id', payDialog.id)
    if (error) toast.error('Erro ao registrar pagamento')
    else { toast.success('Pagamento registrado!'); setPayDialog(null); refetch() }
    setSaving(false)
  }

  return (
    <div>
      <Header title="Pagamentos" />
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex gap-3 items-center">
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="overdue">Vencidos</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{filtered.length} registro(s)</span>
        </div>

        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Pago em</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Nenhum pagamento encontrado
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(p => {
                  const cfg = statusConfig[p.status]
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{(p.member as any)?.name ?? '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{format(new Date(p.due_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-mono">R$ {Number(p.amount).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell">
                        {p.paid_date ? format(new Date(p.paid_date), 'dd/MM/yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        {(p.status === 'pending' || p.status === 'overdue') && (
                          <Button size="sm" variant="outline" onClick={() => { setPayMethod('pix'); setPayDialog(p) }}>
                            <CheckCircle className="mr-1 h-3 w-3" /> Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {payDialog && (
              <p className="text-sm">
                Membro: <strong>{(payDialog.member as any)?.name}</strong><br />
                Valor: <strong>R$ {Number(payDialog.amount).toFixed(2).replace('.', ',')}</strong>
              </p>
            )}
            <div className="space-y-1">
              <Label>Forma de pagamento</Label>
              <Select value={payMethod} onValueChange={v => setPayMethod(v ?? 'pix')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de débito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Cancelar</Button>
            <Button onClick={markPaid} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
