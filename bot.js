// Bot AFK Minecraft (Mineflayer) - auto reconnect + anti-AFK
const mineflayer = require('mineflayer');

const config = {
  host: process.env.MC_HOST || 'namaserver.aternos.me', // ganti dengan IP server kamu
  port: parseInt(process.env.MC_PORT || '25565'),
  username: process.env.MC_USER || 'AFK_Bot',
  version: process.env.MC_VERSION || false, // false = deteksi otomatis, atau isi mis. '1.20.4'
  auth: process.env.MC_AUTH || 'offline',   // 'offline' untuk server cracked, 'microsoft' untuk premium
  password: process.env.MC_PASS || '',      // isi jika server pakai /login (AuthMe)
  reconnectDelay: 10000,                    // jeda reconnect (ms)
};

function startBot() {
  console.log(`[${new Date().toLocaleTimeString()}] Menghubungkan ke ${config.host}:${config.port} ...`);

  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version,
    auth: config.auth,
  });

  let afkTimer = null;

  bot.once('spawn', () => {
    console.log('Bot berhasil masuk ke server!');

    // Login otomatis jika server pakai plugin auth
    if (config.password) {
      setTimeout(() => bot.chat(`/login ${config.password}`), 2000);
      setTimeout(() => bot.chat(`/register ${config.password} ${config.password}`), 3000);
    }

    // Anti-AFK: lompat, jalan, dan putar kepala secara acak
    afkTimer = setInterval(() => {
      const actions = ['forward', 'back', 'left', 'right'];
      const dir = actions[Math.floor(Math.random() * actions.length)];

      bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.6, true);
      bot.setControlState('jump', true);
      bot.setControlState(dir, true);

      setTimeout(() => {
        bot.setControlState('jump', false);
        bot.setControlState(dir, false);
      }, 600);

      if (Math.random() < 0.3) bot.swingArm('right');
    }, 15000);
  });

  bot.on('message', (msg) => console.log('[Chat]', msg.toString()));

  bot.on('death', () => {
    console.log('Bot mati, respawn...');
    bot.respawn?.();
  });

  const cleanup = (reason) => {
    if (afkTimer) clearInterval(afkTimer);
    console.log(`Terputus: ${reason}. Reconnect dalam ${config.reconnectDelay / 1000} detik...`);
    setTimeout(startBot, config.reconnectDelay);
  };

  let ended = false;
  bot.on('end', (reason) => { if (!ended) { ended = true; cleanup(reason); } });
  bot.on('kicked', (reason) => console.log('Di-kick:', reason));
  bot.on('error', (err) => console.log('Error:', err.message));
}

startBot();

process.on('uncaughtException', (err) => console.log('Uncaught:', err.message));
