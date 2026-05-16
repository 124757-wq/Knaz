// API Stratz (через наш сервер)
const API_BASE = '/api';

// Словарь героев
let heroesData = {};

// Загрузка списка героев при старте
async function loadHeroes() {
    try {
        const response = await fetch(`${API_BASE}/heroes`);
        const data = await response.json();
        
        if (data.data && data.data.constants && data.data.constants.heroes) {
            data.data.constants.heroes.forEach(hero => {
                heroesData[hero.id] = hero.displayName;
            });
            console.log('✅ Герои загружены:', Object.keys(heroesData).length);
        }
    } catch (error) {
        console.error('Ошибка загрузки героев:', error);
    }
}

// Получение имени героя по ID
function getHeroName(heroId) {
    return heroesData[heroId] || `Hero #${heroId}`;
}

// Поиск игрока
async function searchPlayer() {
    const input = document.getElementById('playerInput').value.trim();
    
    if (!input) {
        alert('Введите Steam ID');
        return;
    }

    // Показываем загрузку
    showLoading();
    hideError();
    hideProfile();

    try {
        console.log('Поиск игрока:', input);
        
        // Получаем данные игрока
        const playerResponse = await fetch(`${API_BASE}/player/${input}`);
        const playerData = await playerResponse.json();
        
        if (!playerData.data || !playerData.data.player) {
            console.error('Игрок не найден');
            showError('Игрок не найден. Проверьте Steam ID.');
            return;
        }

        const player = playerData.data.player;
        console.log('Данные игрока:', player);

        // Получаем топ героев
        const heroesResponse = await fetch(`${API_BASE}/player/${input}/heroes`);
        const heroesData = await heroesResponse.json();
        const topHeroes = heroesData.data?.player?.heroesPerformance?.slice(0, 6) || [];
        
        // Получаем последние матчи
        const matchesResponse = await fetch(`${API_BASE}/player/${input}/matches`);
        const matchesData = await matchesResponse.json();
        const recentMatches = matchesData.data?.player?.matches || [];

        // Отображаем все данные
        displayPlayerProfile(player, topHeroes, recentMatches);
        
    } catch (error) {
        console.error('Ошибка при поиске:', error);
        showError(`Произошла ошибка: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Отображение профиля игрока
function displayPlayerProfile(player, topHeroes, recentMatches) {
    // Основная информация
    document.getElementById('playerAvatar').src = player.steamAccount?.avatar || 'https://via.placeholder.com/100';
    document.getElementById('playerName').textContent = player.steamAccount?.name || 'Неизвестный игрок';
    
    // Ранг
    const rank = player.ranks?.rank || null;
    if (rank) {
        document.getElementById('playerRank').textContent = `Ранг: ${getRankName(rank)}`;
    } else {
        document.getElementById('playerRank').textContent = 'Ранг: Не откалиброван';
    }

    // Статистика
    const wins = player.winCount || 0;
    const totalGames = player.matchCount || 0;
    const losses = totalGames - wins;
    const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;

    document.getElementById('winRate').textContent = `${winRate}%`;
    document.getElementById('totalGames').textContent = totalGames;
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;

    // Топ героев
    displayTopHeroes(topHeroes);

    // Последние матчи
    displayRecentMatches(recentMatches);

    // Показываем профиль
    showProfile();
}

// Отображение топ героев
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
                <span>Игр:</span>
                <span class="value">${totalGames}</span>
            </div>
            <div class="hero-stats">
                <span>Побед:</span>
                <span class="value">${wins}</span>
            </div>
            <div class="hero-stats">
                <span>Винрейт:</span>
                <span class="value">${winRate}%</span>
            </div>
            <div class="hero-winrate">
                <div class="hero-winrate-fill" style="width: ${winRate}%"></div>
            </div>
        `;
        
        container.appendChild(heroCard);
    });
}

// Отображение последних матчей
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
                    ${isWin ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}
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

// Получение названия ранга
function getRankName(rank) {
    if (rank >= 80) return 'Immortal';
    if (rank >= 70) return 'Divine';
    if (rank >= 60) return 'Ancient';
    if (rank >= 50) return 'Legend';
    if (rank >= 40) return 'Archon';
    if (rank >= 30) return 'Crusader';
    if (rank >= 20) return 'Guardian';
    if (rank >= 10) return 'Herald';
    return 'Неизвестен';
}

// Форматирование длительности матча
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Функции показа/скрытия элементов
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    const errorElement = document.getElementById('error');
    if (message) {
        errorElement.querySelector('p').textContent = `❌ ${message}`;
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

// Поиск по нажатию Enter
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем героев при старте
    loadHeroes();

    // Обработчик Enter в поле ввода
    document.getElementById('playerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPlayer();
        }
    });
});
