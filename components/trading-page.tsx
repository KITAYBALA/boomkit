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

  const sendTrade = async () => {
    if (!selectedUser) return
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
      alert("Error sending trade: " + error.message)
    } else {
      alert("Trade sent!")
      resetTradeForm()
      setShowNewTrade(false)
    }
  }

  const acceptTrade = async (trade: Trade) => {
    setLoading(true)

    // Get fresh user data
    const { data: senderData } = await supabase.from("users").select("booms, tokens").eq("id", trade.sender_id).single()

    const { data: receiverData } = await supabase
      .from("users")
      .select("booms, tokens")
      .eq("id", trade.receiver_id)
      .single()

    if (!senderData || !receiverData) {
      alert("Error: Could not find users")
      setLoading(false)
      return
    }

    // Check if both parties still have the items
    for (const [boom, qty] of Object.entries(trade.sender_booms)) {
      if ((senderData.booms[boom] || 0) < qty) {
        alert(`Trade failed: ${trade.sender_username} no longer has enough ${boom}`)
        setLoading(false)
        return
      }
    }
    for (const [boom, qty] of Object.entries(trade.receiver_booms)) {
      if ((receiverData.booms[boom] || 0) < qty) {
        alert(`Trade failed: You no longer have enough ${boom}`)
        setLoading(false)
        return
      }
    }
    if (senderData.tokens < trade.sender_tokens) {
      alert(`Trade failed: ${trade.sender_username} no longer has enough tokens`)
      setLoading(false)
      return
    }
    if (receiverData.tokens < trade.receiver_tokens) {
      alert(`Trade failed: You no longer have enough tokens`)
      setLoading(false)
      return
    }

    // Calculate new inventories
    const newSenderBooms = { ...senderData.booms }
    const newReceiverBooms = { ...receiverData.booms }

    // Remove sender's offered booms, add to receiver
    for (const [boom, qty] of Object.entries(trade.sender_booms)) {
      newSenderBooms[boom] = (newSenderBooms[boom] || 0) - qty
      if (newSenderBooms[boom] <= 0) delete newSenderBooms[boom]
      newReceiverBooms[boom] = (newReceiverBooms[boom] || 0) + qty
    }

    // Remove receiver's offered booms, add to sender
    for (const [boom, qty] of Object.entries(trade.receiver_booms)) {
      newReceiverBooms[boom] = (newReceiverBooms[boom] || 0) - qty
      if (newReceiverBooms[boom] <= 0) delete newReceiverBooms[boom]
      newSenderBooms[boom] = (newSenderBooms[boom] || 0) + qty
    }

    // Calculate new token amounts
    const newSenderTokens = senderData.tokens - trade.sender_tokens + trade.receiver_tokens
    const newReceiverTokens = receiverData.tokens - trade.receiver_tokens + trade.sender_tokens

    // Update both users
    await supabase.from("users").update({ booms: newSenderBooms, tokens: newSenderTokens }).eq("id", trade.sender_id)

    await supabase
      .from("users")
      .update({ booms: newReceiverBooms, tokens: newReceiverTokens })
      .eq("id", trade.receiver_id)

    // Update trade status
    await supabase
      .from("trades")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", trade.id)

    setLoading(false)
    alert("Trade accepted!")
    onTradeComplete()
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

  const otherUsers = users.filter((u) => u.id !== currentUser.id)

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ArrowRightLeftIcon className="h-8 w-8" />
            Trading
          </h1>
          <p className="text-purple-200 mt-1">Trade Booms with other players</p>
        </div>
        <Button onClick={() => setShowNewTrade(true)} className="bg-green-500 hover:bg-green-600">
          <PlusIcon className="h-4 w-4 mr-2" />
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
      <div className="flex gap-2">
        <Button
          variant={activeTab === "incoming" ? "default" : "outline"}
          onClick={() => setActiveTab("incoming")}
          className={activeTab === "incoming" ? "bg-purple-600" : ""}
        >
          Incoming ({incomingTrades.length})
        </Button>
        <Button
          variant={activeTab === "outgoing" ? "default" : "outline"}
          onClick={() => setActiveTab("outgoing")}
          className={activeTab === "outgoing" ? "bg-purple-600" : ""}
        >
          Outgoing ({outgoingTrades.length})
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
          className={activeTab === "history" ? "bg-purple-600" : ""}
        >
          History ({historyTrades.length})
        </Button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-purple-500">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ArrowRightLeftIcon className="h-6 w-6" />
                Create New Trade
              </CardTitle>
              <CardDescription className="text-purple-200">Select a player and choose items to trade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Selection */}
              {!selectedUser ? (
                <div>
                  <h3 className="text-white font-medium mb-3">Select a player to trade with:</h3>
                  <div className="mb-4">
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {otherUsers
                      .filter((u) => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((user) => (
                        <Button
                          key={user.id}
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                          className="justify-start"
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          {user.username}
                        </Button>
                      ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-white">
                      Trading with: <span className="font-bold text-purple-400">{selectedUser.username}</span>
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                      Change
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Your Offer */}
                    <div className="space-y-4">
                      <h3 className="text-white font-medium flex items-center gap-2">
                        <PackageIcon className="h-5 w-5 text-green-400" />
                        You Give:
                      </h3>

                      {/* Your Booms */}
                      <div className="bg-white/5 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <p className="text-xs text-purple-300 mb-2">Your Booms (click to add):</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(currentUser.booms || {}).map(([boom, qty]) => (
                            <Badge
                              key={boom}
                              variant="outline"
                              className="cursor-pointer hover:bg-green-500/20"
                              onClick={() => addBoomToOffer(boom)}
                            >
                              {boom} ({qty})
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Offered Booms */}
                      {Object.keys(myOfferedBooms).length > 0 && (
                        <div className="bg-green-500/20 rounded-lg p-3">
                          <p className="text-xs text-green-300 mb-2">Offering:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(myOfferedBooms).map(([boom, qty]) => (
                              <Badge
                                key={boom}
                                className="bg-green-600 cursor-pointer"
                                onClick={() => removeBoomFromOffer(boom)}
                              >
                                {boom} x{qty} <XIcon className="h-3 w-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Token Offer */}
                      <div className="flex items-center gap-2">
                        <CoinsIcon className="h-5 w-5 text-yellow-400" />
                        <Input
                          type="number"
                          min="0"
                          max={currentUser.tokens}
                          value={myOfferedTokens}
                          onChange={(e) => setMyOfferedTokens(Math.min(Number(e.target.value), currentUser.tokens))}
                          className="w-24 bg-white/10 border-white/20 text-white"
                        />
                        <span className="text-purple-300 text-sm">/ {currentUser.tokens} tokens</span>
                      </div>
                    </div>

                    {/* You Request */}
                    <div className="space-y-4">
                      <h3 className="text-white font-medium flex items-center gap-2">
                        <PackageIcon className="h-5 w-5 text-blue-400" />
                        You Receive:
                      </h3>

                      {/* Their Booms */}
                      <div className="bg-white/5 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <p className="text-xs text-purple-300 mb-2">
                          {selectedUser.username}&apos;s Booms (click to request):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(selectedUser.booms || {}).map(([boom, qty]) => (
                            <Badge
                              key={boom}
                              variant="outline"
                              className="cursor-pointer hover:bg-blue-500/20"
                              onClick={() => addBoomToRequest(boom)}
                            >
                              {boom} ({qty})
                            </Badge>
                          ))}
                          {Object.keys(selectedUser.booms || {}).length === 0 && (
                            <span className="text-purple-400 text-sm">No Booms</span>
                          )}
                        </div>
                      </div>

                      {/* Requested Booms */}
                      {Object.keys(theirRequestedBooms).length > 0 && (
                        <div className="bg-blue-500/20 rounded-lg p-3">
                          <p className="text-xs text-blue-300 mb-2">Requesting:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(theirRequestedBooms).map(([boom, qty]) => (
                              <Badge
                                key={boom}
                                className="bg-blue-600 cursor-pointer"
                                onClick={() => removeBoomFromRequest(boom)}
                              >
                                {boom} x{qty} <XIcon className="h-3 w-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Token Request */}
                      <div className="flex items-center gap-2">
                        <CoinsIcon className="h-5 w-5 text-yellow-400" />
                        <Input
                          type="number"
                          min="0"
                          max={selectedUser.tokens}
                          value={theirRequestedTokens}
                          onChange={(e) =>
                            setTheirRequestedTokens(Math.min(Number(e.target.value), selectedUser.tokens))
                          }
                          className="w-24 bg-white/10 border-white/20 text-white"
                        />
                        <span className="text-purple-300 text-sm">/ {selectedUser.tokens} tokens</span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-white text-sm mb-2 block">Message (optional):</label>
                    <Textarea
                      value={tradeMessage}
                      onChange={(e) => setTradeMessage(e.target.value)}
                      placeholder="Add a message to your trade offer..."
                      className="bg-white/10 border-white/20 text-white"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetTradeForm()
                    setShowNewTrade(false)
                  }}
                >
                  Cancel
                </Button>
                {selectedUser && (
                  <Button onClick={sendTrade} disabled={loading} className="bg-green-500 hover:bg-green-600">
                    <SendIcon className="h-4 w-4 mr-2" />
                    Send Trade
                  </Button>
                )}
              </div>
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
    <Card className="bg-white/10 border-white/20">
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={statusColors[trade.status]}>
                {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
              </Badge>
              <span className="text-purple-200 text-sm flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {new Date(trade.created_at).toLocaleDateString()}
              </span>
            </div>

            <p className="text-white mb-2">
              {isIncoming ? (
                <>
                  <span className="text-purple-400 font-medium">{trade.sender_username}</span>
                  {" wants to trade with you"}
                </>
              ) : (
                <>
                  {"Trade offer to "}
                  <span className="text-purple-400 font-medium">{trade.receiver_username}</span>
                </>
              )}
            </p>

            {trade.message && <p className="text-purple-300 text-sm italic mb-2">&quot;{trade.message}&quot;</p>}

            <div className="grid md:grid-cols-2 gap-4 mt-3">
              {/* Sender gives */}
              <div className="bg-green-500/10 rounded p-2">
                <p className="text-green-400 text-xs mb-1">{trade.sender_username} gives:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(trade.sender_booms).map(([boom, qty]) => (
                    <Badge key={boom} variant="outline" className="text-xs">
                      {boom} x{qty}
                    </Badge>
                  ))}
                  {trade.sender_tokens > 0 && (
                    <Badge className="bg-yellow-600 text-xs">
                      <CoinsIcon className="h-3 w-3 mr-1" />
                      {trade.sender_tokens}
                    </Badge>
                  )}
                  {Object.keys(trade.sender_booms).length === 0 && trade.sender_tokens === 0 && (
                    <span className="text-gray-400 text-xs">Nothing</span>
                  )}
                </div>
              </div>

              {/* Receiver gives */}
              <div className="bg-blue-500/10 rounded p-2">
                <p className="text-blue-400 text-xs mb-1">{trade.receiver_username} gives:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(trade.receiver_booms).map(([boom, qty]) => (
                    <Badge key={boom} variant="outline" className="text-xs">
                      {boom} x{qty}
                    </Badge>
                  ))}
                  {trade.receiver_tokens > 0 && (
                    <Badge className="bg-yellow-600 text-xs">
                      <CoinsIcon className="h-3 w-3 mr-1" />
                      {trade.receiver_tokens}
                    </Badge>
                  )}
                  {Object.keys(trade.receiver_booms).length === 0 && trade.receiver_tokens === 0 && (
                    <span className="text-gray-400 text-xs">Nothing</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isPending && (
            <div className="flex gap-2 ml-4">
              {isIncoming && onAccept && onDecline && (
                <>
                  <Button size="sm" onClick={onAccept} disabled={loading} className="bg-green-500 hover:bg-green-600">
                    <CheckIcon className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={onDecline} disabled={loading}>
                    <XIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
              {!isIncoming && onCancel && (
                <Button size="sm" variant="outline" onClick={onCancel} disabled={loading}>
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TradingPage
