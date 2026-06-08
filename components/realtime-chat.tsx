"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SendIcon, MessageCircleIcon, PencilIcon, Trash2Icon, CheckIcon, XIcon, AlertTriangleIcon } from "lucide-react"
import { toast } from "sonner"

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
    case "system":
      return "bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] text-white font-extrabold"
    default:
      return "bg-slate-600 text-white"
  }
}

const playPingSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // High-pitched chime synthesizer
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.1); // A5
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.55);
  } catch (e) {
    console.error("Failed to play synthesized ping sound:", e);
  }
};

const renderMessageText = (text: string, userRoles: Record<string, string>) => {
  const parts = text.split(/(@[a-zA-Z0-9_-]+)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("@")) {
      const pingedName = part.slice(1);
      const pingedNameLower = pingedName.toLowerCase();
      const actualUsername = Object.keys(userRoles).find(u => u.toLowerCase() === pingedNameLower);
      if (actualUsername) {
        return (
          <span
            key={idx}
            className="text-red-500 font-extrabold bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/20"
            title={`Mentioned ${actualUsername}`}
          >
            @{actualUsername}
          </span>
        );
      }
    }
    return part;
  });
};

export default function RealtimeChat({ currentUser, roleName, onUsernameClick, onClanTagClick }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [messages, setMessages] = useState<LocalChatRow[]>([])
  const [text, setText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const [userRoles, setUserRoles] = useState<Record<string, string>>({})
  const [userClanData, setUserClanData] = useState<Record<string, { tag: string | null; color: string | null; clan_id: string | null; avatar: string | null }>>({})
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
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [messages])

  useEffect(() => {
    const fetchUserRolesAndClans = async () => {
      if (supabase) {
        const { data } = await supabase.from("users").select("username, role, clan_id, clan_tag, clan_tag_color, profile_picture")
        if (data) {
          const roles: Record<string, string> = {}
          const clans: Record<string, { tag: string | null; color: string | null; clan_id: string | null; avatar: string | null }> = {}
          data.forEach((u: any) => {
            roles[u.username] = u.role || "player"
            clans[u.username] = { tag: u.clan_tag, color: u.clan_tag_color, clan_id: u.clan_id, avatar: u.profile_picture }
          })
          setUserRoles(roles)
          setUserClanData(clans)
        }
      }
    }
    fetchUserRolesAndClans()
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
            reactions: d.reactions || {}
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

        if (!error && data) {
          data.reverse()
          const mapped = data.map((d: any) => ({
            id: d.id,
            username: d.username,
            message: d.message,
            role: d.role,
            timestamp: d.inserted_at || new Date().toISOString(),
            reactions: d.reactions || {}
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
                  timestamp: d.inserted_at || new Date().toISOString(),
                  reactions: d.reactions || {}
                },
              ])
            } else if (payload.eventType === "UPDATE") {
              const d = payload.new as any
              setMessages((prev) =>
                prev.map(m => m.id === d.id ? { ...m, message: d.message, reactions: d.reactions || {} } : m)
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

      {/* Cyber Communications Console Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 border border-white/10 p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
              COMMS <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 drop-shadow-sm">TERMINAL</span>
            </h1>
            <p className="text-white/40 text-xs md:text-sm font-semibold uppercase tracking-wider">
              Secure System Channel • Real-time Broadcast
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-left">
              <div className="text-[10px] text-white/40 font-black uppercase tracking-wider">Network Status</div>
              <div className="text-xs font-black text-emerald-400 uppercase tracking-widest">ONLINE</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/40 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <ScrollArea className="h-[550px] w-full pr-4 mb-6">
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20 p-20 border border-dashed border-white/10 rounded-[2rem] bg-black/20">
                <MessageCircleIcon className="w-12 h-12 mb-4 opacity-20 text-purple-400 animate-pulse" />
                <p className="font-bold uppercase tracking-widest text-sm text-white/60">No Transmissions Found</p>
                <p className="text-xs text-white/30 mt-1">Initiate conversation to establish downlink.</p>
              </div>
            ) : (
              messages.map((msg) => {
                 const isSystem = msg.username === "System 🛡️"
                 const displayRole = isSystem ? "system" : (userRoles[msg.username] || msg.role)
                 const isMe = msg.username === currentUser?.username
                 const isEditing = editingId === msg.id
                 const isStaff = ["owner", "admin", "senior_moderator", "moderator", "tester"].includes(currentUser?.role || "")
                 const canDelete = isMe || isStaff
                 const avatar = isSystem ? "🛡️" : (userClanData[msg.username]?.avatar || "🎯")

                  // Check if the current user is mentioned in this message, or if it is a global ping
                  const isPinged = currentUser?.username && msg.username !== currentUser.username && (() => {
                    const myNameEscaped = currentUser.username.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    return new RegExp(`@(${myNameEscaped}|everyone|here)\\b`, "i").test(msg.message);
                  })();

                return (
                  <div
                    key={msg.id}
                    className={`group flex items-start gap-4 ${isMe ? "flex-row-reverse text-right" : "text-left"} transition-all duration-300 p-3 rounded-2xl ${
                      isPinged 
                        ? "bg-red-500/10 border-l-4 border-red-500 shadow-[inset_0_0_15px_rgba(239,68,68,0.08)]" 
                        : "border-l-4 border-transparent"
                    }`}
                  >
                    {/* User Avatar with Rarity glow */}
                    <div 
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl border bg-slate-900 relative cursor-pointer flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md ${
                        isMe ? "border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]" : "border-white/10"
                      }`}
                      onClick={() => !isSystem && onUsernameClick(msg.username)}
                    >
                      <span>{avatar}</span>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                    </div>

                    <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                      {/* Name / Role Info */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {!isMe && !isSystem && (
                          <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none ${getRoleColor(displayRole)}`}>
                            {displayRole}
                          </Badge>
                        )}
                        
                        {!isSystem && userClanData[msg.username]?.tag && (
                          <span 
                            onClick={() => {
                              if (userClanData[msg.username]?.clan_id && onClanTagClick) {
                                onClanTagClick(userClanData[msg.username].clan_id!)
                              }
                            }}
                            className={`inline-block text-xs font-black tracking-tight ${userClanData[msg.username]?.clan_id ? 'cursor-pointer hover:underline' : ''}`}
                          >
                            <span className={userClanData[msg.username]?.color || 'text-purple-400'}>
                              [{userClanData[msg.username]?.tag}]
                            </span>
                          </span>
                        )}

                        <span
                          className={`text-xs font-bold tracking-wide transition-all ${
                            isSystem
                              ? "text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)] font-black"
                              : isMe
                                ? "text-purple-400 cursor-pointer hover:underline"
                                : "text-white/80 cursor-pointer hover:underline"
                          }`}
                          onClick={() => !isSystem && onUsernameClick(msg.username)}
                        >
                          {msg.username}
                        </span>

                        {isMe && !isSystem && (
                          <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none ${getRoleColor(displayRole)}`}>
                            {displayRole}
                          </Badge>
                        )}

                        {/* Message actions on hover */}
                        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1 ${isMe ? "flex-row-reverse" : ""}`}>
                          {isMe && (
                            <button
                              onClick={() => startEditing(msg)}
                              className="p-1 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition-colors"
                              title="Edit Message"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirmId(msg.id)}
                              className="p-1 hover:bg-red-500/20 rounded-md text-white/40 hover:text-red-400 transition-colors"
                              title="Delete Message"
                            >
                              <Trash2Icon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bubble Text */}
                      <div className={`
                        px-5 py-3.5 rounded-3xl border transition-all duration-300 relative shadow-lg
                        ${isSystem
                          ? "bg-gradient-to-br from-red-950/50 via-orange-950/25 to-slate-950/70 border-red-500/30 text-red-200 rounded-tl-none shadow-[0_0_20px_rgba(239,68,68,0.15)] w-full"
                          : isMe
                            ? "bg-gradient-to-br from-purple-900/20 to-indigo-950/20 border-purple-500/30 text-white rounded-tr-none shadow-[0_0_20px_rgba(168,85,247,0.05)]"
                            : "bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-white/10 text-white/95 rounded-tl-none hover:border-white/20"
                        }
                        ${isEditing ? "ring-2 ring-purple-500 border-transparent w-full" : ""}
                      `}>
                        {isEditing ? (
                          <div className="flex flex-col gap-2 min-w-[250px]">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="bg-transparent border-none text-white focus:ring-0 text-sm resize-none w-full min-h-[60px] outline-none"
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
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {renderMessageText(msg.message, userRoles)}
                          </p>
                        )}
                      </div>

                      {/* Reactions Drawer */}
                      <div className={`flex items-center gap-1.5 mt-2 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(msg.reactions || {}).map(([emoji, users]) => {
                          const reacted = (users as string[]).includes(currentUser?.username || '')
                          return (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-300 ${
                                reacted 
                                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                                  : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white/60'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="font-black">{(users as string[]).length}</span>
                            </button>
                          )
                        })}

                        {/* Floating mini-reaction popover */}
                        <div className="relative group/reactbtn">
                          <button className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-xs border border-white/5 transition-all duration-300">
                            +
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/reactbtn:flex bg-slate-950 border border-white/10 rounded-2xl p-1.5 gap-1.5 shadow-2xl z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {REACTION_EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(msg.id, emoji)}
                                className="hover:bg-white/10 rounded-xl w-8 h-8 flex items-center justify-center text-base transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <span className="text-[9px] text-white/20 mt-1 px-1 font-bold">
                        {new Date(isNaN(Number(msg.timestamp)) ? msg.timestamp : Number(msg.timestamp)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input Dock */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-[2rem] blur opacity-15 group-focus-within:opacity-30 transition duration-500" />
          <div className="relative flex items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-[1.8rem] p-2.5 pl-5 shadow-2xl">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isMuted ? "SYSTEM BLOCKED • MUTED" : "Interface terminal input..."}
              disabled={isMuted}
              className="flex-1 bg-transparent border-none text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 text-sm font-medium"
              onKeyDown={(e) => e.key === "Enter" && !isMuted && send()}
            />
            <Button
              onClick={send}
              disabled={isMuted || !text.trim()}
              className={`
                ml-3 rounded-2xl h-11 px-6 font-black uppercase tracking-wider text-xs transition-all duration-300
                ${isMuted || !text.trim()
                  ? "bg-white/5 text-white/20 cursor-not-allowed border-none"
                  : "bg-white text-black hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-500 hover:text-white shadow-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95 border-none"
                }
              `}
            >
              <SendIcon className="h-4 w-4 mr-2" /> Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
