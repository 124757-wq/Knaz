const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const demoData = require('./demoData');

const PORT = 3000;
const USE_DEMO_MODE = false; // Используем реальный Stratz API
const STRATZ_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJTdWJqZWN0IjoiZmFhMDQ3ZjMtNTI2Yi00NjRlLTg1N2MtMjRkZDBjOTM5NDExIiwiU3RlYW1JZCI6IjEwNjU4NDYyNzgiLCJBUElVc2VyIjoidHJ1ZSIsIm5iZiI6MTc3ODg4NDQzNywiZXhwIjoxODEwNDIwNDM3LCJpYXQiOjE3Nzg4ODQ0MzcsImlzcyI6Imh0dHBzOi8vYXBpLnN0cmF0ei5jb20ifQ.kqZb7X2IAZWj6UY8keNWIzDtZtmRopAFn5duzLE0UA8';

// MIME типы для разных файлов
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Функция для проксирования запросов к Stratz GraphQL API
function proxyStratzRequest(query, variables, res) {
    if (res.headersSent) {
        console.log('⚠️ Ответ уже отправлен');
        return;
    }

    const postData = JSON.stringify({
        query: query,
        variables: variables
    });

    const options = {
        hostname: 'api.stratz.com',
        path: '/graphql',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STRATZ_TOKEN}`,
            'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 15000
    };

    console.log(`📡 Stratz API запрос`);

    const apiReq = https.request(options, (apiRes) => {
        let data = '';

        apiRes.on('data', (chunk) => {
            data += chunk;
        });

        apiRes.on('end', () => {
            if (res.headersSent) return;
            
            try {
                const parsed = JSON.parse(data);
                console.log(`✅ Stratz API ответ получен`);
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(data);
            } catch (e) {
                console.error(`❌ Ошибка парсинга JSON:`, e);
                res.writeHead(500, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ 
                    error: 'Ошибка обработки данных'
                }));
            }
        });
    });

    apiReq.on('error', (error) => {
        if (res.headersSent) return;
        console.error('❌ Ошибка Stratz API:', error.message);
        res.writeHead(503, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
            error: 'Не удалось подключиться к Stratz API'
        }));
    });

    apiReq.on('timeout', () => {
        if (res.headersSent) return;
        console.error('⏱️ Таймаут Stratz API');
        apiReq.destroy();
        res.writeHead(504, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
            error: 'Таймаут запроса'
        }));
    });

    apiReq.write(postData);
    apiReq.end();
}

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);

    // Если запрос к API - проксируем его
    if (req.url.startsWith('/api/')) {
        const urlParts = req.url.split('/');
        
        // /api/player/{steamId}
        if (urlParts[2] === 'player' && urlParts[3]) {
            const steamId = urlParts[3];
            const query = `
                query GetPlayer($steamId: Long!) {
                    player(steamAccountId: $steamId) {
                        steamAccount {
                            id
                            name
                            avatar
                        }
                        ranks {
                            rank
                        }
                        winCount
                        lossCount
                        matchCount
                    }
                }
            `;
            proxyStratzRequest(query, { steamId: parseInt(steamId) }, res);
            return;
        }
        
        // /api/player/{steamId}/heroes
        if (urlParts[2] === 'player' && urlParts[3] && urlParts[4] === 'heroes') {
            const steamId = urlParts[3];
            const query = `
                query GetPlayerHeroes($steamId: Long!) {
                    player(steamAccountId: $steamId) {
                        heroesPerformance {
                            heroId
                            matchCount
                            winCount
                        }
                    }
                }
            `;
            proxyStratzRequest(query, { steamId: parseInt(steamId) }, res);
            return;
        }
        
        // /api/player/{steamId}/matches
        if (urlParts[2] === 'player' && urlParts[3] && urlParts[4] === 'matches') {
            const steamId = urlParts[3];
            const query = `
                query GetPlayerMatches($steamId: Long!) {
                    player(steamAccountId: $steamId) {
                        matches(request: { take: 10 }) {
                            id
                            didRadiantWin
                            durationSeconds
                            players(steamAccountId: $steamId) {
                                isRadiant
                                heroId
                                kills
                                deaths
                                assists
                            }
                        }
                    }
                }
            `;
            proxyStratzRequest(query, { steamId: parseInt(steamId) }, res);
            return;
        }
        
        // /api/heroes - список героев
        if (urlParts[2] === 'heroes') {
            const query = `
                query GetHeroes {
                    constants {
                        heroes {
                            id
                            displayName
                        }
                    }
                }
            `;
            proxyStratzRequest(query, {}, res);
            return;
        }
        
        // Неизвестный эндпоинт
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API endpoint not found' }));
        return;
    }

    // Определяем путь к файлу
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Получаем расширение файла
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Читаем и отправляем файл
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Файл не найден
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Страница не найдена</h1>', 'utf-8');
            } else {
                // Другая ошибка сервера
                res.writeHead(500);
                res.end('Ошибка сервера: ' + error.code);
            }
        } else {
            // Успешно отправляем файл
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Запускаем сервер
server.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║     🎮 DOTA 2 STATS SERVER 🎮         ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    if (USE_DEMO_MODE) {
        console.log('🎭 ДЕМО-РЕЖИМ ВКЛЮЧЕН (тестовые данные)');
    }
    console.log('');
    console.log(`🌐 Открой в браузере:`);
    console.log(`   http://localhost:${PORT}`);
    console.log('');
    console.log('⏹️  Для остановки нажми Ctrl+C');
    console.log('');
    console.log('════════════════════════════════════════');
});
