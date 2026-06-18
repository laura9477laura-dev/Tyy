/**
 * LIO 229 - Bot WhatsApp
 * Entry Point
 */
require('dotenv').config();
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    delay,
    jidNormalizedUser,
    Browsers
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const chalk = require("chalk");
const fs = require('fs');
const { rmSync } = fs;
const NodeCache = require("node-cache");
const readline = require("readline");

const settings = require('./settings');
const db = require('./lib/database');
const antiBan = require('./lib/antiBan');
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const store = require('./lib/lightweight_store');

// Initialize Store
store.readFromFile();
setInterval(() => store.writeToFile(), settings.storeWriteInterval);

const logger = pino({ level: 'silent' });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    // Load dynamic prefix from DB
    const config = await db.get('settings', {});
    if (config.prefix) {
        settings.prefix = config.prefix;
    }

    console.log(chalk.cyan(`\n🚀 Starting ${settings.botName} v${settings.version}...\n`));
    console.log(chalk.blue(`📌 Current Prefix: ${settings.prefix || '.'}\n`));

    // Ensure essential directories exist for Cloud Hosting
    const dirs = ['./session', './data', './temp', './tmp'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(chalk.gray(`📁 Created directory: ${dir}`));
        }
    });

    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: !settings.ownerNumber, // Print QR if no number provided
        browser: Browsers.ubuntu("Chrome"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        msgRetryCounterCache: new NodeCache(),
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid);
            let msg = await store.loadMessage(jid, key.id);
            return msg?.message || undefined;
        }
    });

    // --- ANTIBAN: Wrap sock to include safety checks ---
    const originalSendMessage = sock.sendMessage.bind(sock);
    sock.sendMessage = async (jid, content, options) => {
        const canSend = await antiBan.preSendCheck(sock, jid, content);
        if (!canSend) return;
        return originalSendMessage(jid, content, options);
    };

    // Pair Code logic
    if (!sock.authState.creds.registered) {
        let phoneNumber = settings.ownerNumber;
        if (!phoneNumber) {
            phoneNumber = await question(chalk.yellow('Please enter your WhatsApp number (e.g., 22961000000): '));
        }
        
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(chalk.black(chalk.bgGreen(`\nPairing Code: ${code}\n`)));
            } catch (error) {
                console.error('Pairing Error:', error);
            }
        }, 3000);
    }

    // Events
    sock.ev.on('creds.update', saveCreds);
    store.bind(sock.ev);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'connecting') {
            console.log(chalk.yellow('🔄 Connecting to WhatsApp...'));
        }

        if (connection === 'open') {
            console.log(chalk.green(`✅ Connected as ${sock.user.name || sock.user.id}`));
            
            // Send startup message
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            await sock.sendMessage(botNumber, { 
                text: `🤖 *${settings.botName}* is online!\n\n📅 Date: ${new Date().toLocaleString()}\n🚀 Version: ${settings.version}`
            });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const errorMessage = lastDisconnect?.error?.message || 'Unknown';
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red(`❌ Connection closed. Status: ${statusCode} | Reason: ${errorMessage} | Reconnecting: ${shouldReconnect}`));

            if (statusCode === DisconnectReason.loggedOut) {
                rmSync('./session', { recursive: true, force: true });
                console.log(chalk.yellow('Session cleared. Please restart and re-authenticate.'));
                process.exit(1);
            }

            if (shouldReconnect) {
                startBot();
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        await handleMessages(sock, chatUpdate);
    });

    sock.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(sock, update);
    });

    sock.ev.on('status.update', async (status) => {
        await handleStatus(sock, status);
    });

    return sock;
}

// Global error handlers
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));

startBot();
