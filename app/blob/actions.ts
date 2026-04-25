"use server"

import { put } from "@vercel/blob"

export type UploadResult =
  | { url: string; pathname: string; error?: undefined }
  | { error: string; url?: undefined; pathname?: undefined }

export async function uploadBlob(_: unknown, formData: FormData): Promise<UploadResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: "Vercel Blob is not configured on this deployment." }
  }

  const file = formData.get("file")
  if (!file || typeof file === "string") {
    return { error: "No file found in form data." }
  }

  const asFile = file as File

  // Optional safety: prevent zero-byte uploads
  if (asFile.size === 0) {
    return { error: "File is empty." }
  }

  // Store inside a prefixed folder for this app
  const keySafeName = asFile.name.replace(/\s+/g, "-")
  const objectKey = `boomkit/${Date.now()}-${keySafeName}`

  // access: "public" returns a publicly accessible URL
  const { url, pathname } = await put(objectKey, asFile, {
    access: "public",
    // You can set addRandomSuffix: false if you want to control naming strictly
  })

  return { url, pathname }
}
