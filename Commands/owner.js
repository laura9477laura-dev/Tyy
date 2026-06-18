const settings = require('../settings');

async function ownerCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${settings.botOwner}
TEL;waid=${settings.ownerNumber}:${settings.ownerNumber}
END:VCARD
`;

    await sock.sendMessage(chatId, {
        contacts: { displayName: settings.botOwner, contacts: [{ vcard }] },
    }, { quoted: m });
}

module.exports = {
    name: 'owner',
    category: 'general',
    execute: ownerCommand
};
