const { List } = require('whatsapp-web.js');
const { userIsAdmin, getGroup } = require('./libs');
const { getTabela } = require('./tabela brasileirao');
const { getRanking, getLevel } = require('./level system');
const { sendRandomSticker, sendSticker, makeSticker } = require('./sticker');
const { demoteMember, promoteMember, banMember, imgSearch, forwardingScore, update } = require('./callbackFunctions');

const callbackMap = new Map();
const commandsMap = new Map();

const comandos = [ //Provisório enquanto as listas do Wpp estão bugadas
        "➡️*Comandos Gerais:*",
        "\n\n*!s -* Cria uma figurinha a partir da imagem enviada ou mencionada.",
        "\n*!img [palavra para pesquisar] -* Pesquisa uma imagem no google.",
        "\n*!encaminhado -* Retorna a quantidade de vezes que a mensagem mencionada foi encaminhada.",
        "\n*!epicfreegames -* Retorna os jogos grátis na Epic Games da semana atual e da próxima.",
        "\n*!tabela -* Retorna a tabela atualizada do Brasileirão Serie A.",
        "\n*!level -* Retorna seu level no grupo atual (Se enviado no PV do bot, retorna seu level em todos os grupos que o bot participa).",
        "\n*!ranking -* Retorna o Top 10 do grupo.",

        "\n\n➡️*Comandos de Administrador:*",
        "\n\n*!ban [membro] -* Bane o membro marcado.",
        "\n*!up [membro] -* Promove á Admin o membro marcado ou da mensagem mencionada.",
        "\n*!down [membro] -* Rebaixa o membro marcado ou da mensagem mencionada.",
        "\n*!level [membro] -* Retorna o level do membro marcado.",
        "\n*!epicgames [on/off]* - Habilita ou desabilita o envio automático de novos jogos de graça na Epic Games",

        "\n\n➡️*Comandos PokeBom:*",
        "\n\n*!capturar [nome do Pokémon] -* Tenta capturar um pokemón.",
        "\n*!pokebom -* Retorna sua party de Pokémon.",
        "\n*!boxpokemon -* Retorna sua box de Pokémon.",
        "\n*!inicial -* Para escolher seu Pokémon inicial.",
        "\n*!pokedex [nome do Pokémon] -* Retorna as informações da Pokédex do Pokémon citado.",
        "\n*!pokestop -* Ativar ou desativar o módulo do PokéBom. *SOMENTE ADMS*",
        "\n*!pokespawnrate [%] -* Alterar a chance de aparição de Pokémon. *SOMENTE ADMS*",
        "\n*!pokesummon -* Forçar a aparição de Pokémon. *SOMENTE ADMS*"
    ]

const sendCommands = (msg, bot) =>{
    var commands = comandos.toString();
    bot.sendMessage(msg.from, commands);
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
                    { id: "img", title: "!img [palavra para pesquisar]", description: "Pesquisa uma imagem no google."},
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
                    { id: "up", title: "!up [membro]", description: "Promove á Admin o membro marcado ou da mensagem mencionada."},
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
    { name: '!comandos', callback: (msg, bot) => sendCommands(msg, bot)},
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
    { names: ['molejo', 'russin'], callback: async (msg, bot) => { //Trigger exclusivo para o grupo do Caio
        var group = await getGroup(msg);
        if (group.id._serialized === "5524993337620-1596406363@g.us"){
            sendSticker(msg, 'img/russin molejo.webp', bot)
        }
    }},
    { names: ['alguém', 'alguem'], callback: (msg, bot) => sendSticker(msg, 'img/alguem.jpg', bot)},
    { name: 'baiano', callback: (msg, bot) => sendSticker(msg, 'img/baiano.webp', bot)},
    { name: 'canalha', callback: (msg, bot) => sendSticker(msg, 'img/canalha.webp', bot)},
    { name: 'muie', callback: (msg, bot) => sendRandomSticker(msg, ['img/misoginia.webp', 'muie2.webp'], 2, bot)},
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

module.exports = { callbackMap, commandsMap };
