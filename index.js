const { Client, MessageMedia, LocalAuth, AuthStrategy, MessageAck, List } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { callbackMap, commandsMap } = require('./callback.js');
const { getNextLevelExp } = require('./level system');
const db = require('./database');
const { getGroup } = require('./libs');
const { getGames } = require ('epic-free-games');


const PokemonModule = require("./Modules/Pokemon/integration");

const sendEpicFreeGames = async (bot) => {
    var interval
    var currentGameId
    var pastNextGameId
    var currentGamesInfo = [];
    var nextGamesInfo = [];

    var res = await getGames('BR', false)

    //salva o Id do jogo de graça da semana atual para a checagem do if abaixo
    currentGameId = res.currentGames[0][0].id;
    if(!pastNextGameId) {
        pastNextGameId = res.nextGames[0][0].id;
        return;
    }


    //se o Id do jogo de graça dessa semana for o mesmo do nextGame da semana passada
    if (currentGameId == pastNextGameId){ 
        res.currentGames.forEach(game => {
            currentGamesInfo.push(`🕹*${game.title}* \n🧾Descrição: ${game.description}\n`)
        })
        if(res.nextGames) {
            res.nextGames.forEach(game => {
                nextGamesInfo.push(`🕹*${game.title}* \n🧾Descrição: ${game.description}`)
            })
        }
        else {
            nextGamesInfo.push('Informação ainda não disponível');
        }

        bot.sendMessage('5521969164962-1519130052@g.us', `🎮*Jogos grátis na Epic hoje:* \n\n${currentGamesInfo.join('\n\n')}\n\n 🎮*Próximos jogos grátis na Epic:* \n\n${nextGamesInfo.join('\n\n')}`);

        pastNextGameId = res.nextGames[0][0].id; //atualiza o nextGame para o da semana atual
        interval = 10000//604700000 //7 dias de timeout
    }
    else {
        interval = 2000//7200000 //2h de timeout
    }
    
    setTimeout(sendEpicFreeGames, interval);
}

const exp = [
    {
        date: new Date("2022-11-27 00:00:00"),
        multiplyer: 2.0
    }
]

process.on("uncaughtException", (e) => {
    console.warn("\n\nIA CRASHAR EM\n\n_________\n\n"+e+"\n\n__________\n\n");
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
        executablePath: "/usr/bin/google-chrome-stable"
    },
    ffmpegPath: '/usr/bin/ffmpeg',
    authStrategy: new LocalAuth(),
})

const sendSticker = async (msg, filePath) => {
    var filePath;
    media = MessageMedia.fromFilePath(filePath);
    await bot.sendMessage(msg.from ? msg.from:msg.chatId, media, {
        sendMediaAsSticker:true
    })
}

const randomNumber = (max) => {
    return Math.floor(Math.random() * (max - 1 + 1));
}

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

bot.on('ready', () => {
    console.log("BOT ONLINE")
    PokemonModule.initPokemonModule(bot);
    sendEpicFreeGames(bot);
})

bot.on('group_leave', (notification) => {
    const stickersSaiu = 
    ['./img/saiu.webp',
    './img/saiu2.webp',
    './img/saiu3.webp'];
    sendSticker(notification, stickersSaiu[randomNumber(3)]);
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
                    if(msg.body.toLowerCase().includes(e.name)) {
                        e.callback(msg);
                    }
                })
            });

            for (value of commandsMap) {
                var key = value[0];
                if (msg.body.toLowerCase().includes(key)) {
                    var _callback = value[1];
                    _callback(msg, bot);
                    break;
                }
            }
        } else {
            msgCallback(msg, group);
        }

        if (group) { //Coleta de EXP
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
                    }).then(newFodase => {}).catch(console.error);
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
                e.mod.callbacks.onMessage(msg);
            }
        })
    } catch (err) {
        console.log('_____________________________________________________________\n' + err + '\n_____________________________________________________________\n');
    }
});


bot.initialize();
