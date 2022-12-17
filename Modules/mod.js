global.modules = [];
class Module {
    constructor(name, bot, callbacks, commands) {
        this.name = name;
        this.bot = bot;
        this.enabled = true;
        this.callbacks = callbacks;
        this.commands = commands;
        this.canLog = true;
        
        this.configureCommands();
        global.modules.push({ name: name, mod: this });
    }

    configureCommands() {
        this.commands.push({ name:`!enable${this.name.toLowerCase()}`, callback: this.enable });
        this.commands.push({ name:`!disable${this.name.toLowerCase()}`, callback: this.disable });
        this.commands.push({ name:`!enable${this.name.toLowerCase()}log`, callback: this.enableLog });
        this.commands.push({ name:`!disable${this.name.toLowerCase()}log`, callback: this.disableLog });
    }

    log(...args) {
        if(!this.canLog) return;
        console.log(`[${this.name}]`, args.join(", "));
    }


    disableLog(msg) {
        this.canLog = false
        msg.reply(`Log do Mod: ${this.name} desabilitado`);
    }
    enableLog(msg) {
        this.canLog = true
        msg.reply(`Log do Mod: ${this.name} habilitado`);
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
