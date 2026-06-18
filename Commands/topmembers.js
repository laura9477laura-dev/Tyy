const db = require('../lib/database');

async function incrementMessageCount(groupId, userId) {
    const messageCounts = await db.get('messageCount', { isPublic: true, messageCount: {} });
    
    if (!messageCounts.messageCount) messageCounts.messageCount = {};
    if (!messageCounts.messageCount[groupId]) {
        messageCounts.messageCount[groupId] = {};
    }

    if (!messageCounts.messageCount[groupId][userId]) {
        messageCounts.messageCount[groupId][userId] = 0;
    }

    messageCounts.messageCount[groupId][userId] += 1;

    await db.set('messageCount', messageCounts);
}

async function topMembers(sock, chatId, isGroup) {
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: 'This command is only available in group chats.' });
        return;
    }

    const data = await db.get('messageCount', { isPublic: true, messageCount: {} });
    const groupCounts = data.messageCount ? data.messageCount[chatId] || {} : {};

    const sortedMembers = Object.entries(groupCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Get top 10 members

    if (sortedMembers.length === 0) {
        await sock.sendMessage(chatId, { text: 'No message activity recorded yet.' });
        return;
    }

    let message = '🏆 *Top Members Based on Message Count*:\n\n';
    sortedMembers.forEach(([userId, count], index) => {
        message += `${index + 1}. @${userId.split('@')[0]} - *${count}* messages\n`;
    });

    await sock.sendMessage(chatId, { text: message, mentions: sortedMembers.map(([userId]) => userId) });
}

module.exports = { incrementMessageCount, topMembers };
