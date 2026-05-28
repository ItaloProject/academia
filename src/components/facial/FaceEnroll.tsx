'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { loadModels, extractDescriptor } from '@/lib/face'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Camera, CheckCircle, ScanFace } from 'lucide-react'
import { toast } from 'sonner'

interface FaceEnrollProps {
  memberId: string
  onDone: () => void
}

export function FaceEnroll({ memberId, onDone }: FaceEnrollProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [step, setStep] = useState<'idle' | 'loading' | 'camera' | 'capturing' | 'saving' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  async function startCamera() {
    setError(null)
    setStep('loading')
    try {
      await loadModels()
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setStep('camera')
    } catch {
      setError('Não foi possível acessar a câmera. Verifique as permissões.')
      setStep('idle')
    }
  }

  async function capture() {
    if (!videoRef.current) return
    setStep('capturing')
    setError(null)
    try {
      const descriptor = await extractDescriptor(videoRef.current)
      if (!descriptor) {
        setError('Rosto não detectado. Centralize seu rosto na câmera e tente novamente.')
        setStep('camera')
        return
      }
      setStep('saving')
      stopCamera()
      const supabase = createClient()
      const { error: dbErr } = await supabase
        .from('members')
        .update({ face_descriptor: descriptor })
        .eq('id', memberId)
      // Em modo demo (sem Supabase), ignora erro de banco e conclui normalmente
      if (dbErr && process.env.NEXT_PUBLIC_SUPABASE_URL) throw dbErr
      setStep('done')
      toast.success('Rosto cadastrado com sucesso!')
    } catch {
      setError('Erro ao processar imagem. Tente novamente.')
      setStep('camera')
    }
  }

  return (
    <div className="space-y-4">
      {step === 'idle' && (
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ScanFace className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Capture uma foto do rosto do membro para habilitar o reconhecimento facial na entrada.
          </p>
          <Button onClick={startCamera}>
            <Camera className="mr-2 h-4 w-4" /> Abrir câmera
          </Button>
        </div>
      )}

      {step === 'loading' && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Carregando modelos de IA…</p>
        </div>
      )}

      {(step === 'camera' || step === 'capturing') && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-md mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-4 border-primary/40 rounded-lg pointer-events-none" />
          </div>
          <div className="flex justify-center gap-3">
            <Button onClick={capture} disabled={step === 'capturing'}>
              {step === 'capturing'
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Detectando…</>
                : <><ScanFace className="mr-2 h-4 w-4" /> Capturar rosto</>
              }
            </Button>
            <Button variant="outline" onClick={() => { stopCamera(); setStep('idle') }}>Cancelar</Button>
          </div>
        </div>
      )}

      {step === 'saving' && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm">Salvando dados faciais…</p>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center space-y-4 py-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <p className="font-medium">Rosto cadastrado com sucesso!</p>
          <Button onClick={onDone}>Concluir</Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
