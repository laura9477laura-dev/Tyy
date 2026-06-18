const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const settings = require('./settings');
const db = require('./lib/database');
const commandLoader = require('./lib/commandLoader');
const antiBan = require('./lib/antiBan');

// Import utilities
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const isAdmin = require('./lib/isAdmin');
const { Antilink } = require('./lib/antilink');
const { handleBadwordDetection } = require('./lib/antibadword');
const { handleChatbotResponse } = require('./commands/chatbot');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const { handleJoinEvent } = require('./commands/welcome');
const { handleLeaveEvent } = require('./commands/goodbye');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const { handleStatusUpdate } = require('./commands/autostatus');
const { handleAutoread } = require('./commands/autoread');
const { handleAutotypingForMessage } = require('./commands/autotyping');
const { handleTagDetection } = require('./commands/antitag');
const { handleMentionDetection } = require('./commands/mention');
const { incrementMessageCount } = require('./commands/topmembers');
const { readState: readPmBlockerState } = require('./commands/pmblocker');

// Load commands once
commandLoader.loadCommands();

// Temp cleanup logic (Professionalized)
const cleanupTemp = () => {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    fs.readdir(tempDir, (err, files) => {
        if (err) return;
        let count = 0;
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            fs.stat(filePath, (err, stats) => {
                if (!err && Date.now() - stats.mtimeMs > 60 * 60 * 1000) { // 1 hour instead of 3
                    fs.unlink(filePath, () => {});
                    count++;
                }
            });
        }
        if (count > 0) console.log(chalk.blue(`🧹 Cleaned ${count} files from temp.`));
    });
};
setInterval(cleanupTemp, 30 * 60 * 1000); // Every 30 mins

async function handleMessages(sock, messageUpdate) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const m = messages[0];
        if (!m?.message) return;

        // --- ANTIBAN: Malicious Payload Filter ---
        const body = (
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            ''
        ).trim();

        if (antiBan.isMalicious(body)) {
            console.warn(`[ANTIBAN] Malicious message detected from ${m.key.participant || m.key.remoteJid}. Ignoring.`);
            return;
        }

        // Auto-read and Storage
        await handleAutoread(sock, m);
        if (m.message) storeMessage(sock, m);

        // Anti-delete check
        if (m.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, m);
            return;
        }

        const chatId = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        
        // Identity checks
        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);
        const isBotOwner = m.key.fromMe || senderIsOwnerOrSudo;

        const prefix = settings.prefix || '.';
        const isCmd = body.startsWith(prefix);
        const commandText = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);

        // Banned check
        if (await db.isBanned(senderId) && commandText !== 'unban') return;

        // Stats
        if (!m.key.fromMe) await incrementMessageCount(chatId, senderId);

        // Group Protections
        if (isGroup) {
            if (body) await handleBadwordDetection(sock, chatId, m, body.toLowerCase(), senderId);
            await Antilink(m, sock);
        }

        // PM Blocker
        if (!isGroup && !m.key.fromMe && !senderIsSudo) {
            const pmState = readPmBlockerState();
            if (pmState.enabled) {
                await sock.sendMessage(chatId, { text: pmState.message || 'PMs are currently blocked.' });
                setTimeout(async () => { try { await sock.updateBlockStatus(chatId, 'block'); } catch (e) {} }, 1000);
                return;
            }
        }

        // Automated responses & detections
        if (!isCmd) {
            await handleAutotypingForMessage(sock, chatId, body);
            if (isGroup) {
                await handleTagDetection(sock, chatId, m, senderId);
                await handleMentionDetection(sock, chatId, m);
                
                const msgCountData = await db.get('messageCount', { isPublic: true });
                if (msgCountData.isPublic || isBotOwner) {
                    await handleChatbotResponse(sock, chatId, m, body, senderId);
                }
            }
            return;
        }

        // Command Execution
        const command = commandLoader.getCommand(commandText);
        if (!command) return;

        // Permission checks
        const msgCountData = await db.get('messageCount', { isPublic: true });
        if (!msgCountData.isPublic && !isBotOwner) return;

        // Admin checks for specific commands
        const adminCmds = ['mute', 'unmute', 'ban', 'unban', 'promote', 'demote', 'kick', 'tagall', 'tagnotadmin', 'hidetag', 'antilink', 'antitag', 'setgdesc', 'setgname', 'setgpp'];
        const ownerCmds = ['mode', 'autostatus', 'antidelete', 'cleartmp', 'setpp', 'clearsession', 'areact', 'autoreact', 'autotyping', 'autoread', 'pmblocker', 'sudo'];

        if (isGroup && adminCmds.includes(commandText)) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            if (!adminStatus.isBotAdmin) {
                return sock.sendMessage(chatId, { text: '❌ I need to be an administrator to perform this action.' }, { quoted: m });
            }
            if (!adminStatus.isSenderAdmin && !m.key.fromMe) {
                return sock.sendMessage(chatId, { text: '❌ This command is restricted to group administrators.' }, { quoted: m });
            }
        }

        if (ownerCmds.includes(commandText) && !isBotOwner) {
            return sock.sendMessage(chatId, { text: '❌ This command is reserved for the bot owner.' }, { quoted: m });
        }

        // Execute Command
        console.log(chalk.cyan(`[COMMAND] ${commandText} from ${senderId} in ${chatId}`));
        
        await command.execute(sock, m, args);

    } catch (error) {
        console.error(chalk.red('❌ Error in handleMessages:'), error);
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, action, participants, author } = update;
        if (!id.endsWith('@g.us')) return;

        // --- ANTIBAN: Group Trap Protection ---
        // If the bot is added to a group by someone who is NOT owner/sudo, it leaves immediately.
        if (action === 'add' && participants.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net')) {
            const senderIsOwnerOrSudo = await isOwnerOrSudo(author, sock, id);
            if (!senderIsOwnerOrSudo && author !== undefined) {
                console.warn(`[ANTIBAN] Added to group ${id} by non-sudo user ${author}. Leaving...`);
                await sock.groupLeave(id);
                return;
            }
        }

        switch(action) {
            case 'add': await handleJoinEvent(sock, id, participants); break;
            case 'remove': await handleLeaveEvent(sock, id, participants); break;
            case 'promote': await handlePromotionEvent(sock, id, participants, author); break;
            case 'demote': await handleDemotionEvent(sock, id, participants, author); break;
        }
    } catch (error) {
        console.error(chalk.red('Error GroupUpdate:'), error);
    }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    }
};
