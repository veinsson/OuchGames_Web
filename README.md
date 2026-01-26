# Ouch Games - Website

Ouch Games official website.

## Features

- 🎮 **Live Player Counts** - Shows current players across all Ouch games
- 👻 **SEALED Teaser Section** - Mysterious upcoming project reveal
- 🎯 **Game Cards** - All horror games with direct Fortnite play links
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 🌙 **Dark Theme** - Horror-appropriate dark aesthetic
- ✨ **Animations** - Smooth scroll, hover effects, and glitch animations

## Games Included

| Game | Island Code | Play Link |
|------|-------------|-----------|
| DISTURBED | 3475-9207-2052 | [Play](https://www.fortnite.com/play/island/3475-9207-2052?lang=en-US) |
| SANITY | 0555-4316-6085 | [Play](https://www.fortnite.com/play/island/0555-4316-6085?lang=en-US) |
| EVICTED | 9694-9799-9090 | [Play](https://www.fortnite.com/play/island/9694-9799-9090?lang=en-US) |
| HOMELESS | 4095-6376-8788 | [Play](https://www.fortnite.com/play/island/4095-6376-8788?lang=en-US) |
| TRAUMA | 8985-1891-2904 | [Play](https://www.fortnite.com/play/island/8985-1891-2904?lang=en-US) |
| RITUAL | 1376-4468-8766 | [Play](https://www.fortnite.com/play/island/1376-4468-8766?lang=en-US) |

## Social Links

- [X / Twitter](https://x.com/OuchUEFN)
- [YouTube](https://www.youtube.com/@OuchUEFN)
- [Discord](https://discord.com/invite/hk5a7snQHt)
- [Fortnite.gg](https://fortnite.gg/creator?name=ouch)
- [Fortnite Creator Page](https://www.fortnite.com/@ouch)

## Customization

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

---

© 2026 Ouch Games. All horror experiences reserved.

