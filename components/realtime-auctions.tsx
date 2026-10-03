'use client'

import { secureRpc } from '@/lib/secure-rpc'

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
import { BoomAvatar } from './boom-avatar'

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
  bid_escrow?: number
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
          .select('id, boom_name, seller, current_bid, bid_escrow, ends_at, top_bidder, status, created_at')
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
        .select('id, boom_name, seller, current_bid, bid_escrow, ends_at, top_bidder, status, created_at')
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

    if (!currentUser || currentUser.tokens + (biddingItem.top_bidder === currentUser.username ? (biddingItem.bid_escrow || 0) : 0) < bidAmount) {
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
      const { data, error } = await secureRpc('place_bid', {
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
        onAuctionCreated?.()
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
      const { data, error } = await secureRpc('create_auction', {
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
          .select('id, boom_name, seller, current_bid, bid_escrow, ends_at, top_bidder, status, created_at')
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
        const { error: claimError } = await secureRpc('claim_auction', {
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
          const { error: rpcError } = await secureRpc('reclaim_auction_item', {
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
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 club-well p-8 rounded-xl border club-border ">
        <div className="flex items-center gap-5">
          <div className="p-4 club-purple rounded-xl ring-1 ">
            <GavelIcon className="h-10 w-10 club-ink" />
          </div>
          <div>
            <h1 className="font-heading text-4xl font-black club-ink tracking-tighter">Auction House</h1>
            <p className="font-heading club-accent font-medium">Bid on rare Booms or start your own auction.</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="club-action w-full md:w-auto px-8 py-7 club-purple club-purple club-ink font-black rounded-xl transition-all hover:scale-[1.02] active:scale-95 border-none text-lg flex items-center gap-3"
        >
          <PlusIcon className="h-6 w-6" />
          Create Auction
        </Button>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 club-overlay flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-300">
          <Card className="w-full max-w-2xl club-surface club-border rounded-xl overflow-hidden">
            <CardHeader className="border-b club-border pb-8 p-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="p-4 club-purple rounded-xl border club-border">
                    <PlusIcon className="h-8 w-8 club-accent" />
                  </div>
                  <div>
                    <CardTitle className="font-heading text-3xl font-black club-ink tracking-tight">Post Auction</CardTitle>
                    <CardDescription className="font-heading club-accent text-base">Select a Boom from your vault to auction off.</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="club-action rounded-full h-12 w-12 club-muted club-ink club-well transition-colors">
                  <XIcon className="h-8 w-8" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="space-y-4">
                <label className="font-heading text-xs font-black club-muted uppercase tracking-wide ml-2">Choose Item</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-4 custom-scrollbar">
                  {currentUser?.booms && Object.keys(currentUser.booms).length > 0 ? (
                    Object.entries(currentUser.booms).map(([boom, qty]) => (
                      <button
                        key={boom}
                        type="button"
                        onClick={() => setSelectedBoom(boom)}
                        className={`group relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all duration-300 ${selectedBoom === boom
                          ? 'club-purple club-border ring-1 '
                          : 'club-well club-border club-well club-border'
                          }`}
                      >
                        <div className="font-heading text-4xl group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                          <BoomAvatar name={boom} className="w-[1em] h-[1em]" />
                        </div>
                        <div className="font-heading text-center">
                          <p className={`text-xs font-bold leading-tight ${selectedBoom === boom ? 'club-ink' : 'club-ink'}`}>{boom}</p>
                          <p className="font-heading text-xs club-muted font-black mt-1">x{qty} OWNED</p>
                        </div>
                        {selectedBoom === boom && (
                          <div className="absolute top-2 right-2 h-2 w-2 rounded-full club-purple " />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center club-well rounded-xl border border-dashed club-border">
                      <p className="font-heading club-muted font-bold">Your vault is empty</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 text-center">
                  <label className="font-heading text-xs font-black club-muted uppercase tracking-wide">Starting Bid</label>
                  <div className="relative group">
                    <Input
                      type="number"
                      value={startingBid}
                      onChange={e => setStartingBid(Number(e.target.value))}
                      className="club-well club-border club-ink h-16 rounded-xl text-2xl font-black text-center transition-all"
                      min={10}
                    />
                    <CoinsIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 club-accent" />
                  </div>
                </div>
                <div className="space-y-4 text-center">
                  <label className="font-heading text-xs font-black club-muted uppercase tracking-wide">Duration (Hours)</label>
                  <div className="relative group">
                    <Input
                      type="number"
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="club-well club-border club-ink h-16 rounded-xl text-2xl font-black text-center transition-all"
                      min={1}
                      max={72}
                    />
                    <TimerIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 club-accent" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="club-action flex-1 h-14 rounded-xl club-muted club-ink club-well font-bold"
                >
                  Discard
                </Button>
                <Button
                  onClick={createAuction}
                  disabled={!selectedBoom || loading}
                  className="club-action flex-1 h-14 club-purple club-purple club-ink font-black rounded-xl transition-all hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 club-border border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : 'Launch Auction'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="club-well border club-border rounded-xl p-10 overflow-hidden relative">
        <div className="club-decoration absolute top-0 right-0 w-96 h-96 club-purple rounded-full pointer-events-none" />
        <div className="club-decoration absolute bottom-0 left-0 w-96 h-96 club-blue rounded-full pointer-events-none" />

        <div className="flex items-center gap-3 mb-10">
          <div className="h-2 w-2 rounded-full club-green " />
          <h2 className="font-heading text-xl font-black club-ink tracking-wide uppercase opacity-60">Live Listings</h2>
        </div>

        {items.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center rounded-xl border border-dashed club-border club-well">
            <div className="p-6 club-well rounded-full mb-6 ring-1 ">
              <TimerIcon className="h-10 w-10 club-muted" />
            </div>
            <p className="font-heading club-muted font-black text-xl">The market is currently quiet</p>
            <p className="font-heading club-muted text-sm mt-2">Be the first to list a legendary Boom!</p>
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
                    ? 'club-border club-red'
                    : 'club-border club-well club-border'
                    }`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 club-surface ${rarityColor}`} />

                  <div className="relative p-7 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`text-6xl drop-shadow-2xl group-hover:rotate-12 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center`}>
                            <BoomAvatar name={item.boom_name} className="w-[1em] h-[1em]" />
                          </div>
                          {rarity === 'legendary' || rarity === 'chroma' || rarity === 'mystical' ? (
                            <div className="absolute -top-2 -right-2">
                              <SparklesIcon className="h-6 w-6 club-accent animate-pulse" />
                            </div>
                          ) : null}
                        </div>
                        <div>
                          <h3 className="font-heading text-2xl font-black club-ink tracking-tight">{item.boom_name}</h3>
                          <Badge className={`${rarityColor} club-ink text-xs font-black uppercase tracking-wide px-3 py-1 mt-1 border-none ring-1 `}>
                            {rarity}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="club-well rounded-xl p-4 border club-border">
                        <p className="font-heading text-xs font-black club-muted uppercase tracking-wide mb-1">Seller</p>
                        <div
                          className={`flex items-center gap-2 ${onPlayerClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onPlayerClick) onPlayerClick(item.seller); // Note: Seller is a username right now, need a way to look up ID or pass username to modal
                          }}
                        >
                          <UserIcon className="h-3.5 w-3.5 club-accent" />
                          <span className="font-heading text-sm font-bold club-ink truncate flex items-center gap-1">
                             {(() => {
                               const u = users?.find((usr) => usr.username === item.seller)
                               return u?.clan_tag ? (
                                  <span className="inline-block text-[10px] font-black tracking-tight">
                                    <span className={u.clan_tag_color || 'club-accent'}>
                                      [{u.clan_tag}]
                                    </span>
                                  </span>
                               ) : null
                             })()}
                             {item.seller}
                           </span>
                        </div>
                      </div>
                      <div className="club-well rounded-xl p-4 border club-border">
                        <p className="font-heading text-xs font-black club-muted uppercase tracking-wide mb-1">Status</p>
                        <div className="flex items-center gap-2">
                          {ended ? (
                            <div className="flex items-center gap-2 club-danger">
                              <TimerIcon className="h-3.5 w-3.5" />
                              <span className="font-heading text-sm font-black uppercase">Ended</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 club-success">
                              <ClockIcon className="h-3.5 w-3.5 animate-pulse" />
                              <span className="font-heading text-sm font-black whitespace-nowrap">{timeLeftText(item.ends_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="club-surface rounded-[1.5rem] p-6 border club-border ring-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-xs font-black club-muted uppercase tracking-wide">Current Bid</span>
                        <div className="flex items-center gap-2">
                          <CoinsIcon className="h-5 w-5 club-accent" />
                          <span className="font-heading text-2xl font-black club-ink tabular-nums tracking-tighter">{item.current_bid.toLocaleString()}</span>
                        </div>
                      </div>

                      {item.top_bidder ? (
                        <div className="flex items-center justify-between pt-3 border-t club-border">
                          <span className="font-heading text-xs font-black club-muted uppercase tracking-wide">Top Bidder</span>
                          <div
                            className={`flex items-center gap-2 ${onPlayerClick && !isWinner ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onPlayerClick && !isWinner && item.top_bidder) onPlayerClick(item.top_bidder); // Requires username -> id lookup if modal expects ID
                            }}
                          >
                            <TrophyIcon className={`h-3 w-3 ${isWinner ? 'club-accent' : 'club-accent'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isWinner ? 'club-accent' : 'club-ink'} flex items-center gap-1`}>
                              {isWinner ? 'Your Leading!' : (
                                <>
                                  {(() => {
                                    const u = users?.find((usr) => usr.username === item.top_bidder)
                                    return u?.clan_tag ? (
                                       <span className="inline-block text-[9px] font-black tracking-tight mr-0.5">
                                         <span className={u.clan_tag_color || 'club-accent'}>
                                           [{u.clan_tag}]
                                         </span>
                                       </span>
                                    ) : null;
                                  })()}
                                  {item.top_bidder}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="font-heading text-center pt-2 italic text-xs font-bold club-muted uppercase tracking-wide">No bids placed yet</div>
                      )}
                    </div>

                    {!ended ? (
                      <Button
                        className={`club-action w-full h-14 rounded-2xl font-black text-base transition-all duration-300 active:scale-95 flex items-center gap-3 border-none ${isSeller
                          ? 'club-well club-muted cursor-not-allowed'
                          : 'club-green club-green club-ink '
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
                            className="club-action w-full h-14 club-yellow club-yellow club-ink font-black rounded-xl flex items-center justify-center gap-3 border-none"
                            onClick={() => claimAuction(item)}
                          >
                            <TrophyIcon className="h-6 w-6" />
                            CLAIM YOUR BOOM
                          </Button>
                        )}
                        {isSeller && !item.top_bidder && (
                          <Button
                            className="club-action w-full h-14 club-well club-well club-ink font-black rounded-xl border club-border flex items-center justify-center gap-3 transition-colors"
                            onClick={() => claimAuction(item)}
                          >
                            <ArrowRightIcon className="h-6 w-6 rotate-180" />
                            RECLAIM EXPIRED ITEM
                          </Button>
                        )}
                        {isSeller && item.top_bidder && (
                          <div className="h-14 flex items-center justify-center club-well rounded-xl border club-border club-accent text-xs font-black uppercase tracking-wide">
                            WAITING FOR {item.top_bidder} TO CLAIM
                          </div>
                        )}
                        {!isWinner && !isSeller && (
                          <div className="h-14 flex items-center justify-center club-well rounded-xl border club-border club-muted text-xs font-black uppercase tracking-wide italic">
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
        <div className="fixed inset-0 club-overlay flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-300">
          <Card className="w-full max-w-md club-surface club-border rounded-xl overflow-hidden">
            <CardHeader className="p-8 text-center">
              <div className="mx-auto w-24 h-24 club-purple rounded-full flex items-center justify-center mb-6 ring-1 ">
                <span className="font-heading text-6xl drop-shadow-2xl flex items-center justify-center">
                  <BoomAvatar name={biddingItem.boom_name} className="w-[1em] h-[1em]" />
                </span>
              </div>
              <CardTitle className="font-heading text-3xl font-black club-ink tracking-tight">Place Your Bid</CardTitle>
              <CardDescription className="font-heading club-accent mt-2">You are bidding on {biddingItem.boom_name}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="club-well rounded-xl p-6 border club-border space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="font-heading text-xs font-black club-muted uppercase tracking-wide">Current Bid</span>
                  <div className="flex items-center gap-2">
                    <CoinsIcon className="h-4 w-4 club-accent" />
                    <span className="font-heading text-lg font-black club-ink">{biddingItem.current_bid.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Label className="font-heading text-xs font-black club-muted uppercase tracking-wide ml-2">Your New Bid</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={bidAmount}
                      onChange={e => setBidAmount(Number(e.target.value))}
                      className="club-well club-border club-ink h-16 rounded-xl text-2xl font-black text-center club-border transition-all "
                    />
                    <CoinsIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 club-accent" />
                  </div>
                  <div className="flex justify-between gap-2 px-1">
                    {[10, 50, 100].map(add => (
                      <button
                        key={add}
                        onClick={() => setBidAmount(prev => prev + add)}
                        className="flex-1 py-2 club-well club-well rounded-xl text-xs font-black club-muted transition-colors uppercase tracking-wide border club-border"
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
                  className="club-action h-16 club-green club-green club-ink font-black rounded-xl text-lg group transition-all"
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
                  className="club-action h-14 rounded-xl club-muted club-ink club-well font-bold"
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
        <div className="fixed inset-0 club-overlay flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in-95 duration-300">
          <Card className="w-full max-w-sm club-surface club-border rounded-xl overflow-hidden text-center">
            <CardContent className="p-10 space-y-6">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ring-4 ring-offset-4 ring-offset-[#0a0a0c] ${statusModal.type === 'success' ? 'club-green ring-green-500/50 club-success' :
                statusModal.type === 'error' ? 'club-red ring-red-500/50 club-danger' :
                  'club-blue club-accent'
                }`}>
                {statusModal.type === 'success' ? <CheckIcon className="h-10 w-10" /> :
                  statusModal.type === 'error' ? <XIcon className="h-10 w-10" /> :
                    <BellIcon className="h-10 w-10" />}
              </div>

              <div className="space-y-2">
                <h3 className="font-heading text-2xl font-black club-ink tracking-tight">{statusModal.title}</h3>
                <p className="font-heading club-muted text-sm font-medium leading-relaxed">{statusModal.message}</p>
              </div>

              <Button
                onClick={() => setStatusModal({ ...statusModal, show: false })}
                className={`club-action w-full h-12 rounded-2xl font-black transition-all active:scale-95 ${statusModal.type === 'success' ? 'club-green club-green club-ink' :
                  statusModal.type === 'error' ? 'club-red club-red club-ink' :
                    'club-blue club-blue club-ink'
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
