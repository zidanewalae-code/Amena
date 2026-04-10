// Exposes a simple health endpoint used by uptime probes and smoke tests.
function health(req, res) {
  return res.status(200).send('OK');
}

module.exports = { health };
