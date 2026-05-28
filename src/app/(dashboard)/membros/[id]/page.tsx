'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { MemberForm, type MemberFormData } from '@/components/members/MemberForm'
import { FaceEnroll } from '@/components/facial/FaceEnroll'
import { StatusBadge } from '@/components/members/StatusBadge'
import { PlanAssignDialog } from '@/components/members/PlanAssignDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Edit2, ScanFace, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMember } from '@/hooks/useMembers'
import type { MemberPlan, Payment } from '@/types'

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { member, loading } = useMember(id)
  const [tab, setTab] = useState(searchParams.get('edit') ? 'editar' : 'info')
  const [saving, setSaving] = useState(false)
  const [memberPlans, setMemberPlans] = useState<MemberPlan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [showPlanDialog, setShowPlanDialog] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('member_plans').select('*, plan:plans(*)').eq('member_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setMemberPlans((data as MemberPlan[]) ?? []))
    supabase.from('payments').select('*, member_plan:member_plans(*, plan:plans(name))').eq('member_id', id).order('due_date', { ascending: false })
      .then(({ data }) => setPayments((data as Payment[]) ?? []))
  }, [id])

  async function handleEdit(data: MemberFormData) {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('members').update({
      ...data,
      email: data.email || null,
      cpf: data.cpf || null,
      phone: data.phone || null,
      birth_date: data.birth_date || null,
      notes: data.notes || null,
    }).eq('id', id)
    if (error) toast.error('Erro ao salvar')
    else { toast.success('Salvo com sucesso'); router.refresh(); setTab('info') }
    setSaving(false)
  }

  if (loading) return (
    <div>
      <Header title="Membro" />
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )

  if (!member) return (
    <div>
      <Header title="Membro" />
      <div className="p-6"><p>Membro não encontrado.</p></div>
    </div>
  )

  return (
    <div>
      <Header title={member.name} actions={
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      } />
      <div className="p-4 lg:p-6 max-w-3xl space-y-4">
        {/* Profile card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={member.photo_url ?? undefined} />
                <AvatarFallback className="text-xl">{member.name.slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold">{member.name}</h2>
                <p className="text-sm text-muted-foreground">{member.email ?? '—'}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <StatusBadge status={member.status} />
                  {member.face_descriptor && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <ScanFace className="h-3 w-3" /> Facial cadastrado
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setTab('editar')}>
                  <Edit2 className="mr-1 h-4 w-4" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPlanDialog(true)}>
                  <PlusCircle className="mr-1 h-4 w-4" /> Plano
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={v => v && setTab(v)}>
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="planos">Planos</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="facial">Facial</TabsTrigger>
            <TabsTrigger value="editar">Editar</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card><CardContent className="pt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  ['CPF', member.cpf],
                  ['Telefone', member.phone],
                  ['Nascimento', member.birth_date ? format(new Date(member.birth_date), 'dd/MM/yyyy') : null],
                  ['Cadastrado em', format(new Date(member.created_at), 'dd/MM/yyyy', { locale: ptBR })],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value ?? '—'}</dd>
                  </div>
                ))}
                {member.notes && (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Observações</dt>
                    <dd>{member.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="planos">
            <Card><CardContent className="pt-6">
              {memberPlans.length === 0
                ? <p className="text-muted-foreground text-sm">Nenhum plano vinculado.</p>
                : <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plano</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberPlans.map(mp => (
                        <TableRow key={mp.id}>
                          <TableCell>{(mp.plan as any)?.name ?? '—'}</TableCell>
                          <TableCell>{format(new Date(mp.start_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{format(new Date(mp.end_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={mp.status === 'active' ? 'default' : 'secondary'}>
                              {mp.status === 'active' ? 'Ativo' : mp.status === 'expired' ? 'Expirado' : 'Cancelado'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              }
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="pagamentos">
            <Card><CardContent className="pt-6">
              {payments.length === 0
                ? <p className="text-muted-foreground text-sm">Nenhum pagamento registrado.</p>
                : <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pago em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{format(new Date(p.due_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>R$ {Number(p.amount).toFixed(2).replace('.', ',')}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'paid' ? 'default' : p.status === 'overdue' ? 'destructive' : 'secondary'}>
                              {p.status === 'paid' ? 'Pago' : p.status === 'overdue' ? 'Vencido' : p.status === 'pending' ? 'Pendente' : 'Cancelado'}
                            </Badge>
                          </TableCell>
                          <TableCell>{p.paid_date ? format(new Date(p.paid_date), 'dd/MM/yyyy') : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              }
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="facial">
            <Card>
              <CardHeader><CardTitle>Reconhecimento Facial</CardTitle></CardHeader>
              <CardContent>
                <FaceEnroll memberId={id} onDone={() => setTab('info')} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editar">
            <Card>
              <CardHeader><CardTitle>Editar Membro</CardTitle></CardHeader>
              <CardContent>
                <MemberForm
                  defaultValues={{
                    name: member.name,
                    email: member.email ?? '',
                    cpf: member.cpf ?? '',
                    phone: member.phone ?? '',
                    birth_date: member.birth_date ?? '',
                    status: member.status,
                    notes: member.notes ?? '',
                  }}
                  onSubmit={handleEdit}
                  loading={saving}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showPlanDialog && (
        <PlanAssignDialog
          memberId={id}
          onClose={() => setShowPlanDialog(false)}
          onDone={() => {
            setShowPlanDialog(false)
            setTab('planos')
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
