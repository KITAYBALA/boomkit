"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SendIcon, MessageCircleIcon, PencilIcon, Trash2Icon, CheckIcon, XIcon, AlertTriangleIcon } from "lucide-react"

type Props = {
  currentUser: { id: string; username: string; isMuted?: boolean; role?: string } | null
  roleName: string
  onUsernameClick: (username: string) => void
  onClanTagClick?: (clanId: string) => void
}


type DbChatRow = { id: string; username: string; message: string; role: string; created_at: string; reactions?: Record<string, string[]> }
type LocalChatRow = { id: string; username: string; message: string; role: string; timestamp: string; reactions?: Record<string, string[]> }

const LS_KEY = "boomkit_chat_messages"

const getRoleColor = (role: string) => {
  switch (role) {
    case "owner":
      return "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)] text-white"
    case "admin":
      return "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)] text-white"
    case "senior_moderator":
      return "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)] text-white"
    case "moderator":
      return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] text-white"
    case "tester":
      return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] text-white"
    case "staff":
      return "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)] text-white"
    default:
      return "bg-slate-600 text-white"
  }
}

export default function RealtimeChat({ currentUser, roleName, onUsernameClick, onClanTagClick }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [messages, setMessages] = useState<LocalChatRow[]>([])
  const [text, setText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const [userRoles, setUserRoles] = useState<Record<string, string>>({})
  const [userClanData, setUserClanData] = useState<Record<string, { tag: string | null; color: string | null; clan_id: string | null }>>({})
  const [isMuted, setIsMuted] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "💀", "👀"]

  const toggleReaction = async (msgId: string, emoji: string) => {
    if (!currentUser || !supabase) return
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return

    const reactions = { ...(msg.reactions || {}) }
    const users = reactions[emoji] || []
    const hasReacted = users.includes(currentUser.username)

    if (hasReacted) {
      reactions[emoji] = users.filter(u => u !== currentUser.username)
      if (reactions[emoji].length === 0) delete reactions[emoji]
    } else {
      reactions[emoji] = [...users, currentUser.username]
    }

    // Optimistic update
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions } : m))

    // Persist to DB
    await supabase.from("chat_messages").update({ reactions }).eq("id", msgId)
  }

  // Update mute status from currentUser prop (reuse existing user state)
  useEffect(() => {
    setIsMuted(currentUser?.isMuted || false)
  }, [currentUser?.isMuted])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      // Use block: 'nearest' to prevent scrolling the whole page if already in view
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [messages])

  useEffect(() => {
    const fetchUserRolesAndClans = async () => {
      if (supabase) {
        const { data } = await supabase.from("users").select("username, role, clan_id, clan_tag, clan_tag_color")
        if (data) {
          const roles: Record<string, string> = {}
          const clans: Record<string, { tag: string | null; color: string | null; clan_id: string | null }> = {}
          data.forEach((u: any) => {
            roles[u.username] = u.role || "player"
            clans[u.username] = { tag: u.clan_tag, color: u.clan_tag_color, clan_id: u.clan_id }
          })
          setUserRoles(roles)
          setUserClanData(clans)
        }
      }
    }
    fetchUserRolesAndClans()

    // Refresh roles every 30 seconds - REMOVED POLLING for performance
    // const interval = setInterval(fetchUserRoles, 30000)
    // return () => clearInterval(interval)
  }, [supabase])

  // Load initial data and subscribe to changes
  useEffect(() => {
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null

    const load = async () => {
      console.log("[v0] Initializing chat load...")

      // 1. Try API Route (Most reliable, bypasses RLS via Service Role)
      try {
        console.log("[v0] Fetching chat history from API...")
        const response = await fetch("/api/chat-messages")
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] API chat history loaded:", data.length, "messages")
          const mapped = data.map((d: any) => ({
            id: d.id,
            username: d.username,
            message: d.message,
            role: d.role,
            timestamp: d.inserted_at || new Date().toISOString(),
          }))
          setMessages(mapped)
          setupRealtime()
          return
        } else {
          console.warn("[v0] API fetch failed, status:", response.status)
        }
      } catch (err) {
        console.error("[v0] API fetch error:", err)
      }

      // 2. Fallback to direct Supabase Browser Client
      if (supabase) {
        console.log("[v0] Falling back to direct Supabase fetch...")
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .order("inserted_at", { ascending: false })
          .limit(50)

        // Reverse so that oldest of the 50 is first
        if (!error && data) {
          data.reverse()
          const mapped = data.map((d: any) => ({
            id: d.id,
            username: d.username,
            message: d.message,
            role: d.role,
            timestamp: d.inserted_at || new Date().toISOString(),
          }))
          setMessages(mapped)
          setupRealtime()
          return
        }
      }

      // 3. Fallback to LocalStorage
      console.log("[v0] Using localStorage fallback")
      const raw = localStorage.getItem(LS_KEY)
      setMessages(raw ? (JSON.parse(raw) as LocalChatRow[]) : [])
      setupRealtime()
    }

    const setupRealtime = () => {
      if (!supabase) return

      console.log("[v0] Setting up realtime subscription...")
      channel = supabase
        .channel("chat_room")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "chat_messages" },
          (payload) => {
            console.log("[v0] Realtime change received:", payload)
            if (payload.eventType === "INSERT") {
              const d = payload.new as any
              setMessages((prev) => [
                ...prev,
                {
                  id: d.id,
                  username: d.username,
                  message: d.message,
                  role: d.role,
                  timestamp: d.inserted_at || new Date().toISOString()
                },
              ])
            } else if (payload.eventType === "UPDATE") {
              const d = payload.new as any
              setMessages((prev) =>
                prev.map(m => m.id === d.id ? { ...m, message: d.message } : m)
              )
            } else if (payload.eventType === "DELETE") {
              const oldId = payload.old.id
              setMessages((prev) => prev.filter(m => m.id !== oldId))
            }
          },
        )
        .subscribe()
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

    // Intercept /gift command
    if (text.trim().startsWith("/gift ")) {
      const parts = text.trim().split(" ")
      if (parts.length >= 3) {
        const receiverUsername = parts[1]
        const amount = parseInt(parts[2], 10)

        if (isNaN(amount) || amount <= 0) {
          alert("Invalid amount for gift.")
          setText("")
          return
        }

        try {
          if (!supabase) throw new Error("Supabase client not initialized")
          const { data, error } = await supabase.rpc('transfer_tokens', {
            p_sender_username: currentUser.username,
            p_receiver_username: receiverUsername,
            p_amount: amount
          })

          if (error) {
            console.error("[v0] /gift error:", error)
            alert(error.message || "Gift failed")
          } else {
            console.log("[v0] /gift success:", data)
            alert(`🎉 Successfully sent ${amount.toLocaleString()} tokens to ${receiverUsername}!`)
          }
        } catch (e: any) {
          console.error("[v0] /gift catch error:", e)
          alert(e.message || "Gift failed")
        }

        setText("")
        return
      } else {
        alert("Usage: /gift [username] [amount]")
        return
      }
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

  const handleUpdate = async () => {
    if (!editingId || !editText.trim() || !currentUser) return

    try {
      const response = await fetch("/api/chat-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          username: currentUser.username,
          message: editText.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert("Failed to update message: " + (errorData.error || "Unknown error"))
        return
      }

      setEditingId(null)
      setEditText("")
    } catch (error) {
      console.error("[v0] Error updating message:", error)
      alert("Failed to update message.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!currentUser) return

    try {
      const response = await fetch(`/api/chat-messages?id=${id}&username=${currentUser.username}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert("Failed to delete message: " + (errorData.error || "Unknown error"))
        return
      }
      setDeleteConfirmId(null)
    } catch (error) {
      console.error("[v0] Error deleting message:", error)
      alert("Failed to delete message.")
    }
  }

  const startEditing = (msg: LocalChatRow) => {
    setEditingId(msg.id)
    setEditText(msg.message)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
                <AlertTriangleIcon className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">Delete Message?</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  This action cannot be undone. Are you sure you want to remove this message from the arena?
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-xl border border-white/5 hover:bg-white/5 text-white/60 hover:text-white"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-900/40"
                  onClick={() => handleDelete(deleteConfirmId)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-5xl font-black text-white tracking-tighter">Global Chat</h1>
        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
        <ScrollArea className="h-[500px] w-full pr-4 mb-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20 p-20 border-2 border-dashed border-white/5 rounded-3xl">
                <MessageCircleIcon className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-bold uppercase tracking-widest text-sm">No messages yet</p>
                <p className="text-xs">Be the first to start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const displayRole = userRoles[msg.username] || msg.role
                const isMe = msg.username === currentUser?.username
                const isEditing = editingId === msg.id
                const isStaff = ["owner", "admin", "senior_moderator", "moderator", "tester"].includes(currentUser?.role || "")
                const canDelete = isMe || isStaff

                return (
                  <div
                    key={msg.id}
                    className={`group flex flex-col ${isMe ? "items-end" : "items-start"} transition-all duration-300`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      {!isMe && (
                        <>
                          <Badge className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-none ${getRoleColor(displayRole)}`}>
                            {displayRole}
                          </Badge>
                          {isStaff && (
                            <button
                              onClick={() => setDeleteConfirmId(msg.id)}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-md text-white/40 hover:text-red-400 transition-all"
                              title="Staff Delete"
                            >
                              <Trash2Icon className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                      {userClanData[msg.username]?.tag && (
                        <span 
                          onClick={() => {
                            if (userClanData[msg.username]?.clan_id && onClanTagClick) {
                              onClanTagClick(userClanData[msg.username].clan_id!)
                            }
                          }}
                          className={`inline-block text-xs font-black tracking-tight mr-1 ${userClanData[msg.username]?.clan_id ? 'cursor-pointer hover:underline' : ''}`}
                        >
                          <span className={userClanData[msg.username]?.color || 'text-purple-400'}>
                            [{userClanData[msg.username]?.tag}]
                          </span>
                        </span>
                      )}
                      <span
                        className={`text-xs font-black tracking-tight cursor-pointer hover:underline transition-all ${isMe ? "text-purple-400" : "text-white/60"
                          }`}
                        onClick={() => onUsernameClick(msg.username)}
                      >
                        {msg.username}
                      </span>
                      {isMe && (
                        <>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditing(msg)}
                              className="p-1 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition-colors"
                            >
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(msg.id)}
                              className="p-1 hover:bg-red-500/20 rounded-md text-white/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2Icon className="w-3 h-3" />
                            </button>
                          </div>
                          <Badge className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-none ${getRoleColor(displayRole)}`}>
                            {displayRole}
                          </Badge>
                        </>
                      )}
                    </div>

                    <div className={`
                      max-w-[85%] px-4 py-2.5 rounded-2xl border transition-all duration-300 relative
                      ${isMe
                        ? "bg-purple-600/20 border-purple-500/30 text-white rounded-tr-none shadow-lg shadow-purple-900/10"
                        : "bg-white/5 border-white/10 text-white/90 rounded-tl-none hover:bg-white/10"
                      }
                      ${isEditing ? "ring-2 ring-purple-500 border-transparent w-full" : ""}
                    `}>
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="bg-transparent border-none text-white focus:ring-0 text-sm resize-none w-full min-h-[60px]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleUpdate()
                              }
                              if (e.key === "Escape") setEditingId(null)
                            }}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleUpdate}
                              className="p-1.5 bg-purple-500 hover:bg-purple-400 rounded-lg text-white shadow-lg transition-colors"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                      )}
                    </div>

                    {/* Reactions */}
                    <div className={`flex items-center gap-1 mt-1 px-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {/* Existing reactions */}
                      {Object.entries(msg.reactions || {}).map(([emoji, users]) => {
                        const reacted = (users as string[]).includes(currentUser?.username || '')
                        return (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${reacted ? 'bg-purple-500/30 border border-purple-500/50' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
                          >
                            <span>{emoji}</span>
                            <span className="font-bold text-white/60">{(users as string[]).length}</span>
                          </button>
                        )
                      })}
                      {/* Add reaction button */}
                      <div className="relative group/reaction">
                        <button className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 text-xs transition-all border border-transparent hover:border-white/10">
                          +
                        </button>
                        <div className="absolute bottom-full left-0 mb-1 hidden group-hover/reaction:flex bg-slate-900 border border-white/10 rounded-xl p-1 gap-1 shadow-xl z-50">
                          {REACTION_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="hover:bg-white/10 rounded-lg px-1.5 py-1 text-base transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <span className="text-[9px] text-white/20 mt-1 px-1 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(isNaN(Number(msg.timestamp)) ? msg.timestamp : Number(msg.timestamp)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
          <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-4">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isMuted ? "You have been silenced" : "Share something with the arena..."}
              disabled={isMuted}
              className="flex-1 bg-transparent border-none text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
              onKeyDown={(e) => e.key === "Enter" && !isMuted && send()}
            />
            <Button
              onClick={send}
              disabled={isMuted || !text.trim()}
              className={`
                ml-2 rounded-xl h-10 w-10 p-0 transition-all duration-300
                ${isMuted || !text.trim()
                  ? "bg-white/5 text-white/20"
                  : "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95"
                }
              `}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
