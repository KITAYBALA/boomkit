'use client'
import { useEffect, useRef } from 'react'

async function send(body: Record<string, unknown>) {
  const response = await fetch('/api/game-rewards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const result = await response.json().catch(() => null)
  if (!response.ok || !result) throw new Error(result?.error || 'Unable to save game rewards')
  return result
}

export function useGameRewards(questions: { question: string; options: string[] }[], duration: number, sessionPin?:string) {
  const run = useRef<string | null>(null)
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const ordinal = useRef(0)
  const failure = useRef<unknown>(null)
  const finished = useRef<Promise<any> | null>(null)
  useEffect(() => {
    if (run.current) return
    run.current = crypto.randomUUID()
    queue.current = send({ action: 'start', runId: run.current, duration: Math.max(10, Math.min(3600, duration)), questions, sessionPin:sessionPin||undefined })
      .catch(error => { failure.current = error })
  }, [questions, duration])
  const answer = (index: number) => {
    const position = ordinal.current++
    queue.current = queue.current.then(async () => {
      if (failure.current) return
      const body = { action: 'answer', runId: run.current, ordinal: position, answer: index }
      // Retrying the same ordinal is safe even when the first response was lost.
      try { await send(body) } catch { await new Promise(resolve => setTimeout(resolve, 300)); await send(body) }
    }).catch(error => { failure.current = error })
  }
  const finish = () => {
    if (!finished.current) finished.current = queue.current.then(async () => {
      const body = { action: 'finish', runId: run.current }
      try { return await send(body) } catch { return await send(body) }
    })
    return finished.current
  }
  return { answer, finish }
}
