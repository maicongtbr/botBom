global.modules = [];
class Module {
    constructor(name, bot, callbacks, commands) {
        this.name = name;
        this.bot = bot;
        this.enabled = true;
        this.callbacks = callbacks;
        this.commands = commands;
        this.commands.push({ name:`!enable${name}`, callback: this.enable });
        this.commands.push({ name:`!disable${name}`, callback: this.disable });
        global.modules.push({ name: name, mod: this });
    }

    log(...args) {
        console.log(`[${this.name.toUpperCase()}]`, ...args);
    }

    disable(msg) {
        this.enabled = false
        msg.reply(`Mod: ${this.name} desabilitado`);
    }
    enable(msg) {
        this.enabled = true
        msg.reply(`Mod: ${this.name} habilitado`);
    }
}

module.exports = { Module }
