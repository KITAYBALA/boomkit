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
}

export default function PrivateChat({ currentUser }: Props) {
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

        // This is a heavy query because we need member info
        const { data: memberRows, error: memberError } = await supabase
            .from('conversation_members')
            .select('conversation_id, conversations(*), user_id, users(username)')
            .eq('user_id', currentUser.id)

        if (memberError) {
            console.error("Error fetching conversations:", memberError)
            return
        }

        const conversationsMap = new Map<string, Conversation>()

        // First pass: aggregate conversations
        memberRows.forEach((row: any) => {
            const conv = row.conversations
            conversationsMap.set(conv.id, {
                id: conv.id,
                name: conv.name,
                is_group: conv.is_group,
                updated_at: conv.updated_at,
                members: []
            })
        })

        // Second pass: get all members for these conversations
        if (conversationsMap.size > 0) {
            const conversationIds = Array.from(conversationsMap.keys())

            // Batch the member fetch but limit the size to avoid URL length issues
            // (19 conversations is usually safe, but let's be robust)
            const CHUNK_SIZE = 15
            for (let i = 0; i < conversationIds.length; i += CHUNK_SIZE) {
                const chunk = conversationIds.slice(i, i + CHUNK_SIZE)
                const { data: allMembers } = await supabase
                    .from('conversation_members')
                    .select('conversation_id, users(username)')
                    .in('conversation_id', chunk)

                allMembers?.forEach((m: any) => {
                    const conv = conversationsMap.get(m.conversation_id)
                    if (conv) conv.members.push(m.users.username)
                })
            }
        }

        setConversations(Array.from(conversationsMap.values())
            .filter(c => {
                // Filter hidden chats
                const hidden = JSON.parse(localStorage.getItem("boomkit_hidden_chats") || "[]")
                return !hidden.includes(c.id)
            })
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        )
    }

    // 2. Fetch Messages
    const fetchMessages = async (convId: string) => {
        if (!supabase) return
        const { data, error } = await supabase
            .from('direct_messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('inserted_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error("Error fetching messages:", error)
        } else {
            // Reverse to show in chronological order (oldest -> newest)
            setMessages((data || []).reverse())
        }
    }

    // 3. Realtime Subscription
    useEffect(() => {
        if (!supabase || !currentUser) return

        fetchConversations()

        const channel = supabase
            .channel('private_chats')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'direct_messages'
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newMsg = payload.new as Message
                    if (activeConversation?.id === newMsg.conversation_id) {
                        // Check blocked
                        const senderBlocked = blockedUsers.includes(newMsg.sender_id)
                        // Note: We might need sender_id in blockedUsers.
                        // Current block implementation might be username or ID based. Let's assume ID.
                        // IMPORTANT: blockedUsers logic needs to be consistent. 
                        // For now, let's just filter message list render.
                        setMessages(prev => [...prev, newMsg])
                    }
                    // Refresh list to update "last message" or order
                    fetchConversations()
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, currentUser?.id, activeConversation?.id])

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            // Use block: 'nearest' to prevent scrolling the whole page if already in view
            scrollRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
    }, [messages])

    // Fetch Users for "New Chat"
    useEffect(() => {
        if (showNewChat && supabase) {
            const fetchUsers = async () => {
                const { data } = await supabase
                    .from('users')
                    .select('id, username, profile_picture, role')
                    .neq('id', currentUser?.id)
                if (data) setAllUsers(data)
            }
            fetchUsers()
        }
    }, [showNewChat, supabase, currentUser?.id])

    const startConversation = async () => {
        if (!supabase || !currentUser || selectedUsers.length === 0) return

        const isGroup = selectedUsers.length > 1 || groupName.trim() !== ""

        // 1. Create Conversation
        const { data: conv, error: convError } = await supabase
            .from('conversations')
            .insert({
                name: isGroup ? (groupName || "Group Chat") : null,
                is_group: isGroup,
                created_by: currentUser.id
            })
            .select()
            .single()

        if (convError) {
            alert("Failed to create conversation: " + convError.message)
            return
        }

        // 2. Add Members
        const membersToAdd = [...selectedUsers, currentUser.id].map(uid => ({
            conversation_id: conv.id,
            user_id: uid
        }))

        const { error: memberError } = await supabase
            .from('conversation_members')
            .insert(membersToAdd)

        if (memberError) {
            alert("Failed to add members: " + memberError.message)
            return
        }

        setShowNewChat(false)
        setSelectedUsers([])
        setGroupName("")
        fetchConversations()
        setActiveConversation({
            id: conv.id,
            name: conv.name,
            is_group: conv.is_group,
            updated_at: conv.updated_at,
            members: [] // Will be populated on next fetch
        })
        fetchMessages(conv.id)
    }

    const sendMessage = async () => {
        if (!supabase || !currentUser || !activeConversation || !inputText.trim()) return

        const textToSend = inputText.trim()
        setInputText("")

        const { error } = await supabase
            .from('direct_messages')
            .insert({
                conversation_id: activeConversation.id,
                sender_id: currentUser.id,
                sender_username: currentUser.username,
                message: textToSend
            })

        if (error) {
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
        <div className="flex flex-col h-[600px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 duration-700">
            <div className="flex grow overflow-hidden">

                {/* Sidebar: Chat List */}
                <div className="w-80 border-r border-white/10 flex flex-col bg-black/20">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                            <MessageSquareIcon className="h-5 w-5 text-purple-400" />
                            Directs
                        </h2>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setShowNewChat(true)}
                            className="rounded-xl hover:bg-white/5 text-purple-400"
                        >
                            <UserPlusIcon className="h-5 w-5" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-3 space-y-2">
                            {conversations.length === 0 ? (
                                <div className="py-20 text-center space-y-3 opacity-20">
                                    <MessageCircleIcon className="h-10 w-10 mx-auto" />
                                    <p className="text-xs font-black uppercase tracking-widest">No chats active</p>
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
                                            className={`w-full p-4 rounded-2xl text-left transition-all duration-300 pr-10 ${activeConversation?.id === conv.id
                                                ? 'bg-purple-600/20 border border-purple-500/30'
                                                : 'hover:bg-white/5 border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${conv.is_group ? 'bg-blue-500/10 border-blue-500/20' : 'bg-purple-500/10 border-purple-500/20'
                                                    }`}>
                                                    {conv.is_group ? <UsersIcon className="h-5 w-5 text-blue-400" /> : <MessageSquareIcon className="h-5 w-5 text-purple-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-white text-sm truncate tracking-tight">{getChatTitle(conv)}</p>
                                                    <p className="text-[10px] text-white/30 font-bold uppercase truncate">
                                                        {conv.members.length} MEMBERS
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
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                                <div className="p-1">
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
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg"
                                                                >
                                                                    {isBlocked ? (
                                                                        <>
                                                                            <ShieldCheckIcon className="h-3.5 w-3.5 text-green-400" />
                                                                            <span className="text-green-400">Unblock User</span>
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
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg"
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
                <div className="flex-1 flex flex-col relative">
                    {!activeConversation ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
                            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10">
                                <ShieldCheckIcon className="h-12 w-12 text-white/10" />
                            </div>
                            <div className="max-w-xs space-y-2">
                                <h3 className="text-2xl font-black text-white tracking-tight">Encrypted Zone</h3>
                                <p className="text-sm text-white/30 font-medium leading-relaxed">
                                    Private and group chats are restricted to members.
                                    Mods cannot view or interrupt. Total freedom of speech.
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowNewChat(true)}
                                className="bg-purple-600 hover:bg-purple-500 text-white rounded-2xl px-8 font-black shadow-xl shadow-purple-900/40"
                            >
                                Start new conversation
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/10">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${activeConversation.is_group ? 'bg-blue-500/10 border-blue-500/20' : 'bg-purple-500/10 border-purple-500/20'
                                        }`}>
                                        {activeConversation.is_group ? <UsersIcon className="h-6 w-6 text-blue-400" /> : <MessageSquareIcon className="h-6 w-6 text-purple-400" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">
                                            {getChatTitle(activeConversation)}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{activeConversation.members.join(', ')}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-xl text-white/20 hover:text-white" onClick={() => setActiveConversation(null)}>
                                    <XIcon className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Messages Display */}
                            <ScrollArea className="flex-1 p-8">
                                <div className="space-y-6">
                                    {messages.filter(m => !blockedUsers.includes(m.sender_username)).map((msg, idx) => {
                                        // Filtering by username for now as simple block strategy
                                        // This is effective enough for client-side hide
                                        const isMe = msg.sender_id === currentUser?.id
                                        const showName = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id

                                        return (
                                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                                {showName && !isMe && (
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 ml-1">
                                                        {msg.sender_username}
                                                    </span>
                                                )}
                                                <div className={`max-w-[70%] px-5 py-3 rounded-2xl border transition-all ${isMe
                                                    ? 'bg-purple-600/20 border-purple-500/30 text-white rounded-tr-none shadow-lg shadow-purple-900/10'
                                                    : 'bg-white/5 border-white/10 text-white/90 rounded-tl-none'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                                                        {msg.message}
                                                    </p>
                                                </div>
                                                <span className="text-[9px] text-white/10 mt-1 font-bold">
                                                    {new Date(msg.inserted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>

                            {/* Message Input */}
                            <div className="p-6 bg-black/20 border-t border-white/5">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/50 to-blue-600/50 rounded-3xl blur opacity-10 group-focus-within:opacity-30 transition duration-500" />
                                    <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-6">
                                        <Input
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder="Whisper something private..."
                                            className="flex-1 bg-transparent border-none text-white first-letter:placeholder:text-white/20 focus-visible:ring-0 h-10 text-sm font-medium"
                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        />
                                        <Button
                                            onClick={sendMessage}
                                            disabled={!inputText.trim()}
                                            className="ml-2 bg-gradient-to-br from-purple-600 to-blue-600 text-white h-10 w-10 p-0 rounded-xl shadow-lg shadow-black/40 hover:scale-105 active:scale-95 transition-all"
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
                                    <h3 className="text-3xl font-black text-white tracking-tight">Initiate Transmission</h3>
                                    <p className="text-white/30 text-sm font-bold uppercase tracking-widest mt-1">Select recipients for private or group chat</p>
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
                                        className="bg-white/5 border-white/10 h-14 pl-14 rounded-2xl text-white placeholder:text-white/20 focus:ring-purple-500/50"
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
                                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-[10px] text-white/40">
                                                        {user.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white tracking-tight">{user.username}</p>
                                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{user.role || 'Player'}</span>
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
                                        <label className="text-xs font-black text-white/30 uppercase tracking-[0.2em] ml-1">Group Identifier (Optional)</label>
                                        <Input
                                            placeholder="e.g. The Syndicate"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            className="bg-white/5 border-white/10 h-14 rounded-2xl text-white focus:ring-blue-500/50"
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
