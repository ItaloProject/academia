'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { Member } from '@/types'

const schema = z.object({
  name:       z.string().min(2, 'Nome obrigatório'),
  email:      z.string().email('E-mail inválido').or(z.literal('')).optional(),
  cpf:        z.string().optional(),
  phone:      z.string().optional(),
  birth_date: z.string().optional(),
  status:     z.enum(['active', 'inactive', 'suspended']),
  notes:      z.string().optional(),
})

export type MemberFormData = z.infer<typeof schema>

interface MemberFormProps {
  defaultValues?: Partial<MemberFormData>
  onSubmit: (data: MemberFormData) => Promise<void>
  loading?: boolean
}

export function MemberForm({ defaultValues, onSubmit, loading }: MemberFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MemberFormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active', ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor="name">Nome completo *</Label>
          <Input id="name" {...register('name')} placeholder="João da Silva" />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" {...register('email')} placeholder="joao@email.com" />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" {...register('cpf')} placeholder="000.000.000-00" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" {...register('phone')} placeholder="(11) 9 0000-0000" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="birth_date">Data de nascimento</Label>
          <Input id="birth_date" type="date" {...register('birth_date')} />
        </div>

        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={watch('status')} onValueChange={v => v && setValue('status', v as MemberFormData['status'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" {...register('notes')} placeholder="Informações adicionais..." rows={3} />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar
      </Button>
    </form>
  )
}
