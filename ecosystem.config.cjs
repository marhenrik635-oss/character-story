module.exports = {
  apps: [{
    name: 'cs-api',
    script: './server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 90,
      XOFTWARE_API_KEY: 'YOUR_API_KEY_HERE',
      AI_ENDPOINT: 'https://rnrbmqc.abc-tunnel.us/v1/chat/completions',
      AI_MODEL: 'Vitalwounds'
    }
  }]
};
