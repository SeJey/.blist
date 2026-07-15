export function renderMovieListItem(movie, userMovieData = {}) {
    const isMovie = isMovieRecord(movie);
    const imageBaseUrl = getImageBaseUrl(movie, isMovie);
    let posterPath;
    if (movie.poster_path) {
        const posterValue = String(movie.poster_path);
        if (posterValue.startsWith('http')) {
            posterPath = posterValue;
        } else {
            posterPath = `${imageBaseUrl}${posterValue}`;
        }
    } else {
        posterPath = 'https://placehold.co/100x150/1f2937/4b5563?text=No+Image';
    }
    const title = movie.title || movie.name || 'Untitled';
    const dbId = movie.dbId || (isMovie ? `tmdb_${movie.id}` : `tmdb_tv_${movie.id}`);
    const typeLabel = isMovie ? 'MOVIE' : 'SERIES';
    const userRating = formatStoredRating(userMovieData.rating, settings);
    let progressHtml = '';
    let progressDisplay = '';
    let progressBarOverlayHtml = '';
    if (!isMovie) {
        let totalEps = 0;
        let watchedEps = 0;
        const apiTotalEps = movie.number_of_episodes || movie.numberOfEpisodes || movie.totalEpisodes;
        if (apiTotalEps) {
            if (typeof apiTotalEps === 'object') {
                totalEps = Object.values(apiTotalEps).reduce((a, b) => a + b, 0);
            } else {
                totalEps = Number(apiTotalEps) || 0;
            }
        }
        if (userMovieData.episodesWatched) {
            if (typeof userMovieData.episodesWatched === 'object') {
                watchedEps = Object.values(userMovieData.episodesWatched).reduce((a, b) => a + b, 0);
            } else {
                watchedEps = Number(userMovieData.episodesWatched) || 0;
            }
        }
        if (watchedEps > 0 && totalEps > 0) {
            progressDisplay = `${watchedEps}/${totalEps}`;
            progressHtml = `<span class="text-gray-400">${progressDisplay}</span>`;
            const percentage = Math.min(100, Math.round((watchedEps / totalEps) * 100));
            progressBarOverlayHtml = `
                <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-900/80 rounded-b-md overflow-hidden z-10">
                    <div class="h-full bg-sky-500" style="width: ${percentage}%"></div>
                </div>
            `;
        } else if (watchedEps > 0) {
            progressDisplay = `${watchedEps} eps`;
            progressHtml = `<span class="text-gray-400">${progressDisplay}</span>`;
        }
    }
    return `
        <div class="movie-list-item group flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800 transition-colors border-b border-gray-700 last:border-b-0" data-movie-id="${escapeAttribute(dbId)}">
            <div class="relative w-16 h-24 flex-shrink-0 cursor-pointer movie-list-poster-container" data-movie-id="${escapeAttribute(dbId)}">
                <img src="${escapeAttribute(posterPath)}" alt="${escapeAttribute(title)}" class="movie-list-poster w-full h-full object-cover rounded-md" data-movie-id="${escapeAttribute(dbId)}">
                ${progressBarOverlayHtml}
            </div>
            <div class="flex-grow min-w-0">
                <a href="#" class="movie-list-title block text-sm font-semibold text-white hover:text-sky-300 transition-colors truncate" data-movie-id="${escapeAttribute(dbId)}">${escapeHtml(title)}</a>
                <p class="text-xs text-gray-400">${escapeHtml(typeLabel)}</p>
            </div>
            <div class="flex items-center gap-8 flex-shrink-0 text-right">
                ${userRating ? `<div class="text-right"><p class="text-lg font-bold text-yellow-400">${escapeHtml(userRating)}</p></div>` : '<div></div>'}
                ${progressHtml ? `<div class="text-center">${progressHtml}</div>` : '<div></div>'}
            </div>
        </div>
    `;
}
