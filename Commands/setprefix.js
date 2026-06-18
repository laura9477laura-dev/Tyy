const settings = require('../settings');
const db = require('../lib/database');

/**
 * Change Command Prefix
 * Updates the prefix in the database and current session.
 */
async function setprefixCommand(sock, m, args) {
    const newPrefix = args[0];

    if (!newPrefix || newPrefix.length > 3) {
        return await sock.sendMessage(m.key.remoteJid, { 
            text: "❌ Veuillez fournir un nouveau préfixe (max 3 caractères).\nExemple: .setprefix !" 
        }, { quoted: m });
    }

    try {
        // Update database
        const config = await db.get('settings', {});
        config.prefix = newPrefix;
        await db.set('settings', config);

        // Update current runtime settings
        settings.prefix = newPrefix;

        await sock.sendMessage(m.key.remoteJid, { 
            text: `✅ Préfixe mis à jour avec succès !\nNouveau préfixe : *${newPrefix}*` 
        }, { quoted: m });

    } catch (error) {
        console.error('Setprefix Error:', error);
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Erreur lors du changement de préfixe." }, { quoted: m });
    }
}

module.exports = {
    name: 'setprefix',
    description: 'Changer le préfixe des commandes',
    category: 'owner',
    execute: setprefixCommand
};
