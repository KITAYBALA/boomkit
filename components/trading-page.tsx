"use client"

import { secureRpc } from "@/lib/secure-rpc"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowRightLeftIcon,
  PlusIcon,
  SendIcon,
  CheckIcon,
  XIcon,
  PackageIcon,
  CoinsIcon,
  UserIcon,
  ClockIcon,
  BellIcon,
} from "lucide-react"

interface GameUser {
  id: string
  username: string
  tokens: number
  booms: Record<string, number>
  isBanned?: boolean
  [key: string]: any
}

interface Trade {
  id: string
  sender_id: string
  sender_username: string
  receiver_id: string
  receiver_username: string
  sender_booms: Record<string, number>
  receiver_booms: Record<string, number>
  sender_tokens: number
  receiver_tokens: number
  status: "pending" | "accepted" | "declined" | "cancelled"
  message?: string
  created_at: string
}

interface TradingPageProps {
  currentUser: GameUser
  users: GameUser[]
  onTradeComplete: () => void
}

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export function TradingPage({ currentUser, users, onTradeComplete }: TradingPageProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [showNewTrade, setShowNewTrade] = useState(false)
  const [selectedUser, setSelectedUser] = useState<GameUser | null>(null)
  const [myOfferedBooms, setMyOfferedBooms] = useState<Record<string, number>>({})
  const [theirRequestedBooms, setTheirRequestedBooms] = useState<Record<string, number>>({})
  const [myOfferedTokens, setMyOfferedTokens] = useState(0)
  const [theirRequestedTokens, setTheirRequestedTokens] = useState(0)
  const [tradeMessage, setTradeMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing" | "history">("incoming")
  const [newTradeAlert, setNewTradeAlert] = useState(false)
  const [searchQuery, setSearchQuery] = useState("") // Added for user search
  const [statusModal, setStatusModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, title: "", message: "", type: "info" })

  const fetchTrades = useCallback(async () => {
    const { data, error } = await fetch('/api/trades').then(response => response.json()).catch(() => ({ data: null, error: { message: 'Unable to fetch trades' } }))

    if (!error && data) {
      console.log("[v0] Fetched trades:", data.length)
      setTrades((prevTrades) => {
        // Only update if data actually changed
        if (JSON.stringify(prevTrades) !== JSON.stringify(data)) {
          return data
        }
        return prevTrades
      })
    }
  }, [currentUser.id])

  // Fetch trades and set up realtime subscription
  useEffect(() => {
    fetchTrades()

    const channelName = `trades-${currentUser.id}`

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "trades" }, (payload) => {
        console.log("[v0] Trade realtime event:", payload.eventType)

        fetchTrades()

        // Show alert and switch to incoming tab for new incoming trades
        if (payload.eventType === "INSERT") {
          const newTrade = payload.new as Trade
          if (newTrade.receiver_id === currentUser.id) {
            console.log("[v0] New incoming trade for current user!")
            setNewTradeAlert(true)
            setActiveTab("incoming") // Switch to incoming tab
            try {
              const audio = new Audio("/notification.mp3")
              audio.volume = 0.5
              audio.play().catch(() => { })
            } catch { }
            setTimeout(() => setNewTradeAlert(false), 5000)
          }
        }
      })
      .subscribe((status) => {
        console.log("[v0] Trade subscription status:", status)
      })

    const refreshTimer = setInterval(fetchTrades, 5000)
    return () => {
      clearInterval(refreshTimer)
      supabase.removeChannel(channel)
    }
  }, [currentUser.id, fetchTrades])

  const incomingTrades = trades.filter((t) => t.receiver_id === currentUser.id && t.status === "pending")
  const outgoingTrades = trades.filter((t) => t.sender_id === currentUser.id && t.status === "pending")
  const historyTrades = trades.filter((t) => t.status !== "pending")

  const addBoomToOffer = (boomName: string) => {
    const currentAmount = myOfferedBooms[boomName] || 0
    const maxAmount = (currentUser.booms || {})[boomName] || 0
    console.log(`[v0] Adding ${boomName} to offer. Owned: ${maxAmount}, Offered: ${currentAmount}`)
    if (currentAmount < maxAmount) {
      setMyOfferedBooms({ ...myOfferedBooms, [boomName]: currentAmount + 1 })
    }
  }

  const removeBoomFromOffer = (boomName: string) => {
    const currentAmount = myOfferedBooms[boomName] || 0
    if (currentAmount > 0) {
      const newBooms = { ...myOfferedBooms }
      if (currentAmount === 1) {
        delete newBooms[boomName]
      } else {
        newBooms[boomName] = currentAmount - 1
      }
      setMyOfferedBooms(newBooms)
    }
  }

  const addBoomToRequest = (boomName: string) => {
    if (!selectedUser) return
    const currentAmount = theirRequestedBooms[boomName] || 0
    const maxAmount = (selectedUser.booms || {})[boomName] || 0
    console.log(`[v0] Requesting ${boomName} from ${selectedUser.username}. Owned: ${maxAmount}, Requested: ${currentAmount}`)
    if (currentAmount < maxAmount) {
      setTheirRequestedBooms({ ...theirRequestedBooms, [boomName]: currentAmount + 1 })
    }
  }

  const removeBoomFromRequest = (boomName: string) => {
    const currentAmount = theirRequestedBooms[boomName] || 0
    if (currentAmount > 0) {
      const newBooms = { ...theirRequestedBooms }
      if (currentAmount === 1) {
        delete newBooms[boomName]
      } else {
        newBooms[boomName] = currentAmount - 1
      }
      setTheirRequestedBooms(newBooms)
    }
  }

  const swapTrade = () => {
    if (!selectedUser) return

    // Store current state
    const oldMyBooms = { ...myOfferedBooms }
    const oldMyTokens = myOfferedTokens
    const oldTheirBooms = { ...theirRequestedBooms }
    const oldTheirTokens = theirRequestedTokens

    // Simple swap with validation for tokens
    setMyOfferedBooms(oldTheirBooms)
    setTheirRequestedBooms(oldMyBooms)
    setMyOfferedTokens(Math.min(oldTheirTokens, currentUser.tokens))
    setTheirRequestedTokens(Math.min(oldMyTokens, selectedUser.tokens))
  }

  const sendTrade = async () => {
    if (!selectedUser) return
    if (currentUser.isBanned || currentUser.status === "rejected") {
      setStatusModal({
        show: true,
        title: "Trade Blocked",
        message: "You are banned or rejected and cannot participate in trading.",
        type: "error"
      })
      return
    }

    if (selectedUser.isBanned || selectedUser.status === "rejected") {
      setStatusModal({
        show: true,
        title: "Trade Blocked",
        message: `${selectedUser.username} is banned or rejected and cannot participate in trading.`,
        type: "error"
      })
      return
    }

    if (
      Object.keys(myOfferedBooms).length === 0 &&
      myOfferedTokens === 0 &&
      Object.keys(theirRequestedBooms).length === 0 &&
      theirRequestedTokens === 0
    ) {
      setStatusModal({
        show: true,
        title: "Empty Offer",
        message: "You must add tokens or Booms to the trade before sending.",
        type: "info"
      })
      return
    }

    setLoading(true)
    const { error } = await fetch('/api/trades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      sender_id: currentUser.id,
      sender_username: currentUser.username,
      receiver_id: selectedUser.id,
      receiver_username: selectedUser.username,
      sender_booms: myOfferedBooms,
      receiver_booms: theirRequestedBooms,
      sender_tokens: myOfferedTokens,
      receiver_tokens: theirRequestedTokens,
      message: tradeMessage || null,
      status: "pending",
    }) }).then(response => response.json()).catch(() => ({ error: { message: 'Unable to send trade' } }))

    setLoading(false)
    if (error) {
      console.error("Trade submission error:", error)
      setStatusModal({
        show: true,
        title: "Submission Error",
        message: "Something went wrong while sending your trade: " + error.message,
        type: "error"
      })
    } else {
      setShowNewTrade(false)
      resetTradeForm()
      setStatusModal({
        show: true,
        title: "Trade Dispatched",
        message: "Your trade offer has been successfully sent to " + selectedUser.username + "!",
        type: "success"
      })
      fetchTrades() // Refresh the list in background
    }
  }

  const acceptTrade = async (trade: Trade) => {
    setLoading(true)

    try {
      if (currentUser.isBanned || currentUser.status === "rejected") {
        throw new Error("You are banned or rejected and cannot participate in trading.")
      }

      const sender = users.find((u) => u.id === trade.sender_id)
      if (sender?.isBanned || sender?.status === "rejected") {
        throw new Error("This trade cannot be accepted because the sender is banned or rejected.")
      }

      const { error } = await secureRpc('accept_trade', { trade_uuid: trade.id })
      if (error) throw error

      setLoading(false)
      setStatusModal({
        show: true,
        title: "Trade Finalized",
        message: "The trade has been accepted. Your items have been exchanged!",
        type: "success"
      })
      fetchTrades() // Refresh local trades list
      onTradeComplete()
    } catch (e: any) {
      console.error("Trade failed:", e)
      setLoading(false)
      setStatusModal({
        show: true,
        title: "Trade Failed",
        message: e.message || "An unexpected error occurred while accepting the trade.",
        type: "error"
      })
    }
  }

  const declineTrade = async (trade: Trade) => {
    await updateTradeStatus(trade.id, 'declined')
  }

  const cancelTrade = async (trade: Trade) => {
    await updateTradeStatus(trade.id, 'cancelled')
  }

  const updateTradeStatus = async (id: string, status: 'declined' | 'cancelled') => {
    const { error } = await fetch('/api/trades', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
      .then(response => response.json()).catch(() => ({ error: { message: 'Unable to update trade' } }))
    if (error) setStatusModal({ show: true, title: 'Trade update failed', message: error.message, type: 'error' })
    else void fetchTrades()
  }

  const resetTradeForm = () => {
    setSelectedUser(null)
    setMyOfferedBooms({})
    setTheirRequestedBooms({})
    setMyOfferedTokens(0)
    setTheirRequestedTokens(0)
    setTradeMessage("")
  }

  const otherUsers = users.filter((u) => u.id !== currentUser.id && !u.isBanned && u.status !== "rejected")

  return (
    <div className="space-y-6">
      {newTradeAlert && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <Card className="club-green club-border ">
            <CardContent className="p-4 flex items-center gap-3">
              <BellIcon className="h-6 w-6 club-ink " />
              <span className="font-heading club-ink font-bold text-lg">New Trade Offer!</span>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 club-well p-6 rounded-xl border club-border ">
        <div>
          <h1 className="font-heading text-4xl font-black club-ink flex items-center gap-3 tracking-tight">
            <div className="p-2 club-purple rounded-xl ">
              <ArrowRightLeftIcon className="h-8 w-8 club-ink" />
            </div>
            Trading
          </h1>
          <p className="font-heading club-accent mt-2 font-medium">Exchange Booms and Tokens with the community</p>
        </div>
        <Button
          onClick={() => setShowNewTrade(true)}
          className="club-action club-surface club-ink font-bold px-8 h-12 rounded-xl transition-all hover:scale-105 active:scale-95 border-none"
          disabled={currentUser.isBanned}
          title={currentUser.isBanned ? "You are banned" : "Start a new trade"}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Trade
        </Button>
      </div>

      {/* Pending Trade Notification */}
      {incomingTrades.length > 0 && (
        <Card className="club-yellow club-border">
          <CardContent className="py-3">
            <p className="font-heading club-accent font-medium">
              You have {incomingTrades.length} incoming trade offer{incomingTrades.length > 1 ? "s" : ""}!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Trade Tabs */}
      <div className="flex flex-wrap gap-1 p-1 club-well rounded-xl border club-border w-fit max-w-full">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-3 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "incoming"
            ? "club-purple club-ink transform scale-105"
            : "club-accent club-ink club-well"
            }`}
        >
          Incoming ({incomingTrades.length})
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-3 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "outgoing"
            ? "club-purple club-ink transform scale-105"
            : "club-accent club-ink club-well"
            }`}
        >
          Outgoing ({outgoingTrades.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "history"
            ? "club-purple club-ink transform scale-105"
            : "club-accent club-ink club-well"
            }`}
        >
          History ({historyTrades.length})
        </button>
      </div>

      {/* Trade Lists */}
      <div className="space-y-4">
        {activeTab === "incoming" &&
          (incomingTrades.length === 0 ? (
            <Card className="club-well club-border">
              <CardContent className="py-8 text-center club-accent">No incoming trades</CardContent>
            </Card>
          ) : (
            incomingTrades.map((trade) => {
              const sender = users.find((u) => u.id === trade.sender_id)
              const senderIsBanned = (sender?.isBanned || sender?.status === "rejected") || false
              return (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  currentUserId={currentUser.id}
                  onAccept={() => acceptTrade(trade)}
                  onDecline={() => declineTrade(trade)}
                  loading={loading}
                  senderIsBanned={senderIsBanned}
                  users={users}
                />
              )
            })
          ))}

        {activeTab === "outgoing" &&
          (outgoingTrades.length === 0 ? (
            <Card className="club-well club-border">
              <CardContent className="py-8 text-center club-accent">No outgoing trades</CardContent>
            </Card>
          ) : (
            outgoingTrades.map((trade) => {
              const receiver = users.find((u) => u.id === trade.receiver_id)
              const receiverIsBanned = (receiver?.isBanned || receiver?.status === "rejected") || false
              return (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  currentUserId={currentUser.id}
                  onCancel={() => cancelTrade(trade)}
                  loading={loading}
                  receiverIsBanned={receiverIsBanned}
                  users={users}
                />
              )
            })
          ))}

        {activeTab === "history" &&
          (historyTrades.length === 0 ? (
            <Card className="club-well club-border">
              <CardContent className="py-8 text-center club-accent">No trade history</CardContent>
            </Card>
          ) : (
            historyTrades
              .slice(0, 20)
              .map((trade) => {
                const sender = users.find((u) => u.id === trade.sender_id)
                const receiver = users.find((u) => u.id === trade.receiver_id)
                return (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    currentUserId={currentUser.id}
                    loading={loading}
                    senderIsBanned={(sender?.isBanned || sender?.status === "rejected") || false}
                    receiverIsBanned={(receiver?.isBanned || receiver?.status === "rejected") || false}
                    users={users}
                  />
                )
              })
          ))}
      </div>

      {/* New Trade Modal */}
      {showNewTrade && (
        <div className="fixed inset-0 club-overlay flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden club-surface club-border rounded-xl">
            <CardHeader className="border-b club-border pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-2xl font-bold club-ink flex items-center gap-3">
                    <div className="p-2 club-purple rounded-lg">
                      <PlusIcon className="h-6 w-6 club-accent" />
                    </div>
                    Create New Trade
                  </CardTitle>
                  <CardDescription className="font-heading club-accent mt-1">Select a player and choose items to swap</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowNewTrade(false)} className="club-action rounded-full club-muted club-ink club-well">
                  <XIcon className="h-6 w-6" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-8 space-y-8">
                {/* User Selection */}
                {!selectedUser ? (
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-heading text-lg font-bold club-ink mb-4">Who are you trading with?</h3>
                    <div className="relative mb-6">
                      <Input
                        placeholder="Search by username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="club-well club-border club-ink h-12 pl-12 rounded-xl "
                      />
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 club-muted" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {otherUsers
                        .filter((u) => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((user) => (
                          <Button
                            key={user.id}
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            className="club-action justify-start h-14 club-well club-border club-purple club-border rounded-xl transition-all club-ink"
                          >
                            <div className="w-8 h-8 rounded-full club-well flex items-center justify-center mr-3">
                              <UserIcon className="h-4 w-4 club-muted" />
                            </div>
                            <span className="font-medium club-ink flex items-center">
                              {user.clan_tag && (
                                <span className="inline-block text-xs font-black tracking-tight mr-1">
                                  <span className={user.clan_tag_color || 'club-accent'}>
                                    [{user.clan_tag}]
                                  </span>
                                </span>
                              )}
                              {user.username}
                            </span>
                          </Button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between club-purple p-4 rounded-xl border club-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full club-purple flex items-center justify-center ">
                          <UserIcon className="h-6 w-6 club-ink" />
                        </div>
                        <div>
                          <p className="font-heading text-xs club-accent uppercase font-bold tracking-wide">Trading Session</p>
                          <p className="font-heading text-lg font-bold club-ink flex items-center gap-1">
                            {selectedUser.clan_tag && (
                              <span className="inline-block text-xs font-black tracking-tight">
                                <span className={selectedUser.clan_tag_color || 'club-accent'}>
                                  [{selectedUser.clan_tag}]
                                </span>
                              </span>
                            )}
                            {selectedUser.username}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)} className="club-action rounded-xl bg-transparent club-border club-muted club-ink">
                        Change Player
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 relative">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex">
                        <button
                          type="button"
                          onClick={() => {
                            console.log("[v0] Send triggered from central button")
                            sendTrade()
                          }}
                          className="w-14 h-14 rounded-full club-purple border club-border flex items-center justify-center club-purple active:scale-90 transition-all group/send"
                          title="Send Trade Offer"
                        >
                          <SendIcon className="h-6 w-6 club-ink group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
                        </button>
                      </div>

                      {/* Your Offer */}
                      <div className="space-y-6 club-well p-6 rounded-xl border club-border">
                        <h3 className="font-heading text-sm font-black club-muted uppercase tracking-wide flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full club-green" />
                          Your Offer
                        </h3>

                        <div className="space-y-4">
                          <div className="club-well rounded-xl p-4 min-h-[120px]">
                            <p className="font-heading text-xs club-muted mb-3 font-bold uppercase">Booms to give</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(myOfferedBooms).map(([boom, qty]) => (
                                <Badge
                                  key={boom}
                                  className="club-green club-success border club-border club-green cursor-pointer h-8"
                                  onClick={() => removeBoomFromOffer(boom)}
                                >
                                  {boom} x{qty} <XIcon className="h-3 w-3 ml-2 opacity-50" />
                                </Badge>
                              ))}
                              {Object.keys(myOfferedBooms).length === 0 && (
                                <p className="font-heading text-sm club-muted italic">No Booms selected</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="p-3 club-yellow rounded-xl border club-border club-accent">
                              <CoinsIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <Input
                                type="number"
                                min="0"
                                max={currentUser.tokens}
                                value={myOfferedTokens}
                                onChange={(e) => setMyOfferedTokens(Math.min(Number(e.target.value), currentUser.tokens))}
                                className="club-well club-border club-ink h-12 rounded-xl text-lg font-bold"
                              />
                            </div>
                          </div>

                          <div className="p-4 club-well rounded-xl">
                            <p className="font-heading text-xs club-muted mb-3 font-black uppercase tracking-wide text-center">Tap inventory to add</p>
                            <div className="flex flex-wrap gap-1.5 justify-center max-h-32 overflow-y-auto pr-2">
                              {Object.entries(currentUser.booms || {}).map(([boom, qty]) => (
                                <button
                                  key={boom}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    addBoomToOffer(boom)
                                  }}
                                  className="px-3 py-1.5 rounded-lg club-well club-well border club-border text-xs club-ink transition-all active:scale-90"
                                >
                                  {boom} ({qty})
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Their Request */}
                      <div className="space-y-6 club-well p-6 rounded-xl border club-border">
                        <h3 className="font-heading text-sm font-black club-muted uppercase tracking-wide flex items-center md:flex-row-reverse gap-2">
                          <div className="w-2 h-2 rounded-full club-blue" />
                          Their offer
                        </h3>

                        <div className="space-y-4">
                          <div className="club-well rounded-xl p-4 min-h-[120px]">
                            <p className="font-heading text-xs club-muted mb-3 font-bold uppercase md:text-right">Booms you receive</p>
                            <div className="flex flex-wrap md:justify-end gap-2">
                              {Object.entries(theirRequestedBooms).map(([boom, qty]) => (
                                <Badge
                                  key={boom}
                                  className="club-blue club-accent border club-border club-blue cursor-pointer h-8"
                                  onClick={() => removeBoomFromRequest(boom)}
                                >
                                  {boom} x{qty} <XIcon className="h-3 w-3 ml-2 opacity-50" />
                                </Badge>
                              ))}
                              {Object.keys(theirRequestedBooms).length === 0 && (
                                <p className="font-heading text-sm club-muted italic">No Booms requested</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <Input
                                type="number"
                                min="0"
                                max={selectedUser.tokens}
                                value={theirRequestedTokens}
                                onChange={(e) => setTheirRequestedTokens(Math.min(Number(e.target.value), selectedUser.tokens))}
                                className="club-well club-border club-ink h-12 rounded-xl text-lg font-bold"
                              />
                            </div>
                            <div className="p-3 club-yellow rounded-xl border club-border club-accent">
                              <CoinsIcon className="h-6 w-6" />
                            </div>
                          </div>

                          <div className="p-4 club-well rounded-xl">
                            <p className="font-heading text-xs club-muted mb-3 font-black uppercase tracking-wide text-center">{selectedUser.username}&apos;s Inventory</p>
                            <div className="flex flex-wrap gap-1.5 justify-center max-h-32 overflow-y-auto pr-2">
                              {Object.entries(selectedUser.booms || {}).map(([boom, qty]) => (
                                <button
                                  key={boom}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    addBoomToRequest(boom)
                                  }}
                                  className="px-3 py-1.5 rounded-lg club-well club-well border club-border text-xs club-ink transition-all active:scale-90"
                                >
                                  {boom} ({qty})
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message Area */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 club-muted text-xs font-black uppercase tracking-wide ml-1">
                        <BellIcon className="h-3 w-3" />
                        Attach a Proposal Message
                      </div>
                      <Textarea
                        value={tradeMessage}
                        onChange={(e) => setTradeMessage(e.target.value)}
                        placeholder="Why should they accept this trade? Be persuasive..."
                        className="club-well club-border club-ink rounded-[1.5rem] p-5 resize-none min-h-[100px]"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            {selectedUser && (
              <div className="p-8 border-t club-border club-well flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-6 club-muted">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full club-purple " />
                    <span className="font-heading text-xs font-bold uppercase tracking-wider">Trading Securely</span>
                  </div>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      resetTradeForm()
                      setShowNewTrade(false)
                    }}
                    className="club-action flex-1 md:flex-none club-muted club-ink club-well rounded-xl h-14 px-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={sendTrade}
                    disabled={loading}
                    className="club-action flex-1 md:flex-none club-purple club-purple club-ink font-black h-14 px-12 rounded-xl transition-all hover:scale-[1.02] active:scale-95 border-none"
                  >
                    {loading ? "Sending..." : "Send Trade Offer"}
                    <SendIcon className="h-5 w-5 ml-3" />
                  </Button>
                </div>
              </div>
            )}
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

function TradeCard({
  trade,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
  loading,
  senderIsBanned = false,
  receiverIsBanned = false,
  users,
}: {
  trade: Trade
  currentUserId: string
  onAccept?: () => void
  onDecline?: () => void
  onCancel?: () => void
  loading: boolean
  senderIsBanned?: boolean
  receiverIsBanned?: boolean
  users?: GameUser[]
}) {
  const isIncoming = trade.receiver_id === currentUserId
  const isPending = trade.status === "pending"

  const statusColors = {
    pending: "club-yellow",
    accepted: "club-green",
    declined: "club-red",
    cancelled: "club-well",
  }

  return (
    <Card className="group club-well club-border club-border transition-all duration-300 hover:scale-[1.01] overflow-hidden">
      <div className="absolute inset-0 club-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <CardContent className="py-5 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge className={`${statusColors[trade.status]}   px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
                  {trade.status}
                </Badge>
                {senderIsBanned && (
                  <Badge className="club-red club-ink px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                    🚫 Sender Banned
                  </Badge>
                )}
                {receiverIsBanned && !isIncoming && (
                  <Badge className="club-red club-ink px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                    🚫 Receiver Banned
                  </Badge>
                )}
                <div className="flex items-center club-accent text-xs font-medium">
                  <ClockIcon className="h-3.5 w-3.5 mr-1" />
                  {new Date(trade.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {isPending && (
                <div className="flex gap-2">
                  {isIncoming && onAccept && onDecline && (
                    <>
                      <Button
                        size="sm"
                        onClick={onAccept}
                        disabled={loading || senderIsBanned}
                        className="club-action club-green club-green club-ink px-4 h-9 rounded-full transition-all active:scale-95"
                      >
                        <CheckIcon className="h-4 w-4 mr-1.5" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={onDecline}
                        disabled={loading}
                        className="club-action px-4 h-9 rounded-full transition-all active:scale-95"
                      >
                        <XIcon className="h-4 w-4 mr-1.5" />
                        Decline
                      </Button>
                    </>
                  )}
                  {!isIncoming && onCancel && (
                    <Button
                      size="sm"
                      onClick={onCancel}
                      disabled={loading}
                      className="club-action club-red club-red club-danger border club-border rounded-full px-4 h-9 transition-all active:scale-95"
                    >
                      Cancel Trade
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 club-well p-4 rounded-xl border club-border">
              {/* Party A */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full club-purple flex items-center justify-center border club-border">
                    <UserIcon className="h-4 w-4 club-accent" />
                  </div>
                  <span className={`font-bold ${isIncoming ? "club-accent" : "club-ink"} flex items-center`}>
                    {(() => {
                      const sender = users?.find(u => u.username === trade.sender_username);
                      return sender?.clan_tag ? (
                        <span className="inline-block text-[10px] font-black tracking-tight mr-1">
                          <span className={sender.clan_tag_color || 'club-accent'}>
                            [{sender.clan_tag}]
                          </span>
                        </span>
                      ) : null;
                    })()}
                    {trade.sender_username}
                  </span>
                  <span className="font-heading text-xs club-accent ml-auto font-bold tracking-tighter">GIVES</span>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                  {Object.entries(trade.sender_booms).map(([boom, qty]) => (
                    <Badge key={boom} variant="secondary" className="club-well club-well club-accent border-none px-2.5 py-1 text-xs transition-colors">
                      {boom} <span className="ml-1 club-accent text-xs">x{qty}</span>
                    </Badge>
                  ))}
                  {trade.sender_tokens > 0 && (
                    <Badge className="club-yellow club-yellow club-accent border club-border px-2.5 py-1 text-xs transition-colors">
                      <CoinsIcon className="h-3 w-3 mr-1.5" />
                      {trade.sender_tokens.toLocaleString()}
                    </Badge>
                  )}
                  {Object.keys(trade.sender_booms).length === 0 && trade.sender_tokens === 0 && (
                    <span className="font-heading club-muted text-xs italic py-1 px-2">Nothing offered</span>
                  )}
                </div>
              </div>

              {/* Separator / Direction */}
              <div className="flex items-center justify-center p-2">
                <div className="w-10 h-10 rounded-full club-purple flex items-center justify-center border club-border club-purple transition-colors">
                  <ArrowRightLeftIcon className="h-5 w-5 club-accent group-hover:rotate-180 transition-transform duration-500" />
                </div>
              </div>

              {/* Party B */}
              <div className="flex-1 space-y-3 md:text-right">
                <div className="flex items-center md:flex-row-reverse gap-2">
                  <div className="w-8 h-8 rounded-full club-blue flex items-center justify-center border club-border">
                    <UserIcon className="h-4 w-4 club-accent" />
                  </div>
                  <span className={`font-bold ${!isIncoming ? "club-accent" : "club-ink"} flex items-center md:flex-row-reverse`}>
                    {(() => {
                      const receiver = users?.find(u => u.username === trade.receiver_username);
                      return receiver?.clan_tag ? (
                        <span className="inline-block text-[10px] font-black tracking-tight ml-1 md:mr-1">
                          <span className={receiver.clan_tag_color || 'club-accent'}>
                            [{receiver.clan_tag}]
                          </span>
                        </span>
                      ) : null;
                    })()}
                    {trade.receiver_username}
                  </span>
                  <span className="font-heading text-xs club-accent mr-auto md:ml-auto md:mr-0 font-bold tracking-tighter">RECEIVES</span>
                </div>
                <div className="flex flex-wrap md:justify-end gap-1.5 min-h-[2rem]">
                  {Object.entries(trade.receiver_booms).map(([boom, qty]) => (
                    <Badge key={boom} variant="secondary" className="club-well club-well club-accent border-none px-2.5 py-1 text-xs transition-colors">
                      {boom} <span className="ml-1 club-accent text-[10px]">x{qty}</span>
                    </Badge>
                  ))}
                  {trade.receiver_tokens > 0 && (
                    <Badge className="club-yellow club-yellow club-accent border club-border px-2.5 py-1 text-xs transition-colors">
                      <CoinsIcon className="h-3 w-3 mr-1.5" />
                      {trade.receiver_tokens.toLocaleString()}
                    </Badge>
                  )}
                  {Object.keys(trade.receiver_booms).length === 0 && trade.receiver_tokens === 0 && (
                    <span className="font-heading club-muted text-xs italic py-1 px-2">Nothing requested</span>
                  )}
                </div>
              </div>
            </div>

            {trade.message && (
              <div className="mt-4 flex items-start gap-2 club-accent club-purple p-3 rounded-xl border club-border">
                <span className="font-heading club-accent mt-0.5">“</span>
                <p className="font-heading text-sm italic flex-1 leading-relaxed">{trade.message}</p>
                <span className="font-heading club-accent self-end">”</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TradingPage
