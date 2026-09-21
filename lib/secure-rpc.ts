// Match Supabase's result shape so UI error handling remains consistent.
export async function sessionAction(action: string, params: Record<string, unknown> = {}) {
  try {
    const response = await fetch('/api/game-sessions', { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...params,action}) })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data) return { data:null,error:{message:data?.error || 'Room action failed'} }
    return { data,error:null }
  } catch { return { data:null,error:{message:'Unable to contact room server'} } }
}

export async function communityAction(action: string, params: Record<string, unknown> = {}) {
  const response=await fetch('/api/community',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...params,action})})
  const result=await response.json().catch(()=>null)
  if (!response.ok || !result) throw new Error(result?.error || 'Community request failed')
  return result
}
export async function economyAction(action: string, params: Record<string, unknown> = {}, requestId = crypto.randomUUID()) {
  const body = JSON.stringify({ ...params, action, requestId })
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch('/api/economy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    }).catch(() => null)
    const result = await response?.json().catch(() => null)
    if (response?.ok && result) return result
    if (response && response.status < 500) throw new Error(result?.error || 'Unable to complete action')
  }
  throw new Error('Could not confirm this action. Refresh your balance and inventory before trying again.')
}

export async function updateProfile(targetUserId: string, updates: Record<string, unknown>): Promise<void> {
  const response = await fetch('/api/users/update', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId, updates }),
  })
  const result = await response.json().catch(() => null)
  if (!response.ok || !result?.success) throw new Error(result?.message || 'Unable to update profile')
}

export async function secureRpc(method: string, params: Record<string, unknown> = {}): Promise<{ data: any; error: { message: string; code?: string } | null }> {
  try {
    const response = await fetch('/api/rpc', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method, params }),
    })
    const result = await response.json()
    if (!response.ok) return { data: null, error: result.error || { message: 'Request failed' } }
    return result
  } catch {
    return { data: null, error: { message: 'Unable to contact the server. Please try again.' } }
  }
}
