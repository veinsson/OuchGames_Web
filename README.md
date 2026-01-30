# Ouch Games - Official Website

Official website for **Ouch Games** - An indie horror studio creating immersive horror experiences in UEFN (Unreal Editor for Fortnite).

## 🌐 Live Site

**[ouchuefn.com](https://ouchuefn.com)**

## About

Ouch Games specializes in psychological horror experiences with:
- **155M+** minutes played
- **557K+** favorites  
- **95.6K** followers
- **10 published horror games**

## Featured Games

### Original Horror Collection
- **DISTURBED** - Arctic research station gone wrong
- **SANITY** - Psychological nightmare
- **EVICTED** - Haunted apartment escape
- **HOMELESS** - Urban survival horror
- **TRAUMA** - Mind-bending terror
- **RITUAL** - Occult investigation

### New Releases
- **BELOW** - Deep sea drilling horror *(Epic Picked Soon)*
- **DUMMY** - Mannequin factory nightmare
- **MENTAL** - Forest survival horror
- **SNEAKY SNIPERS** - PvP sniper action

### Coming Soon
- **[CLASSIFIED]** - Extraction horror with procedural generation, adaptive AI, and persistent progression *(ETA: 2025)*

## Features

- 🏆 **Speedrun Leaderboards** - Firebase-powered submission system with admin verification
- 📊 **Live Player Counts** - Real-time players across all games
- 🎮 **Direct Play Links** - One-click access to all games
- 📱 **Fully Responsive** - Optimized for all devices
- 🌙 **Dark Horror Theme** - Purple neon aesthetic
- 🔥 **Firebase Integration** - Secure leaderboard backend

## Tech Stack

- HTML5, CSS3, JavaScript
- Firebase (Firestore, Authentication)
- GitHub Pages hosting
- Custom domain via Cloudflare

## Connect

- [X / Twitter](https://x.com/OuchUEFN)
- [YouTube](https://www.youtube.com/@OuchUEFN)
- [Discord](https://discord.com/invite/hk5a7snQHt)
- [Fortnite Creator Profile](https://www.fortnite.com/@ouch)

---

© 2026 Ouch Games. All rights reserved.


### Adding New Games

Edit `index.html` and add a new game card in the games-grid section:

```html
<div class="game-card" data-island="XXXX-XXXX-XXXX">
    <div class="game-image newgame"></div>
    <div class="game-info">
        <h3 class="game-title">NEW GAME</h3>
        <div class="game-stats">
            <span class="playing"><span class="live-dot"></span><span class="player-count" data-game="newgame">0</span> playing</span>
            <span class="peak">XXX peak</span>
        </div>
        <div class="game-code">XXXX-XXXX-XXXX</div>
        <a href="https://www.fortnite.com/play/island/XXXX-XXXX-XXXX?lang=en-US" target="_blank" class="btn btn-play">
            <span>▶</span> PLAY NOW
        </a>
    </div>
</div>
```

Then add the island code to `script.js`:

```javascript
const islands = {
    // ... existing games
    newgame: 'XXXX-XXXX-XXXX'
};
```

### Updating Stats

Edit the stats values in `index.html` in the stats-bar section.

### Changing Colors

Edit `styles.css` and modify the CSS variables at the top:

```css
:root {
    --accent-red: #ff3333;      /* Main accent color */
    --bg-primary: #0a0a0a;      /* Background color */
    /* etc. */
}
```

## File Structure

```
ouchgames-web/
├── index.html      # Main HTML file
├── styles.css      # All styling
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Live Player Count Note

The current implementation simulates player counts with realistic fluctuating values. To get actual live data, you would need to:

1. Use fortnite.gg's unofficial API (if available)
2. Set up a backend proxy to fetch data
3. Use Epic Games' official API (requires developer access)

---

© 2026 Ouch Games. All horror experiences reserved.
