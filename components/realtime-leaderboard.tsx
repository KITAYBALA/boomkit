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
  clan_tag?: string | null
  clan_tag_color?: string | null
}

interface RealtimeLeaderboardProps {
  onPlayerClick?: (userId: string) => void;
  [key: string]: any; // Catch-all for extra props passed from page.tsx (like users, currentUser, etc) to avoid sweeping type errors right now.
}

export default function RealtimeLeaderboard({ onPlayerClick, ...props }: RealtimeLeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const fetchLeaderboard = async () => {
      if (!supabase) return
      const { data, error } = await supabase
        .from("users")
        .select("id, username, tokens, boom_score, profile_picture, role, badges, packs_opened, clan_tag, clan_tag_color")
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
    <div className="flex-grow flex flex-col space-y-8 min-h-0 animate-in fade-in duration-700">
      {/* 3D Podium Area */}
      {users.length > 0 && (
        <div className="bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px]" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">🏆</span>
              <h2 className="text-xl font-black text-white uppercase tracking-[0.25em]">Podium Contenders</h2>
              <span className="text-3xl">🏆</span>
            </div>

            {/* Podium grid layout: 2nd, 1st, 3rd */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 items-end max-w-2xl w-full pt-12 pb-4">
              {/* 2nd Place Column */}
              {users[1] && (
                <div 
                  className="flex flex-col items-center group cursor-pointer"
                  onClick={() => onPlayerClick && onPlayerClick(users[1].id)}
                >
                  <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-slate-400 to-slate-200 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-slate-400 flex items-center justify-center text-3xl shadow-lg relative overflow-hidden">
                      {users[1].profile_picture}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-950 uppercase tracking-wider">
                      2nd
                    </div>
                  </div>
                  <div className="text-center min-w-0 w-full mb-3">
                    <p className="text-white font-bold text-xs truncate max-w-full">
                      {users[1].clan_tag && (
                        <span className={users[1].clan_tag_color || 'text-purple-400'}>
                          [{users[1].clan_tag}] 
                        </span>
                      )}
                      {users[1].username}
                    </p>
                    <p className="text-[10px] text-yellow-400 font-black flex items-center justify-center gap-1 mt-0.5 drop-shadow">
                      🪙 {users[1].tokens.toLocaleString()}
                    </p>
                  </div>
                  {/* Column block */}
                  <div className="w-full h-32 rounded-t-2xl border-t border-x border-slate-400/20 bg-gradient-to-b from-slate-400/10 via-slate-500/5 to-transparent relative overflow-hidden shadow-inner flex flex-col justify-end p-4">
                    <div className="text-slate-400 text-center font-black text-2xl opacity-30 group-hover:scale-110 transition-transform duration-300">II</div>
                  </div>
                </div>
              )}

              {/* 1st Place Column (Tallest) */}
              {users[0] && (
                <div 
                  className="flex flex-col items-center group cursor-pointer relative -translate-y-4"
                  onClick={() => onPlayerClick && onPlayerClick(users[0].id)}
                >
                  {/* Floating Crown */}
                  <div className="absolute -top-12 z-20 animate-bounce duration-1000">
                    <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">👑</span>
                  </div>

                  <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
                    <div className="absolute -inset-2 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-3xl blur opacity-40 group-hover:opacity-75 transition duration-500" />
                    <div className="w-20 h-20 rounded-3xl bg-slate-900 border-2 border-yellow-400 flex items-center justify-center text-4xl shadow-xl relative overflow-hidden">
                      {users[0].profile_picture}
                    </div>
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-black px-3 py-0.5 rounded-full border border-slate-950 uppercase tracking-wider shadow-lg">
                      1st
                    </div>
                  </div>
                  <div className="text-center min-w-0 w-full mb-3">
                    <p className="text-white font-black text-sm truncate max-w-full drop-shadow">
                      {users[0].clan_tag && (
                        <span className={users[0].clan_tag_color || 'text-purple-400'}>
                          [{users[0].clan_tag}] 
                        </span>
                      )}
                      {users[0].username}
                    </p>
                    <p className="text-xs text-yellow-400 font-black flex items-center justify-center gap-1 mt-0.5 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                      🪙 {users[0].tokens.toLocaleString()}
                    </p>
                  </div>
                  {/* Column block */}
                  <div className="w-full h-44 rounded-t-3xl border-t border-x border-yellow-500/30 bg-gradient-to-b from-yellow-500/15 via-orange-500/5 to-transparent relative overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.05)] flex flex-col justify-end p-4">
                    <div className="text-yellow-400 text-center font-black text-4xl opacity-40 group-hover:scale-110 transition-transform duration-300">I</div>
                  </div>
                </div>
              )}

              {/* 3rd Place Column */}
              {users[2] && (
                <div 
                  className="flex flex-col items-center group cursor-pointer"
                  onClick={() => onPlayerClick && onPlayerClick(users[2].id)}
                >
                  <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-amber-600 to-amber-800 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-amber-600 flex items-center justify-center text-2xl shadow-lg relative overflow-hidden">
                      {users[2].profile_picture}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 text-black text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-950 uppercase tracking-wider">
                      3rd
                    </div>
                  </div>
                  <div className="text-center min-w-0 w-full mb-3">
                    <p className="text-white font-bold text-xs truncate max-w-full">
                      {users[2].clan_tag && (
                        <span className={users[2].clan_tag_color || 'text-purple-400'}>
                          [{users[2].clan_tag}] 
                        </span>
                      )}
                      {users[2].username}
                    </p>
                    <p className="text-[10px] text-yellow-400 font-black flex items-center justify-center gap-1 mt-0.5 drop-shadow">
                      🪙 {users[2].tokens.toLocaleString()}
                    </p>
                  </div>
                  {/* Column block */}
                  <div className="w-full h-24 rounded-t-2xl border-t border-x border-amber-600/20 bg-gradient-to-b from-amber-600/10 via-amber-700/5 to-transparent relative overflow-hidden shadow-inner flex flex-col justify-end p-4">
                    <div className="text-amber-600 text-center font-black text-xl opacity-30 group-hover:scale-110 transition-transform duration-300">III</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Roster list for remaining ranks */}
      <div className="flex-1 flex flex-col space-y-4 min-h-0">
        <ScrollArea className="flex-1 min-h-[400px] pr-4 rounded-[2.5rem] border border-white/10 bg-slate-950/30 backdrop-blur-2xl shadow-2xl">
          <div className="space-y-3 p-6">
            {users.length === 0 ? (
              <div className="text-center text-white/30 p-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <TrophyIcon className="mx-auto h-16 w-16 mb-4 opacity-20 text-purple-500 animate-bounce" />
                <h3 className="text-xl font-bold text-white mb-2">No Contenders Yet</h3>
                <p>The arena is empty. Open some packs and claim your spot!</p>
              </div>
            ) : (
              <>
                {/* Roster header info */}
                <div className="flex items-center gap-4 px-4 py-2 text-[10px] text-white/30 font-black uppercase tracking-wider border-b border-white/5 mb-2">
                  <span className="w-12 text-center">Rank</span>
                  <span className="flex-grow pl-14">Operator</span>
                  <span className="text-right">Balance</span>
                </div>

                {users.map((user, index) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg group ${getRankStyle(index)} ${onPlayerClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onPlayerClick && onPlayerClick(user.id)}
                  >
                    <div className="flex flex-col items-center justify-center w-12 shrink-0">
                      <span className={`text-lg font-black ${index < 3 ? "text-purple-400 font-black" : "text-white/40 font-bold"}`}>
                        {index < 3 ? getMedalEmoji(index) : `#${index + 1}`}
                      </span>
                    </div>

                    <div className="relative shrink-0">
                      <Avatar className={`h-11 w-11 border transition-transform duration-300 group-hover:rotate-3 ${index < 3 ? "border-purple-500/40 shadow-md" : "border-white/10"}`}>
                        <AvatarFallback className="text-2xl bg-black/40 backdrop-blur-md">{user.profile_picture}</AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className={`font-bold truncate text-sm md:text-base ${index < 3 ? "text-white" : "text-white/80"}`}>
                          {user.clan_tag && (
                            <span className="inline-block text-xs font-black tracking-tight mr-1">
                              <span className={user.clan_tag_color || 'text-purple-400'}>
                                [{user.clan_tag}]
                              </span>
                            </span>
                          )}
                          {user.username}
                        </p>
                        <Badge className={`${getRoleColor(user.role)} text-white text-[9px] font-black uppercase tracking-wider h-5 flex items-center border-none`}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-white/40">
                        <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                          <span className="text-yellow-500 font-bold">🪙</span>
                          <span className="font-bold text-yellow-400">{user.tokens.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          <span className="text-blue-500 font-bold">📦</span>
                          <span className="font-bold text-blue-400">{user.packs_opened || 0}</span>
                        </span>
                        <span className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          <span className="text-purple-500 font-bold">⭐</span>
                          <span className="font-bold text-purple-400">{user.boom_score.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* End of list indicator */}
                <div className="py-8 text-center space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Synchronization Lock</div>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
                  </div>
                  <p className="text-xs text-white/30 italic px-8">
                    Open packs, collect Booms, and forge legendaries to upgrade your status.
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
