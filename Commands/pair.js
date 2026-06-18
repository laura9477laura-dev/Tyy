const { getNativePairCode } = require('../lib/nativePair');
const { sleep } = require('../lib/myfunc');

async function pairCommand(sock, chatId, message, q) {
    try {
        if (!q) {
            return await sock.sendMessage(chatId, {
                text: "Veuillez fournir un numéro WhatsApp valide.\nExemple : .pair 33612345678",
            });
        }

        const numbers = q.split(',')
            .map((v) => v.replace(/[^0-9]/g, ''))
            .filter((v) => v.length > 5 && v.length < 20);

        if (numbers.length === 0) {
            return await sock.sendMessage(chatId, {
                text: "Numéro invalide ❌ Veuillez utiliser le bon format !",
            });
        }

        for (const number of numbers) {
            const whatsappID = number + '@s.whatsapp.net';
            const result = await sock.onWhatsApp(whatsappID);

            if (!result[0]?.exists) {
                return await sock.sendMessage(chatId, {
                    text: `Le numéro ${number} n'est pas enregistré sur WhatsApp ❗️`,
                });
            }

            await sock.sendMessage(chatId, {
                text: "Veuillez patienter un instant pour le code de jumelage...",
            });

            try {
                const code = await getNativePairCode(number);

                if (code) {
                    await sleep(2000);
                    await sock.sendMessage(chatId, {
                        text: `Votre code de jumelage : *${code}*`,
                    });
                } else {
                    throw new Error('Code non généré');
                }
            } catch (apiError) {
                console.error('Erreur NativePair:', apiError);
                await sock.sendMessage(chatId, {
                    text: "Échec de la génération du code. Veuillez réessayer plus tard.",
                });
            }
        }
    } catch (error) {
        console.error(error);
        await sock.sendMessage(chatId, {
            text: "Une erreur est survenue lors du jumelage.",
        });
    }
}

module.exports = pairCommand; 
 