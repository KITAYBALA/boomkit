"use client"

import { useState, type ReactNode, type CSSProperties, type ComponentType } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { ArrowRight, Camera, Check, Gamepad2, Lock, LogOut, Menu, MessageCircle, Newspaper, Package, Search, Star, X } from "lucide-react"
import { BoomAvatar } from "@/components/boom-avatar"
import { PACKS, type Pack } from "@/lib/economy-catalog"

export type ClubNavItem = { id: string; label: string; group: string; icon: ComponentType<{ className?: string }>; fetch?: () => void }

export function ClubDialog({ title, onClose, theme, accent, children }: { title: string; onClose: () => void; theme: string; accent: string; children: ReactNode }) {
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}><Dialog.Portal><Dialog.Overlay className="club-drawer-overlay" /><Dialog.Content className="clubhouse club-modal" data-theme={theme} style={{ "--club-custom": accent } as CSSProperties} aria-describedby={undefined} onCloseAutoFocus={event => { event.preventDefault(); document.querySelector<HTMLButtonElement>(`[data-settings-action="${title}"]`)?.focus() }}><Dialog.Title className="sr-only">{title}</Dialog.Title>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>
}

export function ClubTokens({ amount, label = false }: { amount: number; label?: boolean }) {
  return <span className="club-tokens"><span className="club-coin" aria-hidden="true">B</span>{amount.toLocaleString()}<span className={label ? "" : "sr-only"}> tokens</span></span>
}

export function ClubSettings({ username, role, joined, badges, theme, accent, onTheme, onAccent, onPassword, onDelete, onPrivacy, onTerms }: {
  username: string; role: string; joined: string; badges: ReactNode; theme: "light" | "dark" | "custom"; accent: string;
  onTheme: (theme: "light" | "dark" | "custom") => void; onAccent: (color: string) => void;
  onPassword: () => void; onDelete: () => void; onPrivacy: () => void; onTerms: () => void
}) {
  const date = new Date(joined)
  const joinedLabel = Number.isNaN(date.getTime()) ? joined : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  return <div className="club-settings">
    <div className="club-page-heading"><div><p className="club-kicker">MAKE YOURSELF AT HOME</p><h1>Your settings.</h1><p>A few ways to make this clubhouse yours.</p></div></div>
    <div className="club-settings-grid">
      <section className="club-panel"><p className="club-kicker">MEMBER DETAILS</p><h2>Your profile</h2><dl className="club-profile-details"><div><dt>Username</dt><dd>{username}</dd></div><div><dt>Role</dt><dd>{role}</dd></div><div><dt>Joined</dt><dd>{joinedLabel || "—"}</dd></div></dl><div className="club-settings-badges">{badges}</div></section>
      <section className="club-panel"><p className="club-kicker">YOUR ACCOUNT</p><h2>Keep it secure.</h2><p>Update your password or manage your account.</p><div className="club-settings-actions"><button className="club-button" data-settings-action="Change password" onClick={onPassword}><Lock size={17} />Change password</button><button className="club-button club-delete" data-settings-action="Delete account" onClick={onDelete}>Delete account</button></div></section>
      <section className="club-panel club-appearance"><p className="club-kicker">PICK YOUR PALETTE</p><h2>Light, dark, or a little you.</h2><p>Change the clubhouse palette any time.</p><div className="club-theme-options">{(["light", "dark"] as const).map(mode => <button key={mode} className="club-theme-choice" aria-pressed={theme === mode} onClick={() => onTheme(mode)}><span className={`club-theme-preview club-theme-preview-${mode}`} aria-hidden="true"><i /><i /><i /></span><span>{mode === "light" ? "Day at the club" : "After hours"}{theme === mode && <Check size={17} />}</span></button>)}</div><div className="club-custom-theme"><label htmlFor="club-accent-color">Custom accent<input id="club-accent-color" type="color" value={accent} onChange={e => { onAccent(e.target.value); onTheme("custom") }} /></label><span>{accent.toUpperCase()}</span><button className="club-button" aria-pressed={theme === "custom"} onClick={() => onTheme("custom")}>Use custom{theme === "custom" && <Check size={16} />}</button></div></section>
      <section className="club-panel"><p className="club-kicker">THE SMALL PRINT</p><h2>Privacy & terms</h2><p>Read how Boomkit handles your information and the terms for playing here.</p><div className="club-settings-links"><button className="club-text-button" data-settings-action="Privacy policy" onClick={onPrivacy}>Privacy policy<ArrowRight size={16} /></button><button className="club-text-button" data-settings-action="Terms of Service" onClick={onTerms}>Terms of Service<ArrowRight size={16} /></button></div></section>
    </div>
  </div>
}

export function ClubSidebar({ items, currentPage, onNavigate, open, onOpenChange, notificationCount, theme, accent }: {
  items: ClubNavItem[]; currentPage: string; onNavigate: (item: ClubNavItem) => void; open: boolean; onOpenChange: (open: boolean) => void; notificationCount: number; theme: string; accent: string
}) {
  const menu = <>
    <button className="club-brand" onClick={() => onNavigate(items[0])}><span aria-hidden="true">b!</span>boomkit.</button>
    <p className="club-sidebar-caption">Your collector’s clubhouse</p>
    <nav aria-label="Clubhouse navigation">
      {["Your club", "Community", "Your account"].map(group => <div className="club-nav-group" key={group}>
        <p>{group}</p>
        {items.filter(item => item.group === group).map(item => <button key={item.id} aria-current={currentPage === item.id ? "page" : undefined} onClick={() => onNavigate(item)}>
          <item.icon className="club-nav-icon" /><span>{item.label}</span>
          {item.id === "chat" && notificationCount > 0 && <span className="club-notification">{notificationCount}<span className="sr-only"> unread messages</span></span>}
        </button>)}
      </div>)}
    </nav>
    <a className="club-discord" href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/uqbPsEpyhE"} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} aria-hidden="true" /><span>Meet us on Discord<small>Keys, codes & good company</small></span><span className="sr-only"> (opens in a new tab)</span></a>
  </>
  return <>
    <aside className="club-sidebar">{menu}</aside>
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal><Dialog.Overlay className="club-drawer-overlay" /><Dialog.Content className="clubhouse club-drawer" data-theme={theme} style={{ "--club-custom": accent } as CSSProperties} onCloseAutoFocus={event => { event.preventDefault(); document.getElementById("club-menu-button")?.focus() }}>
        <Dialog.Title className="sr-only">Clubhouse menu</Dialog.Title><Dialog.Description className="sr-only">Choose a section of Boomkit.</Dialog.Description>
        <Dialog.Close className="club-drawer-close" aria-label="Close menu"><X size={21} /></Dialog.Close>{menu}
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </>
}

export function ClubTopbar({ title, username, tokens, avatar, onMenu, onNews, onAccount, onLogout }: {
  title: string; username: string; tokens: number; avatar: ReactNode; onMenu: () => void; onNews: () => void; onAccount: () => void; onLogout: () => void
}) {
  return <header className="club-topbar">
    <div className="club-topbar-title"><button id="club-menu-button" className="club-icon-button club-menu-button" onClick={onMenu} aria-label="Open menu"><Menu size={22} /></button><span><small>THE CLUBHOUSE</small><strong>{title}</strong></span></div>
    <div className="club-topbar-actions"><ClubTokens amount={tokens} /><button className="club-icon-button" onClick={onNews} aria-label="Read Boomkit news"><Newspaper size={20} /></button><button className="club-account-button" onClick={onAccount}><span aria-hidden="true">{avatar}</span><strong>{username}</strong></button><button className="club-icon-button" onClick={onLogout} aria-label="Log out"><LogOut size={19} /></button></div>
  </header>
}

type OverviewUser = { username: string; tokens: number; level: number; xp: number; loginStreak: number; boomScore: number; packsOpened?: number; games_played: number; nameColor: string }
export function ClubOverview({ user, avatar, role, badges, collectionSize, onAvatar, onProfile, onNavigate, onClaim, spin }: {
  user: OverviewUser | null; avatar: ReactNode; role: string; badges: ReactNode; collectionSize: number; onAvatar: () => void; onProfile: () => void; onNavigate: (page: string) => void; onClaim: () => void; spin: ReactNode
}) {
  const level = user?.level || 1
  const progress = Math.min(100, Math.max(0, (user?.xp || 0) / (level * 100) * 100))
  return <div className="club-overview">
    <section className="club-welcome">
      <div className="club-welcome-copy"><p className="club-kicker">GOOD TO HAVE YOU HERE</p><h1>Hey, {user?.username || "collector"}.</h1><p>A new round, a new pack, a new favorite.<br />What will you add to your collection today?</p><button className="club-button club-primary" onClick={() => onNavigate("discover")}><Gamepad2 size={20} />Let’s play <ArrowRight size={18} /></button></div>
      <div className="club-member-card"><span className="club-kicker">BOOMKIT MEMBER CARD</span><div className="club-member-identity"><button onClick={onAvatar} className="club-member-avatar" aria-label="Change profile picture">{avatar}<span><Camera size={15} /></span></button><div><strong className={user?.nameColor === "rainbow" ? "club-rainbow-name" : ""}>{user?.username}</strong><span>{role}</span><div className="club-member-badges">{badges}</div></div></div><div className="club-level-label"><strong>Level {level}</strong><span>{user?.xp || 0} / {level * 100} XP</span></div><div role="progressbar" aria-label="Level progress" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} className="club-progress"><span style={{ width: `${progress}%` }} /></div><button className="club-text-button" onClick={onProfile}>View full profile <ArrowRight size={15} /></button></div>
    </section>
    <dl className="club-stat-row"><div><dt>Token pouch</dt><dd><ClubTokens amount={user?.tokens || 0} /></dd></div><div><dt>Booms discovered</dt><dd>{collectionSize}<Package size={22} aria-hidden="true" /></dd></div><div><dt>Boom score</dt><dd>{(user?.boomScore || 0).toLocaleString()}<Star size={22} aria-hidden="true" /></dd></div><div><dt>Games played</dt><dd>{(user?.games_played || 0).toLocaleString()}<Gamepad2 size={22} aria-hidden="true" /></dd></div></dl>
    <section className="club-next-stop" aria-label="Pick your next stop"><button onClick={() => onNavigate("market")}><Package size={24} /><span><strong>Visit the pack shelf</strong><small>Find your next surprise.</small></span><ArrowRight size={20} /></button><button onClick={() => onNavigate("booms")}><Star size={24} /><span><strong>Open your Boom book</strong><small>Every favorite, all in one place.</small></span><ArrowRight size={20} /></button><button onClick={() => onNavigate("trading")}><MessageCircle size={24} /><span><strong>Make a trade</strong><small>A new home for your doubles.</small></span><ArrowRight size={20} /></button></section>
    <div className="club-daily-grid"><section className="club-panel club-streak"><div className="club-section-title"><div><p className="club-kicker">A LITTLE EVERY DAY</p><h2>Keep your streak going.</h2></div><span className="club-streak-count">{user?.loginStreak || 0}<small>days</small></span></div><p>Come back daily and claim your token reward.</p><div className="club-streak-days">{[1,2,3,4,5,6,7].map(day => { const streak = user?.loginStreak || 0; const claimed = day <= streak % 7 || (streak > 0 && streak % 7 === 0); return <span key={day} data-claimed={claimed}><small>DAY {day}</small>{claimed ? <Check size={19} aria-label="Claimed" /> : day === 7 ? <Star size={19} aria-label="Bonus day" /> : <span className="club-coin" aria-hidden="true">B</span>}</span> })}</div><button className="club-button club-primary" onClick={onClaim}>Claim streak reward <ArrowRight size={18} /></button><div className="club-streak-rewards"><span><strong>+50</strong> daily</span><span><strong>+500</strong> 7-day bonus</span><span><strong>+5k</strong> 30-day bonus</span></div></section><section className="club-panel club-spin"><div><p className="club-kicker">ONE SPIN, EVERY DAY</p><h2>A turn of good fortune.</h2></div>{spin}</section></div>
  </div>
}

const packColors = ["#d2c4e2", "#b6d9cb", "#b9d7dc", "#ebbf91", "#cbda9c", "#efc5c5"]
export function ClubPackArt({ pack, index = 0 }: { pack: Pack; index?: number }) {
  return <div className="club-pack-art" style={{ "--pack-color": packColors[index % packColors.length] } as CSSProperties} aria-hidden="true"><div className="club-packet"><span>BOOMKIT</span><BoomAvatar name={pack.booms[0]?.name || "Alien"} className="club-pack-avatar" /><strong>{pack.name.replace(" Pack", "")}</strong><i /></div></div>
}

export function ClubMarket({ balance, plus, instant, auto, onInstant, onAuto, chances, onOpen }: {
  balance: number; plus: boolean; instant: boolean; auto: boolean; onInstant: (value: boolean) => void; onAuto: (value: boolean) => void; chances: Record<string, number>; onOpen: (id: string) => void
}) {
  return <div className="club-market"><div className="club-page-heading"><div><p className="club-kicker">FRESH FROM THE SHELF</p><h1>The pack market.</h1><p>Pick a pack. Meet a Boom. Make room for a favorite.</p></div><div className="club-balance"><small>Your token pouch</small><ClubTokens amount={balance} /></div></div>
    <div className="club-market-controls"><div><label><input type="checkbox" checked={instant} onChange={e => onInstant(e.target.checked)} /> Fast reveal</label><label><input type="checkbox" checked={auto} onChange={e => onAuto(e.target.checked)} /> Auto open</label></div><details><summary>Drop rates</summary><dl className="club-rates">{Object.entries(chances).map(([rarity, chance]) => <div key={rarity}><dt className="club-rarity" data-rarity={rarity}>{rarity}</dt><dd>{Number(chance.toFixed(3))}%</dd></div>)}</dl></details></div>
    <div className="club-pack-grid">{PACKS.filter(pack => pack.id !== "plus" || plus).map((pack, index) => <article className="club-market-pack" key={pack.id}><div className="club-pack-labels"><span>Series {pack.series || 1}</span>{pack.isNew && <strong>NEW</strong>}</div><ClubPackArt pack={pack} index={index} /><div className="club-pack-copy"><h2>{pack.name}</h2><p>{pack.booms.length} Booms to discover</p><div><ClubTokens amount={pack.price} /><button className="club-button club-primary" onClick={() => onOpen(pack.id)} disabled={balance < pack.price} aria-label={`Open ${pack.name}`}>Open pack <ArrowRight size={16} /></button></div></div></article>)}</div>
  </div>
}

export function ClubCollection({ booms, level, score, value, packs, rentalSessions, onBoom, onMarket }: {
  booms: Record<string, number>; level: number; score: number; value: number; packs: number; rentalSessions: Record<string, number>; onBoom: (name: string) => void; onMarket: () => void
}) {
  const [query, setQuery] = useState("")
  const [ownedOnly, setOwnedOnly] = useState(false)
  const [packId, setPackId] = useState("all")
  const filtered = PACKS.filter(pack => packId === "all" || packId === pack.id).map(pack => ({ ...pack, booms: pack.booms.filter(boom => boom.name.toLowerCase().includes(query.toLowerCase()) && (!ownedOnly || (booms[boom.name] || 0) > 0)) })).filter(pack => pack.booms.length).sort((a, b) => Number(b.booms.some(boom => (booms[boom.name] || 0) > 0)) - Number(a.booms.some(boom => (booms[boom.name] || 0) > 0)))
  const ownedCount = PACKS.flatMap(pack => pack.booms).filter(boom => (booms[boom.name] || 0) > 0).length
  return <div className="club-collection"><div className="club-page-heading"><div><p className="club-kicker">THE BOOM BOOK</p><h1>Your collection.</h1><p>The favorites you found. The ones still out there.</p></div><button className="club-button" onClick={onMarket}>Find a new Boom <ArrowRight size={17} /></button></div>
    <dl className="club-collection-summary"><div><dt>Discovered</dt><dd>{ownedCount}</dd></div><div><dt>Boom score</dt><dd>{score.toLocaleString()}</dd></div><div><dt>Packs owned</dt><dd>{packs}</dd></div><div><dt>Collection value</dt><dd><ClubTokens amount={value} /></dd></div></dl>
    <div className="club-collection-tools"><label className="club-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Search Booms</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a Boom…" /></label><label><span className="sr-only">Filter by pack</span><select value={packId} onChange={e => setPackId(e.target.value)}><option value="all">All packs</option>{PACKS.map(pack => <option key={pack.id} value={pack.id}>{pack.name}</option>)}</select></label><label className="club-owned-filter"><input type="checkbox" checked={ownedOnly} onChange={e => setOwnedOnly(e.target.checked)} /> Owned only</label></div>
    <div className="club-milestone"><Star size={21} aria-hidden="true" /><span>Level {level}<strong>Next milestone: level {Math.ceil(level / 10) * 10}</strong></span><small>Exclusive Booms unlock as you level up.</small></div>
    {filtered.length === 0 && <div className="club-empty"><Package size={36} /><h2>No Booms found.</h2><p>Try another name or show all Booms.</p><button className="club-button" onClick={() => {setQuery(""); setOwnedOnly(false); setPackId("all")}}>Clear filters</button></div>}
    {filtered.map(pack => <section className="club-book-section" key={pack.id}><div className="club-section-title"><h2>{pack.name}</h2><span>{PACKS.find(p => p.id === pack.id)!.booms.filter(boom => (booms[boom.name] || 0) > 0).length} / {PACKS.find(p => p.id === pack.id)!.booms.length} found</span></div><div className="club-boom-grid">{pack.booms.map(boom => { const owned = (booms[boom.name] || 0) > 0; return <button key={boom.name} className="club-boom-tile" data-owned={owned} data-rarity={boom.rarity} onClick={() => owned && onBoom(boom.name)} disabled={!owned} aria-label={`${boom.name}, ${boom.rarity}, ${owned ? `${booms[boom.name]} owned` : "not discovered"}`}><div className="club-boom-picture">{owned ? <BoomAvatar name={boom.name} className="club-boom-avatar" /> : <Lock size={25} aria-hidden="true" />}{owned && booms[boom.name] > 1 && <span className="club-quantity">×{booms[boom.name]}</span>}{rentalSessions[boom.name] && <span className="club-rental">Rent · {rentalSessions[boom.name]} sessions</span>}</div><strong>{boom.name}</strong><span className="club-rarity" data-rarity={boom.rarity}>{boom.rarity}</span></button> })}</div></section>)}
  </div>
}
