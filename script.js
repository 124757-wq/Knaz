// API Stratz (\u0447\u0435\u0440\u0435\u0437 \u043d\u0430\u0448 \u0441\u0435\u0440\u0432\u0435\u0440)
const API_BASE = '/api';

// \u0421\u043b\u043e\u0432\u0430\u0440\u044c \u0433\u0435\u0440\u043e\u0435\u0432
let heroesData = {};

// \u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0441\u043f\u0438\u0441\u043a\u0430 \u0433\u0435\u0440\u043e\u0435\u0432 \u043f\u0440\u0438 \u0441\u0442\u0430\u0440\u0442\u0435
async function loadHeroes() {
    try {
        const response = await fetch(`${API_BASE}/heroes`);
        const data = await response.json();
        
        if (data.data && data.data.constants && data.data.constants.heroes) {
            data.data.constants.heroes.forEach(hero => {
                heroesData[hero.id] = hero.displayName;
            });
            console.log('\u2705 \u0413\u0435\u0440\u043e\u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u044b:', Object.keys(heroesData).length);
        }
    } catch (error) {
        console.error('\u041e\u0448\u0438\u0431\u043a\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438 \u0433\u0435\u0440\u043e\u0435\u0432:', error);
    }\n}

// \u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u0435 \u0438\u043c\u0435\u043d\u0438 \u0433\u0435\u0440\u043e\u044f \u043f\u043e ID
function getHeroName(heroId) {
    return heroesData[heroId] || `Hero #${heroId}`;\n}

// \u041f\u043e\u0438\u0441\u043a \u0438\u0433\u0440\u043e\u043a\u0430
async function searchPlayer() {
    const input = document.getElementById('playerInput').value.trim();
    
    if (!input) {
        alert('\u0412\u0432\u0435\u0434\u0438\u0442\u0435 Steam ID');
        return;
    }

    // \u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u043c \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0443
    showLoading();
    hideError();
    hideProfile();

    try {
        console.log('\u041f\u043e\u0438\u0441\u043a \u0438\u0433\u0440\u043e\u043a\u0430:', input);
        
        // \u041f\u043e\u043b\u0443\u0447\u0430\u0435\u043c \u0434\u0430\u043d\u043d\u044b\u0435 \u0438\u0433\u0440\u043e\u043a\u0430
        const playerResponse = await fetch(`${API_BASE}/player/${input}`);
        const playerData = await playerResponse.json();
        
        if (!playerData.data || !playerData.data.player) {
            console.error('\u0418\u0433\u0440\u043e\u043a \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d');
            showError('\u0418\u0433\u0440\u043e\u043a \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 Steam ID.');
            return;
        }

        const player = playerData.data.player;
        console.log('\u0414\u0430\u043d\u043d\u044b\u0435 \u0438\u0433\u0440\u043e\u043a\u0430:', player);

        // \u041f\u043e\u043b\u0443\u0447\u0430\u0435\u043c \u0442\u043e\u043f \u0433\u0435\u0440\u043e\u0435\u0432
        const heroesResponse = await fetch(`${API_BASE}/player/${input}/heroes`);
        const heroesData = await heroesResponse.json();
        const topHeroes = heroesData.data?.player?.heroesPerformance?.slice(0, 6) || [];
        
        // \u041f\u043e\u043b\u0443\u0447\u0430\u0435\u043c \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0435 \u043c\u0430\u0442\u0447\u0438
        const matchesResponse = await fetch(`${API_BASE}/player/${input}/matches`);
        const matchesData = await matchesResponse.json();
        const recentMatches = matchesData.data?.player?.matches || [];

        // \u041e\u0442\u043e\u0431\u0440\u0430\u0436\u0430\u0435\u043c \u0432\u0441\u0435 \u0434\u0430\u043d\u043d\u044b\u0435
        displayPlayerProfile(player, topHeroes, recentMatches);
        
    } catch (error) {
        console.error('\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438 \u043f\u043e\u0438\u0441\u043a\u0435:', error);
        showError(`\u041f\u0440\u043e\u0438\u0437\u043e\u0448\u043b\u0430 \u043e\u0448\u0438\u0431\u043a\u0430: ${error.message}`);\n    } finally {
        hideLoading();
    }
}

// \u041e\u0442\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435 \u043f\u0440\u043e\u0444\u0438\u043b\u044f \u0438\u0433\u0440\u043e\u043a\u0430
function displayPlayerProfile(player, topHeroes, recentMatches) {
    // \u041e\u0441\u043d\u043e\u0432\u043d\u0430\u044f \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f
    document.getElementById('playerAvatar').src = player.steamAccount?.avatar || 'https://via.placeholder.com/100';
    document.getElementById('playerName').textContent = player.steamAccount?.name || '\u041d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u044b\u0439 \u0438\u0433\u0440\u043e\u043a';
    
    // \u0420\u0430\u043d\u0433
    const rank = player.ranks?.rank || null;
    if (rank) {
        document.getElementById('playerRank').textContent = `\u0420\u0430\u043d\u0433: ${getRankName(rank)}`;\n    } else {
        document.getElementById('playerRank').textContent = '\u0420\u0430\u043d\u0433: \u041d\u0435 \u043e\u0442\u043a\u0430\u043b\u0438\u0431\u0440\u043e\u0432\u0430\u043d';
    }

    // \u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430
    const wins = player.winCount || 0;
    const losses = player.lossCount || 0;
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;

    document.getElementById('winRate').textContent = `${winRate}%`;
    document.getElementById('totalGames').textContent = totalGames;
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;

    // \u0422\u043e\u043f \u0433\u0435\u0440\u043e\u0435\u0432
    displayTopHeroes(topHeroes);

    // \u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0435 \u043c\u0430\u0442\u0447\u0438
    displayRecentMatches(recentMatches);

    // \u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u043c \u043f\u0440\u043e\u0444\u0438\u043b\u044c
    showProfile();
}

// \u041e\u0442\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435 \u0442\u043e\u043f \u0433\u0435\u0440\u043e\u0435\u0432
function displayTopHeroes(heroes) {
    const container = document.getElementById('topHeroes');
    container.innerHTML = '';

    heroes.forEach(hero => {
        const totalGames = hero.matchCount || 0;
        const wins = hero.winCount || 0;
        const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
        
        const heroCard = document.createElement('div');
        heroCard.className = 'hero-card';
        heroCard.innerHTML = `
            <h4>${getHeroName(hero.heroId)}</h4>
            <div class="hero-stats">
                <span>\u0418\u0433\u0440:</span>
                <span class="value">${totalGames}</span>
            </div>
            <div class="hero-stats">
                <span>\u041f\u043e\u0431\u0435\u0434:</span>
                <span class="value">${wins}</span>
            </div>
            <div class="hero-stats">
                <span>\u0412\u0438\u043d\u0440\u0435\u0439\u0442:</span>
                <span class="value">${winRate}%</span>
            </div>
            <div class="hero-winrate">
                <div class="hero-winrate-fill" style="width: ${winRate}%"></div>
            </div>
        `;
        
        container.appendChild(heroCard);
    });
}

// \u041e\u0442\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435 \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0445 \u043c\u0430\u0442\u0447\u0435\u0432
function displayRecentMatches(matches) {
    const container = document.getElementById('recentMatches');
    container.innerHTML = '';

    matches.forEach(match => {
        const playerData = match.players?.[0];
        if (!playerData) return;
        
        const isRadiant = playerData.isRadiant;
        const isWin = (isRadiant && match.didRadiantWin) || (!isRadiant && !match.didRadiantWin);
        
        const duration = formatDuration(match.durationSeconds);
        const kda = `${playerData.kills}/${playerData.deaths}/${playerData.assists}`;
        
        const matchCard = document.createElement('div');
        matchCard.className = `match-card ${isWin ? 'win' : 'loss'}`;
        matchCard.innerHTML = `
            <div class="match-info">
                <div class="match-result ${isWin ? 'win' : 'loss'}">
                    ${isWin ? '\u041f\u041e\u0411\u0415\u0414\u0410' : '\u041f\u041e\u0420\u0410\u0416\u0415\u041d\u0418\u0415'}
                </div>
                <div>
                    <div class="match-hero">${getHeroName(playerData.heroId)}</div>
                    <div class="match-kda">KDA: ${kda}</div>
                </div>
            </div>
            <div class="match-duration">${duration}</div>
        `;
        
        container.appendChild(matchCard);
    });
}

// \u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f \u0440\u0430\u043d\u0433\u0430
function getRankName(rank) {
    if (rank >= 80) return 'Immortal';
    if (rank >= 70) return 'Divine';
    if (rank >= 60) return 'Ancient';
    if (rank >= 50) return 'Legend';
    if (rank >= 40) return 'Archon';
    if (rank >= 30) return 'Crusader';
    if (rank >= 20) return 'Guardian';
    if (rank >= 10) return 'Herald';
    return '\u041d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u0435\u043d';
}

// \u0424\u043e\u0440\u043c\u0430\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0434\u043b\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u0438 \u043c\u0430\u0442\u0447\u0430
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// \u0424\u0443\u043d\u043a\u0446\u0438\u0438 \u043f\u043e\u043a\u0430\u0437\u0430/\u0441\u043a\u0440\u044b\u0442\u0438\u044f \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043e\u0432
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    const errorElement = document.getElementById('error');
    if (message) {
        errorElement.querySelector('p').textContent = `\u274c ${message}`;
    }
    errorElement.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function showProfile() {
    document.getElementById('playerProfile').classList.remove('hidden');
}

function hideProfile() {
    document.getElementById('playerProfile').classList.add('hidden');
}

// \u041f\u043e\u0438\u0441\u043a \u043f\u043e \u043d\u0430\u0436\u0430\u0442\u0438\u044e Enter
document.addEventListener('DOMContentLoaded', () => {
    // \u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0433\u0435\u0440\u043e\u0435\u0432 \u043f\u0440\u0438 \u0441\u0442\u0430\u0440\u0442\u0435
    loadHeroes();

    // \u041e\u0431\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a Enter \u0432 \u043f\u043e\u043b\u0435 \u0432\u0432\u043e\u0434\u0430
    document.getElementById('playerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPlayer();
        }
    });
});
