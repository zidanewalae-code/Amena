// Generic ownership middleware factory
// usage: requireOwnership('Don', 'donor_id')
const models = require('../models');

function requireOwnership(modelName, ownerKey = 'user_id') {
  return async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    const Model = models[modelName];
    if (!Model) return res.status(500).json({ message: 'Model not found' });
    try {
      const instance = await Model.findByPk(id);
      if (!instance) return res.status(404).json({ message: `${modelName} not found` });
      // ownerKey can be a field on the instance that references the user's id
      if (instance[ownerKey] !== user.user_id && user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.instance = instance;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireOwnership };
