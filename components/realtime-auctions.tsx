'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Props = {
  currentUser: { username: string } | null
  getBoomAvatar: (name: string) => string
  getBoomRarity: (name: string) => string
  getRarityColor: (rarity: string) => string
}

type DbAuction = {
  id: string
  boom_name: string
  seller: string
  current_bid: number
  ends_at: string
  top_bidder?: string | null
}

type LocalAuction = {
  id: string
  boomName: string
  seller: string
  currentBid: number
  timeLeft: number // hours
  bidders: string[]
}

const LS_KEY = 'boomkit_auctions'

export default function RealtimeAuctions({
  currentUser,
  getBoomAvatar,
  getBoomRarity,
  getRarityColor,
}: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [items, setItems] = useState<DbAuction[]>([])

  // Convert local auctions to Db-like shape
  const convertLocal = (rows: LocalAuction[]): DbAuction[] => {
    return rows.map((r) => ({
      id: r.id,
      boom_name: r.boomName,
      seller: r.seller,
      current_bid: r.currentBid,
      ends_at: new Date(Date.now() + r.timeLeft * 60 * 60 * 1000).toISOString(),
      top_bidder: r.bidders?.[r.bidders.length - 1] ?? null,
    }))
  }

  useEffect(() => {
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null

    const load = async () => {
      if (supabase) {
        const { data } = await supabase
          .from('auction_items')
          .select('*')
          .order('ends_at', { ascending: true })
        setItems((data as DbAuction[]) ?? [])

        channel = supabase
          .channel('auction_feed')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'auction_items' },
            () => refresh(),
          )
          .subscribe()
      } else {
        const raw = localStorage.getItem(LS_KEY)
        const local = raw ? (JSON.parse(raw) as LocalAuction[]) : []
        setItems(convertLocal(local))

        const onStorage = (e: StorageEvent) => {
          if (e.key === LS_KEY && e.newValue) {
            setItems(convertLocal(JSON.parse(e.newValue) as LocalAuction[]))
          }
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
      }
    }

    const refresh = async () => {
      if (!supabase) return
      const { data } = await supabase
        .from('auction_items')
        .select('*')
        .order('ends_at', { ascending: true })
      setItems((data as DbAuction[]) ?? [])
    }

    load()

    return () => {
      if (channel) supabase?.removeChannel(channel)
    }
  }, [supabase])

  const placeBid = async (item: DbAuction) => {
    const input = prompt(`Enter your bid (current: ${item.current_bid})`)
    if (!input) return
    const bid = Number.parseInt(input, 10)
    if (Number.isNaN(bid) || bid <= item.current_bid) {
      alert('Bid must be a number greater than current bid.')
      return
    }
    if (supabase) {
      const { error } = await supabase
        .from('auction_items')
        .update({ current_bid: bid, top_bidder: currentUser?.username ?? null })
        .eq('id', item.id)
      if (error) alert('Failed to place bid.')
    } else {
      // Local fallback
      const raw = localStorage.getItem(LS_KEY)
      const local = raw ? (JSON.parse(raw) as LocalAuction[]) : []
      const updated = local.map((a) =>
        a.id === item.id ? { ...a, currentBid: bid, bidders: [...(a.bidders ?? []), currentUser?.username ?? 'anon'] } : a,
      )
      localStorage.setItem(LS_KEY, JSON.stringify(updated))
      setItems(convertLocal(updated))
    }
  }

  const timeLeftText = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now()
    if (diff <= 0) return 'Ended'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-white">Auction House</h1>
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Active Auctions</h2>
        {items.length === 0 ? (
          <p className="text-white/70 text-center">No active auctions</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-3xl">{getBoomAvatar(item.boom_name)}</span>
                  <div>
                    <h3 className="text-white font-bold">{item.boom_name}</h3>
                    <Badge className={`${getRarityColor(getBoomRarity(item.boom_name))} text-white text-xs`}>
                      {getBoomRarity(item.boom_name)}
                    </Badge>
                  </div>
                </div>
                <p className="text-white/70">Seller: {item.seller}</p>
                <p className="text-white">Current Bid: {item.current_bid} tokens</p>
                <p className="text-white/70">Time Left: {timeLeftText(item.ends_at)}</p>
                <Button className="w-full mt-2 bg-green-600 hover:bg-green-700" onClick={() => placeBid(item)}>
                  Place Bid
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
