const { handleAreactCommand } = require('../lib/reactions');
const isOwnerOrSudo = require('../lib/isOwner');

/**
 * .areact on/off
 * Controls auto-reactions to commands.
 */
async function areactCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    const senderId = m.key.participant || m.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    
    // Bridge to the existing handler in lib/reactions.js
    // Note: lib/reactions.js expects the full message object and re-parses args internally
    await handleAreactCommand(sock, chatId, m, isOwner);
}

module.exports = {
    name: 'areact',
    aliases: ['autoreact'],
    category: 'owner',
    execute: areactCommand
};
