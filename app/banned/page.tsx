import { ShieldAlert, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function BannedPage({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const reason = resolvedParams.reason;

  return (
    <div className="min-h-screen bg-[#0f101a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-red-950/30 border border-red-500/50 rounded-3xl p-8 text-center backdrop-blur-xl">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Ban className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">
          Access Denied
        </h1>

        {reason ? (
          <div className="space-y-4">
            <p className="text-red-200/80 font-medium">
              Your account has been suspended due to a violation of our Terms of Service.
            </p>
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 text-left">
              <p className="text-xs text-red-400 uppercase tracking-widest font-black mb-1">Reason</p>
              <p className="text-sm text-red-100 font-bold">{reason}</p>
            </div>
          </div>
        ) : (
          <p className="text-red-200/80 mb-8 font-medium">
            Your IP address has been blacklisted from accessing Boomkit due to a violation of our Terms of Service.
          </p>
        )}

        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 my-8">
          <p className="text-xs text-red-300 font-mono">
            If you believe this is a mistake, please contact support via our external channels.
          </p>
        </div>
      </div>
    </div>
  )
}
