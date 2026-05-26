'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from './StatusBadge'
import { MoreHorizontal, Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import type { Member } from '@/types'

interface MemberTableProps {
  members: Member[]
  onRefetch: () => void
}

export function MemberTable({ members, onRefetch }: MemberTableProps) {
  const [search, setSearch] = useState('')
  const router = useRouter()

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.cpf ?? '').includes(search) ||
    (m.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir membro "${name}"? Esta ação não pode ser desfeita.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) toast.error('Erro ao excluir membro')
    else { toast.success('Membro excluído'); onRefetch() }
  }

  async function handleStatus(id: string, status: Member['status']) {
    const supabase = createClient()
    const { error } = await supabase.from('members').update({ status }).eq('id', id)
    if (error) toast.error('Erro ao atualizar status')
    else { toast.success('Status atualizado'); onRefetch() }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou e-mail…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/membros/novo">
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Membro
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead className="hidden md:table-cell">CPF</TableHead>
              <TableHead className="hidden sm:table-cell">Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  Nenhum membro encontrado
                </TableCell>
              </TableRow>
            )}
            {filtered.map(m => (
              <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/membros/${m.id}`)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={m.photo_url ?? undefined} />
                      <AvatarFallback>{m.name.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">{m.cpf ?? '—'}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm">{m.phone ?? '—'}</TableCell>
                <TableCell><StatusBadge status={m.status} /></TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/membros/${m.id}`)}>Ver detalhes</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/membros/${m.id}?edit=1`)}>Editar</DropdownMenuItem>
                      {m.status !== 'active' && (
                        <DropdownMenuItem onClick={() => handleStatus(m.id, 'active')}>Ativar</DropdownMenuItem>
                      )}
                      {m.status === 'active' && (
                        <DropdownMenuItem onClick={() => handleStatus(m.id, 'suspended')}>Suspender</DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(m.id, m.name)}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} membro(s)</p>
    </div>
  )
}
