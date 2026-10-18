// A local TCP relay makes a real DB connection outage reproducible without pausing Supabase.
require('dotenv').config();
const net = require('node:net');
const readline = require('node:readline');
const { spawn } = require('node:child_process');
const path = require('node:path');

const database = new URL(process.env.DATABASE_URL);
const sockets = new Set();
const relay = net.createServer((client) => {
  const remote = net.connect(Number(database.port) || 5432, database.hostname);
  sockets.add(client); sockets.add(remote);
  client.pipe(remote); remote.pipe(client);
  client.on('error', () => remote.destroy());
  remote.on('error', () => client.destroy());
  client.on('close', () => { sockets.delete(client); remote.destroy(); });
  remote.on('close', () => { sockets.delete(remote); client.destroy(); });
});

relay.listen(15432, '127.0.0.1', () => {
  const localDatabase = new URL(database);
  localDatabase.hostname = '127.0.0.1'; localDatabase.port = '15432';
  const child = spawn(process.execPath, [path.join(__dirname, '../server.js')], {
    env: { ...process.env, PORT: '3002', DATABASE_URL: localDatabase.toString() },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  console.log('Проверка: http://localhost:3002. Команды: off — отключить БД, on — подключить, exit — завершить.');
  const input = readline.createInterface({ input: process.stdin });
  input.on('line', (line) => {
    if (line.trim() === 'off' && relay.listening) {
      for (const socket of sockets) socket.destroy();
      relay.close(() => console.log('Соединение с БД отключено. Обновите страницу на порту 3002.'));
    } else if (line.trim() === 'on' && !relay.listening) {
      relay.listen(15432, '127.0.0.1', () => console.log('Соединение с БД восстановлено.'));
    } else if (line.trim() === 'exit') stop();
  });
  function stop() {
    child.kill(); input.close();
    for (const socket of sockets) socket.destroy();
    if (relay.listening) relay.close();
  }
  process.on('SIGINT', stop);
  child.on('exit', () => { input.close(); for (const socket of sockets) socket.destroy(); if (relay.listening) relay.close(); });
});
relay.on('error', (error) => { console.error('Не удалось открыть локальное соединение:', error.message); process.exitCode = 1; });
