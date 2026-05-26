'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { usePlans } from '@/hooks/usePlans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus, Pencil, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'
import type { Plan } from '@/types'

const emptyForm = { name: '', description: '', duration_days: 30, price: '' }

export default function PlanosPage() {
  const { plans, loading, refetch } = usePlans()
  const [open, setOpen] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  function openNew() { setEditPlan(null); setForm(emptyForm); setOpen(true) }
  function openEdit(p: Plan) {
    setEditPlan(p)
    setForm({ name: p.name, description: p.description ?? '', duration_days: p.duration_days, price: String(p.price) })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.price) { toast.error('Preencha nome e preço'); return }
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: form.name,
      description: form.description || null,
      duration_days: Number(form.duration_days),
      price: parseFloat(String(form.price).replace(',', '.')),
    }
    const { error } = editPlan
      ? await supabase.from('plans').update(payload).eq('id', editPlan.id)
      : await supabase.from('plans').insert(payload)
    if (error) toast.error('Erro ao salvar plano')
    else { toast.success(editPlan ? 'Plano atualizado' : 'Plano criado'); setOpen(false); refetch() }
    setSaving(false)
  }

  async function toggleActive(p: Plan) {
    const supabase = createClient()
    await supabase.from('plans').update({ active: !p.active }).eq('id', p.id)
    refetch()
  }

  return (
    <div>
      <Header title="Planos" actions={
        <Button size="sm" onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo Plano</Button>
      } />
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Duração</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && plans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhum plano cadastrado
                    </TableCell>
                  </TableRow>
                )}
                {plans.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.name}</p>
                      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{p.duration_days} dias</TableCell>
                    <TableCell className="font-mono">R$ {Number(p.price).toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                        <Badge variant={p.active ? 'default' : 'secondary'}>{p.active ? 'Ativo' : 'Inativo'}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Mensal" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Duração (dias) *</Label>
                <Input type="number" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Preço (R$) *</Label>
                <Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="89,90" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
