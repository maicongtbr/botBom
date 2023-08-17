const { Client, MessageMedia, LocalAuth, AuthStrategy, MessageAck, List } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { callbackMap, commandsMap } = require('./callback.js');
const { getNextLevelExp } = require('./level system');
const db = require('./database');
const { getGroup, sendSticker, getRandomInt } = require('./libs');


const PokemonModule = require("./Modules/Pokemon/integration");

const EpicFreeGameModule = require("./Modules/freeGames/main");

const exp = [
    {
        date: new Date("2022-11-27 00:00:00"),
        multiplyer: 2.0
    }
]

process.on("uncaughtException", (e) => {
    let currentdate = new Date();
    let timestamp = currentdate.getDate() + "/"
        + (currentdate.getMonth()+1)  + "/" 
        + currentdate.getFullYear() + " @ "  
        + currentdate.getHours() + ":"  
        + currentdate.getMinutes() + ":" 
        + currentdate.getSeconds();

    console.warn("\n\n" + timestamp + "[ERRO]:\n" + e + "\n\n");
})

const getExpMultply = () => {
    var date = new Date();

    for (var i = 0; i < exp.length; i++){
        var selectedBonus = exp[i];
        if (selectedBonus.date>date) {
            return selectedBonus.multiplyer
        }
    }
    return 1.0;
}

const bot = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    ffmpegPath: '/usr/bin/ffmpeg',
    authStrategy: new LocalAuth(),
})

bot.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
})

bot.on('auth_failure', () => {
    console.log('FALHA NA AUTENTICAÇÃO')
})

bot.on('authenticated', () => {
    console.log('AUTENTICADO COM SUCESSO')
})

bot.on('disconnected', () => {
    console.log('BOT DESCONECTADO')
})

bot.on('ready', async () => {
    console.log("BOT ONLINE")
    await PokemonModule.initPokemonModule(bot);
    EpicFreeGameModule.init(bot);
})

bot.on('group_leave', (notification) => {
    var stickersSaiu = 
    ['./img/saiu.webp',
    './img/saiu2.webp',
    './img/saiu3.webp'];
    sendSticker(notification, stickersSaiu[getRandomInt(3)]);
});

const msgCallback = (msg, group) => {
    for (value of callbackMap) {
        var key = value[0];
        if (msg.body.toLowerCase().includes(key)) {
            var _callback = value[1];
            _callback(msg, bot);
            return;
        }
    }

    if(!group) {bot.sendMessage(msg.from, 'Use *!comandos* para ver a lista de comandos.');
    }
}

bot.on('message', async msg => {
    try {
        var group = await getGroup(msg);
        if (msg.body.startsWith('!')){
            global.modules.forEach(e => {
                e.mod.commands.forEach(e => {
                    if(msg.body.toLowerCase().includes(`${e.name} `) || msg.body == e.name) {
                        e.callback(msg);
                    }
                })
            });

            for (value of commandsMap) {
                var key = value[0];
                if (msg.body.toLowerCase().includes(`${key} `) || msg.body == key) {
                    var _callback = value[1];
                    _callback(msg, bot);
                    break;
                }
            }
        } else {
            msgCallback(msg, group);
        }
        //Coleta de EXP
        if (group) {
            var groupId = group.id._serialized;
            var groupName = group.name;
            let contact = await msg.getContact();
            var userName = contact.name ? contact.name : contact.pushname;
            var expMultiplier = getExpMultply();

            const Exp = db.getModel('Experiencia');

            Exp.findOne({
                id: msg.author,
                group: groupId
            }).then(async user => {
                if (user) {
                    let newExp = user.exp + (1 * expMultiplier);
                    let level = user.level;
                    let nextLevelExp = user.nextLevelExp ? user.nextLevelExp : getNextLevelExp(user.level + 1);
                    if (newExp >= getNextLevelExp(user.level + 1)) {
                        level = level + 1;
                        newExp = 0;
                        nextLevelExp = getNextLevelExp(level);
                        bot.sendMessage(msg.from, `🌟*Parabéns! ${userName}*🌟\n\nVocê subiu para o *level ${level}*`)
                    }
        
                    Exp.updateOne({
                        id: msg.author,
                        group: groupId
                    }, {
                        exp: newExp, 
                        level,
                        userName,
                        group: groupId,
                        groupName,
                        nextLevelExp
                    }).then(x => {}).catch(console.error);
                }
                else {
                    Exp.create({ 
                        id: msg.author,
                        userName,
                        exp: 1,
                        level: 1,
                        group: groupId,
                        groupName,
                        nextLevelExp: getNextLevelExp(2)

                    }).catch(console.error);
                }
            })
        }

        global.modules.forEach(e => {
            if(e.mod.enabled) {
                if(e.mod.callbacks.onMessage){
                    e.mod.callbacks.onMessage(msg);
                }
            }
        })
    } catch (err) {
        console.log('_____________________________________________________________\n' + err + '\n_____________________________________________________________\n');
    }
});


bot.initialize();
