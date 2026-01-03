"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const username = searchParams.get("username") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [usernameInput, setUsernameInput] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!password || !confirmPassword) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      const finalUsername = username || usernameInput
      if (!finalUsername) {
        setError("Username is required")
        setLoading(false)
        return
      }

      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: finalUsername,
          password: password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to set password. Please try again.")
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/?view=login")
      }, 2000)
    } catch (error) {
      console.error("Reset password error:", error)
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-4">
              <p className="text-green-600 mb-4">Password reset successful!</p>
              <p className="text-sm text-gray-600">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {username && (
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={username} disabled className="bg-gray-100" />
                </div>
              )}
              {!username && (
                <div>
                  <Label htmlFor="usernameInput">Username</Label>
                  <Input
                    id="usernameInput"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter your username"
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Setting Password..." : "Reset Password"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => router.push("/?view=login")}
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

