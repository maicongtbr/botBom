const { MessageMedia, Client, List, Buttons } = require('whatsapp-web.js');
const { getGames } = require ('epic-free-games');
const fs = require ('fs');
const superagent = require('superagent');
const db = require('./database');
const google = require('googlethis');
const tts = require('./tts');
const getTabela = require('./tabela brasileirao');


const callbackMap = new Map();
const commandsMap = new Map();


const getNextLevelExp = (level) => {
    if(level < 50) {
        return Math.floor((Math.pow(level, 2) * ( 100 - level )) / 50);
    } else if(level <= 68) {
        return Math.floor((Math.pow(level, 2) * ( 150 - level )) / 100);
    } else if(level <= 98) {
        return Math.floor((Math.pow(level, 2) * ( (1911 - (10 * level)) / 3)) / 500);
    } else if(level <= 100) {
        return Math.floor((Math.pow(level, 2) * ( 160 - level )) / 100);
    } else {
        return 10000;
    }
}

const randomNumber = (max) => {
    return Math.floor(Math.random() * (max - 1 + 1));
}

const sendRandomSticker = (msg, fileName, num, bot) => {
    media = MessageMedia.fromFilePath(`./${fileName[randomNumber(num)]}`);
    bot.sendMessage(msg.from, media, {
        sendMediaAsSticker:true
        })
}

const sendSticker = async (msg, fileName, bot) => {
    media = MessageMedia.fromFilePath(`./${fileName}`);
    return bot.sendMessage(msg.from, media, {
        sendMediaAsSticker:true
    })
}

const downloadMessageMedia = async (msg) => {
    var messageToDowloadMedia = msg;
    if (msg.hasQuotedMsg){
        let quotedMsg = await msg.getQuotedMessage();
        return; //só enquanto o bot ta crashando com quotedMsg
        if (quotedMsg.hasMedia){
            messageToDowloadMedia = quotedMsg;
        }
    }
    var ret = await messageToDowloadMedia.downloadMedia();
    return ret;
}

const makeSticker = async (msg) => {
    if (msg.type === 'chat') return msg.reply('O comando de Sticker não está funcionando mencionando mensagens. Tente enviando diretamente a imagem.');
    if (msg.type != 'image') return msg.reply('O comando de Sticker só funciona com arquivos de imagem.');

    var media = await downloadMessageMedia(msg);
    msg.reply(media, undefined, {
        sendMediaAsSticker:true,
        stickerName: 'Feito com o Bot Bom da AOP',
        sticketAuthor: 'Bot Bom'
    })
}

const getGroup = async (msg) => {
    var chat = await msg.getChat();
    if (chat.isGroup) return chat;

    return undefined;
}

const userIsAdmin = async (chat, authorId) => {
    for(let participant of chat.participants) {
        if(participant.id._serialized === authorId && participant.isAdmin) {
            return true;
        }
    }
    return false;
}

const banMember = (msg, bot) => {
    var hasMentions = msg.getMentions();
    if (!msg.hasQuotedMsg && !hasMentions){
        return msg.reply('Para banir, você deve mencionar um usuário ou responder a mensagem do usuário a ser banido.');
    }

    const group = getGroup(msg).then((group) => {
        if (!group){
            return msg.reply('Você precisa estar em um grupo para isso');
        }

        const isAdmin = userIsAdmin(group, msg.author).then((isAdmin) => {
            if (!isAdmin) {
                return msg.reply('Você não é Admin.');
            }

            const botIsAdmin = userIsAdmin(group, bot.info.wid._serialized).then((botIsAdmin) => {
                if (!botIsAdmin){
                    return msg.reply('O Bot não é Admin.');
                }

                sendSticker(msg, './img/delete this5.webp', bot).then(() => { //id do bot = 5521991241118@c.us
                    msg.getQuotedMessage().then((quotedMsg) => {
                        if (quotedMsg && quotedMsg.author === '5521991241118@c.us') {
                            console.log('mencionou a msg do bot');
                            msg.reply('*JAMAIS TENTE ISSO!*');
                            group.removeParticipants([msg.author]);
                            return;
                        }
                        msg.getMentions().then((mentionedUsers) => {
                            mentionedUsers.forEach((element) => {
                                if (element.id._serialized === '5521991241118@c.us') {
                                    console.log('mencionou o bot');
                                    msg.reply('*JAMAIS TENTE ISSO*');
                                    group.removeParticipants([msg.author]);
                                    return;
                                }
                            })

                            if (msg.hasQuotedMsg){
                                    console.log(quotedMsg);
                                    let usersToBan = [quotedMsg.author];
                                    console.log(usersToBan);
                                    group.removeParticipants(usersToBan);
                                    return;
                            }
                            
                                var usersToBan = [];
                                mentionedUsers.forEach((element) => {
                                usersToBan.push(element.id._serialized);
                                })
                                group.removeParticipants(usersToBan);
                        })
                    })
                })
            })
        })
    })
}

const promoteMember = (msg, bot) => {
    var hasMentions = msg.getMentions();
    if (!msg.hasQuotedMsg && !hasMentions){
        return msg.reply('Para promover alguém para Admin você deve mencionar um usuário ou responder a mensagem do usuário a ser promovido.');
    }

    const group = getGroup(msg).then((group) => {
        if (!group){
            return msg.reply('Você precisa estar em um grupo para isso.');
        }
        const isAdmin = userIsAdmin(group, msg.author).then((isAdmin) => {
            if (!isAdmin) {
                return msg.reply('Você não é Admin.');
            }

            const botIsAdmin = userIsAdmin(group, bot.info.wid._serialized).then((botIsAdmin) => {
                if (!botIsAdmin){
                    return msg.reply('O Bot não é Admin.');
                }

                if (msg.hasQuotedMsg){
                    let quotedMsg = msg.getQuotedMessage().then((quotedMsg) => {
                        let usersToUp = [quotedMsg.author];
                        group.promoteParticipants(usersToUp);
                    })
                }
                else {
                    var mentionedUsers = msg.getMentions().then((mentionedUsers) => {
                        var usersToUp = [];
                        mentionedUsers.forEach((element) => {
                            usersToUp.push(element.id._serialized);
                        })
                        group.promoteParticipants(usersToUp);
                })
                }
            })
        })
    })
}

const demoteMember = (msg, bot) => {
    var hasMentions = msg.getMentions();
    if (!hasMentions && !msg.hasQuotedMsg){
        return msg.reply('Para rebaixar alguém você deve mencionar um usuário ou responder a mensagem do usuário a ser rebaixado.');
    }
    const group = getGroup(msg).then((group) => {
        if (!group){
            return msg.reply('Você precisa estar em um grupo para isso.');
        }
        const isAdmin = userIsAdmin(group, msg.author).then((isAdmin) => {
            if (!isAdmin){
                return msg.reply('Você não é Admin.');
            }
            const botIsAdmin = userIsAdmin(group, bot.info.wid._serialized).then((botIsAdmin) => {
                if (!botIsAdmin){
                    return msg.reply('O Bot não é Admin.');
                }
            
                if (msg.hasQuotedMsg){
                    let quotedMsg = msg.getQuotedMessage().then((quotedMsg) => {
                        let usersToDown = [quotedMsg.author];
                        group.demoteParticipants(usersToDown);
                    })
                }
                else {
                    var mentionedUsers = msg.getMentions().then((mentionedUsers) => {
                        var usersToDown = [];
                        mentionedUsers.forEach((element) => {
                            usersToDown.push(element.id._serialized);
                        })
                        group.demoteParticipants(usersToDown);
                    })
                }
            })
        })
    })
}

const forwardingScore = (msg) => {
    msg.getQuotedMessage().then((quotedMsg) => {
        if (!quotedMsg) return msg.reply('Você precisa mencionar uma mensagem.'); 
        var score = quotedMsg.forwardingScore;
        if (score === 1){
            msg.reply('Essa mensagem foi encaminhada ' + score + ' vez.', undefined);
        }
        else if (score === 0){
            msg.reply('Essa mensagem nunca foi encaminhada', undefined);
        }
        else {
            msg.reply('Essa mensagem foi encaminhada ' + score + ' vezes.', undefined);
        }
    })
}

const freeGames = (bot, msg) => {
    getGames('BR', false).then(res => {
        var currentGamesInfo = [];
        var nextGamesInfo = [];
        res.currentGames.forEach(game => {
            currentGamesInfo.push(`🕹*${game.title}* \n🧾Descrição: ${game.description}\n`)
        })
        res.nextGames.forEach(game => {
            nextGamesInfo.push(`🕹*${game.title}* \n🧾Descrição: ${game.description}`)
        })
        bot.sendMessage(msg.from, `🎮*Jogos grátis na Epic hoje:* \n\n${currentGamesInfo.join('\n\n')}\n\n 🎮*Próximos jogos grátis na Epic:* \n\n${nextGamesInfo.join('\n\n')}`);
    })
}

const imgSearch = async (msg, bot) => {
    const palavraChave = msg.body.slice(4);

    if (palavraChave.length <= 0) {
        msg.reply('Você deve usar !img [palavra chave]\n(_sem o []_)');
        return;
    }

    try {
        const image = await google.image(palavraChave.replace(/[\u0300-\u036f]/g, ""), { safe: true });
        const foundImage = image[randomNumber(10)];
        const img = await MessageMedia.fromUrl(foundImage.url, {
            unsafeMime: true
        });

        bot.sendMessage(msg.from, img, {
            caption: `Origem da Imagem: ${foundImage.origin?.title}`
        })
    } catch(e) {
        bot.sendMessage(msg.from, "Deu ruim aqui mané");
        console.error(e);
        return;
    }
}

const getLevel = async (msg, bot) => {
    const Exp = db.getModel('Experiencia');
    const group = await getGroup(msg);
    const mentionedUsers = await msg.getMentions();
    if (group) {
        var isAdmin = await userIsAdmin(group, msg.author);
    }

    if (!group) {
        Exp.find({
            id: msg.id.remote
        }).then(async user => {
            if(!user) {
                msg.reply('*Você ainda não tem exp.*');
                return;
            }

            var userLevelArr = [];

            for (element of user) {
                let exp = element.exp;
                let level = element.level;
                let group = element.groupName;
                let expToNextLevel = getNextLevelExp(level + 1) - exp;

                let userLevel = `💎Nível no grupo *${group}*\n✨Exp: ${exp}\n🎇Level: ${level}\n🎆Exp para o próximo level: ${expToNextLevel}`

                userLevelArr.push(userLevel);
            }
            let _userLevel = `💎*Esse é seu nível em cada grupo:*\n\n${userLevelArr.join('\n\n')}`;
            bot.sendMessage(msg.from, _userLevel); 
        })
        return;
    }

    if (mentionedUsers && mentionedUsers.length > 0) {
        if (isAdmin) {
            console.log(mentionedUsers);
            Exp.findOne({
                id: mentionedUsers[0].id._serialized,
                group: group.id._serialized
            }).then(async user => {
                let userName = user.userName;
                let exp = user.exp;
                let level = user.level;
                let group = user.groupName;
                let expToNextLevel = getNextLevelExp(level + 1) - exp;

                bot.sendMessage(msg.from, `Nível de *${userName}* no grupo *${group}*\n\n✨Exp: ${exp}\n🎇Level: ${level}\n🎆Exp para o próximo level: ${expToNextLevel}`);
            })
            return;
        }
    }

    Exp.findOne({
        id: msg.author,
        group: group.id._serialized
    }).then(async user => {
        if(!user) {
            msg.reply('*Você ainda não tem exp.*');
            return;
        }
        let userName = user.userName;
        let exp = user.exp;
        let level = user.level;
        let group = user.groupName;
        let expToNextLevel = getNextLevelExp(level + 1) - exp;

        bot.sendMessage(msg.from, `Nível de *${userName}* no grupo *${group}*\n\n✨Exp: ${exp}\n🎇Level: ${level}\n🎆Exp para o próximo level: ${expToNextLevel}`);
    })
}

const getRanking = async (msg, bot) => {
    const Exp = db.getModel('Experiencia');
    const group = await getGroup(msg);
    
    Exp.find({
        group: group.id._serialized
    }).then(async users => {
        users.sort((a, b) => {
            if (a.level == b.level){
                return (a.exp > b.exp) ? -1 : 1;
            }
            return (a.level > b.level) ? -1 : 1;
        })
        
        let ranking = [];

        var max = 10;
        if(users.length < 10) {
            max = users.length;
        }

        for (var i = 0; i < max; i++) {
            let element = users[i];
            let place = users.indexOf(element) + 1;
            let placeMessage = "";
            switch(place) {
                case 1:
                    placeMessage = "🥇";
                    break;
                case 2:
                    placeMessage = "🥈";
                    break;
                case 3:
                    placeMessage = "🥉";
                    break;
                default:
                    break;
            }
            let message = `${placeMessage} *${place}° Lugar*: ${element.userName}, *Level*: ${element.level}, *Exp*: ${element.exp}.`;
            ranking.push(message);
        }

        let _message = `🏆 Top 10 no grupo *${group.name}*\n\n${ranking.join("\n")}`;
        bot.sendMessage(msg.from, _message);
    });
}

const roletaRussa = async (msg, bot) => {
    // iniciar o jogo
    bot.sendMessage(msg.from, 'A ROLETA RUSSA COMEÇOU \nEnvie !atirar para testar sua sorte.');
    bot.on('message', async message => {
        if (message === '!roleta') {
            bot.sendMessage(message.from, 'A ROLETA RUSSA ACABOU');
            return;
        }
        else if (message === '!atirar') {
            if (randomNumber(5) === 1) {
                // group.removeParticipants(message.author);
                bot.sendMessage(message.from, 'Alguma mensagem dizendo que vc morreu + um gif'); //encerrar o jogo aqui
                return;
            }
            else {
                message.reply('A arma falhou!');
            }
        }
    });
}

const commandList = (msg, bot) => {
    const _commandList = new List(
        "Esta é a lista de comandos do Bot Bom.",
        "Lista de comandos",
        [
            {
                title: "Comandos gerais",
                rows: [
                    { id: "sticker", title: "!s", description: "Cria uma figurinha a partir da imagem enviada ou mencionada." },
                    { id: "img", title: "!img [palavra para pesquisar]", description: "Pesquisa uma imagem e retorna ela."},
                    { id: "encaminhado", title: "!encaminhado", description: "Retorna a quantidade de vezes que a mensagem mencionada foi encaminhada."},
                    { id: "gratis", title: "!gratis", description: "Retorna os jogos grátis na Epic Games da semana atual e da próxima."},
                    { id: "tabela", title: "!tabela", description: "Retorna a tabela atualizada do Brasileirão Serie A."},
                    { id: "level", title: "!level", description: "Retorna seu level no grupo atual (Se enviado no PV do bot, retorna seu level em todos os grupos que o bot participa)."},
                    { id: "ranking", title: "!ranking", description: "Retorna o Top 10 do grupo."}
            ],
            },
            {
                title: "Comandos de Administrador",
                rows: [
                    { id: "ban", title: "!ban [membro]", description: "Bane o membro marcado ou da mensagem mencionada."},
                    { id: "up", title: "!up [membro]", description: "Remove o membro marcado ou da mensagem mencionada."},
                    { id: "down", title: "!down [membro]", description: "Rebaixa o membro marcado ou da mensagem mencionada."},
                    { id: "level", title: "!level [membro]", description: "Retorna o level do membro marcado."},
                ]
            },
            {
                title: "Comandos do PokéBom",
                rows: [
                    { id: "capturar", title: "!capturar [nome do Pokémon]", description: "Tenta capturar um pokemón."},
                    { id: "pokemon", title: "!pokebom", description: "Retorna sua party de Pokémon."},
                    { id: "boxpokemon", title: "!boxpokemon", description: "Retorna sua box de Pokémon."},
                    { id: "inicial", title: "!inicial", description: "Para escolher seu Pokémon inicial."},
                    { id: "pokedex", title: "!pokedex [nome do Pokémon]", description: "Retorna as informações da Pokédex do Pokémon citado."},
                    { id: "pokestop", title: "!pokestop", description: "Ativar ou desativar o módulo do PokéBom."},
                    { id: "pokespawnrate", title: "!pokespawnrate [%]", description: "Alterar a chance de aparição de Pokémon."},
                    { id: "pokesummon", title: "!pokesummon", description: "Forçar a aparição de Pokémon."},
                    // { id: "compraritens", title: "!compraritens", description: "Abrir a loja para compra de ítens."},
                ]
            }
        ],
        "Comandos"
      );

    bot.sendMessage(msg.from, _commandList );
}

const textToSpeach = (msg, bot) => {
    console.log('coe');
    tts(msg.body.slice(4), msg, bot);
}

const update = async (msg) => {
    const { exec } = require("child_process");
    if(!userIsAdmin(await msg.getChat(), msg.authorId)) return;
    exec("git pull", (err) => {
        if(err) console.warn(err);
    })
}


const commands = [
    { name: '!ban', callback: (msg, bot) => banMember(msg, bot)},
    { name: '!up', callback: (msg, bot) => promoteMember(msg, bot)},
    { name: '!down', callback: (msg, bot) => demoteMember(msg, bot)},
    { name: '!s', callback: (msg) => makeSticker(msg)},
    { name: '!encaminhado', callback: (msg) => forwardingScore(msg)},
    { name: '!gratis', callback: (msg, bot) => freeGames(bot, msg)},
    { name: '!tts', callback: (msg, bot) => textToSpeach(msg, bot)},
    { name: '!tabela', callback: (msg, bot) => getTabela(msg, bot)},
    // { name: '!img', callback: (msg, bot) => imgSearch(msg, bot)},
    { name: '!level', callback: (msg, bot) => getLevel(msg, bot)},
    { name: '!ranking', callback: (msg, bot) => getRanking(msg, bot)},
    { name: '!comandos', callback: (msg, bot) => commandList(msg, bot)},
    { name: '!roleta', callback: (msg, bot) => roletaRussa(msg, bot)},
    { name: "!update", callback: (msg) => update(msg) }
]

const trigger = [
    { name: 'zeca', 
        callback: (msg, bot) => sendSticker(msg, 'img/zeca.png', bot)},
    { names: ['macaco', 'macacos'], 
        callback: (msg, bot) => sendSticker(msg, 'img/macaco.jpg', bot)},
    { names: ['mengao', 'flamengo', 'flaputa', 'flacadela', 'malvadão'], 
        callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/mengao.jpg',
        'img/mengao2.webp',
        'img/mengao4.webp',
        'img/mengao5.webp',
        'img/mengao6.webp',
        'img/mengao7.webp',
        'img/mengao8.webp'], 7, bot)},
    { name: 'puto',
        callback: (msg, bot) => sendSticker(msg, 'img/puto.jpg', bot)},
    { names: ['perdemo', 'perdemos'],
        callback: (msg, bot) => sendSticker(msg, 'img/perdemo.jpg', bot)},
    { name: 'poxa',
        callback: (msg, bot) => sendSticker(msg, 'img/a ana entortou.webp', bot)},
    { name: 'ancap',
        callback: (msg, bot) => sendSticker(msg, 'img/ancap.webp', bot)},
    { names: ['churrasco', 'churras'],
        callback: (msg, bot) => sendSticker(msg, 'img/churrasco.webp', bot)},
    { names: ['nargas', 'narga', 'narguile'],
        callback: (msg, bot) => sendSticker(msg, 'img/e o narga.webp', bot)},
    { name: 'fofo',
        callback: (msg, bot) => sendSticker(msg, 'img/fofo.webp', bot)},
    { name: 'jae',
        callback: (msg, bot) => sendSticker(msg, 'img/jae princesa.webp', bot)},
    { names: ['kek', 'kekw'],
        callback: (msg, bot) => sendSticker(msg, 'img/kekw.webp', bot)},
    { name: 'maluco',
        callback: (msg, bot) => sendSticker(msg, 'img/maluco.webp', bot)},
    { name: 'muie',
        callback: (msg, bot) => sendSticker(msg, 'img/misoginia.webp', bot)},
    { names: ['foi de base', 'foi de b', 'nao tankou', 'não tankou', 'foi encontrado morto', 'morri'],
        callback: (msg, bot) => sendSticker(msg, 'img/morri.webp', bot)},
    { name: 'neymar', 
        callback: (msg, bot) => sendSticker(msg, 'img/neymar.webp', bot)},
    { name: 'primeiramente',
        callback: (msg, bot) => sendSticker(msg, 'img/primeiramente.webp', bot)},
    { name: 'segundamente',
        callback: (msg, bot) => sendSticker(msg, 'img/segundamente.webp', bot)},
    { name: 'terceiramente',
        callback: (msg, bot) => sendSticker(msg, 'img/terceiramente.webp', bot)},
    { name: 'quartamente',
        callback: (msg, bot) => sendSticker(msg, 'img/quartamente.webp', bot)},
    { name: 'quintamente',
        callback: (msg, bot) => sendSticker(msg, 'img/quintamente.webp', bot)},
    { name: 'sextamente',
        callback: (msg, bot) => sendSticker(msg, 'img/sextamente.webp', bot)},
    { name: 'setimamente',
        callback: (msg, bot) => sendSticker(msg, 'img/setimamente.webp', bot)},
    { name: 'oitavamente',
        callback: (msg, bot) => sendSticker(msg, 'img/oitavamente.webp', bot)},
    { name: 'perdi',
        callback: (msg, bot) => sendSticker(msg, 'img/perdi.webp', bot)},
    { name: 'oxe',
        callback: (msg, bot) => sendSticker(msg, 'img/oxe.webp', bot)},
    { names: ['será', 'sera'],
        callback: (msg, bot) => sendSticker(msg, 'img/sera.webp', bot)},
    { name: 'transito',
        callback: (msg, bot) => sendSticker(msg, 'img/ta transito.webp', bot)},
    { name: 'galera',
        callback: (msg, bot) => sendSticker(msg, 'img/tijolo.webp', bot)},
    { name: 'boa noite',
        callback: (msg, bot) => sendRandomSticker(msg,
        ['img/boa noite bolsonaro.webp',
        'img/vasco3.webp'], 2, bot)},
    { name: 'angra',
        callback: (msg, bot) => sendSticker(msg, 'img/ANDRÉ matos bliding hart.png', bot)},
    { name: 'lula',
        callback: (msg, bot) => sendSticker(msg, 'img/lula.webp', bot)},
    { name: 'triste', 
        callback: (msg, bot) => sendSticker(msg, 'img/triste.webp', bot)},
    { name: 'bom dia',
        callback: (msg, bot) => sendRandomSticker(msg,
        ['img/bom dia.webp',
        'img/vasco2.webp',
        'img/vasco4.webp',
        'img/mengao3.webp'], 4, bot)},
    { names: ['caralho', 'crlho'], callback: (msg, bot) => sendSticker(msg, 'img/caralho.webp', bot)},
    { name: 'ok google',
        callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/ok google.webp', 
        'img/ok google2.webp'], 2, bot)},
    { names: ['dj', 'azeitona'],
        callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/dj azeitona.jpg', 
        'img/dj azeitona 2.png', 
        'img/dj azeitona 3.png'], 3, bot)},
    { names: ['calvo', 'careca', 'carecas'],
        callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/careca.jpeg', 
        'img/calvo.webp', 
        'img/calvo2.webp'], 3, bot)},
    { name: 'legal',
        callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/legal.webp', 
        'img/legal2.webp', 
        'img/legal3.webp',
        'img/legal4.webp'], 4, bot)},
    { names: ['bolsonaro', 'bolsomito'],
        callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/bolsonaro.webp', 
        'img/bolsonaro2.webp',
        'img/bolsonaro3.webp'], 3, bot)},
    { names: ['verdade', 'positivo', 'concordo'],
        callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/verdade.webp', 
        'img/capitao broxa.webp'], 2, bot)},
    { name: 'apaga',
        callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/delete this.webp', 
        'img/delete this2.webp', 
        'img/delete this3.webp', 
        'img/delete this4.webp'], 4, bot)},
    { names: ['erva do capeta', 'maconha', 'diamba', 'banza', 'baseado', 'beck', 'cannabis', 'dedo de gorila', 'erva', 'ganja', 'majimba', 'marijuana', 'maria joana', 'mary jane', 'verdinha', 'tapa na pantera', 'um dois', 'bongada'],
        callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/maconha.webp', 
        'img/maconha2.webp', 
        'img/maconha3.webp', 
        'img/maconha4.webp', 
        'img/maconha5.webp',
        'img/maconha6.webp',
        'img/maconha7.webp',
        'img/maconha8.webp',
        'img/maconha9.webp',
        'img/maconha10.webp',
        'img/maconha11.webp',
        'img/maconha12.webp',
        'img/maconha13.webp',
        'img/maconha14.webp',
        'img/maconha15.webp',
        'img/maconha16.webp'], 16, bot)},
    { names: ['transa', 'atos libidinosos', 'coito', 'sexo', 'furunfada'],
        callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/roger procuro sexo.webp', 
        'img/sexo.webp', 
        'img/sexo2.webp', 
        'img/sexo3.webp', 
        'img/sexo4.webp',
        'img/sexo5.webp',
        'img/sexo6.webp',
        'img/sexo7.webp'], 8, bot)},
    { names: ['gay', 'viado', 'viadagem'],
        callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/viadagem.webp', 
        'img/gay.webp'], 2, bot)},
    { name: 'ironicamente', callback: (msg, bot) => sendSticker(msg, 'img/ironicamente.webp', bot)},
    { name: 'ceni', callback: (msg, bot) => sendSticker(msg, 'img/ceni.webp', bot)},
    { name: 'argentina', callback: (msg, bot) => sendSticker(msg, 'img/argentina.webp', bot)},
    { names: ['vasco', 'wasco', 'gigante da colina', 'gigantastico', 'vascudo'], callback: (msg, bot) => sendRandomSticker(msg, 
        ['img/vasco.webp',
        'img/vasco5.webp',
        'img/vasco6.webp'], 3, bot)},
    { names: ['corinthians', 'coringão', 'timão'], callback: (msg, bot) => sendRandomSticker(msg,
        ['img/corinthians2.webp',
        'img/corinthians.webp'], 2, bot)},
    {names: ['galo', 'atletico mg', 'Galão da Massa', 'Galo Doido'], callback: (msg, bot) => sendSticker(msg, 'img/galo.webp', bot)},
    {names: ['fortaleza', 'leão', 'tricolaço', 'laion'], callback: (msg, bot) => sendSticker(msg, 'img/fortaleza.webp', bot)},
    {names: ['santos' ,'peixão', 'peixao', 'big fish', 'santástico', 'santastico'], callback: (msg, bot) => sendSticker(msg, 'img/santos.webp', bot)}
]

commands.forEach((value) => {
    commandsMap.set(value.name, value.callback);
})

trigger.forEach((value) => {
    if (value.names) {
        value.names.forEach((name) => {
            callbackMap.set(name, value.callback);
        })
    }
    else if (value.name) {
        callbackMap.set(value.name, value.callback);
    }
})   

module.exports = { callbackMap, commandsMap, getGroup, getNextLevelExp };
