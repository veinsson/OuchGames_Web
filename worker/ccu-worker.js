/**
 * Ouch Games - Live CCU Worker (Cloudflare Workers)
 * 
 * Fetches real-time player counts from Epic's Discovery API
 * and returns them with proper CORS headers for the website.
 * 
 * SETUP:
 * 1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Name it "ouch-ccu" (or whatever you want)
 * 3. Paste this entire file into the worker editor
 * 4. Click "Deploy"
 * 5. Your worker URL will be: https://ouch-ccu.YOUR_SUBDOMAIN.workers.dev
 * 6. Update CCU_WORKER_URL in script.js with your worker URL
 * 
 * Free tier: 100,000 requests/day — more than enough
 */

const EPIC_DISCOVERY_API = 'https://fn-service-discovery-live-website.ogs.live.on.epicgames.com/api/v1/links/fn/';

// CORS headers — allow your site
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=60', // CDN cache for 60s
};

export default {
    async fetch(request) {
        const url = new URL(request.url);

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Batch endpoint: /batch?codes=3475-9207-2052,0555-4316-6085,...
        if (url.pathname === '/batch') {
            const codes = url.searchParams.get('codes');
            if (!codes) {
                return jsonResponse({ error: 'Missing codes parameter' }, 400);
            }

            const codeList = codes.split(',').filter(c => c.match(/^\d{4}-\d{4}-\d{4}$/));
            if (codeList.length === 0) {
                return jsonResponse({ error: 'No valid island codes provided' }, 400);
            }

            // Fetch all island CCUs in parallel
            const results = {};
            const fetches = codeList.map(async (code) => {
                try {
                    const response = await fetch(EPIC_DISCOVERY_API + code, {
                        headers: {
                            'User-Agent': 'OuchGames-CCU/1.0',
                            'Accept': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        results[code] = data.globalCCU || 0;
                    } else {
                        results[code] = 0;
                    }
                } catch (e) {
                    results[code] = 0;
                }
            });

            await Promise.all(fetches);
            return jsonResponse(results);
        }

        // Single island endpoint: /island?code=3475-9207-2052
        if (url.pathname === '/island') {
            const code = url.searchParams.get('code');
            if (!code || !code.match(/^\d{4}-\d{4}-\d{4}$/)) {
                return jsonResponse({ error: 'Invalid island code' }, 400);
            }

            try {
                const response = await fetch(EPIC_DISCOVERY_API + code, {
                    headers: {
                        'User-Agent': 'OuchGames-CCU/1.0',
                        'Accept': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    return jsonResponse({
                        code: code,
                        globalCCU: data.globalCCU || 0,
                        title: data.metadata?.title || '',
                    });
                }

                return jsonResponse({ code, globalCCU: 0 });
            } catch (e) {
                return jsonResponse({ code, globalCCU: 0, error: e.message });
            }
        }

        // Health check
        if (url.pathname === '/' || url.pathname === '/health') {
            return jsonResponse({ status: 'ok', service: 'ouch-ccu' });
        }

        return jsonResponse({ error: 'Not found' }, 404);
    },
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
        },
    });
}
