const db = require('../lib/database');
const isAdmin = require('../lib/isAdmin');

async function banCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    const senderId = m.key.participant || m.key.remoteJid;

    if (isGroup) {
        const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isSenderAdmin && !m.key.fromMe) {
            return await sock.sendMessage(chatId, { text: '❌ Seuls les administrateurs peuvent bannir.' }, { quoted: m });
        }
    } else if (!m.key.fromMe) {
        // In private chat, only bot can "ban" (though it's more for global restriction)
        return;
    }

    let userToBan = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                    m.message?.extendedTextMessage?.contextInfo?.participant;
    
    if (!userToBan) {
        return await sock.sendMessage(chatId, { text: '❌ Mentionnez l\'utilisateur à bannir ou répondez à son message.' }, { quoted: m });
    }

    try {
        const bannedUsers = await db.get('banned', []);
        if (!bannedUsers.includes(userToBan)) {
            bannedUsers.push(userToBan);
            await db.set('banned', bannedUsers);
            await sock.sendMessage(chatId, { text: `✅ Utilisateur @${userToBan.split('@')[0]} banni avec succès.`, mentions: [userToBan] }, { quoted: m });
        } else {
            await sock.sendMessage(chatId, { text: 'ℹ️ Cet utilisateur est déjà banni.' }, { quoted: m });
        }
    } catch (error) {
        await sock.sendMessage(chatId, { text: '❌ Erreur lors du bannissement.' }, { quoted: m });
    }
}

module.exports = {
    name: 'ban',
    category: 'admin',
    execute: banCommand
};