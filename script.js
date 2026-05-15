// API OpenDota (через наш сервер)
const API_BASE = '/api';

// Словарь героев (будет загружен из API)
let heroesData = {};

// Загрузка списка героев при старте
async function loadHeroes() {
    try {
        const response = await fetch(`${API_BASE}/heroes`);
        const heroes = await response.json();
        
        // Создаем словарь: id -> имя героя
        heroes.forEach(hero => {
            heroesData[hero.id] = hero.localized_name;
        });
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
        alert('Введите Steam ID или ID профиля');
        return;
    }

    // Показываем загрузку
    showLoading();
    hideError();
    hideProfile();

    try {
        console.log('Поиск игрока:', input);
        
        // Получаем данные игрока
        const playerData = await fetchPlayerData(input);
        
        if (!playerData || !playerData.profile) {
            console.error('Данные игрока не получены');
            showError('Игрок не найден. Проверьте правильность ID.');
            return;
        }

        console.log('Данные игрока получены:', playerData.profile.personaname);

        // Получаем статистику побед/поражений
        const winLoss = await fetchWinLoss(input);
        console.log('W/L получено:', winLoss);
        
        // Получаем топ героев
        const topHeroes = await fetchTopHeroes(input);
        console.log('Топ героев получено:', topHeroes.length);
        
        // Получаем последние матчи
        const recentMatches = await fetchRecentMatches(input);
        console.log('Матчи получены:', recentMatches.length);

        // Отображаем все данные
        displayPlayerProfile(playerData, winLoss, topHeroes, recentMatches);
        
    } catch (error) {
        console.error('Ошибка при поиске:', error);
        showError(`Произошла ошибка: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Получение данных игрока
async function fetchPlayerData(playerId) {
    try {
        const url = `${API_BASE}/players/${playerId}`;
        console.log('Запрос к:', url);
        
        const response = await fetch(url);
        console.log('Статус ответа:', response.status);
        
        if (!response.ok) {
            console.error('Ошибка HTTP:', response.status);
            return null;
        }
        
        const data = await response.json();
        console.log('Получены данные:', data);
        return data;
    } catch (error) {
        console.error('Ошибка получения данных игрока:', error);
        throw error;
    }
}

// Получение статистики побед/поражений
async function fetchWinLoss(playerId) {
    try {
        const response = await fetch(`${API_BASE}/players/${playerId}/wl`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка получения W/L:', error);
        return { win: 0, lose: 0 };
    }
}

// Получение топ героев
async function fetchTopHeroes(playerId) {
    try {
        const response = await fetch(`${API_BASE}/players/${playerId}/heroes`);
        const heroes = await response.json();
        // Возвращаем топ-6 героев по количеству игр
        return heroes.slice(0, 6);
    } catch (error) {
        console.error('Ошибка получения героев:', error);
        return [];
    }
}

// Получение последних матчей
async function fetchRecentMatches(playerId) {
    try {
        const response = await fetch(`${API_BASE}/players/${playerId}/recentMatches`);
        const matches = await response.json();
        // Возвращаем последние 10 матчей
        return matches.slice(0, 10);
    } catch (error) {
        console.error('Ошибка получения матчей:', error);
        return [];
    }
}

// Отображение профиля игрока
function displayPlayerProfile(player, winLoss, topHeroes, recentMatches) {
    // Основная информация
    document.getElementById('playerAvatar').src = player.profile.avatarfull;
    document.getElementById('playerName').textContent = player.profile.personaname || 'Неизвестный игрок';
    
    // Ранг (если есть)
    const rankTier = player.rank_tier;
    if (rankTier) {
        const rank = Math.floor(rankTier / 10);
        const stars = rankTier % 10;
        document.getElementById('playerRank').textContent = `Ранг: ${getRankName(rank)} [${stars}★]`;
    } else {
        document.getElementById('playerRank').textContent = 'Ранг: Не откалиброван';
    }

    // Статистика
    const totalGames = winLoss.win + winLoss.lose;
    const winRate = totalGames > 0 ? ((winLoss.win / totalGames) * 100).toFixed(1) : 0;

    document.getElementById('winRate').textContent = `${winRate}%`;
    document.getElementById('totalGames').textContent = totalGames;
    document.getElementById('wins').textContent = winLoss.win;
    document.getElementById('losses').textContent = winLoss.lose;

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
        const totalGames = hero.games;
        const winRate = ((hero.win / totalGames) * 100).toFixed(1);
        
        const heroCard = document.createElement('div');
        heroCard.className = 'hero-card';
        heroCard.innerHTML = `
            <h4>${getHeroName(hero.hero_id)}</h4>
            <div class="hero-stats">
                <span>Игр:</span>
                <span class="value">${totalGames}</span>
            </div>
            <div class="hero-stats">
                <span>Побед:</span>
                <span class="value">${hero.win}</span>
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
        const isWin = (match.player_slot < 128 && match.radiant_win) || 
                      (match.player_slot >= 128 && !match.radiant_win);
        
        const duration = formatDuration(match.duration);
        const kda = `${match.kills}/${match.deaths}/${match.assists}`;
        
        const matchCard = document.createElement('div');
        matchCard.className = `match-card ${isWin ? 'win' : 'loss'}`;
        matchCard.innerHTML = `
            <div class="match-info">
                <div class="match-result ${isWin ? 'win' : 'loss'}">
                    ${isWin ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}
                </div>
                <div>
                    <div class="match-hero">${getHeroName(match.hero_id)}</div>
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
    const ranks = {
        1: 'Herald',
        2: 'Guardian',
        3: 'Crusader',
        4: 'Archon',
        5: 'Legend',
        6: 'Ancient',
        7: 'Divine',
        8: 'Immortal'
    };
    return ranks[rank] || 'Неизвестен';
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
