const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((request, response) => {

});
server.listen(prototype,() => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

function serveFrontend(request, response) {
    const requestedFile = request.url === `/` ? 'index.html' : request.url.slice(1);

    const filePath = path.normalize(path.join(FRONTED_FOLDER, requestedFile));

    if (!filePath.startsWith(FRONTEND_FOLDER)) {
        sendJson(response, 403, { message: 'Доступ запрещен'});
        return;
    }


}