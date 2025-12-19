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
}

export default function RealtimeLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    // Initial fetch
    const fetchLeaderboard = async () => {
      console.log("[v0] Fetching leaderboard data...")
      const { data, error } = await supabase
        .from("users")
        .select("id, username, tokens, boom_score, profile_picture, role, badges")
        .order("tokens", { ascending: false })
        .limit(10)

      if (error) {
        console.error("[v0] Error fetching leaderboard:", error)
      } else {
        console.log("[v0] Leaderboard data fetched:", data)
        setUsers(data || [])
      }
      setLoading(false)
    }

    fetchLeaderboard()

    // Subscribe to realtime changes
    const channel = supabase
      .channel("leaderboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        (payload) => {
          console.log("[v0] Leaderboard realtime update:", payload)
          // Refetch leaderboard on any user change
          fetchLeaderboard()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-500"
      case "admin":
        return "bg-purple-500"
      case "senior_moderator":
        return "bg-blue-500"
      case "moderator":
        return "bg-green-500"
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-2">
        {users.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            <TrophyIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No players yet. Be the first!</p>
          </div>
        ) : (
          users.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                index < 3 ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
              }`}
            >
              <div className="text-2xl font-bold w-12 text-center">{getMedalEmoji(index)}</div>
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarFallback className="text-2xl">{user.profile_picture}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{user.username}</p>
                  <Badge className={`${getRoleColor(user.role)} text-white text-xs`}>{user.role}</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    💰 <span className="font-semibold text-foreground">{user.tokens}</span> tokens
                  </span>
                  <span className="flex items-center gap-1">
                    ⭐ <span className="font-semibold text-foreground">{user.boom_score}</span> score
                  </span>
                </div>
              </div>
              {user.badges && user.badges.length > 0 && (
                <div className="flex gap-1">
                  {user.badges.slice(0, 3).map((badge, i) => (
                    <span key={i} className="text-lg">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
