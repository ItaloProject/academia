'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { loadModels, extractDescriptor, findBestMatch } from '@/lib/face'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, ScanFace } from 'lucide-react'
import type { Member } from '@/types'

type CheckinState = 'loading' | 'scanning' | 'recognized' | 'denied' | 'unknown'

interface CheckinResult {
  member: Member
  allowed: boolean
  reason?: string
}

const SCAN_INTERVAL_MS = 1500

export function FaceCheckin() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<CheckinState>('loading')
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processingRef = useRef(false)

  const stopInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  const showResult = useCallback((r: CheckinResult) => {
    setState(r.allowed ? 'recognized' : 'denied')
    setResult(r)
    stopInterval()
    setTimeout(() => {
      setState('scanning')
      setResult(null)
      startScanInterval()
    }, 4000)
  }, [stopInterval]) // eslint-disable-line

  const processFrame = useCallback(async () => {
    if (processingRef.current || !videoRef.current || allMembers.length === 0) return
    processingRef.current = true
    try {
      const descriptor = await extractDescriptor(videoRef.current)
      if (!descriptor) return

      const match = findBestMatch(descriptor, allMembers)
      if (!match) { setState('unknown'); return }

      setState('scanning')
      const supabase = createClient()
      const today = new Date().toISOString().slice(0, 10)
      const { data: activePlan } = await supabase
        .from('member_plans')
        .select('id')
        .eq('member_id', match.member.id)
        .eq('status', 'active')
        .gte('end_date', today)
        .limit(1)
        .single()

      const allowed = !!activePlan
      await supabase.from('access_logs').insert({
        member_id: match.member.id,
        method: 'facial',
        allowed,
        notes: allowed ? null : 'Plano inativo ou vencido',
      })

      showResult({
        member: match.member,
        allowed,
        reason: allowed ? undefined : 'Plano vencido ou inativo',
      })
    } finally {
      processingRef.current = false
    }
  }, [allMembers, showResult])

  function startScanInterval() {
    stopInterval()
    intervalRef.current = setInterval(processFrame, SCAN_INTERVAL_MS)
  }

  useEffect(() => {
    let mounted = true
    async function init() {
      const supabase = createClient()
      const [, membersResult] = await Promise.all([
        loadModels(),
        supabase.from('members').select('*').eq('status', 'active').not('face_descriptor', 'is', null),
      ])
      if (!mounted) return
      setAllMembers((membersResult.data as Member[]) ?? [])

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setState('scanning')
      } catch {
        setState('unknown')
      }
    }
    init()
    return () => { mounted = false; stopInterval(); streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [stopInterval])

  useEffect(() => {
    if (state === 'scanning') startScanInterval()
    else stopInterval()
  }, [state, stopInterval]) // eslint-disable-line

  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden">
      {/* Webcam feed */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-80" />

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6">
        {state === 'loading' && (
          <div className="bg-black/70 rounded-2xl p-8 text-center text-white space-y-3">
            <Loader2 className="h-12 w-12 animate-spin mx-auto" />
            <p className="text-lg font-medium">Iniciando reconhecimento facial…</p>
          </div>
        )}

        {state === 'scanning' && (
          <div className="bg-black/50 rounded-2xl p-6 text-center text-white space-y-2">
            <ScanFace className="h-10 w-10 mx-auto animate-pulse" />
            <p className="text-base font-medium">Aproxime o rosto da câmera</p>
          </div>
        )}

        {state === 'unknown' && (
          <div className="bg-black/70 rounded-2xl p-6 text-center text-white space-y-2">
            <XCircle className="h-10 w-10 mx-auto text-yellow-400" />
            <p className="text-base font-medium text-yellow-300">Rosto não identificado</p>
          </div>
        )}

        {(state === 'recognized' || state === 'denied') && result && (
          <div className={`rounded-2xl p-8 text-center space-y-4 shadow-2xl w-full max-w-sm ${
            result.allowed ? 'bg-green-900/90 text-green-50' : 'bg-red-900/90 text-red-50'
          }`}>
            {result.allowed
              ? <CheckCircle2 className="h-12 w-12 mx-auto text-green-400" />
              : <XCircle className="h-12 w-12 mx-auto text-red-400" />
            }
            <Avatar className="h-20 w-20 mx-auto border-4 border-white/20">
              <AvatarImage src={result.member.photo_url ?? undefined} />
              <AvatarFallback className="text-2xl bg-white/10 text-white">
                {result.member.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{result.member.name}</h2>
              {result.allowed
                ? <p className="text-green-300 text-sm mt-1">Acesso autorizado</p>
                : <p className="text-red-300 text-sm mt-1">{result.reason ?? 'Acesso negado'}</p>
              }
            </div>
            <Badge variant="outline" className={`text-sm ${result.allowed ? 'border-green-400 text-green-300' : 'border-red-400 text-red-300'}`}>
              {result.allowed ? '✓ ENTRADA LIBERADA' : '✗ ACESSO NEGADO'}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
