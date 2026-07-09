import type React from "react"
import type { Metadata } from "next"
import { Nunito, Fredoka } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"

const nunito = Nunito({ subsets: ["latin"], variable: "--font-sans" })
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-heading" })

export const metadata: Metadata = {
  title: "Boomkit",
  description: "Created by: system",
  generator: "system",
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
