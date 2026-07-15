const TVDB_BASE_URL = "/api/tvdb";
const IMAGE_BASE_URL = "https://artworks.thetvdb.com/banners";

/**
 * Fetch from TVDB via local proxy
 */
async function fetchTVDB(endpoint, params = '') {
  const url = params
    ? `${TVDB_BASE_URL}${endpoint}?${params}`
    : `${TVDB_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('TVDB API error:', response.status, errorText);
    throw new Error(`TVDB API error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Search for TV series on TVDB
 */
async function searchTVSeries(query) {
  try {
    const result = await fetchTVDB('/search', `query=${encodeURIComponent(query)}&type=series`);
    return result.data || [];
  } catch (err) {
    console.error('TVDB search failed:', err);
    return [];
  }
}

/**
 * Get a list of series using TVDB filter endpoint
 */
async function getSeriesFilter(params = '') {
  try {
    const result = await fetchTVDB('/series/filter', params);
    return result?.data || [];
  } catch (err) {
    console.error('TVDB series filter failed:', err);
    return [];
  }
}

/**
 * Get TVDB genres
 */
async function getTVDBGenres() {
  try {
    const result = await fetchTVDB('/genres');
    return result?.data || [];
  } catch (err) {
    console.error('TVDB genres fetch failed:', err);
    return [];
  }
}

/**
 * Get TVDB series statuses
 */
async function getSeriesStatuses() {
  try {
    const result = await fetchTVDB('/series/statuses');
    return result?.data || [];
  } catch (err) {
    console.error('TVDB series statuses fetch failed:', err);
    return [];
  }
}

/**
 * Get series details including seasons
 */
async function getSeriesDetails(seriesId) {
  try {
    // Try the extended endpoint which includes translations and seasons
    let result;
    try {
      result = await fetchTVDB(`/series/${seriesId}/extended`, 'meta=translations');
    } catch (extErr) {
      result = await fetchTVDB(`/series/${seriesId}`);
    }
    
    const series = result.data || result || null;
    
    // Fetch cast/characters data separately
    if (series) {
      try {
        const charactersResult = await fetchTVDB(`/series/${seriesId}/characters`);
        if (charactersResult?.data) {
          series.characters = charactersResult.data;
        }
      } catch (charErr) {
        console.warn('Failed to fetch series characters:', charErr);
      }
    }
    
    return series;
  } catch (err) {
    console.error('Failed to fetch series details:', err);
    return null;
  }
}

/**
 * Get series translation record for a language (e.g., eng)
 */
async function getSeriesTranslation(seriesId, language = 'eng') {
  try {
    const result = await fetchTVDB(`/series/${seriesId}/translations/${language}`);
    return result?.data || null;
  } catch (err) {
    console.error('Failed to fetch series translation:', err);
    return null;
  }
}

/**
 * Get episode count for a series season (default season type)
 */
async function getSeriesSeasonEpisodeCount(seriesId, seasonType = 'default', seasonNumber = 1) {
  try {
    const params = `page=0&season=${encodeURIComponent(seasonNumber)}`;
    const result = await fetchTVDB(`/series/${seriesId}/episodes/${seasonType}`, params);
    const episodes = result?.data?.episodes || [];
    const total = result?.links?.total_items;
    return typeof total === 'number' ? total : episodes.length;
  } catch (err) {
    console.error('Failed to fetch series episodes:', err);
    return null;
  }
}

/**
 * Get season details (extended) by season ID
 */
async function getSeasonDetails(seasonId) {
  try {
    const result = await fetchTVDB(`/seasons/${seasonId}/extended`);
    return result?.data || null;
  } catch (err) {
    console.error('Failed to fetch season details:', err);
    return null;
  }
}

/**
 * Get episode details (extended) by episode ID
 */
async function getEpisodeDetails(episodeId) {
  try {
    const result = await fetchTVDB(`/episodes/${episodeId}/extended`);
    return result?.data || null;
  } catch (err) {
    console.error('Failed to fetch episode details:', err);
    return null;
  }
}

export { fetchTVDB, searchTVSeries, getSeriesFilter, getTVDBGenres, getSeriesStatuses, getSeriesDetails, getSeriesTranslation, getSeriesSeasonEpisodeCount, getSeasonDetails, getEpisodeDetails, IMAGE_BASE_URL };