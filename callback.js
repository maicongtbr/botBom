const { MessageMedia, List } = require('whatsapp-web.js');
const { getGames } = require ('epic-free-games');
const gis = require('g-i-s');
const { tts } = require('./tts');
const { getTabela } = require('./tabela brasileirao');
const { getRandomInt, getRandomIntRange, userIsAdmin, getGroup } = require('./libs');
const { sendRandomSticker, sendSticker, makeSticker } = require('./sticker');
const { getRanking, getLevel } = require('./level system');

const callbackMap = new Map();
const commandsMap = new Map();

const banMember = (msg, bot) => { 
    var hasMentions = msg.getMentions();
    if (!msg.hasQuotedMsg && !hasMentions){
        return msg.reply('Para banir, você deve mencionar um usuário ou responder a mensagem do usuário a ser banido.');
    }

    getGroup(msg).then((group) => {
        if (!group){
            return msg.reply('Você precisa estar em um grupo para isso');
        }

        userIsAdmin(group, msg.author).then((isAdmin) => {
            if (!isAdmin) {
                return msg.reply('Você não é Admin.');
            }

            userIsAdmin(group, bot.info.wid._serialized).then((botIsAdmin) => {
                if (!botIsAdmin){
                    return msg.reply('O Bot não é Admin.');
                }

                sendSticker(msg, './img/delete this5.webp', bot).then(() => { 
                    if (msg.hasQuotedMsg){
                        msg.getQuotedMessage().then((quotedMsg) => {
                            if (quotedMsg && quotedMsg.author === '5521991241118@c.us') {
                                console.log('mencionou a msg do bot');
                                msg.reply('*JAMAIS TENTE ISSO!*');
                                group.removeParticipants([msg.author]);
                                return;
                            }
                            let usersToBan = [quotedMsg.author];
                            return group.removeParticipants(usersToBan);
                        })
                    }
                    if (hasMentions){
                        msg.getMentions().then((mentionedUsers) => {
                            for (let i = 0; i <= mentionedUsers.length; i++){
                                if (mentionedUsers[i].PrivateContact.id._serialized === '5521991241118@c.us') {
                                    console.log(mentionedUsers[i].PrivateContact.id._serialized);
                                    console.log(mentionedUsers);
                                    console.log('mencionou o bot');
                                    msg.reply('*JAMAIS TENTE ISSO*');
                                    group.removeParticipants([msg.author]);
                                    return;
                                }
                            }
                            let usersToBan = [];
                            mentionedUsers.forEach((element) => {
                                usersToBan.push(element.PrivateContact.id._serialized);
                            })
                            return group.removeParticipants(usersToBan);
                        })
                        return;
                    }
                    msg.reply('Você precisa marcar ou mencionar um membro para ser banido.');
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
                            usersToUp.push(element.PrivateContact.id._serialized);
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
                            usersToDown.push(element.PrivateContact.id._serialized);
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

const imgSearch = async (msg, bot) => {
    var keyWord = msg.body.slice(5);

    if (keyWord.length <= 0) {
        msg.reply('Você deve usar !img [palavra chave]');
        return;
    }

    const processImageData = async (error, results) => {
        if (error) {
            console.log('\n\n' + '[Google Image Search] ' + error + '\n\n');
            msg.reply('Ocorreu um erro. Tente novamente.');
        }
        else {
            var images = []
            for (let i = 0; i <= 7; i++) {
                images.push(results[i]);
            }
            var foundImage = images[getRandomInt(7)];
            foundImage = await MessageMedia.fromUrl(foundImage.url, {
                unsafeMime:false
            });

            msg.reply(foundImage)
        }
    }

    gis(keyWord, processImageData);

}

// -- Ainda em teste
const roletaRussa = async (msg, bot) => {
    // iniciar o jogo
    bot.sendMessage(msg.from, 'A ROLETA RUSSA COMEÇOU \nEnvie !atirar para testar sua sorte.');
    bot.on('message', async message => {
        if (message === '!roleta') {
            bot.sendMessage(message.from, 'A ROLETA RUSSA ACABOU');
            return;
        }
        else if (message === '!atirar') {
            if (getRandomInt(5) === 1) {
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
// --

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
                    { id: "epicfreegames", title: "!epicfreegames", description: "Retorna os jogos grátis na Epic Games da semana atual e da próxima."},
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
                    { id: "epicgames [on/off]", title: "!epicgames [on/off]", description: "Habilita ou desabilita o envio automático de novos jogos de graça na Epic Games"},

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

// -- Ainda em teste
const textToSpeach = (msg, bot) => {
    console.log('coe');
    tts(msg.body.slice(4), msg, bot);
}
// --

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
    { name: '!tts', callback: (msg, bot) => textToSpeach(msg, bot)},
    { name: '!tabela', callback: (msg, bot) => getTabela(msg, bot)},
    { name: '!img', callback: (msg, bot) => imgSearch(msg, bot)},
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
    { names: ['galo', 'atletico mg', 'Galão da Massa', 'Galo Doido'], callback: (msg, bot) => sendSticker(msg, 'img/galo.webp', bot)},
    { names: ['fortaleza', 'leão', 'tricolaço', 'laion'], callback: (msg, bot) => sendSticker(msg, 'img/fortaleza.webp', bot)},
    { names: ['santos' ,'peixão', 'peixao', 'big fish', 'santástico', 'santastico'], callback: (msg, bot) => sendSticker(msg, 'img/santos.webp', bot)},
    { names: ['churrasco', 'churras'], callback: (msg, bot) => sendRandomSticker(msg, ['img/churrasco.webp', 'img/churrasco2.webp'], 2, bot)}, 
    { name: 'abib', callback: async (msg, bot) => { //Trigger exclusivo para o grupo do Caio
        var group = await getGroup(msg);
        if (group.id._serialized === "5524993337620-1596406363@g.us"){
            sendSticker(msg, 'img/abib.webp', bot)
        }
    }},
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

module.exports = { callbackMap, commandsMap, getGroup };
