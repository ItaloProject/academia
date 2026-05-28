'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { MemberForm, type MemberFormData } from '@/components/members/MemberForm'

const FaceEnroll = dynamic(
  () => import('@/components/facial/FaceEnroll').then(m => m.FaceEnroll),
  { ssr: false }
)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export default function NovoMembroPage() {
  const [loading, setLoading] = useState(false)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [tab, setTab] = useState('dados')
  const router = useRouter()

  async function handleSave(data: MemberFormData) {
    setLoading(true)
    const supabase = createClient()
    const payload = {
      ...data,
      email: data.email || null,
      cpf: data.cpf || null,
      phone: data.phone || null,
      birth_date: data.birth_date || null,
      notes: data.notes || null,
    }
    const result = await supabase
      .from('members')
      .insert(payload)
      .select()
      .single()

    if (result.error) {
      toast.error('Erro ao cadastrar membro: ' + result.error.message)
    } else {
      setMemberId((result.data as { id: string }).id)
      toast.success('Membro cadastrado! Agora cadastre o rosto.')
      setTab('facial')
    }
    setLoading(false)
  }

  return (
    <div>
      <Header title="Novo Membro" />
      <div className="p-4 lg:p-6 max-w-2xl">
        <Tabs value={tab} onValueChange={v => v && setTab(v)}>
          <TabsList className="mb-4">
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="facial" disabled={!memberId}>Cadastro Facial</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <Card>
              <CardHeader><CardTitle>Informações do Membro</CardTitle></CardHeader>
              <CardContent>
                <MemberForm onSubmit={handleSave} loading={loading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facial">
            {memberId && (
              <Card>
                <CardHeader><CardTitle>Cadastro de Reconhecimento Facial</CardTitle></CardHeader>
                <CardContent>
                  <FaceEnroll
                    memberId={memberId}
                    onDone={() => router.push(`/membros/${memberId}`)}
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
