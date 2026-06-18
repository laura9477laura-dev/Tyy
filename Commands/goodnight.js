const { goodnight } = require('../data/local_banks');

module.exports = async function goodnightCommand(sock, chatId, message) {
    const gn = goodnight[Math.floor(Math.random() * goodnight.length)];
    await sock.sendMessage(chatId, { text: gn }, { quoted: message });
};
