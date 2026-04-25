'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'

type ChatMessage = {
  id: string
  username: string
  role: string | null
  message: string
  created_at: string
}

export default function RealtimeChatDemo() {
  const supabase = getSupabaseBrowserClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    if (!supabase) return

    // initial load
    supabase
      .from('chat_messages')
      .select('id, username, role, message, created_at')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[])
      })

    // realtime subscribe
    const channel = supabase
      .channel('chat-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const send = async () => {
    if (!supabase) return
    const msg = text.trim()
    if (!msg) return
    setText('')
    const username = 'Guest' // replace with your logged-in username
    await supabase.from('chat_messages').insert({ username, message: msg, role: 'Player' })
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-white/70">Realtime chat demo</div>
      <ul className="max-h-64 overflow-auto border border-white/20 rounded p-3 space-y-2 bg-black/20">
        {messages.map((m) => (
          <li key={m.id} className="text-white">
            <span className="font-semibold">{m.username}:</span> {m.message}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded px-3 py-2 bg-white/10 text-white border border-white/20"
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="rounded bg-blue-600 hover:bg-blue-700 text-white px-3 py-2">
          Send
        </button>
      </div>
    </div>
  )
}
