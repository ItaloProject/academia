'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { usePlans } from '@/hooks/usePlans'
import { Header } from '@/components/layout/Header'
import { MemberForm, type MemberFormData } from '@/components/members/MemberForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, CalendarDays, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { addDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const FaceEnroll = dynamic(
  () => import('@/components/facial/FaceEnroll').then(m => m.FaceEnroll),
  { ssr: false }
)

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL

const PAYMENT_METHODS = [
  { value: 'pix',            label: 'PIX' },
  { value: 'dinheiro',       label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito',  label: 'Cartão de Débito' },
  { value: 'boleto',         label: 'Boleto' },
]

export default function NovoMembroPage() {
  const router = useRouter()
  const { plans, loading: plansLoading } = usePlans(true)

  const [tab, setTab] = useState('dados')
  const [savingMember, setSavingMember] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)

  const [memberId, setMemberId] = useState<string | null>(null)
  const [memberName, setMemberName] = useState('')

  // Plano
  const [planId, setPlanId] = useState('')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [paymentMethod, setPaymentMethod] = useState('')

  const selectedPlan = plans.find(p => p.id === planId)
  const endDate = selectedPlan
    ? format(addDays(new Date(startDate + 'T12:00:00'), selectedPlan.duration_days), 'yyyy-MM-dd')
    : ''

  async function handleSaveMember(data: MemberFormData) {
    setSavingMember(true)
    const supabase = createClient()
    const payload = {
      ...data,
      email:      data.email      || null,
      cpf:        data.cpf        || null,
      phone:      data.phone      || null,
      birth_date: data.birth_date || null,
      notes:      data.notes      || null,
    }
    const result = await supabase.from('members').insert(payload).select().single()

    if (result.error) {
      toast.error('Erro ao cadastrar membro: ' + result.error.message)
      setSavingMember(false)
      return
    }

    const id = (result.data as { id: string } | null)?.id ?? crypto.randomUUID()
    setMemberId(id)
    setMemberName(data.name)
    toast.success('Dados salvos! Agora selecione o plano.')
    setTab('plano')
    setSavingMember(false)
  }

  async function handleSavePlan() {
    if (!planId) { toast.error('Selecione um plano'); return }
    if (!paymentMethod) { toast.error('Selecione a forma de pagamento'); return }
    if (!memberId) return

    setSavingPlan(true)

    if (!IS_DEMO) {
      const supabase = createClient()
      const mpResult = await supabase
        .from('member_plans')
        .insert({ member_id: memberId, plan_id: planId, start_date: startDate, end_date: endDate, status: 'active' })
        .select()
        .single()

      if (mpResult.error) {
        toast.error('Erro ao vincular plano')
        setSavingPlan(false)
        return
      }

      await supabase.from('payments').insert({
        member_id: memberId,
        member_plan_id: (mpResult.data as { id: string }).id,
        amount: selectedPlan!.price,
        due_date: startDate,
        payment_method: paymentMethod,
        status: 'pending',
      })
    }

    toast.success(`Plano ${selectedPlan?.name} vinculado! Agora cadastre o rosto.`)
    setTab('facial')
    setSavingPlan(false)
  }

  function handleSkipPlan() {
    toast.info('Plano não vinculado. Você pode adicionar depois.')
    setTab('facial')
  }

  return (
    <div>
      <Header title="Novo Membro" />
      <div className="p-4 lg:p-6 max-w-2xl">
        <Tabs value={tab} onValueChange={v => v && setTab(v)}>
          <TabsList className="mb-4">
            <TabsTrigger value="dados">
              1. Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="plano" disabled={!memberId}>
              2. Plano &amp; Pagamento
            </TabsTrigger>
            <TabsTrigger value="facial" disabled={!memberId}>
              3. Cadastro Facial
            </TabsTrigger>
          </TabsList>

          {/* ── ETAPA 1: Dados pessoais ── */}
          <TabsContent value="dados">
            <Card>
              <CardHeader><CardTitle>Informações do Membro</CardTitle></CardHeader>
              <CardContent>
                <MemberForm onSubmit={handleSaveMember} loading={savingMember} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ETAPA 2: Plano & Pagamento ── */}
          <TabsContent value="plano">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Plano &amp; Forma de Pagamento
                </CardTitle>
                {memberName && (
                  <p className="text-sm text-muted-foreground">Membro: <strong>{memberName}</strong></p>
                )}
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Seleção de plano */}
                <div className="space-y-1">
                  <Label>Plano *</Label>
                  {plansLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando planos…
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {plans.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPlanId(p.id)}
                          className={`text-left rounded-lg border p-4 transition-all hover:border-primary ${
                            planId === p.id
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{p.name}</p>
                              {p.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" /> {p.duration_days} dias
                              </p>
                            </div>
                            <Badge variant={planId === p.id ? 'default' : 'secondary'} className="shrink-0">
                              R$ {Number(p.price).toFixed(2).replace('.', ',')}
                            </Badge>
                          </div>
                          {planId === p.id && (
                            <CheckCircle className="h-4 w-4 text-primary mt-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Datas */}
                {selectedPlan && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Data de início *</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Vencimento</Label>
                      <Input
                        type="text"
                        readOnly
                        value={endDate ? format(new Date(endDate + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : ''}
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* Forma de pagamento */}
                <div className="space-y-1">
                  <Label>Forma de Pagamento *</Label>
                  <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione como vai pagar" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resumo */}
                {selectedPlan && paymentMethod && (
                  <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
                    <p className="font-medium">Resumo</p>
                    <p>Plano: <strong>{selectedPlan.name}</strong></p>
                    <p>Valor: <strong>R$ {Number(selectedPlan.price).toFixed(2).replace('.', ',')}</strong></p>
                    <p>Pagamento: <strong>{PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}</strong></p>
                    {endDate && (
                      <p>Válido até: <strong>{format(new Date(endDate + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</strong></p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSavePlan} disabled={savingPlan}>
                    {savingPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar Plano
                  </Button>
                  <Button variant="ghost" onClick={handleSkipPlan} disabled={savingPlan}>
                    Pular por agora
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ETAPA 3: Cadastro Facial ── */}
          <TabsContent value="facial">
            {memberId && (
              <Card>
                <CardHeader><CardTitle>Cadastro de Reconhecimento Facial</CardTitle></CardHeader>
                <CardContent>
                  <FaceEnroll
                    memberId={memberId}
                    onDone={() => router.push(IS_DEMO ? '/membros' : `/membros/${memberId}`)}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
