const fs = require('fs-extra');
const path = require('path');

/**
 * Database Service to abstract JSON file management.
 * Designed to be easily replaceable by a real database (SQLite/PostgreSQL) later.
 */
class Database {
    constructor(folder = './data') {
        this.folder = folder;
        this.cache = new Map();
        fs.ensureDirSync(this.folder);
    }

    _getPath(key) {
        return path.join(this.folder, `${key}.json`);
    }

    async get(key, defaultValue = {}) {
        if (this.cache.has(key)) return this.cache.get(key);
        
        const filePath = this._getPath(key);
        if (!await fs.exists(filePath)) {
            await this.set(key, defaultValue);
            return defaultValue;
        }
        try {
            const data = await fs.readJson(filePath);
            this.cache.set(key, data);
            return data;
        } catch (error) {
            console.error(`Database error reading ${key}:`, error);
            return defaultValue;
        }
    }

    async set(key, value) {
        this.cache.set(key, value);
        const filePath = this._getPath(key);
        try {
            await fs.writeJson(filePath, value, { spaces: 2 });
            return true;
        } catch (error) {
            console.error(`Database error writing ${key}:`, error);
            return false;
        }
    }

    // Specialized methods for common tasks
    async isBanned(jid) {
        const banned = await this.get('banned', []);
        return banned.includes(jid);
    }

    async ban(jid) {
        const banned = await this.get('banned', []);
        if (!banned.includes(jid)) {
            banned.push(jid);
            return await this.set('banned', banned);
        }
        return true;
    }

    async unban(jid) {
        const banned = await this.get('banned', []);
        const index = banned.indexOf(jid);
        if (index > -1) {
            banned.splice(index, 1);
            return await this.set('banned', banned);
        }
        return true;
    }
}

module.exports = new Database();
