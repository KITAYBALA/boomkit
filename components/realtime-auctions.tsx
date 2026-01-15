'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Define GameUser interface locally or import if available
interface GameUser {
  id: string
  username: string
  tokens: number
  booms: Record<string, number>
}

type Props = {
  currentUser: GameUser | null
  getBoomAvatar: (name: string) => string
  getBoomRarity: (name: string) => string
  getRarityColor: (rarity: string) => string
  onAuctionCreated?: () => void
}

type DbAuction = {
  id: string
  boom_name: string
  seller: string
  current_bid: number
  ends_at: string
  top_bidder?: string | null
  status?: "active" | "ended" | "processed" // processed means winner claimed
  created_at?: string
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
  onAuctionCreated,
}: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [items, setItems] = useState<DbAuction[]>([])
  // Create Auction State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedBoom, setSelectedBoom] = useState<string>("")
  const [startingBid, setStartingBid] = useState(50)
  const [duration, setDuration] = useState(1) // hours
  const [loading, setLoading] = useState(false)

  // Convert local auctions to Db-like shape
  const convertLocal = (rows: LocalAuction[]): DbAuction[] => {
    return rows.map((r) => ({
      id: r.id,
      boom_name: r.boomName,
      seller: r.seller,
      current_bid: r.currentBid,
      ends_at: new Date(Date.now() + r.timeLeft * 60 * 60 * 1000).toISOString(),
      top_bidder: r.bidders?.[r.bidders.length - 1] ?? null,
      status: (new Date(Date.now() + r.timeLeft * 60 * 60 * 1000).getTime()) < Date.now() ? "ended" : "active"
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

  const createAuction = async () => {
    if (!currentUser || !selectedBoom) return
    if ((currentUser.booms[selectedBoom] || 0) < 1) {
      alert("You don't have this Boom!")
      return
    }

    setLoading(true)

    const endsAt = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()

    if (supabase) {
      // 1. Deduct Boom from User
      const newBooms = { ...currentUser.booms }
      if (newBooms[selectedBoom] > 1) {
        newBooms[selectedBoom]--
      } else {
        delete newBooms[selectedBoom]
      }

      const { error: userError } = await supabase
        .from('users')
        .update({ booms: newBooms })
        .eq('id', currentUser.id)

      if (userError) {
        alert('Failed to update inventory: ' + userError.message)
        setLoading(false)
        return
      }

      // 2. Create Auction
      const { error: auctionError } = await supabase
        .from('auction_items')
        .insert({
          boom_name: selectedBoom,
          seller: currentUser.username,
          current_bid: startingBid,
          ends_at: endsAt,
          status: 'active'
        })

      if (auctionError) {
        alert('Failed to create auction: ' + auctionError.message)
        // Ideally revert boom deduction here, keeping it simple for now
      } else {
        alert('Auction created!')
        setShowCreateModal(false)
        setSelectedBoom("")
        if (onAuctionCreated) onAuctionCreated()
      }
    } else {
      // Local Storage Logic
      const newId = Math.random().toString(36).substring(7)
      const newItem: LocalAuction = {
        id: newId,
        boomName: selectedBoom,
        seller: currentUser.username,
        currentBid: startingBid,
        timeLeft: duration,
        bidders: []
      }
      const raw = localStorage.getItem(LS_KEY)
      const local = raw ? (JSON.parse(raw) as LocalAuction[]) : []
      const updated = [...local, newItem]
      localStorage.setItem(LS_KEY, JSON.stringify(updated))
      setItems(convertLocal(updated))

      // Deduct boom locally for display (not persistent properly without full user sync in this mode)
      alert("Auction created (Local Mode)")
      setShowCreateModal(false)
    }
    setLoading(false)
  }

  const claimAuction = async (item: DbAuction) => {
    if (!currentUser || !supabase) return
    setLoading(true)

    try {
      // Double check auction status
      const { data: auctionData } = await supabase.from('auction_items').select('*').eq('id', item.id).single()
      if (!auctionData || auctionData.status === 'processed') {
        alert("Auction already processed.")
        setLoading(false)
        return
      }

      const isWinner = currentUser.username === item.top_bidder
      const isSeller = currentUser.username === item.seller

      if (isWinner) {
        // Winner pays tokens, gets boom
        if (currentUser.tokens < item.current_bid) {
          alert("You don't have enough tokens to claim this prize!")
          setLoading(false)
          return
        }

        // 1. Deduct Tokens & Add Boom for Winner
        const newTokens = currentUser.tokens - item.current_bid
        const newBooms = { ...currentUser.booms }
        newBooms[item.boom_name] = (newBooms[item.boom_name] || 0) + 1

        const { error: winnerError } = await supabase
          .from('users')
          .update({ tokens: newTokens, booms: newBooms })
          .eq('id', currentUser.id)

        if (winnerError) throw winnerError

        // 2. Pay Seller
        // Need seller ID, but we only have username. In real app, store seller_id. 
        // Workaround: Find seller by username (unique)
        const { data: sellerData } = await supabase.from('users').select('id, tokens').eq('username', item.seller).single()
        if (sellerData) {
          await supabase.from('users').update({ tokens: sellerData.tokens + item.current_bid }).eq('id', sellerData.id)
        }

        // 3. Mark processed
        await supabase.from('auction_items').update({ status: 'processed' }).eq('id', item.id)
        alert("Claimed successfully! You received " + item.boom_name)

      } else if (isSeller) {
        if (!item.top_bidder) {
          // Seller reclaims item (no bids)
          const { error: rpcError } = await supabase.rpc('reclaim_auction_item', {
            p_auction_id: item.id
          })

          if (rpcError) {
            console.error("RPC Error:", rpcError)
            throw rpcError
          }

          alert("Item reclaimed successfully!")
          // Subscription will auto-refresh
        } else {
          // Winner exists but hasn't claimed? Logic gap. 
          // For now, let's assume Winner must claim. Seller just waits.
          alert("Winner must claim the item to finalize the transaction.")
        }
      }
    } catch (e: any) {
      alert('Error claiming: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">Auction House</h1>
        <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
          + Create Auction
        </Button>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Create Auction</h2>

            <div className="space-y-4">
              <div>
                <label className="text-white block mb-2">Select Boom</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-black/20 rounded">
                  {currentUser?.booms && Object.keys(currentUser.booms).length > 0 ? (
                    Object.entries(currentUser.booms).map(([boom, qty]) => (
                      <Badge
                        key={boom}
                        onClick={() => setSelectedBoom(boom)}
                        className={`cursor-pointer ${selectedBoom === boom ? 'bg-green-600' : 'bg-slate-700'} hover:bg-green-500`}
                      >
                        {boom} (x{qty})
                      </Badge>
                    ))
                  ) : <span className="text-gray-400">No Booms to sell</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white block mb-2">Start Price</label>
                  <input
                    type="number"
                    value={startingBid}
                    onChange={e => setStartingBid(Number(e.target.value))}
                    className="w-full bg-slate-800 text-white p-2 rounded"
                    min={10}
                  />
                </div>
                <div>
                  <label className="text-white block mb-2">Duration (Hrs)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full bg-slate-800 text-white p-2 rounded"
                    min={1}
                    max={24}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button onClick={createAuction} disabled={!selectedBoom || loading} className="bg-green-600">
                  {loading ? 'Creating...' : 'Create Auction'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Active Auctions</h2>
        {items.length === 0 ? (
          <p className="text-white/70 text-center">No active auctions</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const ended = new Date(item.ends_at).getTime() < Date.now()
              const isWinner = currentUser?.username === item.top_bidder
              const isSeller = currentUser?.username === item.seller

              if (item.status === 'processed') return null // Don't show completed ones

              return (
                <div key={item.id} className={`rounded-lg p-4 ${ended ? 'bg-red-900/40 border border-red-500' : 'bg-white/10'}`}>
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
                  <p className={`${ended ? 'text-red-400 font-bold' : 'text-white/70'}`}>
                    Time Left: {timeLeftText(item.ends_at)}
                  </p>
                  {item.top_bidder && <p className="text-green-400 text-sm">Top Bidder: {item.top_bidder}</p>}

                  {!ended ? (
                    <Button
                      className="w-full mt-2 bg-green-600 hover:bg-green-700"
                      onClick={() => placeBid(item)}
                      disabled={isSeller}
                    >
                      Place Bid
                    </Button>
                  ) : (
                    <div className="mt-2">
                      {isWinner && (
                        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 animate-pulse text-black font-bold" onClick={() => claimAuction(item)}>
                          Claim Prize! 🎁
                        </Button>
                      )}
                      {isSeller && !item.top_bidder && (
                        <Button className="w-full bg-gray-500 hover:bg-gray-600" onClick={() => claimAuction(item)}>
                          Reclaim Item ↩️
                        </Button>
                      )}
                      {isSeller && item.top_bidder && !isWinner && (
                        <p className="text-center text-yellow-200 text-sm">Waiting for winner to claim.</p>
                      )}
                      {!isWinner && !isSeller && (
                        <p className="text-center text-gray-400 text-sm">Auction Ended</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
