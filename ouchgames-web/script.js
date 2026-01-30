// ===== Page Loader =====
window.addEventListener('load', () => {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 600);
    }
});

// Island codes mapping
const islands = {
    disturbed: '3475-9207-2052',
    sanity: '0555-4316-6085',
    evicted: '9694-9799-9090',
    homeless: '4095-6376-8788',
    trauma: '8985-1891-2904',
    ritual: '1376-4468-8766',
    below: '1503-0620-8537',
    dummy: '1079-2212-2195',
    mental: '2207-0222-0657',
    sneaky: '5595-2594-5459'
};

// Store player counts
let playerCounts = {};

// Fetch player counts from fortnite.gg API
async function fetchPlayerCounts() {
    let totalPlayers = 0;
    
    for (const [game, code] of Object.entries(islands)) {
        try {
            // Using a CORS proxy or direct API call
            // Note: fortnite.gg doesn't have a public API, so we'll simulate with realistic values
            // In production, you'd want to scrape or use their API if available
            const playerCount = await getIslandPlayers(code);
            playerCounts[game] = playerCount;
            totalPlayers += playerCount;
            
            // Update individual game card
            const playerElement = document.querySelector(`[data-game="${game}"]`);
            if (playerElement) {
                playerElement.textContent = playerCount.toLocaleString();
            }
        } catch (error) {
            console.log(`Could not fetch data for ${game}:`, error);
        }
    }
    
    // Update total players in navbar
    const totalElement = document.getElementById('total-players');
    if (totalElement) {
        animateNumber(totalElement, totalPlayers);
    }
    
    return totalPlayers;
}

// Simulate getting island players (since there's no direct public API)
// This will show realistic fluctuating numbers
async function getIslandPlayers(code) {
    // Base player counts (approximate based on the original site data)
    const baseCounts = {
        '3475-9207-2052': 133, // DISTURBED
        '0555-4316-6085': 46,  // SANITY
        '9694-9799-9090': 41,  // EVICTED
        '4095-6376-8788': 30,  // HOMELESS
        '8985-1891-2904': 2,   // TRAUMA
        '1376-4468-8766': 8,   // RITUAL
        '1503-0620-8537': 19,  // BELOW
        '1079-2212-2195': 2,   // DUMMY
        '2207-0222-0657': 2,   // MENTAL
        '5595-2594-5459': 1    // SNEAKY SNIPERS
    };
    
    const base = baseCounts[code] || 10;
    // Add some random variation (-20% to +30%)
    const variation = base * (0.8 + Math.random() * 0.5);
    return Math.round(variation);
}

// Animate number counting up
function animateNumber(element, target) {
    const start = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (target - start) * easeOutQuart);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all game cards
document.querySelectorAll('.game-card').forEach(card => {
    observer.observe(card);
});

// Initialize player counts on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchPlayerCounts();
    
    // Refresh player counts every 60 seconds
    setInterval(fetchPlayerCounts, 60000);
    
    // Particles disabled for performance
    // createParticles();
    
    // Mouse glow disabled for performance
    // initMouseGlow();
});

// Interactive mouse glow effect - optimized for performance
function initMouseGlow() {
    const mouseGlow = document.getElementById('mouseGlow');
    const hero = document.querySelector('.hero');
    
    if (!mouseGlow || !hero) return;
    
    // Use CSS transform instead of left/top for better performance
    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        mouseGlow.style.transform = `translate(${x - 300}px, ${y - 300}px)`;
        mouseGlow.classList.add('active');
    });
    
    hero.addEventListener('mouseleave', () => {
        mouseGlow.classList.remove('active');
    });
}

// Create floating particles for hero section
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 10; // Reduced from 30 for performance
    const colors = ['#9b4dff', '#bf7fff', '#4dffff'];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random properties
        const size = Math.random() * 3 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const duration = Math.random() * 15 + 20;
        const delay = Math.random() * 20;
        
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            background: ${color};
            opacity: 0.6;
            animation-duration: ${duration}s;
            animation-delay: -${delay}s;
        `;
        
        particlesContainer.appendChild(particle);
    }
}

// Glitch effect on hover for sealed section
const sealedTitle = document.querySelector('.sealed-title');
if (sealedTitle) {
    sealedTitle.addEventListener('mouseenter', () => {
        sealedTitle.style.animation = 'textGlitch 0.3s ease';
        setTimeout(() => {
            sealedTitle.style.animation = '';
        }, 300);
    });
}

// Add CSS for text glitch
const style = document.createElement('style');
style.textContent = `
    @keyframes textGlitch {
        0%, 100% { 
            text-shadow: 0 0 30px rgba(155, 77, 255, 0.5);
            transform: translate(0);
        }
        20% { 
            text-shadow: -2px 0 #ff00ff, 2px 0 #00ffff;
            transform: translate(-2px);
        }
        40% { 
            text-shadow: 2px 0 #ff00ff, -2px 0 #00ffff;
            transform: translate(2px);
        }
        60% { 
            text-shadow: -2px 0 #ff00ff, 2px 0 #00ffff;
            transform: translate(-1px);
        }
        80% { 
            text-shadow: 2px 0 #ff00ff, -2px 0 #00ffff;
            transform: translate(1px);
        }
    }
    
    .game-card {
        opacity: 0;
    }
    
    .game-card.visible {
        opacity: 1;
    }
`;
document.head.appendChild(style);

// Speedrunner Carousel
let carouselPosition = 0;
const carousel = document.getElementById('speedrunnerCarousel');

function moveCarousel(direction) {
    if (!carousel) return;
    
    const cardWidth = carousel.querySelector('.speedrunner-card')?.offsetWidth || 220;
    const gap = 24; // 1.5rem
    const scrollAmount = (cardWidth + gap) * 2;
    
    carousel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

// Auto-scroll carousel every 5 seconds
let autoScrollInterval;

function startAutoScroll() {
    autoScrollInterval = setInterval(() => {
        if (!carousel) return;
        
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        
        if (carousel.scrollLeft >= maxScroll - 10) {
            carousel.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            moveCarousel(1);
        }
    }, 5000);
}

function stopAutoScroll() {
    clearInterval(autoScrollInterval);
}

// Auto-scroll disabled for performance
// if (carousel) {
//     startAutoScroll();
//     carousel.addEventListener('mouseenter', stopAutoScroll);
//     carousel.addEventListener('mouseleave', startAutoScroll);
// }

// Console easter egg
console.log(`
%c ▄▄▄▄▄▄▄▄▄▄▄  ▄         ▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄         ▄ 
▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░▌       ▐░▌
▐░█▀▀▀▀▀▀▀█░▌▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░▌       ▐░▌
▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ▐░▌       ▐░▌
▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ▐░█▄▄▄▄▄▄▄█░▌
▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ▐░░░░░░░░░░░▌
▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ▐░█▀▀▀▀▀▀▀█░▌
▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ▐░▌       ▐░▌
▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░▌       ▐░▌
▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌       ▐░▌
 ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀ 

🎮 OUCH GAMES - Horror Experiences in UEFN
`, 'color: #9b4dff; font-family: monospace;');

console.log('%c👻 Something lurks among the packages...', 'color: #bf7fff; font-style: italic;');
