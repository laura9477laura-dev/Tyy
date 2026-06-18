const axios = require('axios');

async function imagineCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const prompt = text.split(' ').slice(1).join(' ').trim();

        if (!prompt) {
            await sock.sendMessage(chatId, { text: 'Veuillez fournir une description pour générer l\'image.\nExemple : .imagine un coucher de soleil sur les montagnes' }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '🎨 Génération de votre image en cours... Veuillez patienter.' }, { quoted: message });

        try {
            const response = await axios.get(`https://api.siputzx.my.id/api/ai/flux-dev?prompt=${encodeURIComponent(prompt)}`, {
                responseType: 'arraybuffer'
            });

            const imageBuffer = Buffer.from(response.data);
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: `🎨 Image générée pour : "${prompt}"\n\n> *_Généré par LIO 229_*`
            }, { quoted: message });
        } catch (apiError) {
            throw new Error('Échec de l\'API');
        }

    } catch (error) {
        console.error('Error in imagine command:', error);
        await sock.sendMessage(chatId, { text: '❌ Échec de la génération d\'image. Réessayez plus tard.' }, { quoted: message });
    }
}

module.exports = imagineCommand; 
 