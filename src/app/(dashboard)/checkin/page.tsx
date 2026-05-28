'use client'
import dynamic from 'next/dynamic'

const FaceCheckin = dynamic(
  () => import('@/components/facial/FaceCheckin').then(m => m.FaceCheckin),
  { ssr: false }
)

export default function CheckinPage() {
  return <FaceCheckin />
}
