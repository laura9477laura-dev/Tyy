const settings = require('../settings.js');

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${days}j ${hours}h ${minutes}m ${seconds}s`.trim();
}

async function pingCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    try {
        const start = Date.now();
        const { key } = await sock.sendMessage(chatId, { text: 'Calcul du ping...' }, { quoted: m });
        const end = Date.now();
        const ping = end - start;

        const uptime = formatTime(process.uptime());

        const botInfo = `
🚀 *Vitesse* : ${ping} ms
⏱️ *En ligne* : ${uptime}
🔖 *Version* : ${settings.version}
`.trim();

        await sock.sendMessage(chatId, { text: botInfo, edit: key });

    } catch (error) {
        await sock.sendMessage(chatId, { text: '❌ Erreur lors du ping.' }, { quoted: m });
    }
}

module.exports = {
    name: 'ping',
    category: 'general',
    execute: pingCommand
};