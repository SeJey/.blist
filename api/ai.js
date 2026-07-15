function getGeminiProxyUrl(settings) {
    return '/api/ai';
}

async function callGeminiApi(payload, settings = {}, retries = 3, delay = 1000) {
    const proxyUrl = getGeminiProxyUrl(settings);
    
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload })
            });
            if (!res.ok) throw new Error(`AI proxy error: ${res.status}`);
            return await res.json();
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
        }
    }
}

export { callGeminiApi };
