"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TrophyIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [sortBy, setSortBy] = useState<"tokens" | "packs">("tokens")

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, tokens, boom_score, profile_picture, role, badges, packs_opened")
        .order("tokens", { ascending: false })
        .limit(50)

      if (error) {
        console.error("[v0] Error fetching leaderboard:", error)
      } else {
        setUsers(data || [])
      }
      setLoading(false)
    }

    fetchLeaderboard()

    const channel = supabase
      .channel("leaderboard-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => fetchLeaderboard())
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

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === "tokens") {
      return b.tokens - a.tokens
    } else {
      return (b.packs_opened || 0) - (a.packs_opened || 0)
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="tokens" onValueChange={(v) => setSortBy(v as "tokens" | "packs")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tokens">💰 Most Tokens</TabsTrigger>
          <TabsTrigger value="packs">📦 Most Packs</TabsTrigger>
        </TabsList>
      </Tabs>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-2">
          {sortedUsers.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <TrophyIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No players yet. Be the first!</p>
            </div>
          ) : (
            sortedUsers.map((user, index) => (
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
                      💰 <span className="font-semibold text-foreground">{user.tokens}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      📦 <span className="font-semibold text-foreground">{user.packs_opened || 0}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      ⭐ <span className="font-semibold text-foreground">{user.boom_score}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
