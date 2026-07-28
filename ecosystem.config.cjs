module.exports = {
  apps: [{
    name: 'cs-api',
    script: './server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env_file: './.env',
    env: {
      NODE_ENV: 'production',
      PORT: 90
    }
  }]
};
