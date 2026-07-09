const fs = require('fs');

const originalText = `## 🚀 BOOMKIT UPDATE CHANGELOG 🚀

Hey @everyone! A brand new game client update is now LIVE on Boomkit! We've overhauled the avatar selection, optimized inventory layouts, added a premium custom notification system, and synced avatars everywhere.

Here is what's new in this deployment:

---

### 👤 AVATAR OVERHAUL & MY BOOMS PORTRAIT
* **Owned Booms as Profile Pictures:** You are no longer restricted to just classic emojis! You can now set any Boom you own from your collection as your main profile avatar.
* **Custom Profile Selector Tab:** Open the avatar picker to find two tabs:
  * 🌟 **Emojis:** Your classic emoji collection.
  * 📦 **My Booms:** Shows all the unique Booms currently in your inventory.
* **Active Progression Syncing:** Equipping a Boom as your profile picture automatically designates it as your active Boom, allowing it to earn XP and level up as you play live games!
* **Showcase Cleanup:** We deleted the redundant "Showcase Boom" display to keep player profile cards clean, sleek, and focused on core stats.

---

### 📡 CYBERPUNK MODAL NOTIFICATIONS (ALERTS UPGRADE)
* We have **completely replaced** the basic, outdated browser alert dialog popups with custom, fully-styled in-game modal cards!
* **Harmonious Neon Glows:**
  * 🎉 **System Success:** Emerald green glows for wins, unlocks, claims, and successful crafting.
  * ⚠️ **System Alert:** Crimson red glows for errors, mute warnings, and insufficient balance alerts.
* **Motion & Animations:** Smooth entry transitions and holographic grid effects.

---

### 👑 SYSTEM OWNER AUTOPILOT
* **OG Pack Auto-Grant:** Owners no longer need to execute manual commands or database updates. The system now automatically detects users with the \`Owner\` role on login and populates their inventories with **999 copies of each OG Pack Boom**!

---

### 🎨 UNIVERSAL AVATAR RENDERING
* Custom Boom avatars are now synced and render dynamically across all gameplay screens:
  * 💬 **Global & Private Chat**
  * 🏆 **Podium & Leaderboard Lists**
  * 🎮 **Live Game Lobbies**

---

👉 **Join the game and select your new Boom profile picture now!**
🔗 https://boomkit.org`;

console.log("Original text length:", originalText.length);

const proposedText = `## 🚀 BOOMKIT UPDATE CHANGELOG 🚀

Hey @everyone! A brand new update is now LIVE on Boomkit! We've overhauled avatar selection, optimized profiles, added premium custom notifications, and synced avatars everywhere.

Here is what's new in this deployment:

---

### 👤 PROFILE OVERHAUL & AVATAR SYNC
* **Owned Booms as Avatars:** You can now set any Boom you own from your collection as your profile picture instead of just emojis!
* **Custom Tabbed Picker:** Select your avatar via two new tabs:
  * 🌟 **Emojis:** Your classic emoji collection.
  * 📦 **My Booms:** Shows all unique Booms in your inventory.
* **Active Progression Syncing:** Equipping a Boom as your profile picture automatically sets it as your active Boom, allowing it to earn XP and level up during live games!
* **Showcase Deletion:** Removed the redundant "Showcase Boom" display to keep profiles clean and focused on core stats.

---

### 📡 CYBERPUNK MODAL NOTIFICATIONS
* Replaced basic browser alert popups with fully-styled, in-game modal cards!
* **Harmonious Neon Glows:**
  * 🎉 **System Success:** Emerald green glows for wins, unlocks, claims, and crafting.
  * ⚠️ **System Alert:** Crimson red glows for errors, mutes, and warning alerts.
* **Aesthetics:** Smooth entry transitions and holographic grid effects.

---

### 👑 OWNER AUTOPILOT
* **OG Pack Auto-Grant:** Owners no longer need manual updates. The system automatically detects the \`Owner\` role on login and populates their inventories with **999 copies of each OG Pack Boom**!

---

### 🎨 UNIVERSAL RENDERING
* Custom Boom avatars now render dynamically across:
  * 💬 **Global & Private Chat**
  * 🏆 **Podium & Leaderboard Lists**
  * 🎮 **Live Game Lobbies**

---

👉 **Join the game and select your new Boom profile picture now!**
🔗 https://boomkit.org`;

console.log("Proposed text length:", proposedText.length);
console.log("Difference:", originalText.length - proposedText.length);
