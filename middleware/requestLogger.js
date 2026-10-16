const fs = require('node:fs/promises');
const path = require('node:path');
const { log: limits } = require('../config/validation.json');

const logFile = process.env.REQUEST_LOG_FILE || path.join(__dirname, '../logs/requests.log');
let pendingWrite = Promise.resolve();

async function writeEntry(entry) {
  await fs.mkdir(path.dirname(logFile), { recursive: true });
  const size = await fs.stat(logFile).then((stat) => stat.size).catch((error) => {
    if (error.code === 'ENOENT') return 0;
    throw error;
  });
  const line = JSON.stringify(entry) + '\n';
  if (size + Buffer.byteLength(line) > limits.maxBytes) await fs.rename(logFile, logFile + '.1');
  await fs.appendFile(logFile, line, 'utf8');
}

async function readRecentLogs() {
  // Serialize reading with rotation, and read only a bounded tail of the current file.
  const reading = pendingWrite.then(async () => {
    const file = await fs.open(logFile, 'r');
    try {
      const { size } = await file.stat();
      const start = Math.max(0, size - limits.tailBytes);
      const buffer = Buffer.alloc(Math.min(size, limits.tailBytes));
      const { bytesRead } = await file.read(buffer, 0, buffer.length, start);
      const lines = buffer.subarray(0, bytesRead).toString('utf8').split('\n');
      if (start) lines.shift();
      return lines.filter(Boolean).slice(-limits.maxEntries).reverse().map((line) => JSON.parse(line));
    } finally {
      await file.close();
    }
  });
  pendingWrite = reading.catch(() => {});
  return reading;
}

async function requestLogger(req, res, next) {
  const entry = { requestedAt: new Date().toISOString(), method: req.method, url: req.originalUrl };
  try {
    const writing = pendingWrite.then(() => writeEntry(entry));
    pendingWrite = writing.catch(() => {});
    await writing;
    console.log(`[${entry.requestedAt}] ${entry.method} ${entry.url}`);
    return next();
  } catch (cause) {
    const error = new Error('Не удалось записать журнал запросов', { cause });
    error.publicMessage = 'Не удалось открыть или записать файл журнала. Проверьте доступ к каталогу logs и повторите запрос.';
    return next(error);
  }
}

module.exports = requestLogger;
module.exports.logFile = logFile;
module.exports.readRecentLogs = readRecentLogs;
