import { list } from "@vercel/blob"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BlobUploader } from "@/components/blob-uploader"

export const metadata = {
  title: "Blob Uploads | Boomkit",
}

export const dynamic = "force-dynamic"

export default async function BlobPage() {
  // List existing blobs under our 'boomkit/' prefix. This runs on the server.
  const blobs = await getStoredBlobs()

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Vercel Blob uploads</h1>
      <p className="text-sm text-muted-foreground">
        Use this page to test uploads and see files stored in your connected Vercel Blob store.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload a file (server action)</CardTitle>
          </CardHeader>
          <CardContent>
            <BlobUploader />
            <p className="mt-3 text-xs text-muted-foreground">
              Tip: Server uploads are limited to about 4.5 MB per request on serverless functions. For larger files, we
              can switch to client uploads later.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              This form posts a File to a Next.js Server Action which calls put() from @vercel/blob to store your file
              under the "boomkit/" prefix. It returns a public URL.
            </p>
            <Separator />
            <p className="text-xs">
              After you create a Blob store in Vercel, environment variables are added automatically to your project.
              You don&apos;t need to paste anything in this page.
            </p>
            <p className="text-xs">
              Deployed on Vercel, this page will use those environment variables securely on the server.
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Stored files</h2>
        {!blobs?.length ? (
          <p className="text-sm text-muted-foreground mt-2">No files yet. Upload one above.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blobs.map((b) => {
              const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(b.pathname)
              return (
                <li key={b.url} className="border rounded-md p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium truncate" title={b.pathname}>
                      {b.pathname.replace(/^boomkit\//, "")}
                    </span>
                    <Link
                      href={b.url}
                      className="text-xs text-primary underline underline-offset-2"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </Link>
                  </div>
                  {isImage ? (
                    <div className="mt-3 relative aspect-video overflow-hidden rounded-md border bg-muted">
                      {/* Next.js Image requires width/height or fill. Using fill since we don't know the intrinsic size. */}
                      <Image
                        src={b.url || "/placeholder.svg"}
                        alt={`Preview of ${b.pathname}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : null}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Size: {b.size} bytes • Uploaded: {new Date(b.uploadedAt).toLocaleString()}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

async function getStoredBlobs() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return []
  }

  try {
    const { blobs } = await list({ prefix: "boomkit/" })
    return blobs
  } catch (error) {
    console.error("Failed to list Vercel Blob files:", error)
    return []
  }
}
