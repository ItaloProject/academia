'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { subDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AccessLog } from '@/types'

interface AccessChartProps {
  logs: AccessLog[]
}

export function AccessChart({ logs }: AccessChartProps) {
  const data = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dayStr = format(date, 'yyyy-MM-dd')
    const count = logs.filter(l => l.accessed_at.startsWith(dayStr) && l.allowed).length
    return { day: format(date, 'EEE', { locale: ptBR }), count }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Entradas — Últimos 7 dias</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <Bar dataKey="count" name="Entradas" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
