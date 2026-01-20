"use client"

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

  const fetchTrades = useCallback(async () => {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order("created_at", { ascending: false })

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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser.id, fetchTrades])

  const incomingTrades = trades.filter((t) => t.receiver_id === currentUser.id && t.status === "pending")
  const outgoingTrades = trades.filter((t) => t.sender_id === currentUser.id && t.status === "pending")
  const historyTrades = trades.filter((t) => t.status !== "pending")

  const addBoomToOffer = (boomName: string) => {
    const currentAmount = myOfferedBooms[boomName] || 0
    const maxAmount = currentUser.booms[boomName] || 0
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
    const maxAmount = selectedUser.booms[boomName] || 0
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
    if (currentUser.isBanned) {
      alert("You are banned and cannot trade.")
      return
    }

    if (
      Object.keys(myOfferedBooms).length === 0 &&
      myOfferedTokens === 0 &&
      Object.keys(theirRequestedBooms).length === 0 &&
      theirRequestedTokens === 0
    ) {
      alert("Please add something to the trade!")
      return
    }

    setLoading(true)
    const { error } = await supabase.from("trades").insert({
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
    })

    setLoading(false)
    if (error) {
      console.error("Trade submission error:", error)
      alert("Error sending trade: " + error.message)
    } else {
      alert("Trade sent successfully!")
      resetTradeForm()
      setShowNewTrade(false)
      fetchTrades() // Refresh the list
    }
  }

  const acceptTrade = async (trade: Trade) => {
    setLoading(true)

    try {
      if (currentUser.isBanned) {
        throw new Error("You are banned and cannot trade.")
      }

      const { error } = await supabase.rpc('accept_trade', { trade_uuid: trade.id })
      if (error) throw error

      setLoading(false)
      alert("Trade accepted!")
      fetchTrades() // Refresh local trades list
      onTradeComplete()
    } catch (e: any) {
      console.error("Trade failed:", e)
      setLoading(false)
      alert("Trade failed: " + (e.message || "Unknown error"))
    }
  }

  const declineTrade = async (trade: Trade) => {
    await supabase
      .from("trades")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", trade.id)
  }

  const cancelTrade = async (trade: Trade) => {
    await supabase
      .from("trades")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", trade.id)
  }

  const resetTradeForm = () => {
    setSelectedUser(null)
    setMyOfferedBooms({})
    setTheirRequestedBooms({})
    setMyOfferedTokens(0)
    setTheirRequestedTokens(0)
    setTradeMessage("")
  }

  const otherUsers = users.filter((u) => u.id !== currentUser.id && !u.isBanned)

  return (
    <div className="space-y-6">
      {newTradeAlert && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <Card className="bg-green-500 border-green-400 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <BellIcon className="h-6 w-6 text-white animate-pulse" />
              <span className="text-white font-bold text-lg">New Trade Offer!</span>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
              <ArrowRightLeftIcon className="h-8 w-8 text-white" />
            </div>
            Trading
          </h1>
          <p className="text-purple-200/60 mt-2 font-medium">Exchange Booms and Tokens with the community</p>
        </div>
        <Button
          onClick={() => setShowNewTrade(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 h-12 rounded-2xl shadow-xl shadow-green-500/20 transition-all hover:scale-105 active:scale-95 border-none"
          disabled={currentUser.isBanned}
          title={currentUser.isBanned ? "You are banned" : "Start a new trade"}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Trade
        </Button>
      </div>

      {/* Pending Trade Notification */}
      {incomingTrades.length > 0 && (
        <Card className="bg-yellow-500/20 border-yellow-500">
          <CardContent className="py-3">
            <p className="text-yellow-300 font-medium">
              You have {incomingTrades.length} incoming trade offer{incomingTrades.length > 1 ? "s" : ""}!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Trade Tabs */}
      <div className="flex p-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "incoming"
            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 transform scale-105"
            : "text-purple-200 hover:text-white hover:bg-white/5"
            }`}
        >
          Incoming ({incomingTrades.length})
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "outgoing"
            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 transform scale-105"
            : "text-purple-200 hover:text-white hover:bg-white/5"
            }`}
        >
          Outgoing ({outgoingTrades.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "history"
            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 transform scale-105"
            : "text-purple-200 hover:text-white hover:bg-white/5"
            }`}
        >
          History ({historyTrades.length})
        </button>
      </div>

      {/* Trade Lists */}
      <div className="space-y-4">
        {activeTab === "incoming" &&
          (incomingTrades.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="py-8 text-center text-purple-200">No incoming trades</CardContent>
            </Card>
          ) : (
            incomingTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                currentUserId={currentUser.id}
                onAccept={() => acceptTrade(trade)}
                onDecline={() => declineTrade(trade)}
                loading={loading}
              />
            ))
          ))}

        {activeTab === "outgoing" &&
          (outgoingTrades.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="py-8 text-center text-purple-200">No outgoing trades</CardContent>
            </Card>
          ) : (
            outgoingTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                currentUserId={currentUser.id}
                onCancel={() => cancelTrade(trade)}
                loading={loading}
              />
            ))
          ))}

        {activeTab === "history" &&
          (historyTrades.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="py-8 text-center text-purple-200">No trade history</CardContent>
            </Card>
          ) : (
            historyTrades
              .slice(0, 20)
              .map((trade) => (
                <TradeCard key={trade.id} trade={trade} currentUserId={currentUser.id} loading={loading} />
              ))
          ))}
      </div>

      {/* New Trade Modal */}
      {showNewTrade && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[#0a0a0c]/90 backdrop-blur-2xl border-purple-500/30 shadow-[0_0_50px_rgba(139,92,246,0.15)] rounded-[2rem]">
            <CardHeader className="border-b border-white/5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <PlusIcon className="h-6 w-6 text-purple-400" />
                    </div>
                    Create New Trade
                  </CardTitle>
                  <CardDescription className="text-purple-300/60 mt-1">Select a player and choose items to swap</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowNewTrade(false)} className="rounded-full text-white/40 hover:text-white hover:bg-white/5">
                  <XIcon className="h-6 w-6" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-8 space-y-8">
                {/* User Selection */}
                {!selectedUser ? (
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-white mb-4">Who are you trading with?</h3>
                    <div className="relative mb-6">
                      <Input
                        placeholder="Search by username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border-white/10 text-white h-12 pl-12 rounded-xl focus:ring-purple-500/50"
                      />
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {otherUsers
                        .filter((u) => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((user) => (
                          <Button
                            key={user.id}
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            className="justify-start h-14 bg-white/5 border-white/5 hover:bg-purple-500/10 hover:border-purple-500/30 rounded-xl transition-all text-white"
                          >
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3">
                              <UserIcon className="h-4 w-4 text-white/60" />
                            </div>
                            <span className="font-medium text-white">{user.username}</span>
                          </Button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                          <UserIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-purple-300/60 uppercase font-bold tracking-widest">Trading Session</p>
                          <p className="text-lg font-bold text-white">{selectedUser.username}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)} className="rounded-xl bg-transparent border-white/10 text-white/60 hover:text-white">
                        Change Player
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 relative">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex">
                        <button
                          type="button"
                          onClick={() => {
                            console.log("[v0] Swap triggered")
                            swapTrade()
                          }}
                          className="w-12 h-12 rounded-full bg-[#1a1a1e] border border-white/10 flex items-center justify-center shadow-2xl hover:bg-white/10 hover:border-purple-500/50 active:scale-90 transition-all group/swap"
                          title="Swap Offer and Request"
                        >
                          <ArrowRightLeftIcon className="h-6 w-6 text-purple-400 group-hover/swap:rotate-180 transition-transform duration-500" />
                        </button>
                      </div>

                      {/* Your Offer */}
                      <div className="space-y-6 bg-white/5 p-6 rounded-3xl border border-white/5">
                        <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Your Offer
                        </h3>

                        <div className="space-y-4">
                          <div className="bg-black/20 rounded-2xl p-4 min-h-[120px]">
                            <p className="text-xs text-white/60 mb-3 font-bold uppercase">Booms to give</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(myOfferedBooms).map(([boom, qty]) => (
                                <Badge
                                  key={boom}
                                  className="bg-green-500/20 text-green-400 border border-green-500/20 hover:bg-green-500/30 cursor-pointer h-8"
                                  onClick={() => removeBoomFromOffer(boom)}
                                >
                                  {boom} x{qty} <XIcon className="h-3 w-3 ml-2 opacity-50" />
                                </Badge>
                              ))}
                              {Object.keys(myOfferedBooms).length === 0 && (
                                <p className="text-sm text-white/20 italic">No Booms selected</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-500">
                              <CoinsIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <Input
                                type="number"
                                min="0"
                                max={currentUser.tokens}
                                value={myOfferedTokens}
                                onChange={(e) => setMyOfferedTokens(Math.min(Number(e.target.value), currentUser.tokens))}
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl text-lg font-bold"
                              />
                            </div>
                          </div>

                          <div className="p-4 bg-white/5 rounded-2xl">
                            <p className="text-[10px] text-white/30 mb-3 font-black uppercase tracking-widest text-center">Tap inventory to add</p>
                            <div className="flex flex-wrap gap-1.5 justify-center max-h-32 overflow-y-auto pr-2">
                              {Object.entries(currentUser.booms || {}).map(([boom, qty]) => (
                                <button
                                  key={boom}
                                  onClick={() => addBoomToOffer(boom)}
                                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white/70 transition-all active:scale-90"
                                >
                                  {boom} ({qty})
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Their Request */}
                      <div className="space-y-6 bg-white/5 p-6 rounded-3xl border border-white/5">
                        <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] flex items-center md:flex-row-reverse gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          Their Give
                        </h3>

                        <div className="space-y-4">
                          <div className="bg-black/20 rounded-2xl p-4 min-h-[120px]">
                            <p className="text-xs text-white/60 mb-3 font-bold uppercase md:text-right">Booms you receive</p>
                            <div className="flex flex-wrap md:justify-end gap-2">
                              {Object.entries(theirRequestedBooms).map(([boom, qty]) => (
                                <Badge
                                  key={boom}
                                  className="bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:bg-blue-500/30 cursor-pointer h-8"
                                  onClick={() => removeBoomFromRequest(boom)}
                                >
                                  {boom} x{qty} <XIcon className="h-3 w-3 ml-2 opacity-50" />
                                </Badge>
                              ))}
                              {Object.keys(theirRequestedBooms).length === 0 && (
                                <p className="text-sm text-white/20 italic">No Booms requested</p>
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
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl text-lg font-bold"
                              />
                            </div>
                            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-500">
                              <CoinsIcon className="h-6 w-6" />
                            </div>
                          </div>

                          <div className="p-4 bg-white/5 rounded-2xl">
                            <p className="text-[10px] text-white/30 mb-3 font-black uppercase tracking-widest text-center">{selectedUser.username}&apos;s Inventory</p>
                            <div className="flex flex-wrap gap-1.5 justify-center max-h-32 overflow-y-auto pr-2">
                              {Object.entries(selectedUser.booms || {}).map(([boom, qty]) => (
                                <button
                                  key={boom}
                                  onClick={() => addBoomToRequest(boom)}
                                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white/70 transition-all active:scale-90"
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
                      <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest ml-1">
                        <BellIcon className="h-3 w-3" />
                        Attach a Proposal Message
                      </div>
                      <Textarea
                        value={tradeMessage}
                        onChange={(e) => setTradeMessage(e.target.value)}
                        placeholder="Why should they accept this trade? Be persuasive..."
                        className="bg-white/5 border-white/10 text-white rounded-[1.5rem] p-5 focus:ring-purple-500/50 resize-none min-h-[100px]"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            {selectedUser && (
              <div className="p-8 border-t border-white/5 bg-black/20 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-6 text-white/40">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Trading Securely</span>
                  </div>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      resetTradeForm()
                      setShowNewTrade(false)
                    }}
                    className="flex-1 md:flex-none text-white/60 hover:text-white hover:bg-white/5 rounded-2xl h-14 px-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={sendTrade}
                    disabled={loading}
                    className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-500 text-white font-black h-14 px-12 rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-95 border-none"
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
}: {
  trade: Trade
  currentUserId: string
  onAccept?: () => void
  onDecline?: () => void
  onCancel?: () => void
  loading: boolean
}) {
  const isIncoming = trade.receiver_id === currentUserId
  const isPending = trade.status === "pending"

  const statusColors = {
    pending: "bg-yellow-500",
    accepted: "bg-green-500",
    declined: "bg-red-500",
    cancelled: "bg-gray-500",
  }

  return (
    <Card className="group bg-white/5 backdrop-blur-md border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <CardContent className="py-5 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge className={`${statusColors[trade.status]} shadow-lg shadow-current/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
                  {trade.status}
                </Badge>
                <div className="flex items-center text-purple-300/60 text-xs font-medium">
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
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 px-4 h-9 rounded-full transition-all active:scale-95"
                      >
                        <CheckIcon className="h-4 w-4 mr-1.5" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={onDecline}
                        disabled={loading}
                        className="shadow-lg shadow-red-500/30 px-4 h-9 rounded-full transition-all active:scale-95"
                      >
                        <XIcon className="h-4 w-4 mr-1.5" />
                        Decline
                      </Button>
                    </>
                  )}
                  {!isIncoming && onCancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancel}
                      disabled={loading}
                      className="border-white/10 text-white hover:bg-white/5 rounded-full px-4"
                    >
                      Cancel Trade
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              {/* Party A */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <UserIcon className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className={`font-bold ${isIncoming ? "text-purple-400" : "text-white"}`}>
                    {trade.sender_username}
                  </span>
                  <span className="text-xs text-purple-200 ml-auto font-bold tracking-tighter">GIVES</span>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                  {Object.entries(trade.sender_booms).map(([boom, qty]) => (
                    <Badge key={boom} variant="secondary" className="bg-white/10 hover:bg-white/20 text-purple-100 border-none px-2.5 py-1 text-xs transition-colors">
                      {boom} <span className="ml-1 text-purple-300 text-[10px]">x{qty}</span>
                    </Badge>
                  ))}
                  {trade.sender_tokens > 0 && (
                    <Badge className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 px-2.5 py-1 text-xs transition-colors">
                      <CoinsIcon className="h-3 w-3 mr-1.5" />
                      {trade.sender_tokens.toLocaleString()}
                    </Badge>
                  )}
                  {Object.keys(trade.sender_booms).length === 0 && trade.sender_tokens === 0 && (
                    <span className="text-gray-500 text-xs italic py-1 px-2">Nothing offered</span>
                  )}
                </div>
              </div>

              {/* Separator / Direction */}
              <div className="flex items-center justify-center p-2">
                <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-600/30 group-hover:bg-purple-600/30 transition-colors">
                  <ArrowRightLeftIcon className="h-5 w-5 text-purple-400 group-hover:rotate-180 transition-transform duration-500" />
                </div>
              </div>

              {/* Party B */}
              <div className="flex-1 space-y-3 md:text-right">
                <div className="flex items-center md:flex-row-reverse gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <UserIcon className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className={`font-bold ${!isIncoming ? "text-purple-400" : "text-white"}`}>
                    {trade.receiver_username}
                  </span>
                  <span className="text-xs text-blue-200 mr-auto md:ml-auto md:mr-0 font-bold tracking-tighter">RECEIVES</span>
                </div>
                <div className="flex flex-wrap md:justify-end gap-1.5 min-h-[2rem]">
                  {Object.entries(trade.receiver_booms).map(([boom, qty]) => (
                    <Badge key={boom} variant="secondary" className="bg-white/10 hover:bg-white/20 text-purple-100 border-none px-2.5 py-1 text-xs transition-colors">
                      {boom} <span className="ml-1 text-blue-300 text-[10px]">x{qty}</span>
                    </Badge>
                  ))}
                  {trade.receiver_tokens > 0 && (
                    <Badge className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 px-2.5 py-1 text-xs transition-colors">
                      <CoinsIcon className="h-3 w-3 mr-1.5" />
                      {trade.receiver_tokens.toLocaleString()}
                    </Badge>
                  )}
                  {Object.keys(trade.receiver_booms).length === 0 && trade.receiver_tokens === 0 && (
                    <span className="text-gray-500 text-xs italic py-1 px-2">Nothing requested</span>
                  )}
                </div>
              </div>
            </div>

            {trade.message && (
              <div className="mt-4 flex items-start gap-2 text-purple-200/80 bg-purple-500/5 p-3 rounded-xl border border-purple-500/10">
                <span className="text-purple-400 mt-0.5">“</span>
                <p className="text-sm italic flex-1 leading-relaxed">{trade.message}</p>
                <span className="text-purple-400 self-end">”</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TradingPage
