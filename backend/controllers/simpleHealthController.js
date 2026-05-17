function health(req, res) {
  return res.status(200).json({ status: 'ok', service: 'amena-crud-backend' });
}

module.exports = { health };