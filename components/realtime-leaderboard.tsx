"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TrophyIcon } from "lucide-react"
import { BoomAvatar } from "./boom-avatar"

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
    const timer = setInterval(fetchLeaderboard, 15000)

    if (!supabase) return () => clearInterval(timer)
    const subscription = supabase
      .channel("leaderboard-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => fetchLeaderboard())
      .subscribe()

    return () => {
      clearInterval(timer)
      supabase.removeChannel(subscription)
    }
  }, [])

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "club-yellow "
      case "admin":
        return "club-purple "
      case "senior_moderator":
        return "club-blue "
      case "moderator":
        return "club-green "
      case "tester":
        return "club-green "
      case "player":
        return "club-well "
      default:
        return "club-well"
    }
  }

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇"
    if (index === 1) return "🥈"
    if (index === 2) return "🥉"
    return `#${index + 1}`
  }

  const getRankStyle = (index: number) => {
    if (index === 0) return "club-border club-surface "
    if (index === 1) return "club-border club-surface "
    if (index === 2) return "club-border club-surface "
    return "club-well club-border club-well"
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
        <div className="club-panel p-8 relative overflow-hidden">
          <div className="club-decoration absolute inset-0 bg-[size:30px_30px]" />
          <div className="club-decoration absolute top-0 right-0 w-80 h-80 club-purple rounded-full pointer-events-none" />
          <div className="club-decoration absolute bottom-0 left-0 w-80 h-80 club-blue rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-8">
              <span className="font-heading text-3xl">🏆</span>
              <h2 className="font-heading text-xl font-black club-ink uppercase tracking-wide">Top collectors</h2>
              <span className="font-heading text-3xl">🏆</span>
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
                    <div className="absolute -inset-1 club-surface rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                    <div className="w-16 h-16 rounded-xl club-well border-2 club-border flex items-center justify-center text-3xl relative overflow-hidden p-1.5">
                      <BoomAvatar name={users[1].profile_picture} className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 club-well club-ink text-xs font-black px-2 py-0.5 rounded-full border club-border uppercase tracking-wider">
                      2nd
                    </div>
                  </div>
                  <div className="font-heading text-center min-w-0 w-full mb-3">
                    <p className="font-heading club-ink font-bold text-xs truncate max-w-full">
                      {users[1].clan_tag && (
                        <span className={users[1].clan_tag_color || 'club-accent'}>
                          [{users[1].clan_tag}] 
                        </span>
                      )}
                      {users[1].username}
                    </p>
                    <p className="font-heading text-[10px] club-accent font-black flex items-center justify-center gap-1 mt-0.5 drop-shadow">
                      🪙 {users[1].tokens.toLocaleString()}
                    </p>
                  </div>
                  {/* Column block */}
                  <div className="w-full h-32 rounded-t-2xl border-t border-x club-border club-surface relative overflow-hidden flex flex-col justify-end p-4">
                    <div className="font-heading club-muted text-center font-black text-2xl opacity-30 group-hover:scale-110 transition-transform duration-300">II</div>
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
                    <span className="font-heading text-4xl filter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">👑</span>
                  </div>

                  <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
                    <div className="absolute -inset-2 club-surface rounded-xl blur opacity-40 group-hover:opacity-75 transition duration-500" />
                    <div className="w-20 h-20 rounded-xl club-well border-2 club-border flex items-center justify-center text-4xl relative overflow-hidden p-2">
                      <BoomAvatar name={users[0].profile_picture} className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 club-yellow club-ink text-xs font-black px-3 py-0.5 rounded-full border club-border uppercase tracking-wider ">
                      1st
                    </div>
                  </div>
                  <div className="font-heading text-center min-w-0 w-full mb-3">
                    <p className="font-heading club-ink font-black text-sm truncate max-w-full ">
                      {users[0].clan_tag && (
                        <span className={users[0].clan_tag_color || 'club-accent'}>
                          [{users[0].clan_tag}] 
                        </span>
                      )}
                      {users[0].username}
                    </p>
                    <p className="font-heading text-xs club-accent font-black flex items-center justify-center gap-1 mt-0.5 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                      🪙 {users[0].tokens.toLocaleString()}
                    </p>
                  </div>
                  {/* Column block */}
                  <div className="w-full h-44 rounded-t-3xl border-t border-x club-border club-surface relative overflow-hidden flex flex-col justify-end p-4">
                    <div className="font-heading club-accent text-center font-black text-4xl opacity-40 group-hover:scale-110 transition-transform duration-300">I</div>
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
                    <div className="absolute -inset-1 club-surface rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                    <div className="w-14 h-14 rounded-xl club-well border-2 club-border flex items-center justify-center text-2xl relative overflow-hidden p-1">
                      <BoomAvatar name={users[2].profile_picture} className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 club-yellow club-ink text-xs font-black px-2 py-0.5 rounded-full border club-border uppercase tracking-wider">
                      3rd
                    </div>
                  </div>
                  <div className="font-heading text-center min-w-0 w-full mb-3">
                    <p className="font-heading club-ink font-bold text-xs truncate max-w-full">
                      {users[2].clan_tag && (
                        <span className={users[2].clan_tag_color || 'club-accent'}>
                          [{users[2].clan_tag}] 
                        </span>
                      )}
                      {users[2].username}
                    </p>
                    <p className="font-heading text-[10px] club-accent font-black flex items-center justify-center gap-1 mt-0.5 drop-shadow">
                      🪙 {users[2].tokens.toLocaleString()}
                    </p>
                  </div>
                  {/* Column block */}
                  <div className="w-full h-24 rounded-t-2xl border-t border-x club-border club-surface relative overflow-hidden flex flex-col justify-end p-4">
                    <div className="font-heading club-accent text-center font-black text-xl opacity-30 group-hover:scale-110 transition-transform duration-300">III</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Roster list for remaining ranks */}
      <div className="flex-grow flex flex-col space-y-4 min-h-0">
        <ScrollArea className="flex-1 min-h-[400px] pr-4 rounded-xl border club-border club-panel">
          <div className="space-y-3 p-6">
            {users.length === 0 ? (
              <div className="font-heading text-center club-muted p-12 club-well rounded-xl border border-dashed club-border">
                <TrophyIcon className="mx-auto h-16 w-16 mb-4 opacity-20 club-accent " />
                <h3 className="font-heading text-xl font-bold club-ink mb-2">The leaderboard is empty</h3>
                <p>The arena is empty. Open some packs and claim your spot!</p>
              </div>
            ) : (
              <>
                {/* Roster header info */}
                <div className="flex items-center gap-4 px-4 py-2 text-xs club-muted font-black uppercase tracking-wider border-b club-border mb-2">
                  <span className="w-12 text-center">Rank</span>
                  <span className="flex-grow pl-14">Operator</span>
                  <span className="font-heading text-right">Balance</span>
                </div>

                {users.map((user, index) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg group ${getRankStyle(index)} ${onPlayerClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onPlayerClick && onPlayerClick(user.id)}
                  >
                    <div className="flex flex-col items-center justify-center w-12 shrink-0">
                      <span className={`text-lg font-black ${index < 3 ? "club-accent font-black" : "club-muted font-bold"}`}>
                        {index < 3 ? getMedalEmoji(index) : `#${index + 1}`}
                      </span>
                    </div>

                    <div className="relative shrink-0">
                      <Avatar className={`h-11 w-11 border transition-transform duration-300 group-hover:rotate-3 ${index < 3 ? "club-border " : "club-border"}`}>
                        <AvatarFallback className="font-heading text-2xl club-well flex items-center justify-center p-1 overflow-hidden">
                          <BoomAvatar name={user.profile_picture} className="w-full h-full object-contain" />
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className={`font-bold truncate text-sm md:text-base ${index < 3 ? "club-ink" : "club-ink"}`}>
                          {user.clan_tag && (
                            <span className="inline-block text-xs font-black tracking-tight mr-1">
                              <span className={user.clan_tag_color || 'club-accent'}>
                                [{user.clan_tag}]
                              </span>
                            </span>
                          )}
                          {user.username}
                        </p>
                        <Badge className={`${getRoleColor(user.role)} club-ink text-xs font-black uppercase tracking-wider h-5 flex items-center border-none`}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs club-muted">
                        <span className="flex items-center gap-1 club-yellow px-2 py-0.5 rounded-full border club-border">
                          <span className="font-heading club-accent font-bold">🪙</span>
                          <span className="font-bold club-accent">{user.tokens.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1 club-blue px-2 py-0.5 rounded-full border club-border">
                          <span className="font-heading club-accent font-bold">📦</span>
                          <span className="font-bold club-accent">{user.packs_opened || 0}</span>
                        </span>
                        <span className="flex items-center gap-1 club-purple px-2 py-0.5 rounded-full border club-border">
                          <span className="font-heading club-accent font-bold">⭐</span>
                          <span className="font-bold club-accent">{user.boom_score.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* End of list indicator */}
                <div className="py-8 text-center space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-12 club-surface " />
                    <div className="font-heading text-xs font-black club-muted uppercase tracking-wide">Synchronization Lock</div>
                    <div className="h-px w-12 club-surface " />
                  </div>
                  <p className="font-heading text-xs club-muted italic px-8">
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
