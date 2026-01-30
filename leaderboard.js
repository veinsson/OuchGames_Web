/**
 * Leaderboard Display Script for Ouch Games
 * Add this to any page to show featured speedrunners
 * 
 * Usage:
 * 1. Include Firebase SDK and firebase-config.js
 * 2. Include this script
 * 3. Add a container with id="gameLeaderboard" and data-game="GAME_NAME"
 */

async function loadGameLeaderboard() {
    const container = document.getElementById('gameLeaderboard');
    if (!container) return;
    
    const gameName = container.dataset.game;
    
    // Check if Firebase is configured
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        container.innerHTML = '<p class="leaderboard-empty">Leaderboard coming soon!</p>';
        return;
    }
    
    try {
        // Get all approved/featured submissions for this game
        const snapshot = await firebase.firestore()
            .collection('submissions')
            .where('game', '==', gameName)
            .get();
        
        // Filter for approved or featured status
        const docs = snapshot.docs.filter(doc => {
            const status = doc.data().status;
            return status === 'approved' || status === 'featured';
        });
        
        if (docs.length === 0) {
            container.innerHTML = '<p class="leaderboard-empty">No speedruns yet. Be the first!</p>';
            return;
        }
        
        // Sort by time and get top 5
        const runs = docs
            .map(doc => doc.data())
            .sort((a, b) => a.timeInSeconds - b.timeInSeconds)
            .slice(0, 5);
        
        console.log('Leaderboard runs:', runs);
        
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
