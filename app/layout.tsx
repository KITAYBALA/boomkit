import type React from "react"
import type { Metadata } from "next"
import { Nunito, Fredoka } from "next/font/google"
import "./globals.css"
import "./clubhouse.css"
import { Toaster } from "sonner"

const nunito = Nunito({ subsets: ["latin"], variable: "--font-sans" })
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-heading" })

export const metadata: Metadata = {
  title: "Boomkit",
  description: "Play quizzes, collect Booms, and trade with the Boomkit community.",
  icons: {
    icon: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${fredoka.variable} font-sans bg-background`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
