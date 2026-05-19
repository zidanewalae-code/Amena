// Provides lightweight structured logging for payment and checkout observability.
function log(level, event, data = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...data
  };

  if (level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}

module.exports = {
  info: (event, data) => log('info', event, data),
  warn: (event, data) => log('warn', event, data),
  error: (event, data) => log('error', event, data)
};
