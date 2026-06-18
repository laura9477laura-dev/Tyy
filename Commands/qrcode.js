const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * QR Code Generator Command
 * Converts text or URLs into a QR Code image.
 */
async function qrcodeCommand(sock, chatId, message) {
    const body = (message.message?.conversation || message.message?.extendedTextMessage?.text || '').trim();
    const text = body.split(' ').slice(1).join(' ');

    if (!text) {
        return await sock.sendMessage(chatId, { 
            text: "❌ Veuillez fournir un texte ou un lien à convertir en QR Code.\nExemple: .qr https://google.com" 
        }, { quoted: message });
    }

    const tempPath = path.join(process.cwd(), 'temp', `qr_${Date.now()}.png`);

    try {
        // Generate QR Code as file
        await QRCode.toFile(tempPath, text, {
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 500
        });

        // Send image
        await sock.sendMessage(chatId, {
            image: fs.readFileSync(tempPath),
            caption: `✅ *QR Code généré avec succès*\n📝 *Contenu* : ${text.length > 50 ? text.substring(0, 50) + '...' : text}`
        }, { quoted: message });

        // Cleanup
        setTimeout(() => {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }, 5000);

    } catch (error) {
        console.error('QR Error:', error);
        await sock.sendMessage(chatId, { text: "❌ Erreur lors de la génération du QR Code." }, { quoted: message });
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
}

module.exports = qrcodeCommand;
