'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  GavelIcon,
  PlusIcon,
  ClockIcon,
  TrophyIcon,
  CoinsIcon,
  UserIcon,
  XIcon,
  TimerIcon,
  ArrowRightIcon,
  SparklesIcon,
  CheckIcon,
  BellIcon
} from 'lucide-react'

// Define GameUser interface locally or import if available
interface GameUser {
  id: string
  username: string
  tokens: number
  booms: Record<string, number>
  clan_tag?: string | null
  clan_tag_color?: string | null
}

type Props = {
  currentUser: GameUser | null
  getBoomAvatar: (name: string) => string
  getBoomRarity: (name: string) => string
  getRarityColor: (rarity: string) => string
  onAuctionCreated?: () => void
  onClaimComplete?: () => void
  onPlayerClick?: (userId: string) => void
  users?: GameUser[]
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
  onClaimComplete,
  onPlayerClick,
  users,
}: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [items, setItems] = useState<DbAuction[]>([])
  // Create Auction State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedBoom, setSelectedBoom] = useState<string>("")
  const [startingBid, setStartingBid] = useState(50)
  const [duration, setDuration] = useState(1) // hours
  const [loading, setLoading] = useState(false)
  // Bidding State
  const [biddingItem, setBiddingItem] = useState<DbAuction | null>(null)
  const [bidAmount, setBidAmount] = useState<number>(0)
  // Status Modal State
  const [statusModal, setStatusModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, title: "", message: "", type: "info" })

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
          .select('id, boom_name, seller, current_bid, ends_at, top_bidder, status, created_at')
          .eq('status', 'active')
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
        .select('id, boom_name, seller, current_bid, ends_at, top_bidder, status, created_at')
        .eq('status', 'active')
        .order('ends_at', { ascending: true })
      setItems((data as DbAuction[]) ?? [])
    }

    load()

    return () => {
      if (channel) supabase?.removeChannel(channel)
    }
  }, [supabase])

  const handlePlaceBid = async () => {
    if (!biddingItem || bidAmount <= biddingItem.current_bid) {
      setStatusModal({
        show: true,
        title: "Invalid Bid",
        message: "Your bid must be higher than the current top bid.",
        type: "info"
      })
      return
    }

    if (!currentUser || currentUser.tokens < bidAmount) {
      setStatusModal({
        show: true,
        title: "Insufficient Tokens",
        message: `You need ${bidAmount.toLocaleString()} tokens to place this bid, but you only have ${(currentUser?.tokens || 0).toLocaleString()}.`,
        type: "error"
      })
      return
    }

    setLoading(true)
    if (supabase) {
      const { data, error } = await supabase.rpc('place_bid', {
        p_auction_id: biddingItem.id,
        p_amount: bidAmount,
        p_username: currentUser.username,
        p_user_id: currentUser.id
      })

      if (error) {
        setStatusModal({
          show: true,
          title: "Bidding Error",
          message: error.message || "We couldn't process your bid.",
          type: "error"
        })
      } else {
        setBiddingItem(null)
        setStatusModal({
          show: true,
          title: "Bid Confirmed",
          message: "You are now the highest bidder for " + biddingItem.boom_name + "!",
          type: "success"
        })
      }
    } else {
      // Local fallback
      const raw = localStorage.getItem(LS_KEY)
      const local = raw ? (JSON.parse(raw) as LocalAuction[]) : []
      const updated = local.map((a) =>
        a.id === biddingItem.id ? { ...a, currentBid: bidAmount, bidders: [...(a.bidders ?? []), currentUser?.username ?? 'anon'] } : a,
      )
      localStorage.setItem(LS_KEY, JSON.stringify(updated))
      setItems(convertLocal(updated))
      setBiddingItem(null)
    }
    setLoading(false)
  }

  const placeBid = (item: DbAuction) => {
    setBiddingItem(item)
    setBidAmount(item.current_bid + 10) // Suggest 10 more than current
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

    // Optimistic check
    if ((currentUser.booms[selectedBoom] || 0) < 1) {
      setStatusModal({
        show: true,
        title: "Missing Item",
        message: "You don't have enough " + selectedBoom + " to auction.",
        type: "error"
      })
      return
    }

    setLoading(true)

    if (supabase) {
      // Use RPC for atomic deduction and creation
      const { data, error } = await supabase.rpc('create_auction', {
        p_boom_name: selectedBoom,
        p_starting_bid: startingBid,
        p_duration_hours: duration,
        p_user_id: currentUser.id // Explicitly pass the ID for custom session support
      })

      if (error) {
        setStatusModal({
          show: true,
          title: "Auction Failed",
          message: error.message || "System error while creating auction.",
          type: "error"
        })
      } else {
        setShowCreateModal(false)
        setSelectedBoom("")
        setStatusModal({
          show: true,
          title: "Market Listing Live",
          message: "Your " + selectedBoom + " is now up for auction!",
          type: "success"
        })
        if (onAuctionCreated) onAuctionCreated()
        // Force refresh items
        const { data: newItems } = await supabase
          .from('auction_items')
          .select('id, boom_name, seller, current_bid, ends_at, top_bidder, status, created_at')
          .order('ends_at', { ascending: true })
        setItems((newItems as DbAuction[]) ?? [])
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
      const { data: auctionData } = await supabase
        .from('auction_items')
        .select('id, status')
        .eq('id', item.id)
        .single()
      if (!auctionData || auctionData.status === 'processed') {
        setStatusModal({
          show: true,
          title: "Item Unavailable",
          message: "This auction has already been processed or closed.",
          type: "info"
        })
        setLoading(false)
        return
      }

      const isWinner = currentUser.username === item.top_bidder
      const isSeller = currentUser.username === item.seller

      if (isWinner) {
        // Winner pays tokens, gets boom via RPC for security and RLS bypass
        const { error: claimError } = await supabase.rpc('claim_auction', {
          p_auction_id: item.id,
          p_user_id: currentUser.id
        })

        if (claimError) {
          console.error("Claim Error:", claimError)
          throw claimError
        }

        setStatusModal({
          show: true,
          title: "Prize Claimed",
          message: "You received your " + item.boom_name + ". Check your vault!",
          type: "success"
        })

        if (onClaimComplete) onClaimComplete()
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

          setStatusModal({
            show: true,
            title: "Item Returned",
            message: "Your " + item.boom_name + " has been returned to your inventory.",
            type: "success"
          })
          // Subscription will auto-refresh
        } else {
          // Winner exists but hasn't claimed? Logic gap. 
          // For now, let's assume Winner must claim. Seller just waits.
          setStatusModal({
            show: true,
            title: "Waiting for Winner",
            message: "The winner must claim the item to finalize the sale.",
            type: "info"
          })
        }
      }
    } catch (e: any) {
      setStatusModal({
        show: true,
        title: "Transaction Failed",
        message: e.message || "An unexpected error occurred while claiming.",
        type: "error"
      })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-purple-600 rounded-2xl shadow-xl shadow-purple-500/20 ring-1 ring-white/20">
            <GavelIcon className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter">Auction House</h1>
            <p className="text-purple-300/60 font-medium">Bid on rare Booms or start your own auction.</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto px-8 py-7 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl shadow-2xl shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-95 border-none text-lg flex items-center gap-3"
        >
          <PlusIcon className="h-6 w-6" />
          Create Auction
        </Button>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-300">
          <Card className="w-full max-w-2xl bg-[#0a0a0c]/95 backdrop-blur-2xl border-purple-500/30 shadow-[0_0_80px_rgba(139,92,246,0.2)] rounded-[2.5rem] overflow-hidden">
            <CardHeader className="border-b border-white/5 pb-8 p-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                    <PlusIcon className="h-8 w-8 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-black text-white tracking-tight">Post Auction</CardTitle>
                    <CardDescription className="text-purple-300/50 text-base">Select a Boom from your vault to auction off.</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="rounded-full h-12 w-12 text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                  <XIcon className="h-8 w-8" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="space-y-4">
                <label className="text-xs font-black text-white/30 uppercase tracking-[0.2em] ml-2">Choose Item</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-4 custom-scrollbar">
                  {currentUser?.booms && Object.keys(currentUser.booms).length > 0 ? (
                    Object.entries(currentUser.booms).map(([boom, qty]) => (
                      <button
                        key={boom}
                        type="button"
                        onClick={() => setSelectedBoom(boom)}
                        className={`group relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all duration-300 ${selectedBoom === boom
                          ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.15)] ring-1 ring-purple-500'
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                          }`}
                      >
                        <div className="text-4xl group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                          {getBoomAvatar(boom).startsWith('/') ? (
                            <img src={getBoomAvatar(boom)} alt={boom} className="w-[1em] h-[1em] object-contain drop-shadow-md" />
                          ) : (
                            getBoomAvatar(boom)
                          )}
                        </div>
                        <div className="text-center">
                          <p className={`text-xs font-bold leading-tight ${selectedBoom === boom ? 'text-white' : 'text-white/70'}`}>{boom}</p>
                          <p className="text-[10px] text-white/30 font-black mt-1">x{qty} OWNED</p>
                        </div>
                        {selectedBoom === boom && (
                          <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(139,92,246,1)]" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <p className="text-white/20 font-bold">Your vault is empty</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 text-center">
                  <label className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Starting Bid</label>
                  <div className="relative group">
                    <Input
                      type="number"
                      value={startingBid}
                      onChange={e => setStartingBid(Number(e.target.value))}
                      className="bg-black/30 border-white/10 text-white h-16 rounded-2xl text-2xl font-black text-center focus:ring-purple-500/50 transition-all"
                      min={10}
                    />
                    <CoinsIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-yellow-500/50" />
                  </div>
                </div>
                <div className="space-y-4 text-center">
                  <label className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Duration (Hours)</label>
                  <div className="relative group">
                    <Input
                      type="number"
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="bg-black/30 border-white/10 text-white h-16 rounded-2xl text-2xl font-black text-center focus:ring-purple-500/50 transition-all"
                      min={1}
                      max={72}
                    />
                    <TimerIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-500/50" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-14 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 font-bold"
                >
                  Discard
                </Button>
                <Button
                  onClick={createAuction}
                  disabled={!selectedBoom || loading}
                  className="flex-1 h-14 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : 'Launch Auction'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center gap-3 mb-10">
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
          <h2 className="text-xl font-black text-white tracking-widest uppercase opacity-60">Live Listings</h2>
        </div>

        {items.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/5">
            <div className="p-6 bg-white/5 rounded-full mb-6 ring-1 ring-white/10">
              <TimerIcon className="h-10 w-10 text-white/20" />
            </div>
            <p className="text-white/30 font-black text-xl">The market is currently quiet</p>
            <p className="text-white/10 text-sm mt-2">Be the first to list a legendary Boom!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {items.map((item) => {
              const ended = new Date(item.ends_at).getTime() < Date.now()
              const isWinner = currentUser?.username === item.top_bidder
              const isSeller = currentUser?.username === item.seller
              const rarity = getBoomRarity(item.boom_name)
              const rarityColor = getRarityColor(rarity)

              if (item.status === 'processed') return null

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-[2rem] p-1 overflow-hidden transition-all duration-500 hover:scale-[1.02] ${ended
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-white/5 bg-white/5 hover:border-purple-500/30'
                    }`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${rarityColor}`} />

                  <div className="relative p-7 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`text-6xl drop-shadow-2xl group-hover:rotate-12 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center`}>
                            {getBoomAvatar(item.boom_name).startsWith('/') ? (
                              <img src={getBoomAvatar(item.boom_name)} alt={item.boom_name} className="w-[1em] h-[1em] object-contain drop-shadow-lg" />
                            ) : (
                              getBoomAvatar(item.boom_name)
                            )}
                          </div>
                          {rarity === 'legendary' || rarity === 'chroma' || rarity === 'mystical' ? (
                            <div className="absolute -top-2 -right-2">
                              <SparklesIcon className="h-6 w-6 text-yellow-500 animate-pulse" />
                            </div>
                          ) : null}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white tracking-tight">{item.boom_name}</h3>
                          <Badge className={`${rarityColor} text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 mt-1 border-none shadow-lg ring-1 ring-white/20`}>
                            {rarity}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Seller</p>
                        <div
                          className={`flex items-center gap-2 ${onPlayerClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onPlayerClick) onPlayerClick(item.seller); // Note: Seller is a username right now, need a way to look up ID or pass username to modal
                          }}
                        >
                          <UserIcon className="h-3.5 w-3.5 text-purple-400" />
                          <span className="text-sm font-bold text-white truncate flex items-center gap-1">
                             {(() => {
                               const u = users?.find((usr) => usr.username === item.seller)
                               return u?.clan_tag ? (
                                 <span className={`text-[10px] font-black tracking-tight ${u.clan_tag_color || 'text-purple-400'}`}>
                                   [{u.clan_tag}]
                                 </span>
                               ) : null
                             })()}
                             {item.seller}
                           </span>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Status</p>
                        <div className="flex items-center gap-2">
                          {ended ? (
                            <div className="flex items-center gap-2 text-red-400">
                              <TimerIcon className="h-3.5 w-3.5" />
                              <span className="text-sm font-black uppercase">Ended</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-400">
                              <ClockIcon className="h-3.5 w-3.5 animate-pulse" />
                              <span className="text-sm font-black whitespace-nowrap">{timeLeftText(item.ends_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-[1.5rem] p-6 border border-white/10 ring-1 ring-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white/40 uppercase tracking-widest">Current Bid</span>
                        <div className="flex items-center gap-2">
                          <CoinsIcon className="h-5 w-5 text-yellow-500" />
                          <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{item.current_bid.toLocaleString()}</span>
                        </div>
                      </div>

                      {item.top_bidder ? (
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Top Bidder</span>
                          <div
                            className={`flex items-center gap-2 ${onPlayerClick && !isWinner ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onPlayerClick && !isWinner && item.top_bidder) onPlayerClick(item.top_bidder); // Requires username -> id lookup if modal expects ID
                            }}
                          >
                            <TrophyIcon className={`h-3 w-3 ${isWinner ? 'text-yellow-500' : 'text-purple-400'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isWinner ? 'text-yellow-500' : 'text-white'} flex items-center gap-1`}>
                              {isWinner ? 'Your Leading!' : (
                                <>
                                  {(() => {
                                    const u = users?.find((usr) => usr.username === item.top_bidder)
                                    return u?.clan_tag ? (
                                      <span className={`text-[9px] font-black tracking-tight ${u.clan_tag_color || 'text-purple-400'} mr-0.5`}>
                                        [{u.clan_tag}]
                                      </span>
                                    ) : null
                                  })()}
                                  {item.top_bidder}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center pt-2 italic text-[10px] font-bold text-white/20 uppercase tracking-widest">No bids placed yet</div>
                      )}
                    </div>

                    {!ended ? (
                      <Button
                        className={`w-full h-14 rounded-2xl font-black text-base transition-all duration-300 active:scale-95 flex items-center gap-3 border-none ${isSeller
                          ? 'bg-white/5 text-white/30 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-500 text-white shadow-xl shadow-green-900/40'
                          }`}
                        onClick={() => placeBid(item)}
                        disabled={isSeller}
                      >
                        {isSeller ? 'Watching Your Sale' : (
                          <>
                            Place High Bid
                            <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="animate-in slide-in-from-bottom-2">
                        {isWinner && (
                          <Button
                            className="w-full h-14 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-2xl shadow-xl shadow-yellow-500/40 flex items-center justify-center gap-3 animate-pulse border-none"
                            onClick={() => claimAuction(item)}
                          >
                            <TrophyIcon className="h-6 w-6" />
                            CLAIM YOUR BOOM
                          </Button>
                        )}
                        {isSeller && !item.top_bidder && (
                          <Button
                            className="w-full h-14 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl border border-white/10 flex items-center justify-center gap-3 transition-colors"
                            onClick={() => claimAuction(item)}
                          >
                            <ArrowRightIcon className="h-6 w-6 rotate-180" />
                            RECLAIM EXPIRED ITEM
                          </Button>
                        )}
                        {isSeller && item.top_bidder && (
                          <div className="h-14 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 text-yellow-200/50 text-[10px] font-black uppercase tracking-[0.2em]">
                            WAITING FOR {item.top_bidder} TO CLAIM
                          </div>
                        )}
                        {!isWinner && !isSeller && (
                          <div className="h-14 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 text-white/10 text-[10px] font-black uppercase tracking-[0.2em] italic">
                            MARKET LISTING EXPIRED
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* Bidding Modal */}
      {biddingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-300">
          <Card className="w-full max-w-md bg-[#0a0a0c]/95 backdrop-blur-2xl border-purple-500/30 shadow-[0_0_80px_rgba(139,92,246,0.3)] rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 text-center">
              <div className="mx-auto w-24 h-24 bg-purple-600/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-purple-500/30">
                <span className="text-6xl drop-shadow-2xl flex items-center justify-center">
                  {getBoomAvatar(biddingItem.boom_name).startsWith('/') ? (
                    <img src={getBoomAvatar(biddingItem.boom_name)} alt={biddingItem.boom_name} className="w-[1em] h-[1em] object-contain drop-shadow-lg" />
                  ) : (
                    getBoomAvatar(biddingItem.boom_name)
                  )}
                </span>
              </div>
              <CardTitle className="text-3xl font-black text-white tracking-tight">Place Your Bid</CardTitle>
              <CardDescription className="text-purple-300/40 mt-2">You are bidding on {biddingItem.boom_name}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Current Bid</span>
                  <div className="flex items-center gap-2">
                    <CoinsIcon className="h-4 w-4 text-yellow-500" />
                    <span className="text-lg font-black text-white">{biddingItem.current_bid.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Label className="text-xs font-black text-white/30 uppercase tracking-[0.2em] ml-2">Your New Bid</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={bidAmount}
                      onChange={e => setBidAmount(Number(e.target.value))}
                      className="bg-black/40 border-purple-500/30 text-white h-16 rounded-2xl text-2xl font-black text-center focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]"
                    />
                    <CoinsIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="flex justify-between gap-2 px-1">
                    {[10, 50, 100].map(add => (
                      <button
                        key={add}
                        onClick={() => setBidAmount(prev => prev + add)}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-white/60 transition-colors uppercase tracking-widest border border-white/5"
                      >
                        +{add}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Button
                  onClick={handlePlaceBid}
                  disabled={loading || bidAmount <= biddingItem.current_bid}
                  className="h-16 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-900/40 text-lg group transition-all"
                >
                  {loading ? 'Processing...' : (
                    <span className="flex items-center gap-3">
                      Confirm Bid
                      <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setBiddingItem(null)}
                  className="h-14 rounded-2xl text-white/30 hover:text-white hover:bg-white/5 font-bold"
                >
                  Maybe later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Status Modal */}
      {statusModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in-95 duration-300">
          <Card className="w-full max-w-sm bg-[#0a0a0c]/95 backdrop-blur-2xl border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden text-center">
            <CardContent className="p-10 space-y-6">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ring-4 ring-offset-4 ring-offset-[#0a0a0c] ${statusModal.type === 'success' ? 'bg-green-500/20 ring-green-500/50 text-green-400' :
                statusModal.type === 'error' ? 'bg-red-500/20 ring-red-500/50 text-red-400' :
                  'bg-blue-500/20 ring-blue-500/50 text-blue-400'
                }`}>
                {statusModal.type === 'success' ? <CheckIcon className="h-10 w-10" /> :
                  statusModal.type === 'error' ? <XIcon className="h-10 w-10" /> :
                    <BellIcon className="h-10 w-10" />}
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight">{statusModal.title}</h3>
                <p className="text-white/40 text-sm font-medium leading-relaxed">{statusModal.message}</p>
              </div>

              <Button
                onClick={() => setStatusModal({ ...statusModal, show: false })}
                className={`w-full h-12 rounded-2xl font-black transition-all active:scale-95 ${statusModal.type === 'success' ? 'bg-green-600 hover:bg-green-500 text-white' :
                  statusModal.type === 'error' ? 'bg-red-600 hover:bg-red-500 text-white' :
                    'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
