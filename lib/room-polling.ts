import { sessionAction } from './secure-rpc'

export function pollRoom(pin:string, receive:(room:any)=>void) {
  let active=true, busy=false
  const poll=async()=>{
    if (busy) return
    busy=true
    try {
      const {data,error}=await sessionAction('read',{pin})
      if (active && !error && data) receive(data)
    } finally { busy=false }
  }
  void poll()
  const timer=setInterval(poll,2000)
  return ()=>{active=false;clearInterval(timer)}
}
