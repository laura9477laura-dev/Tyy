const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class CommandLoader {
    constructor() {
        this.commands = new Map();
        this.aliases = new Map();
    }

    loadCommands(directory = './commands') {
        const commandFiles = fs.readdirSync(directory).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const filePath = path.join(process.cwd(), directory, file);
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);

                // Handle professional object-based format
                if (typeof command === 'object' && command.name) {
                    this.commands.set(command.name.toLowerCase(), command);
                    if (command.aliases && Array.isArray(command.aliases)) {
                        command.aliases.forEach(alias => this.aliases.set(alias.toLowerCase(), command.name.toLowerCase()));
                    }
                } 
                // Handle legacy function-based format (compatible with current codebase)
                else if (typeof command === 'function') {
                    const commandName = file.split('.')[0].toLowerCase();
                    this.commands.set(commandName, {
                        name: commandName,
                        execute: command,
                        category: 'general',
                        legacy: true
                    });
                }
            } catch (error) {
                console.error(chalk.red(`Failed to load command ${file}:`), error);
            }
        }

        console.log(chalk.green(`✅ Loaded ${this.commands.size} commands.`));
    }

    getCommand(name) {
        name = name.toLowerCase();
        const commandName = this.aliases.get(name) || name;
        return this.commands.get(commandName);
    }
}

module.exports = new CommandLoader();
