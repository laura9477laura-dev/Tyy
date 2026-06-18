const settings = require("../settings");
const fs = require('fs');
const path = require('path');

async function aliveCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    try {
        const msg = `*🤖 ${settings.botName || 'LIO 229'} est en ligne !*\n\n` +
                    `📌 *Version* : ${settings.version}\n` +
                    `🟢 *Statut* : Opérationnel\n` +
                    `🌐 *Mode* : ${settings.commandMode || 'public'}\n\n` +
                    `_Tapez .menu pour voir mes commandes._`;

        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, { 
                image: fs.readFileSync(imagePath), 
                caption: msg 
            }, { quoted: m });
        } else {
            await sock.sendMessage(chatId, { text: msg }, { quoted: m });
        }
    } catch (error) {
        await sock.sendMessage(chatId, { text: 'Je suis en vie et prêt !' }, { quoted: m });
    }
}

module.exports = {
    name: 'alive',
    category: 'general',
    execute: aliveCommand
};