const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require('fs-extra')
const path = require('path')

async function getNativePairCode(number) {
    return new Promise(async (resolve, reject) => {
        const sessionPath = `./session_pair/${number}`
        if (fs.existsSync(sessionPath)) {
            await fs.remove(sessionPath)
        }
        
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
        
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"]
        })

        if (!sock.authState.creds.registered) {
            try {
                await delay(2000)
                const code = await sock.requestPairingCode(number)
                const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code
                
                // Auto-close after 60s if not used
                setTimeout(async () => {
                    try {
                        sock.ev.removeAllListeners()
                        sock.ws.close()
                    } catch (e) {}
                }, 60000)

                resolve(formattedCode)
            } catch (error) {
                reject(error)
            }
        } else {
            reject(new Error("Number already registered in this session"))
        }

        sock.ev.on('creds.update', saveCreds)
        
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update
            if (connection === 'open') {
                console.log(`[NativePair] ${number} connected successfully`)
                // Handle successful connection if needed
            }
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode
                if (reason !== DisconnectReason.loggedOut) {
                    // Closed but not logged out
                } else {
                    await fs.remove(sessionPath)
                }
            }
        })
    })
}

module.exports = { getNativePairCode }