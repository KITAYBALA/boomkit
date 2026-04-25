"use client"

import * as React from "react"
import { useActionState } from "react"
import { uploadBlob, type UploadResult } from "@/app/blob/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; url: string }
  | { status: "error"; message: string }

export function BlobUploader() {
  const [state, action, isPending] = useActionState<UploadResult | null, FormData>(uploadBlob, null)
  const [ui, setUI] = React.useState<UploadState>({ status: "idle" })

  React.useEffect(() => {
    if (!state) return
    if ("error" in state && state.error) {
      setUI({ status: "error", message: state.error })
    } else if ("url" in state && state.url) {
      setUI({ status: "success", url: state.url })
    }
  }, [state])

  return (
    <form
      action={(formData) => {
        setUI({ status: "uploading" })
        return action(formData)
      }}
      className="space-y-3"
    >
      <div className="grid gap-2">
        <Label htmlFor="file">Pick a file</Label>
        <Input id="file" name="file" type="file" required />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Uploading..." : "Upload"}
      </Button>
      {ui.status === "success" ? (
        <p className="text-sm">
          Uploaded:{" "}
          <a className="underline text-primary" href={ui.url} target="_blank" rel="noreferrer">
            {ui.url}
          </a>
        </p>
      ) : null}
      {ui.status === "error" ? <p className="text-sm text-red-600">Error: {ui.message}</p> : null}
    </form>
  )
}

BlobUploader.defaultProps = {}
