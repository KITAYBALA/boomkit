"use server"

import { put } from "@vercel/blob"
import { verifySession } from '@/lib/auth-server'
import { randomUUID } from 'node:crypto'

export type UploadResult =
  | { url: string; pathname: string; error?: undefined }
  | { error: string; url?: undefined; pathname?: undefined }

export async function uploadBlob(_: unknown, formData: FormData): Promise<UploadResult> {
  const session = await verifySession()
  if (!session || (!session.isOwner && !['owner', 'admin'].includes(session.role))) {
    return { error: 'Only administrators can upload files.' }
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: "Vercel Blob is not configured on this deployment." }
  }

  const file = formData.get("file")
  if (!file || typeof file === "string") {
    return { error: "No file found in form data." }
  }

  const asFile = file as File

  // Optional safety: prevent zero-byte uploads
  if (asFile.size === 0 || asFile.size > 5 * 1024 * 1024) {
    return { error: "Images must be between 1 byte and 5 MB." }
  }

  const bytes = new Uint8Array(await asFile.arrayBuffer())
  const png = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  const webp = bytes.length >= 12 && Buffer.from(bytes.subarray(0, 4)).toString() === 'RIFF' && Buffer.from(bytes.subarray(8, 12)).toString() === 'WEBP'
  const extension = png ? 'png' : jpeg ? 'jpg' : webp ? 'webp' : null
  if (!extension) return { error: 'Only PNG, JPEG and WebP images are allowed.' }

  // Store inside a prefixed folder for this app
  const objectKey = `boomkit/${session.userId}/${randomUUID()}.${extension}`

  // access: "public" returns a publicly accessible URL
  const { url, pathname } = await put(objectKey, asFile, {
    access: "public",
    contentType: jpeg ? 'image/jpeg' : `image/${extension}`,
    // You can set addRandomSuffix: false if you want to control naming strictly
  })

  return { url, pathname }
}
