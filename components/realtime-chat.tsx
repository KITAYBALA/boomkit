"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SendIcon } from "lucide-react"

type Props = {
  currentUser: { username: string; isMuted?: boolean; role?: string } | null
  roleName: string
  onUsernameClick: (username: string) => void
}

type DbChatRow = { id: string; username: string; message: string; role: string; inserted_at: string }
type LocalChatRow = { id: string; username: string; message: string; role: string; timestamp: string }

const LS_KEY = "boomkit_chat_messages"

const getRoleColor = (role: string) => {
  switch (role) {
    case "owner":
      return "bg-yellow-500 text-black"
    case "admin":
      return "bg-purple-500 text-white"
    case "senior_moderator":
      return "bg-blue-500 text-white"
    case "moderator":
      return "bg-green-500 text-white"
    case "tester":
      return "bg-orange-500 text-white"
    case "staff":
      return "bg-cyan-500 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

export default function RealtimeChat({ currentUser, roleName, onUsernameClick }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [messages, setMessages] = useState<LocalChatRow[]>([])
  const [text, setText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const [userRoles, setUserRoles] = useState<Record<string, string>>({})
  const [isMuted, setIsMuted] = useState(false)

  // Update mute status from currentUser prop (reuse existing user state)
  useEffect(() => {
    setIsMuted(currentUser?.isMuted || false)
  }, [currentUser?.isMuted])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (supabase) {
        const { data } = await supabase.from("users").select("username, role")
        if (data) {
          const roles: Record<string, string> = {}
          data.forEach((u: { username: string; role: string }) => {
            roles[u.username] = u.role
          })
          setUserRoles(roles)
        }
      }
    }
    fetchUserRoles()

    // Refresh roles every 30 seconds
    const interval = setInterval(fetchUserRoles, 30000)
    return () => clearInterval(interval)
  }, [supabase])

  // Load initial data and subscribe to changes
  useEffect(() => {
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null

    const load = async () => {
      if (supabase) {
        console.log("[v0] Loading chat messages from Supabase...")
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .order("inserted_at", { ascending: true })
          .limit(200)

        if (error) {
          console.error("[v0] Error loading chat messages:", error)
        } else {
          console.log("[v0] Loaded", data?.length || 0, "chat messages")
        }

        const mapped =
          (data as DbChatRow[] | null)?.map((d) => ({
            id: d.id,
            username: d.username,
            message: d.message,
            role: d.role,
            timestamp: d.inserted_at,
          })) ?? []
        setMessages(mapped)

        // Realtime subscription
        console.log("[v0] Setting up realtime subscription...")
        channel = supabase
          .channel("chat_room")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "chat_messages" },
            (payload: { new: DbChatRow }) => {
              console.log("[v0] New message received via realtime:", payload.new)
              const d = payload.new
              setMessages((prev) => [
                ...prev,
                { id: d.id, username: d.username, message: d.message, role: d.role, timestamp: d.inserted_at },
              ])
            },
          )
          .subscribe((status) => {
            console.log("[v0] Realtime subscription status:", status)
          })
      } else {
        // LocalStorage fallback
        console.log("[v0] Using localStorage fallback for chat")
        const raw = localStorage.getItem(LS_KEY)
        setMessages(raw ? (JSON.parse(raw) as LocalChatRow[]) : [])

        const onStorage = (e: StorageEvent) => {
          if (e.key === LS_KEY && e.newValue) {
            setMessages(JSON.parse(e.newValue))
          }
        }
        window.addEventListener("storage", onStorage)
        return () => window.removeEventListener("storage", onStorage)
      }
    }

    load()

    return () => {
      if (channel) {
        console.log("[v0] Cleaning up realtime subscription")
        supabase?.removeChannel(channel)
      }
    }
  }, [supabase])

  const send = async () => {
    if (!text.trim() || !currentUser) return
    
    // Client-side check (also enforced server-side)
    if (isMuted) {
      return
    }

    const userRole = currentUser.role || roleName

    console.log("[v0] Sending message:", text.trim(), "with role:", userRole)

    // Use API route for server-side mute enforcement
    try {
      const response = await fetch("/api/chat-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          message: text.trim(),
          role: userRole,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403 && errorData.error === "MUTED") {
          // User got muted - update local state and block message
          setIsMuted(true)
          console.log("[v0] Message blocked: User is muted")
          return
        }
        console.error("[v0] Error sending message:", errorData.error)
        alert("Failed to send message: " + (errorData.error || "Unknown error"))
        return
      }

      const data = await response.json()
      console.log("[v0] Message sent successfully:", data)
      setText("")
    } catch (error) {
      console.error("[v0] Network error sending message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-white">Global Chat</h1>
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
        <ScrollArea className="h-96 w-full border border-white/20 rounded p-4 mb-4">
          {messages.map((msg) => {
            const displayRole = userRoles[msg.username] || msg.role
            return (
              <div key={msg.id} className="mb-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge className={`text-xs ${getRoleColor(displayRole)}`}>{displayRole}</Badge>
                  <span
                    className="text-white font-semibold cursor-pointer hover:underline"
                    onClick={() => onUsernameClick(msg.username)}
                  >
                    {msg.username}:
                  </span>
                </div>
                <p className="text-white/90 ml-2">{msg.message}</p>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </ScrollArea>
        <div className="flex space-x-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isMuted ? "You are muted" : "Type a message..."}
            disabled={isMuted}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            onKeyDown={(e) => e.key === "Enter" && !isMuted && send()}
          />
          <Button onClick={send} disabled={isMuted} className="bg-blue-600 hover:bg-blue-700">
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
