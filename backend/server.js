const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const FRONTEND_FOLDER = path.join(__dirname, '..', 'frontend');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'devproject_db',
  port: 5433
})

function getUsers() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  response.end(JSON.stringify(data));
}

function serveFrontend(request, response) {
  const requestedFile = request.url === '/' ? 'index.html' : request.url.slice(1);
  const filePath = path.normalize(path.join(FRONTEND_FOLDER, requestedFile));

  if (!filePath.startsWith(FRONTEND_FOLDER)) {
    sendJson(response, 403, { message: 'Доступ запрещен' });
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Страница не найдена');
      return;
    }

    const extension = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8'
    };

    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream'
    });
    response.end(file);
  });
}

const server = http.createServer( async (request, response) => {
  if (request.method === 'GET' && request.url === '/users') {
    try {
      const result = await pool.query('SELECT id, username FROM users ORDER BY id ASC');
      sendJson(response, 200, result.rows);
    } catch (error) {
      console.error('Ошибка БД', error);
      sendJson(response, 500, { message: 'Ошибки при получении данных'});
    }
    return;
  }

  if (request.method === 'POST' && (request.url === '/register' || request.url === '/login')) {
    let body = '';

    request.on('data', chunk => {
      body += chunk;
    });

    request.on('end',async () => {
      try {
        const userData = JSON.parse(body);

        if (request.url === '/register') {
          const checkUser = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [userData.username]
          )

          if (checkUser.rows.length > 0) {
            sendJson(response, 409, { message: 'Пользователь уже существует' });
            return;
          }

          const insertResult = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
            [userData.username, userData.password]
          )

          const newUser = insertResult.rows[0];
          sendJson(response, 201, {
            message: 'Регистрация успешна',
            user: newUser
          });

          return};
          

  if (request.url === '/login') {
          const result = await pool.query(
            'SELECT id, username FROM users WHERE username = $1 AND password = $2',
            [userData.username, userData.password]
          );
          if (result.rows.length === 0) {
            sendJson(response, 401, { message: 'Неверное имя пользователя или пароль' });
            return;
          }
          sendJson(response, 200, {
            message: 'Вход выполнен успешно',
            user: result.rows[0]
          });
        }
      } catch (error) {
        console.error(error);
        sendJson(response, 400, { message: 'Неверный формат данных' });
      }
    });
    return;
  }

  serveFrontend(request, response);
});

server.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
