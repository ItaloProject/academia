'use client'
import { Header } from '@/components/layout/Header'
import { useAccessLogs } from '@/hooks/useAccess'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AcessosPage() {
  const { logs, loading } = useAccessLogs()

  return (
    <div>
      <Header title="Log de Acessos" />
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="pt-4">
            {loading
              ? <div className="space-y-2">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-12 w-full"/>)}</div>
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead className="hidden sm:table-cell">Data/Hora</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                          Nenhum acesso registrado
                        </TableCell>
                      </TableRow>
                    )}
                    {logs.map(log => {
                      const member = (log.member as any)
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {member && (
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={member.photo_url} />
                                  <AvatarFallback className="text-xs">{member.name?.slice(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                              )}
                              <span className="text-sm font-medium">{member?.name ?? 'Desconhecido'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {format(new Date(log.accessed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {log.method === 'facial' ? '🔍 Facial' : '👤 Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.allowed ? 'default' : 'destructive'}>
                              {log.allowed ? '✓ Autorizado' : '✗ Negado'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
