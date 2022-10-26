const { Client, MessageMedia, LocalAuth, AuthStrategy, MessageAck, List } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { callbackMap, commandsMap, getGroup, getNextLevelExp } = require('./callback.js');
const db = require('./database');
const { get } = require('superagent');

const bot = new Client({
    puppeteer: {
//        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        args:["--no-sandbox", "--autoplay-policy=no-user-gesture-required"]
    },
//    ffmpegPath: "./ffmpeg/ffmpeg.exe",
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
})

bot.on('group_leave', (notification) => {
    const stickersSaiu = 
    ['./img/saiu.webp',
    './img/saiu2.webp',
    './img/saiu3.webp'];
    sendSticker(notification, stickersSaiu[randomNumber(3)]);
});

const list = new List(
    'TESTE1',
    'TESTE2',
    [
        {
          title: "Products list",
          rows: [
            { id: "apple", title: "Apple" },
            { id: "mango", title: "Mango" },
            { id: "banana", title: "Banana" },
          ],
        },
      ],
      "teste3"
)

bot.on('message', async msg => {
    try {
        var group = await getGroup(msg);
        if (msg.body.startsWith('!')){
            for (value of commandsMap) {
                var key = value[0];
                if (msg.body.toLowerCase().includes(key)) {
                    var _callback = value[1];
                    _callback(msg, bot);
                    break;
                }
            }
        }
        for (value of callbackMap) {
            var key = value[0];
            if (msg.body.toLowerCase().includes(key)) {
                var _callback = value[1];
                _callback(msg, bot);
                break;
            }
            else if (!group){
                bot.sendMessage(msg.from, 'Use *!comandos* para ver a lista de comandos.');
                break;
            }
        }
        if (msg.body.length >= 150) {
            msg.reply('Desculpa parceiro, não leio textão');
        }

        if (group) {
            var groupId = group.id._serialized;
            var groupName = group.name;
            let contact = await msg.getContact();
            var userName = contact.name ? contact.name : contact.pushname;

            const Exp = db.getModel('Experiencia');

            Exp.findOne({
                id: msg.author,
                group: groupId
            }).then(async user => {
                if (user) {
                    let newExp = user.exp + 1;
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
    } catch (err) {
        console.log('_____________________________________________________________\n' + err + '\n_____________________________________________________________\n');
    }
});


bot.initialize();
