/**
 * Leaderboard Display Script for Ouch Games
 * Add this to any page to show featured speedrunners
 * 
 * Usage:
 * 1. Include Firebase SDK and firebase-config.js
 * 2. Include this script
 * 3. Add a container with id="gameLeaderboard" and data-game="GAME_NAME"
 *    OR call loadGameLeaderboard('GAME_NAME') manually
 */

async function loadGameLeaderboard(gameName) {
    // Support both old and new calling patterns
    let container, game;
    
    if (gameName) {
        // Called with game name parameter - find any leaderboard container
        container = document.getElementById('leaderboardList') || document.getElementById('gameLeaderboard');
        game = gameName;
    } else {
        // Legacy: Look for container with data-game attribute
        container = document.getElementById('gameLeaderboard');
        if (!container) return;
        game = container.dataset.game;
    }
    
    if (!container) return;
    
    // Check if Firebase is configured
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        container.innerHTML = '<p class="leaderboard-empty">Leaderboard coming soon!</p>';
        return;
    }
    
    try {
        // Get all submissions and filter in JS to avoid needing composite index
        const snapshot = await firebase.firestore()
            .collection('submissions')
            .get();
        
        // Filter for this game and approved/featured status
        const runs = snapshot.docs
            .map(doc => doc.data())
            .filter(run => {
                const matchesGame = run.game === game;
                const isApproved = run.status === 'approved' || run.status === 'featured';
                return matchesGame && isApproved;
            })
            .sort((a, b) => (a.timeInSeconds || 9999) - (b.timeInSeconds || 9999))
            .slice(0, 5);
        
        console.log('Leaderboard runs for', game, ':', runs);
        
        if (runs.length === 0) {
            container.innerHTML = '<p class="leaderboard-empty">No speedruns yet. Be the first!</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="leaderboard-list">
                ${runs.map((run, i) => `
                    <div class="leaderboard-entry ${i === 0 ? 'first-place' : ''}">
                        <span class="leaderboard-rank">${i === 0 ? '👑' : '#' + (i + 1)}</span>
                        <span class="leaderboard-player">${escapeHtml(run.epicUsername || run.username || 'Unknown')}</span>
                        <span class="leaderboard-time">${run.time || '--:--'}</span>
                    </div>
                `).join('')}
            </div>
            <a href="/submit-time" class="btn btn-tertiary btn-sm leaderboard-submit">Submit Your Time</a>
        `;
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        container.innerHTML = '<p class="leaderboard-empty">Leaderboard coming soon!</p>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGameLeaderboard);
} else {
    loadGameLeaderboard();
}
