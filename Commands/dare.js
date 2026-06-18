const { dares } = require('../data/local_banks');

module.exports = async function dareCommand(sock, chatId, message) {
    const dare = dares[Math.floor(Math.random() * dares.length)];
    await sock.sendMessage(chatId, { text: `🔥 *Défi* :\n\n"${dare}"` }, { quoted: message });
};
