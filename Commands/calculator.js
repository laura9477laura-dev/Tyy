const settings = require('../settings');

/**
 * Safe Calculator Command
 * Logic: Simple regex-based evaluation to avoid security risks of eval()
 */
async function calculatorCommand(sock, chatId, message) {
    const body = (message.message?.conversation || message.message?.extendedTextMessage?.text || '').trim();
    const args = body.split(' ').slice(1).join(' ');

    if (!args) {
        return await sock.sendMessage(chatId, { 
            text: `❌ Veuillez fournir un calcul.\nExemple: ${settings.prefix}calc 5 + 5` 
        }, { quoted: message });
    }

    try {
        // Remove spaces and validate input (only numbers and basic operators)
        const expression = args.replace(/\s+/g, '');
        if (!/^[0-9+\-*/().]+$/.test(expression)) {
            return await sock.sendMessage(chatId, { 
                text: "❌ Expression invalide. Utilisez uniquement des chiffres et + - * / ( ) ." 
            }, { quoted: message });
        }

        // Safe evaluation using Function constructor (limited scope)
        // In a real pro env, we would use 'mathjs', but this is a lightweight native way.
        const result = new Function(`return ${expression}`)();

        const response = `
🔢 *CALCULATRICE*
────────────────
📝 *Calcul* : ${args}
✅ *Résultat* : *${result}*
────────────────
`.trim();

        await sock.sendMessage(chatId, { text: response }, { quoted: message });

    } catch (error) {
        await sock.sendMessage(chatId, { text: "❌ Erreur de calcul. Vérifiez votre expression." }, { quoted: message });
    }
}

module.exports = calculatorCommand;
