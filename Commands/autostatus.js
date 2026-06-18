const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            serverMessageId: -1
        }
    }
};

// Path to store auto status configuration
const configPath = path.join(__dirname, '../data/autoStatus.json');

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ 
        enabled: false, 
        reactOn: false 
    }));
}

async function autoStatusCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    try {
        const senderId = m.key.participant || m.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!m.key.fromMe && !isOwner) {
            return await sock.sendMessage(chatId, { 
                text: '❌ This command can only be used by the owner!',
                ...channelInfo
            }, { quoted: m });
        }

        let config = await db.get('autoStatus', { enabled: false, reactOn: false });

        if (!args || args.length === 0) {
            const status = config.enabled ? 'enabled' : 'disabled';
            const reactStatus = config.reactOn ? 'enabled' : 'disabled';
            return await sock.sendMessage(chatId, { 
                text: `🔄 *Auto Status Settings*\n\n📱 *Auto Status View:* ${status}\n💫 *Status Reactions:* ${reactStatus}\n\n*Commands:*\n.autostatus on - Enable auto status view\n.autostatus off - Disable auto status view\n.autostatus react on - Enable status reactions\n.autostatus react off - Disable status reactions`,
                ...channelInfo
            }, { quoted: m });
        }

        const command = args[0].toLowerCase();
        
        if (command === 'on') {
            config.enabled = true;
            await db.set('autoStatus', config);
            await sock.sendMessage(chatId, { text: '✅ Auto status view enabled!', ...channelInfo }, { quoted: m });
        } else if (command === 'off') {
            config.enabled = false;
            await db.set('autoStatus', config);
            await sock.sendMessage(chatId, { text: '❌ Auto status view disabled!', ...channelInfo }, { quoted: m });
        } else if (command === 'react') {
            const reactCommand = args[1]?.toLowerCase();
            if (reactCommand === 'on') {
                config.reactOn = true;
                await db.set('autoStatus', config);
                await sock.sendMessage(chatId, { text: '💫 Status reactions enabled!', ...channelInfo }, { quoted: m });
            } else if (reactCommand === 'off') {
                config.reactOn = false;
                await db.set('autoStatus', config);
                await sock.sendMessage(chatId, { text: '❌ Status reactions disabled!', ...channelInfo }, { quoted: m });
            }
        }
    } catch (error) {
        console.error('Error in autostatus command:', error);
    }
}

// Function to check if auto status is enabled
async function isAutoStatusEnabled() {
    const config = await db.get('autoStatus', { enabled: false });
    return config.enabled;
}

// Function to check if status reactions are enabled
async function isStatusReactionEnabled() {
    const config = await db.get('autoStatus', { reactOn: false });
    return config.reactOn;
}

// Function to react to status using proper method
async function reactToStatus(sock, statusKey) {
    try {
        if (!await isStatusReactionEnabled()) return;
        
        await sock.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: '💚'
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
    } catch (error) {
        console.error('❌ Error reacting to status:', error.message);
    }
}

// Function to handle status updates
async function handleStatusUpdate(sock, status) {
    try {
        if (!await isAutoStatusEnabled()) return;

        await new Promise(resolve => setTimeout(resolve, 1000));

        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                await sock.readMessages([msg.key]);
                await reactToStatus(sock, msg.key);
            }
        }
    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}

module.exports = {
    name: 'autostatus',
    category: 'owner',
    execute: autoStatusCommand,
    handleStatusUpdate
}; 