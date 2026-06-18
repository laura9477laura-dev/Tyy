const { truths } = require('../data/local_banks');

module.exports = async function truthCommand(sock, chatId, message) {
    const truth = truths[Math.floor(Math.random() * truths.length)];
    await sock.sendMessage(chatId, { text: `🧐 *Vérité* :\n\n"${truth}"` }, { quoted: message });
};
