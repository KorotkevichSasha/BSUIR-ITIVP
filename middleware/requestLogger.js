const fs = require('node:fs/promises');
const path = require('node:path');

const logFile = process.env.REQUEST_LOG_FILE || path.join(__dirname, '../logs/requests.log');

async function requestLogger(req, res, next) {
  const entry = { requestedAt: new Date().toISOString(), method: req.method, url: req.originalUrl };
  try {
    await fs.mkdir(path.dirname(logFile), { recursive: true });
    // Append creates a missing file and preserves previous entries.
    await fs.appendFile(logFile, JSON.stringify(entry) + '\n', 'utf8');
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
