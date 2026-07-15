// TMDb API Key: Configured in server environment variables.
const TMDb_BASE_URL = '/api/tmdb';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

async function fetchTMDb(endpoint, params = '') {
    // Build URL safely — only append params when provided to avoid trailing ampersands
    const url = `${TMDb_BASE_URL}${endpoint}` + (params ? `?${params}` : '');

    let response;
    try {
        response = await fetch(url);
    } catch (networkErr) {
        throw new Error(`Network error contacting TMDb: ${networkErr.message}`);
    }

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`TMDb API error: ${response.status}${body ? ' - ' + body : ''}`);
    }

    return await response.json();
}

export { fetchTMDb, IMAGE_BASE_URL };
