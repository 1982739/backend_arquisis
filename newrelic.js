/** newrelic.js **/
'use strict'
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'Node.js API (Default)'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  allow_all_headers: true,
  enabled: !!process.env.NEW_RELIC_LICENSE_KEY // Solo habilita si la clave existe
}