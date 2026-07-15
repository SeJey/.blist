require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/tmdb', async (req, res) => {
    try {
        const tmdbApiKey = process.env.TMDB_API_KEY;
        if (!tmdbApiKey) {
            return res.status(500).json({ error: 'TMDB_API_KEY is not configured' });
        }
        
        // Construct the TMDb url
        // req.url contains the path and query string after /api/tmdb
        const targetUrl = new URL(`https://api.themoviedb.org/3${req.url}`);
        targetUrl.searchParams.set('api_key', tmdbApiKey);
        
        const response = await fetch(targetUrl.toString());
        const data = await response.text();
        res.status(response.status).send(data);
    } catch (err) {
        console.error('TMDB Proxy Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

let aiClient = null;
app.post('/api/ai', async (req, res) => {
    try {
        if (!aiClient) {
            const geminiApiKey = process.env.GEMINI_API_KEY;
            if (!geminiApiKey) {
                return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
            }
            aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
        }
        
        const { payload } = req.body;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('Gemini Proxy Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// TVDB PROXY
const TVDB_API_KEY = "b1feca17-dc79-4438-80f8-f01d1b26b767";
const TVDB_BASE_URL = "https://api4.thetvdb.com/v4";
let tvdbToken = null;
let tokenExpiryTime = null;

async function ensureTVDBToken() {
    if (!tvdbToken || !tokenExpiryTime || Date.now() >= tokenExpiryTime) {
        const response = await fetch(`${TVDB_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apikey: TVDB_API_KEY })
        });
        if (!response.ok) throw new Error(`TVDB auth failed: ${response.status}`);
        const data = await response.json();
        tvdbToken = data.data.token;
        tokenExpiryTime = Date.now() + (23 * 60 * 60 * 1000);
    }
    return tvdbToken;
}

app.use('/api/tvdb', async (req, res) => {
    try {
        const token = await ensureTVDBToken();
        const targetUrl = new URL(`${TVDB_BASE_URL}${req.url}`);
        
        const response = await fetch(targetUrl.toString(), {
            method: req.method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                tvdbToken = null;
                tokenExpiryTime = null;
                return res.status(401).json({ error: 'Token expired' });
            }
        }
        
        const data = await response.text();
        res.status(response.status).send(data);
    } catch (err) {
        console.error('TVDB Proxy Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.use(express.static(path.join(__dirname, '/')));

app.get('/config.local.js', (req, res) => {
    let firebaseConfig = {};
    try {
        const fs = require('fs');
        const configPath = path.join(__dirname, 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
            const extraConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            firebaseConfig = { ...firebaseConfig, ...extraConfig };
        }
    } catch (e) {
        console.error('Error reading firebase-applet-config.json:', e);
    }

    const script = `
window.__app_id = '${firebaseConfig.projectId || 'nexst-50c18'}';
window.__firebase_config = JSON.stringify(${JSON.stringify(firebaseConfig)});
window.__tmdb_api_key = '';
window.__gemini_proxy_url = '/api/ai';
`;
    res.type('application/javascript').send(script);
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
