global.modules = [];
class Module {
    constructor(name, bot, callbacks, commands) {
        this.name = name;
        this.bot = bot;
        this.enabled = true;
        this.callbacks = callbacks;
        this.commands = commands;
        global.modules.push({ name: name, mod: this });
    }

    log(...args) {
        console.log(`[${this.name.toUpperCase()}]`, ...args);
    }

    disable() { this.enabled = false }
    enable() { this.enabled = true }
}

module.exports = { Module }
