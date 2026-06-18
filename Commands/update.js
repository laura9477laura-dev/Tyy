// Commande .update désactivée pour sécurité
// L'URL d'update pointait vers le repo original (mruniquehacker).
// Pour réactiver, configure settings.updateZipUrl avec ton propre repo.

async function updateCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, {
        text: '⚠️ La commande .update est désactivée.\nContacte le propriétaire du bot pour les mises à jour.'
    }, { quoted: message });
}

module.exports = updateCommand;
