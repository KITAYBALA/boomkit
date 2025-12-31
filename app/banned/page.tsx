"use client"

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Oops 😕</h1>
        <p className="text-white/90 text-lg">You got banned from Boomkit.</p>
      </div>
    </div>
  )
}
