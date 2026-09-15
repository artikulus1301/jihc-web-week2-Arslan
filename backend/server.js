const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const FRONTEND_FOLDER = path.join(__dirname, '..', 'frontend');

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

const server = http.createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/users') {
    sendJson(response, 200, getUsers());
    return;
  }

  if (request.method === 'POST' && (request.url === '/register' || request.url === '/login')) {
    let body = '';

    request.on('data', chunk => {
      body += chunk;
    });

    request.on('end', () => {
      try {
        const userData = JSON.parse(body);
        const users = getUsers();

        if (request.url === '/register') {
          const userExists = users.some(user => user.username === userData.username);

          if (userExists) {
            sendJson(response, 409, { message: 'Пользователь уже существует' });
            return;
          }

          const newUser = {
            id: Date.now(),
            username: userData.username,
            password: userData.password
          };

          users.push(newUser);
          saveUsers(users);
          sendJson(response, 201, { message: 'Регистрация прошла успешно', user: { id: newUser.id, username: newUser.username } });
          return;
        }

        const foundUser = users.find(user =>
          user.username === userData.username && user.password === userData.password
        );

        if (!foundUser) {
          sendJson(response, 401, { message: 'Неверное имя пользователя или пароль' });
          return;
        }

        sendJson(response, 200, { message: 'Вход выполнен успешно', user: { id: foundUser.id, username: foundUser.username } });
      } catch (error) {
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
