import * as faceapi from 'face-api.js'
import type { Member } from '@/types'

const MATCH_THRESHOLD = 0.5

export async function extractDescriptor(
  input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<number[] | null> {
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()
  if (!detection) return null
  return Array.from(detection.descriptor)
}

export function findBestMatch(
  descriptor: number[],
  members: Member[]
): { member: Member; distance: number } | null {
  const queryDescriptor = new Float32Array(descriptor)
  let best: { member: Member; distance: number } | null = null

  for (const member of members) {
    if (!member.face_descriptor) continue
    const stored = new Float32Array(member.face_descriptor)
    const distance = faceapi.euclideanDistance(queryDescriptor, stored)
    if (distance <= MATCH_THRESHOLD && (!best || distance < best.distance)) {
      best = { member, distance }
    }
  }
  return best
}
