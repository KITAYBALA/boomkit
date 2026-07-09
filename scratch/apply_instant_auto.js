const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Insert isInstantOpen and isAutoOpen states in BoomkitGame component
const stateTarget = '  const [lobbyActive, setLobbyActive] = useState(false)';
const stateInsertion = `\n  const [isInstantOpen, setIsInstantOpen] = useState(false)
  const [isAutoOpen, setIsAutoOpen] = useState(false)`;

content = content.replace(stateTarget, stateTarget + stateInsertion);

// 2. Insert the useEffect hook for auto pack opening
const hookInsertion = `\n  // Auto Open effect
  useEffect(() => {
    if (packAnimation.show && packAnimation.stage === "done" && isAutoOpen && currentUser) {
      const pack = PACKS.find((p) => p.name === packAnimation.packName)
      if (pack && currentUser.tokens >= pack.price) {
        const autoOpenDelay = isInstantOpen ? 400 : 1000
        const timer = setTimeout(() => {
          closePackAnimation()
          handlePackAction(pack.id)
        }, autoOpenDelay)
        return () => clearTimeout(timer)
      } else if (pack && currentUser.tokens < pack.price) {
        setIsAutoOpen(false)
      }
    }
  }, [packAnimation.stage, isAutoOpen, currentUser?.tokens, isInstantOpen, packAnimation.show, packAnimation.packName])\n`;

// Let's insert this hook right after handlePackAction or in a clean place.
// Let's find: "const handlePackAction = (packId: string) => {"
const handlePackActionIndex = content.indexOf('const handlePackAction = (packId: string) => {');
if (handlePackActionIndex === -1) {
  console.error("Could not find handlePackAction definition in app/page.tsx");
  process.exit(1);
}
content = content.slice(0, handlePackActionIndex) + hookInsertion + content.slice(handlePackActionIndex);

// 3. Update timeouts in openPack to support isInstantOpen
const timeoutsTarget = `    // Stage 2: Burst (after 1.5s)
    setTimeout(() => {
      setPackAnimation((prev) => ({ ...prev, stage: "burst" }))
    }, 1500)

    // Stage 3: Reveal (after 2s)
    setTimeout(() => {
      setPackAnimation((prev) => ({ ...prev, stage: "reveal" }))
    }, 2000)

    // Stage 4: Done (after 2.8s)
    setTimeout(() => {
      setPackAnimation((prev) => ({ ...prev, stage: "done" }))
    }, 2800)`;

const timeoutsReplacement = `    const speedMultiplier = isInstantOpen ? 0.5 : 1

    // Stage 2: Burst
    setTimeout(() => {
      setPackAnimation((prev) => ({ ...prev, stage: "burst" }))
    }, 1500 * speedMultiplier)

    // Stage 3: Reveal
    setTimeout(() => {
      setPackAnimation((prev) => ({ ...prev, stage: "reveal" }))
    }, 2000 * speedMultiplier)

    // Stage 4: Done
    setTimeout(() => {
      setPackAnimation((prev) => ({ ...prev, stage: "done" }))
    }, 2800 * speedMultiplier)`;

content = content.replace(timeoutsTarget, timeoutsReplacement);

// 4. Update the Global Drop Rates banner markup (including the switches and correct rates)
const bannerHeaderTarget = `                {/* Premium Rarity Banner */}
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Global Drop Rates</h3>
                  </div>`;

const bannerHeaderReplacement = `                {/* Premium Rarity Banner */}
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                      <h3 className="text-lg font-black text-white uppercase tracking-widest">Global Drop Rates</h3>
                    </div>
                    
                    {/* Toggles for Instant & Auto Open */}
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={isInstantOpen}
                          onChange={(e) => setIsInstantOpen(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={\`w-10 h-6 rounded-full p-1 transition-colors duration-300 \${isInstantOpen ? 'bg-purple-600' : 'bg-slate-800 border border-white/10'}\`}>
                          <div className={\`w-4 h-4 rounded-full bg-white transition-transform duration-300 \${isInstantOpen ? 'translate-x-4' : 'translate-x-0'}\`} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/70 group-hover:text-white transition-colors">Instant Open (2x)</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={isAutoOpen}
                          onChange={(e) => setIsAutoOpen(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={\`w-10 h-6 rounded-full p-1 transition-colors duration-300 \${isAutoOpen ? 'bg-pink-600' : 'bg-slate-800 border border-white/10'}\`}>
                          <div className={\`w-4 h-4 rounded-full bg-white transition-transform duration-300 \${isAutoOpen ? 'translate-x-4' : 'translate-x-0'}\`} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/70 group-hover:text-white transition-colors">Auto Open</span>
                      </label>
                    </div>
                  </div>`;

content = content.replace(bannerHeaderTarget, bannerHeaderReplacement);

// Update global drop rates mapping array
const bannerArrayTarget = `                    [
                      { label: "Uncommon", rate: "60%", color: "bg-green-500", border: "border-green-500/20", glow: "hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]" },
                      { label: "Rare", rate: "25%", color: "bg-blue-500", border: "border-blue-500/20", glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]" },
                      { label: "Epic", rate: "10%", color: "bg-purple-500", border: "border-purple-500/20", glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]" },
                      { label: "Legendary", rate: "4%", color: "bg-orange-500", border: "border-orange-500/20", glow: "hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] animate-pulse-slow" },
                      { label: "Chroma", rate: "0.9%", color: "bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500", border: "border-pink-500/20", glow: "hover:shadow-[0_0_25px_rgba(236,72,153,0.25)]" },
                      { label: "Mystical", rate: "0.1%", color: "bg-gradient-to-r from-purple-900 via-pink-500 to-indigo-900", border: "border-cyan-500/20", glow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]" },
                    ]`;

const bannerArrayReplacement = `                    [
                      { label: "Uncommon", rate: "60%", color: "bg-green-500", border: "border-green-500/20", glow: "hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]" },
                      { label: "Rare", rate: "30%", color: "bg-blue-500", border: "border-blue-500/20", glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]" },
                      { label: "Epic", rate: "8%", color: "bg-purple-500", border: "border-purple-500/20", glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]" },
                      { label: "Legendary", rate: "1%", color: "bg-orange-500", border: "border-orange-500/20", glow: "hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]" },
                      { label: "Hidden", rate: "0.09%", color: "bg-slate-900 text-slate-100", border: "border-slate-800", glow: "hover:shadow-[0_0_20px_rgba(148,163,184,0.3)] animate-pulse" },
                      { label: "Chroma", rate: "0.9%", color: "bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500", border: "border-pink-500/20", glow: "hover:shadow-[0_0_25px_rgba(236,72,153,0.25)]" },
                      { label: "Mystical", rate: "0.01%", color: "bg-gradient-to-r from-purple-900 via-pink-500 to-indigo-900", border: "border-cyan-500/20", glow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]" },
                    ]`;

content = content.replace(bannerArrayTarget, bannerArrayReplacement);

// 5. Update reveal block backdrop to include "instant-open-active" class
content = content.replace(
  '            className={`fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 overflow-hidden ${packAnimation.stage === "done" ? "cursor-pointer" : "cursor-default"}`}',
  '            className={`fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 overflow-hidden ${isInstantOpen ? "instant-open-active" : ""} ${packAnimation.stage === "done" ? "cursor-pointer" : "cursor-default"}`}'
);

// 6. Update the reveal stage Close/Done indicators to render a "Stop Auto Open" button if isAutoOpen is active
const clickAnywhereTarget = `                  {packAnimation.stage === "done" && (
                    <p className="text-white/30 text-xs font-black uppercase tracking-[0.25em] mt-8 animate-pulse">
                      Click Anywhere to Continue
                    </p>
                  )}`;

const clickAnywhereReplacement = `                  {packAnimation.stage === "done" && (
                    <p className="text-white/30 text-xs font-black uppercase tracking-[0.25em] mt-8 animate-pulse">
                      Click Anywhere to Continue
                    </p>
                  )}
                  {isAutoOpen && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsAutoOpen(false)
                      }}
                      className="mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl border border-red-500/30 shadow-lg shadow-red-950/50 z-20 animate-pulse"
                    >
                      🛑 Stop Auto Open
                    </Button>
                  )}`;

content = content.replace(clickAnywhereTarget, clickAnywhereReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully added Instant & Auto Open switches and correct Global Drop Rates display in app/page.tsx");
