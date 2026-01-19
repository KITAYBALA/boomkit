"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TrophyIcon } from "lucide-react"

interface LeaderboardUser {
  id: string
  username: string
  tokens: number
  boom_score: number
  profile_picture: string
  role: string
  badges: string[]
  packs_opened: number
}

export default function RealtimeLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const fetchLeaderboard = async () => {
      if (!supabase) return
      const { data, error } = await supabase
        .from("users")
        .select("id, username, tokens, boom_score, profile_picture, role, badges, packs_opened")
        .eq("is_banned", false)
        .order("tokens", { ascending: false })
        .limit(10)

      if (error) {
        console.error("[v0] Error fetching leaderboard:", error)
      } else {
        setUsers(data || [])
      }
      setLoading(false)
    }

    fetchLeaderboard()

    if (!supabase) return
    const subscription = supabase
      .channel("leaderboard-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => fetchLeaderboard())
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
      case "admin":
        return "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
      case "senior_moderator":
        return "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
      case "moderator":
        return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
      case "tester":
        return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
      case "player":
        return "bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.5)]"
      default:
        return "bg-gray-500"
    }
  }

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇"
    if (index === 1) return "🥈"
    if (index === 2) return "🥉"
    return `#${index + 1}`
  }

  const getRankStyle = (index: number) => {
    if (index === 0) return "border-yellow-500/50 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
    if (index === 1) return "border-slate-300/50 bg-gradient-to-r from-slate-300/20 to-slate-400/10 shadow-[0_0_15px_rgba(203,213,225,0.2)]"
    if (index === 2) return "border-orange-600/50 bg-gradient-to-r from-orange-600/20 to-orange-700/10 shadow-[0_0_15px_rgba(234,88,12,0.2)]"
    return "bg-white/5 border-white/10 hover:bg-white/10"
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse" />
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
        </div>
        <div className="mt-4 text-primary font-medium animate-pulse text-lg">Syncing Ranks...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-4 min-h-0">
      <ScrollArea className="flex-1 min-h-[600px] pr-4 rounded-xl border border-white/5 bg-black/50 backdrop-blur-md shadow-2xl">
        <div className="space-y-3 p-4">
          {users.length === 0 ? (
            <div className="text-center text-muted-foreground p-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <TrophyIcon className="mx-auto h-16 w-16 mb-4 opacity-20 text-primary animate-bounce" />
              <h3 className="text-xl font-bold text-foreground mb-2">No Contenders Yet</h3>
              <p>The arena is empty. Open some packs and claim your spot!</p>
            </div>
          ) : (
            <>
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg group ${getRankStyle(index)}`}
                >
                  <div className="flex flex-col items-center justify-center w-12 shrink-0">
                    <span className={`text-2xl font-black ${index < 3 ? "scale-125 drop-shadow-md" : "text-muted-foreground opacity-50"}`}>
                      {getMedalEmoji(index)}
                    </span>
                  </div>

                  <div className="relative shrink-0">
                    <Avatar className={`h-14 w-14 border-2 transition-transform duration-300 group-hover:rotate-3 ${index < 3 ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-white/10"}`}>
                      <AvatarFallback className="text-3xl bg-black/40 backdrop-blur-md">{user.profile_picture}</AvatarFallback>
                    </Avatar>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 bg-primary text-[10px] font-bold px-1.5 rounded-full text-primary-foreground border border-background shadow-sm">
                        TOP
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-bold truncate text-lg ${index < 3 ? "text-primary" : "text-foreground"}`}>
                        {user.username}
                      </p>
                      <Badge className={`${getRoleColor(user.role)} text-white text-[10px] font-bold uppercase tracking-wider h-5 flex items-center border-none`}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                        <span className="text-yellow-500 font-bold group-hover:animate-pulse">💰</span>
                        <span className="font-bold text-foreground/80">{user.tokens.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        <span className="text-blue-500 font-bold">📦</span>
                        <span className="font-bold text-foreground/80">{user.packs_opened || 0}</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                        <span className="text-purple-500 font-bold">⭐</span>
                        <span className="font-bold text-foreground/80">{user.boom_score.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Fix for "nothing" place - End of list indicator */}
              <div className="py-8 text-center space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
                  <div className="text-xs font-bold text-white/20 uppercase tracking-[0.2em]">The End</div>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
                </div>
                <p className="text-xs text-muted-foreground/60 italic px-8">
                  Keep opening packs and earning tokens to climb the global ranks!
                  The arena reset happens weekly.
                </p>
                <div className="opacity-10 grayscale brightness-200">
                  🏆
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
