async function soraCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, { 
        text: "Désolé, la génération de vidéo via Sora (IA) n'est pas encore disponible gratuitement et de manière stable. Cette fonctionnalité est actuellement désactivée." 
    }, { quoted: message });
}

module.exports = soraCommand;


