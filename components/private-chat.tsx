"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    MessageSquareIcon,
    UserPlusIcon,
    UsersIcon,
    SendIcon,
    XIcon,
    SearchIcon,
    MessageCircleIcon,
    CheckIcon,
    MoreVerticalIcon,
    Trash2Icon,
    ShieldCheckIcon,
    BanIcon
} from "lucide-react"

type GameUser = {
    id: string
    username: string
    profile_picture?: string
    role?: string
}

type Conversation = {
    id: string
    name: string | null
    is_group: boolean
    last_message?: string
    updated_at: string
    members: string[] // usernames
}

type Message = {
    id: string
    conversation_id: string
    sender_id: string
    sender_username: string
    message: string
    inserted_at: string
}

type Props = {
    currentUser: { id: string; username: string; role?: string } | null
    onPlayerClick?: (userId: string) => void;
}

export default function PrivateChat({ currentUser, onPlayerClick }: Props) {
    const supabase = useMemo(() => getSupabaseBrowserClient(), [])

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputText, setInputText] = useState("")
    const [showNewChat, setShowNewChat] = useState(false)

    // New Chat Logic
    const [allUsers, setAllUsers] = useState<GameUser[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]) // user IDs
    const [groupName, setGroupName] = useState("")
    const [searchQuery, setSearchQuery] = useState("")


    // Block System
    const [blockedUsers, setBlockedUsers] = useState<string[]>([])
    // Chat Actions
    const [showChatActions, setShowChatActions] = useState<string | null>(null) // conversation ID

    useEffect(() => {
        const stored = localStorage.getItem("boomkit_blocked_users")
        if (stored) setBlockedUsers(JSON.parse(stored))
    }, [])

    const blockUser = (username: string) => {
        if (blockedUsers.includes(username)) return
        const newBlocked = [...blockedUsers, username]
        setBlockedUsers(newBlocked)
        localStorage.setItem("boomkit_blocked_users", JSON.stringify(newBlocked))
        // Close active if blocked user is in it (optional, but good UX for single chats)
        if (activeConversation && !activeConversation.is_group && activeConversation.members.find(m => m === username)) {
            setActiveConversation(null)
        }
        alert("User blocked.")
    }

    const unblockUser = (username: string) => {
        const newBlocked = blockedUsers.filter(u => u !== username)
        setBlockedUsers(newBlocked)
        localStorage.setItem("boomkit_blocked_users", JSON.stringify(newBlocked))
        alert("User unblocked.")
    }

    const deleteChat = (convId: string) => {
        // Local "hide" for now as requested
        const storedHidden = localStorage.getItem("boomkit_hidden_chats")
        const hidden = storedHidden ? JSON.parse(storedHidden) : []
        const newHidden = [...hidden, convId]
        localStorage.setItem("boomkit_hidden_chats", JSON.stringify(newHidden))

        setConversations(prev => prev.filter(c => c.id !== convId))
        if (activeConversation?.id === convId) setActiveConversation(null)
        alert("Chat deleted from view.")
    }

    const scrollRef = useRef<HTMLDivElement>(null)

    // 1. Fetch Conversations
    const fetchConversations = async () => {
        if (!supabase || !currentUser) return

        try {
            const res = await fetch('/api/conversations')
            if (!res.ok) throw new Error('Failed to fetch conversations')
            const data = await res.json()
            
            setConversations((data || [])
                .filter((c: any) => {
                    // Filter hidden chats
                    const hidden = JSON.parse(localStorage.getItem("boomkit_hidden_chats") || "[]")
                    return !hidden.includes(c.id)
                })
                .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            )
        } catch (e) {
            console.error("Error fetching conversations:", e)
        }
    }

    // 2. Fetch Messages
    const fetchMessages = async (convId: string) => {
        if (!supabase) return
        try {
            const res = await fetch(`/api/messages?conversation_id=${convId}`)
            if (!res.ok) throw new Error('Failed to fetch messages')
            const data = await res.json()
            setMessages((data || []).reverse())
        } catch (e) {
            console.error("Error fetching messages:", e)
        }
    }

    // 3. Realtime Subscription (Broadcast)
    useEffect(() => {
        if (!supabase || !currentUser) return

        fetchConversations()

        if (!activeConversation) return

        const channelName = `private_chat_${activeConversation.id}`
        const channel = supabase
            .channel(channelName)
            .on('broadcast', { event: 'new_message' }, (payload) => {
                const newMsg = payload.payload as Message
                const senderBlocked = blockedUsers.includes(newMsg.sender_username)
                if (!senderBlocked) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev
                        return [...prev, newMsg]
                    })
                }
                fetchConversations()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, currentUser?.id, activeConversation?.id, blockedUsers])

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            // Use block: 'nearest' to prevent scrolling the whole page if already in view
            scrollRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
    }, [messages])

    // Fetch Users for "New Chat"
    useEffect(() => {
        if (showNewChat) {
            const fetchUsers = async () => {
                try {
                    const res = await fetch('/api/users')
                    if (!res.ok) throw new Error('Failed to fetch users')
                    const data = await res.json()
                    setAllUsers(data.filter((u: any) => u.id !== currentUser?.id))
                } catch (e) {
                    console.error(e)
                }
            }
            fetchUsers()
        }
    }, [showNewChat, currentUser?.id])

    const startConversation = async () => {
        if (!supabase || !currentUser || selectedUsers.length === 0) return

        const isGroup = selectedUsers.length > 1 || groupName.trim() !== ""

        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedUsers,
                    groupName: isGroup ? (groupName || "Group Chat") : null
                })
            })
            
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to create conversation')
            }
            
            const { conversation } = await res.json()

            setShowNewChat(false)
            setSelectedUsers([])
            setGroupName("")
            fetchConversations()
            setActiveConversation({
                id: conversation.id,
                name: conversation.name,
                is_group: conversation.is_group,
                updated_at: conversation.updated_at,
                members: []
            })
            fetchMessages(conversation.id)
        } catch (error: any) {
            alert(error.message)
        }
    }

    const sendMessage = async () => {
        if (!supabase || !currentUser || !activeConversation || !inputText.trim()) return

        const textToSend = inputText.trim()
        setInputText("")

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: activeConversation.id,
                    message: textToSend
                })
            })

            if (!res.ok) {
                const err = await res.json()
                if (err.error === 'MUTED') {
                    alert('You are muted and cannot send messages.')
                } else {
                    throw new Error(err.error || 'Failed to send message')
                }
                setInputText(textToSend)
            }
        } catch (error: any) {
            alert("Failed to send: " + error.message)
            setInputText(textToSend)
        }
    }

    const filteredUsers = allUsers.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(u as any).is_banned
    )

    const getChatTitle = (conv: Conversation) => {
        if (conv.name) return conv.name
        const otherMember = conv.members.find(m => m !== currentUser?.username)
        return otherMember || "Private Chat"
    }

    return (
        <div className="flex flex-col md:flex-row h-[650px] blooket-card overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col md:flex-row grow overflow-hidden w-full">

                {/* Sidebar: Chat List */}
                <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-black/30">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h2 className="font-heading text-lg font-black text-white tracking-tight flex items-center gap-2">
                                <MessageSquareIcon className="h-4 w-4 text-purple-400" />
                                SECURE CHATS
                            </h2>
                            <p className="font-heading text-[9px] text-white/30 font-black uppercase tracking-widest">Downlink channels</p>
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setShowNewChat(true)}
                            className="rounded-xl hover:bg-[#5b21b6]/5 text-purple-400 border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300"
                        >
                            <UserPlusIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-grow">
                        <div className="p-4 space-y-2.5">
                            {conversations.length === 0 ? (
                                <div className="py-20 text-center space-y-3 opacity-20 bg-black/10 rounded-2xl border border-dashed border-white/5 m-2">
                                    <MessageCircleIcon className="h-8 w-8 mx-auto text-purple-400 animate-pulse" />
                                    <p className="font-heading text-[10px] font-black uppercase tracking-widest text-white">No active decodes</p>
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <div
                                        key={conv.id}
                                        className="relative group"
                                        onMouseLeave={() => setShowChatActions(null)}
                                    >
                                        <button
                                            onClick={() => {
                                                setActiveConversation(conv)
                                                fetchMessages(conv.id)
                                            }}
                                            className={`w-full p-4 rounded-2xl text-left transition-all duration-300 pr-10 border ${
                                                activeConversation?.id === conv.id
                                                    ? 'bg-purple-900/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)] text-white'
                                                    : 'bg-black/10 hover:bg-[#5b21b6]/5 border-white/5 hover:border-white/10 text-white/70 hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                                                    conv.is_group 
                                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                                                        : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                                }`}>
                                                    {conv.is_group ? <UsersIcon className="h-4 w-4" /> : <MessageSquareIcon className="h-4 w-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-sm truncate tracking-tight">{getChatTitle(conv)}</p>
                                                    <p className="font-heading text-[9px] text-white/30 font-bold uppercase tracking-wider mt-0.5">
                                                        {conv.members.length} operators
                                                    </p>
                                                </div>
                                                {activeConversation?.id === conv.id && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_purple]" />
                                                )}
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowChatActions(showChatActions === conv.id ? null : conv.id)
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white"
                                        >
                                            <MoreVerticalIcon className="h-4 w-4" />
                                        </button>

                                        {showChatActions === conv.id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 blooket-panel rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                                <div className="p-1.5 space-y-1">
                                                    {!conv.is_group && (
                                                        (() => {
                                                            const otherUser = conv.members.find(m => m !== currentUser?.username)
                                                            const isBlocked = otherUser ? blockedUsers.includes(otherUser) : false

                                                            return (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        if (otherUser) {
                                                                            if (isBlocked) {
                                                                                unblockUser(otherUser)
                                                                            } else {
                                                                                blockUser(otherUser)
                                                                            }
                                                                        }
                                                                        setShowChatActions(null)
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-white hover:bg-[#5b21b6]/10 rounded-xl"
                                                                >
                                                                    {isBlocked ? (
                                                                        <>
                                                                            <ShieldCheckIcon className="h-3.5 w-3.5 text-green-400" />
                                                                            <span className="font-heading text-green-400">Unblock User</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <BanIcon className="h-3.5 w-3.5" /> Block User
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )
                                                        })()
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteChat(conv.id)
                                                            setShowChatActions(null)
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl"
                                                    >
                                                        <Trash2Icon className="h-3.5 w-3.5" /> Delete Chat
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col relative bg-black/10 min-w-0">
                    {!activeConversation ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 relative">
                            {/* Glowing Grid Background */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px]" />
                            <div className="absolute w-72 h-72 rounded-full bg-purple-500/5 blur-[80px] pointer-events-none" />

                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative z-10">
                                <ShieldCheckIcon className="h-10 w-10 text-purple-400 animate-pulse" />
                            </div>
                            <div className="max-w-sm space-y-2 relative z-10">
                                <h3 className="font-heading text-2xl font-black text-white tracking-tight">ENCRYPTED DOWNLINK</h3>
                                <p className="font-heading text-xs text-white/40 font-semibold leading-relaxed uppercase tracking-wider max-w-xs mx-auto">
                                    Private quantum links are completely encrypted. Peer-to-peer connection bypasses global logs.
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowNewChat(true)}
                                className="bg-purple-600 hover:bg-purple-500 text-white rounded-2xl px-8 py-6 font-black shadow-xl shadow-purple-900/30 hover:scale-[1.02] active:scale-95 transition-all relative z-10 border-none text-xs uppercase tracking-wider"
                            >
                                Open Channel
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/20 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                                        activeConversation.is_group 
                                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                                            : 'bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                                    }`}>
                                        {activeConversation.is_group ? <UsersIcon className="h-5 w-5" /> : <MessageSquareIcon className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-heading text-base font-black text-white tracking-tight leading-none mb-1">
                                            {getChatTitle(activeConversation)}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="font-heading text-[9px] font-black text-white/30 uppercase tracking-widest truncate max-w-xs">{activeConversation.members.join(', ')}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-xl text-white/40 hover:text-white border border-white/5 hover:bg-[#5b21b6]/5" 
                                    onClick={() => setActiveConversation(null)}
                                >
                                    <XIcon className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Messages Display */}
                            <ScrollArea className="flex-1 p-6 md:p-8">
                                <div className="space-y-6">
                                    {messages.filter(m => !blockedUsers.includes(m.sender_username)).map((msg, idx) => {
                                        const isMe = msg.sender_id === currentUser?.id
                                        const showName = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id

                                        return (
                                            <div key={msg.id} className={`flex items-start gap-3.5 ${isMe ? 'flex-row-reverse text-right' : 'text-left'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                                {/* Left avatar placeholder (only for incoming messages) */}
                                                {!isMe && (
                                                    <div 
                                                        className={`w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-sm font-black cursor-pointer shadow-md`}
                                                        onClick={() => onPlayerClick && onPlayerClick(msg.sender_id)}
                                                    >
                                                        {msg.sender_username[0].toUpperCase()}
                                                    </div>
                                                )}

                                                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                    {showName && !isMe && (
                                                        <span
                                                            className={`text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5 ml-1 ${onPlayerClick ? 'cursor-pointer hover:text-purple-400 transition-colors' : ''}`}
                                                            onClick={() => onPlayerClick && onPlayerClick(msg.sender_id)}
                                                        >
                                                            {msg.sender_username}
                                                        </span>
                                                    )}
                                                    
                                                    <div className={`px-4.5 py-3 rounded-3xl border transition-all shadow-md ${
                                                        isMe
                                                            ? 'bg-gradient-to-br from-purple-900/20 to-indigo-950/20 border-purple-500/30 text-white rounded-tr-none shadow-[0_0_15px_rgba(168,85,247,0.05)]'
                                                            : 'bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-white/10 text-white/90 rounded-tl-none'
                                                    }`}>
                                                        <p className="font-heading text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                                                            {msg.message}
                                                        </p>
                                                    </div>
                                                    <span className="font-heading text-[8px] text-white/20 mt-1 font-bold">
                                                        {new Date(msg.inserted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>

                            {/* Message Input */}
                            <div className="p-6 blooket-panel border-t border-purple-800">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/50 to-blue-600/50 rounded-3xl blur opacity-10 group-focus-within:opacity-20 transition duration-500" />
                                    <div className="relative flex items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-5 shadow-2xl">
                                        <Input
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder="Transmit secure whisper..."
                                            className="flex-1 bg-transparent border-none text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-sm font-medium"
                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        />
                                        <Button
                                            onClick={sendMessage}
                                            disabled={!inputText.trim()}
                                            className={`ml-2 h-10 w-10 p-0 rounded-xl transition-all duration-300 border-none ${
                                                !inputText.trim() 
                                                    ? "bg-[#5b21b6]/5 text-white/20" 
                                                    : "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg hover:scale-105 active:scale-95"
                                            }`}
                                        >
                                            <SendIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-300">
                    <Card className="w-full max-w-lg bg-[#0a0a0c]/95 backdrop-blur-2xl border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden">
                        <div className="p-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-heading text-3xl font-black text-white tracking-tight">Initiate Transmission</h3>
                                    <p className="font-heading text-white/30 text-sm font-bold uppercase tracking-widest mt-1">Select recipients for private or group chat</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowNewChat(false)} className="rounded-full h-12 w-12 text-white/20 hover:text-white">
                                    <XIcon className="h-8 w-8" />
                                </Button>
                            </div>

                            <div className="space-y-6">
                                <div className="relative">
                                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                                    <Input
                                        placeholder="Search characters by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-[#5b21b6]/5 border-white/10 h-14 pl-14 rounded-2xl text-white placeholder:text-white/20 focus:ring-purple-500/50"
                                    />
                                </div>

                                <ScrollArea className="h-64 border border-white/5 rounded-2xl bg-black/20 p-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {filteredUsers.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => {
                                                    if (selectedUsers.includes(user.id)) {
                                                        setSelectedUsers(prev => prev.filter(id => id !== user.id))
                                                    } else {
                                                        setSelectedUsers(prev => [...prev, user.id])
                                                    }
                                                }}
                                                className={`p-4 rounded-xl text-left border transition-all flex items-center justify-between group ${selectedUsers.includes(user.id)
                                                    ? 'bg-purple-600/20 border-purple-500/50'
                                                    : 'bg-[#5b21b6]/5 border-white/5 hover:bg-[#5b21b6]/10'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#5b21b6]/10 flex items-center justify-center font-black text-[10px] text-white/40">
                                                        {user.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-heading text-xs font-black text-white tracking-tight">{user.username}</p>
                                                        <span className="font-heading text-[10px] font-bold text-white/20 uppercase tracking-widest">{user.role || 'Player'}</span>
                                                    </div>
                                                </div>
                                                {selectedUsers.includes(user.id) && (
                                                    <div className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center shadow-[0_0_10px_purple]">
                                                        <CheckIcon className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>

                                {selectedUsers.length > 1 && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <label className="font-heading text-xs font-black text-white/30 uppercase tracking-[0.2em] ml-1">Group Identifier (Optional)</label>
                                        <Input
                                            placeholder="e.g. The Syndicate"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            className="bg-[#5b21b6]/5 border-white/10 h-14 rounded-2xl text-white focus:ring-blue-500/50"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowNewChat(false)}
                                    className="flex-1 h-14 rounded-2xl text-white/20 hover:text-white"
                                >
                                    Discard
                                </Button>
                                <Button
                                    disabled={selectedUsers.length === 0}
                                    onClick={startConversation}
                                    className="flex-1 h-14 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl shadow-xl shadow-purple-900/40"
                                >
                                    Establish Link
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
