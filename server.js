const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const demoData = require('./demoData');

const PORT = 3000;
const USE_DEMO_MODE = true; // Включить демо-режим при недоступности API

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

// Функция для проксирования запросов к OpenDota API с повторными попытками
function proxyApiRequest(apiPath, res, retryCount = 0) {
    // Демо-режим: возвращаем тестовые данные
    if (USE_DEMO_MODE) {
        console.log(`🎭 ДЕМО-РЕЖИМ: ${apiPath}`);
        
        let demoResponse = null;
        
        if (apiPath.includes('/heroes')) {
            demoResponse = demoData.demoHeroes;
        } else if (apiPath.includes('/players/') && apiPath.includes('/wl')) {
            demoResponse = demoData.demoWinLoss;
        } else if (apiPath.includes('/players/') && apiPath.includes('/heroes')) {
            demoResponse = demoData.demoTopHeroes;
        } else if (apiPath.includes('/players/') && apiPath.includes('/recentMatches')) {
            demoResponse = demoData.demoRecentMatches;
        } else if (apiPath.includes('/players/')) {
            demoResponse = demoData.demoPlayerData;
        }
        
        if (demoResponse) {
            // Имитируем задержку сети
            setTimeout(() => {
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify(demoResponse));
            }, 500);
            return;
        }
    }
    
    const maxRetries = 2;
    const retryDelay = 2000; // 2 секунды
    
    // Проверяем, не был ли уже отправлен ответ
    if (res.headersSent) {
        console.log('⚠️ Ответ уже отправлен, пропускаем запрос');
        return;
    }

    const options = {
        hostname: 'api.opendota.com',
        path: `/api${apiPath}`,
        method: 'GET',
        headers: {
            'User-Agent': 'Dota2StatsApp/1.0',
            'Accept': 'application/json'
        },
        timeout: 15000 // 15 секунд таймаут
    };

    console.log(`📡 API запрос: ${apiPath} (попытка ${retryCount + 1}/${maxRetries + 1})`);

    const apiReq = https.request(options, (apiRes) => {
        let data = '';

        apiRes.on('data', (chunk) => {
            data += chunk;
        });

        apiRes.on('end', () => {
            if (res.headersSent) return;
            
            // Проверяем, что получили валидный JSON
            try {
                JSON.parse(data);
                console.log(`✅ API ответ получен: ${apiPath}`);
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(data);
            } catch (e) {
                console.error(`❌ Невалидный JSON от API: ${data.substring(0, 100)}`);
                
                // Если это ошибка 522 и есть попытки - повторяем
                if (retryCount < maxRetries && data.includes('error code: 522')) {
                    console.log(`🔄 Повтор через ${retryDelay}мс...`);
                    setTimeout(() => {
                        proxyApiRequest(apiPath, res, retryCount + 1);
                    }, retryDelay);
                } else {
                    res.writeHead(503, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify({ 
                        error: 'OpenDota API временно недоступен',
                        details: 'Попробуйте через несколько минут'
                    }));
                }
            }
        });
    });

    apiReq.on('error', (error) => {
        if (res.headersSent) return;
        
        console.error('❌ Ошибка API запроса:', error.message);
        
        // Повторяем при ошибке сети
        if (retryCount < maxRetries) {
            console.log(`🔄 Повтор через ${retryDelay}мс...`);
            setTimeout(() => {
                proxyApiRequest(apiPath, res, retryCount + 1);
            }, retryDelay);
        } else {
            res.writeHead(503, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ 
                error: 'Не удалось подключиться к OpenDota API',
                details: 'Сервис временно недоступен. Попробуйте позже.'
            }));
        }
    });

    apiReq.on('timeout', () => {
        if (res.headersSent) return;
        
        console.error('⏱️ Таймаут запроса к API');
        apiReq.destroy();
        
        if (retryCount < maxRetries) {
            console.log(`🔄 Повтор через ${retryDelay}мс...`);
            setTimeout(() => {
                proxyApiRequest(apiPath, res, retryCount + 1);
            }, retryDelay);
        } else {
            res.writeHead(504, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ 
                error: 'Таймаут запроса к API',
                details: 'OpenDota API не отвечает. Попробуйте позже.'
            }));
        }
    });

    apiReq.end();
}

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);

    // Если запрос к API - проксируем его
    if (req.url.startsWith('/api/')) {
        const apiPath = req.url.replace('/api', '');
        proxyApiRequest(apiPath, res);
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
