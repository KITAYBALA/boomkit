"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function BannedPage() {
  const searchParams = useSearchParams()
  const [reason, setReason] = useState<string | null>(null)

  useEffect(() => {
    // Try to get reason from query param first
    const reasonParam = searchParams.get("reason")
    if (reasonParam) {
      setReason(reasonParam)
    } else {
      // Fallback: check localStorage for current user's ban reason
      const storedUser = localStorage.getItem("boomkit_current_user")
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          if (user.isBanned && user.banReason) {
            setReason(user.banReason)
          }
        } catch (e) {
          console.error("Error parsing stored user:", e)
        }
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-lg w-full text-center border border-white/10 shadow-2xl">
        <h1 className="text-5xl font-black text-white mb-6 tracking-tighter">Oops 😕</h1>
        <div className="space-y-4">
          <p className="text-white/90 text-xl font-medium">You were banned from Boomkit.</p>
          {reason && (
            <div className="mt-8 p-6 bg-red-500/20 rounded-xl border border-red-500/30">
              <p className="text-red-300 text-sm uppercase tracking-widest font-bold mb-2">Reason</p>
              <p className="text-white text-lg italic">"{reason}"</p>
            </div>
          )}
          <p className="text-white/40 text-sm mt-8 pt-6 border-t border-white/5">
            If you believe this was a mistake, please contact staff.
          </p>
        </div>
      </div>
    </div>
  )
}
