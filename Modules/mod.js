global.modules = { }
class Module {
    constructor(name, bot, callbacks, commands) {
        this.name = name;
        this.bot = bot;
        this.enabled = false;
        this.callbacks = callbacks;
        this.commands = commands;
        global.modules[name] = this;
    }

    disable() { this.enabled = false }
    enable() { this.enabled = true }
}

module.exports = { Module }
