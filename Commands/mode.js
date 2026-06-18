const db = require('../lib/database');

/**
 * .mode public/private
 * Switches the bot between public mode (everyone can use) and private mode (only owner/sudo).
 */
async function modeCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    
    if (!args[0]) {
        const data = await db.get('messageCount', { isPublic: true });
        return sock.sendMessage(chatId, { text: `Current mode: *${data.isPublic ? 'Public' : 'Private'}*\nUsage: .mode public/private` }, { quoted: m });
    }

    const mode = args[0].toLowerCase();
    if (mode === 'public') {
        await db.set('messageCount', { isPublic: true, messageCount: (await db.get('messageCount')).messageCount || {} });
        await sock.sendMessage(chatId, { text: '✅ Mode set to *Public*. Everyone can use the bot.' }, { quoted: m });
    } else if (mode === 'private') {
        await db.set('messageCount', { isPublic: false, messageCount: (await db.get('messageCount')).messageCount || {} });
        await sock.sendMessage(chatId, { text: '✅ Mode set to *Private*. Only owner and sudo users can use the bot.' }, { quoted: m });
    } else {
        await sock.sendMessage(chatId, { text: '❌ Invalid mode. Use *public* or *private*.' }, { quoted: m });
    }
}

module.exports = {
    name: 'mode',
    category: 'owner',
    execute: modeCommand
};
