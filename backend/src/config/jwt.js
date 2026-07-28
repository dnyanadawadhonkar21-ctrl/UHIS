module = module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'uhis_super_secret_jwt_key_2026_production_ready',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};
