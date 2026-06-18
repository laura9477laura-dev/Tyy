const { quotes } = require('../data/local_banks');

module.exports = async function quoteCommand(sock, chatId, message) {
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    await sock.sendMessage(chatId, { text: `📜 *Citation du jour* :\n\n"${quote}"` }, { quoted: message });
};
