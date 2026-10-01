"use client"

import { useEffect, useRef, type FormEvent, type Dispatch, type SetStateAction } from "react"
import { ArrowRight, Gamepad2, MessageCircle, Package, Repeat2, Star, Ticket } from "lucide-react"
import { BoomAvatar } from "@/components/boom-avatar"
import { PACKS } from "@/lib/economy-catalog"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import s from "./public-lobby.module.css"

type View = "owner-access" | "login" | "register"
type Registration = { email: string; username: string; password: string; age: string; reason: string; accessKey: string }
type Login = { username: string; password: string }
type Props = {
  view: View
  onNavigate: (view: View) => void
  loginForm: Login
  setLoginForm: Dispatch<SetStateAction<Login>>
  registerForm: Registration
  setRegisterForm: Dispatch<SetStateAction<Registration>>
  onLogin: (event: FormEvent) => void
  onRegister: (event: FormEvent) => void
  busy: boolean
  error: string | null
  tosAccepted: boolean
  setTosAccepted: (accepted: boolean) => void
}

const invite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/uqbPsEpyhE"
const shelf = ["space", "aquatic", "breakfast", "dino"].map(id => PACKS.find(pack => pack.id === id)!)
const characters = ["Alien", "Octopus", "Pancake", "Triceratops"]

function Token({ amount }: { amount: number }) {
  return <span className={s.tokens}><span className={s.coin} aria-hidden="true">B</span>{amount} <span className={s.srOnly}>tokens</span></span>
}

function Collection({ compact = false }: { compact?: boolean }) {
  return <div className={`${s.collection} ${compact ? s.compact : ""}`}>
    <div className={s.collectionHeading}><span>THE BOOM BOOK</span><Star size={18} aria-hidden="true" /></div>
    <div className={s.characterGrid}>
      {[{ name: "Alien", rarity: "Uncommon" }, { name: "Octopus", rarity: "Rare" }, { name: "Pancake", rarity: "Uncommon" }, { name: "Triceratops", rarity: "Uncommon" }].map((boom, index) =>
        <div className={s.character} key={boom.name} data-tone={index}>
          <div aria-hidden="true"><BoomAvatar name={boom.name} className={s.avatar} /></div>
          <strong>{boom.name}</strong><span>{boom.rarity}</span>
        </div>)}
    </div>
    <div className={s.collectionCaption}><span>A few faces from the collection</span><span aria-hidden="true">✦</span></div>
  </div>
}

export default function PublicLobby(props: Props) {
  const { view, onNavigate, loginForm, setLoginForm, registerForm, setRegisterForm, busy, error, tosAccepted, setTosAccepted } = props
  const isHome = view === "owner-access"
  const isRegister = view === "register"
  const heading = useRef<HTMLHeadingElement>(null)
  const previousView = useRef(view)
  useEffect(() => {
    if (previousView.current !== view) {
      heading.current?.focus()
      window.scrollTo(0, 0)
      previousView.current = view
    }
  }, [view])

  return <div className={s.site}>
    <a className={s.skipLink} href="#lobby-main">Skip to content</a>
    <header className={s.header}>
      <div className={s.navInner}>
        <button className={s.brand} onClick={() => onNavigate("owner-access")} aria-label="Boomkit home"><span className={s.brandMark} aria-hidden="true">b!</span>boomkit<span className={s.brandDot}>.</span></button>
        <nav className={s.navigation} aria-label="Main navigation">
          <a className={s.communityLink} href={invite} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Community <span className={s.srOnly}>(opens in a new tab)</span></a>
          <button className={s.navLogin} aria-current={view === "login" ? "page" : undefined} onClick={() => onNavigate("login")}>Log in</button>
          <button className={s.smallButton} aria-current={isRegister ? "page" : undefined} onClick={() => onNavigate("register")}>Join the club <ArrowRight size={17} aria-hidden="true" /></button>
        </nav>
      </div>
    </header>

    <main id="lobby-main" className={s.main}>
      {isHome ? <>
        <section className={s.hero} aria-labelledby="lobby-title">
          <div className={s.heroCopy}>
            <p className={s.eyebrow}><span aria-hidden="true">✦</span> A HOME FOR COLLECTORS</p>
            <h1 id="lobby-title" ref={heading} tabIndex={-1}>Small Booms.<br /><span>Big collection.</span></h1>
            <p className={s.intro}>Play a round. Crack a pack. Find your next favorite.<br className={s.desktopBreak} /> Welcome to your little corner of Boomkit.</p>
            <div className={s.heroActions}><button className={s.primaryButton} onClick={() => onNavigate("register")}>Start collecting <ArrowRight size={21} aria-hidden="true" /></button><button className={s.textButton} onClick={() => onNavigate("login")}>Already a member? Log in</button></div>
            <p className={s.accessNote}><Ticket size={17} aria-hidden="true" /> Bring your Discord access key to join.</p>
          </div>
          <div className={s.heroArt}><div className={s.sticker}>Meet your<br />next favorites!</div><Collection /></div>
        </section>

        <section className={s.packSection} aria-labelledby="pack-heading">
          <div className={s.sectionHeading}><div><p className={s.eyebrow}>FRESH FROM THE SHELF</p><h2 id="pack-heading">Pick your kind of pack.</h2></div><span className={s.shelfNote}>A peek inside the market</span></div>
          <div className={s.packGrid}>{shelf.map((pack, index) => <article className={s.packCard} key={pack.id} data-tone={index}>
            <div className={s.packArt} aria-hidden="true"><div className={s.packet}><span>BOOMKIT</span><BoomAvatar name={characters[index]} className={s.packAvatar} /><strong>{pack.name.replace(" Pack", "").toUpperCase()}</strong><span className={s.packetSeal} /></div></div>
            <div className={s.packInfo}><h3>{pack.name}</h3><Token amount={pack.price} /></div>
            <p>{pack.booms.length} Booms to discover</p>
          </article>)}</div>
          <p className={s.packFootnote}>Earn tokens through play. Open packs in the market once you’re signed in.</p>
        </section>

        <section className={s.clubStrip} aria-label="Around the club">
          <div><Gamepad2 aria-hidden="true" /><h3>Play for the fun of it.</h3><p>Jump into quizzes and earn tokens along the way.</p></div>
          <div><Repeat2 aria-hidden="true" /><h3>Make a good trade.</h3><p>Swap Booms with other collectors and grow your collection.</p></div>
          <a href={invite} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" /><h3>Find your people. <ArrowRight size={19} aria-hidden="true" /></h3><p>Hang out with the community on Discord.<span className={s.srOnly}> Opens in a new tab.</span></p></a>
        </section>
      </> : <section className={s.authLayout} aria-labelledby="auth-title">
        <aside className={s.authAside}>
          <p className={s.eyebrow}>YOUR COLLECTION STARTS HERE</p>
          <h2>A little luck.<br />A lot to collect.</h2>
          <Collection compact />
          <p>From your first pack to that one missing Boom.<br />There’s always something to come back for.</p>
        </aside>
        <div className={s.formPanel}>
          <div className={s.formTop}><Package size={20} aria-hidden="true" /><span>BOOMKIT MEMBERS CLUB</span></div>
          <div className={s.formBody}>
            <h1 id="auth-title" ref={heading} tabIndex={-1}>{isRegister ? "Save your spot." : "Hey, welcome back."}</h1>
            <p className={s.formIntro}>{isRegister ? "A new name. A fresh collection. Let’s get you in." : "Your Booms are right where you left them."}</p>
            {isRegister && <div className={s.keyNotice}><Ticket size={23} aria-hidden="true" /><p><strong>Got your access key?</strong><br />Join our <a href={invite} target="_blank" rel="noopener noreferrer">Discord server<span className={s.srOnly}> (opens in a new tab)</span></a> and use <code>/getkey</code> to get one.</p></div>}
            <form onSubmit={isRegister ? props.onRegister : props.onLogin} aria-busy={busy}>
              <div className={s.field}><label htmlFor="club-username">Username</label><input id="club-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={isRegister ? registerForm.username : loginForm.username} onChange={e => isRegister ? setRegisterForm(prev => ({ ...prev, username: e.target.value })) : setLoginForm(prev => ({ ...prev, username: e.target.value }))} placeholder={isRegister ? "Choose your player name" : "Your player name"} /></div>
              <div className={s.field}><label htmlFor="club-password">Password</label><input id="club-password" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 8 : undefined} value={isRegister ? registerForm.password : loginForm.password} onChange={e => isRegister ? setRegisterForm(prev => ({ ...prev, password: e.target.value })) : setLoginForm(prev => ({ ...prev, password: e.target.value }))} aria-describedby={isRegister ? "password-hint" : undefined} placeholder={isRegister ? "Make it a good one" : "Your password"} />{isRegister && <small id="password-hint">At least 8 characters.</small>}</div>
              {isRegister && <>
                <div className={s.fieldRow}>
                  <div className={s.field}><label htmlFor="club-age">Age <span>(13+)</span></label><input id="club-age" name="age" type="number" min="13" required value={registerForm.age} onChange={e => setRegisterForm(prev => ({ ...prev, age: e.target.value }))} placeholder="Your age" /></div>
                  <div className={s.field}><label htmlFor="club-key">Discord access key</label><input id="club-key" name="accessKey" autoCapitalize="none" spellCheck={false} required value={registerForm.accessKey} onChange={e => setRegisterForm(prev => ({ ...prev, accessKey: e.target.value }))} placeholder="BK-KEY-…" /></div>
                </div>
                <div className={s.field}><label htmlFor="club-reason">Why would you like to join?</label><textarea id="club-reason" name="reason" required value={registerForm.reason} onChange={e => setRegisterForm(prev => ({ ...prev, reason: e.target.value }))} placeholder="Tell us a little about why you’re here…" rows={2} /></div>
                <div className={s.terms}><input id="club-terms" type="checkbox" checked={tosAccepted} onChange={e => setTosAccepted(e.target.checked)} /><label htmlFor="club-terms">I accept the</label><Dialog><DialogTrigger asChild><button type="button" className={s.inlineLink}>Terms of Service</button></DialogTrigger><DialogContent className={s.termsDialog}><DialogTitle>Terms of Service</DialogTitle><DialogDescription>Our club rules. Last updated: January 2026.</DialogDescription><ol><li><strong>Respect Required:</strong> Treat all players with kindness. No bullying, hate speech, or harassment.</li><li><strong>No Cheating:</strong> Using bots, scripts, or unfair advantages will result in an immediate ban.</li><li><strong>Safety First:</strong> Do not share personal information (real name, address, phone number) in public chats.</li><li><strong>Appropriate Content:</strong> No inappropriate language or themes. This is a game for everyone.</li><li><strong>Account Responsibility:</strong> You are responsible for your account security. Do not share your password.</li></ol></DialogContent></Dialog></div>
              </>}
              {error && <p className={s.error} role="alert">{error}</p>}
              <button className={s.submitButton} type="submit" disabled={busy || (isRegister && !tosAccepted)}>{busy ? "Please wait…" : isRegister ? "Create account" : "Let’s go"}{!busy && <ArrowRight size={20} aria-hidden="true" />}</button>
            </form>
            <p className={s.switchView}>{isRegister ? "Already in the club?" : "New around here?"} <button className={s.inlineLink} onClick={() => onNavigate(isRegister ? "login" : "register")}>{isRegister ? "Log in" : "Create an account"}</button></p>
            {!isRegister && <p className={s.loginHelp}>Need a hand? Find the community on <a href={invite} target="_blank" rel="noopener noreferrer">Discord<span className={s.srOnly}> (opens in a new tab)</span></a>.</p>}
          </div>
        </div>
      </section>}
    </main>
    <footer className={s.footer}><span className={s.footerBrand}>boomkit.</span><p>Collect a little. Stay a while.</p><span>© 2026 Boomkit</span></footer>
  </div>
}
