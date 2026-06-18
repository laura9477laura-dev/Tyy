const { flirts } = require('../data/local_banks');

module.exports = async function flirtCommand(sock, chatId, message) {
    const flirt = flirts[Math.floor(Math.random() * flirts.length)];
    await sock.sendMessage(chatId, { text: `❤️ *Flirt* :\n\n"${flirt}"` }, { quoted: message });
};
