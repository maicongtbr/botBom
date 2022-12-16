const superagent = require('superagent');
const {Module} = require("../mod");
const db = require("../../database");

const Cache = db.getModel('Cache');


var myModule;

var commands = [
    { name:'!epicgames', callback: (msg) => freeGames(msg) },
    { name:'!epicgid', callback: async (msg) => {
        console.log(msg.from);
        Cache.update({
            name: "EpicGames",
        },
        {
            infos: { groups: [ msg ] }
        },
        {
            _upsert: true
        })
    }},
]

const init = async (bot) => {
    myModule = new Module("freeGames", bot, { }, commands);
    mainLoop();
}


const groups = [  "5521969164962-1519130052@g.us" ]
const mainLoop = async () => {
    const games = await freeEpicGames();

    const curGames = await Cache.findOne({
        name: "EpicGames"
    });

    if (curGames) {
        var newGame = false;
        for(let i = 0; i < games.length; i++) {
            var game = games[i];
            if(!curGames.infos.groups.includes(game.id)) {
                newGame = true;
                break;
            }
        } 
        if(!newGame) return;
    }

    const _gamnes = [];

    curGames.infos.groups.forEach( e=> {
        _gamnes.push(e.id);
    })

    await Cache.update({
        name: "EpicGames"
    },
    {
        infos : { ...curGames,  _gamnes }
    });

    const message = await getFreeGameMessage();

    async function sendMessageToGroup(group) {
        myModule.bot.sendMessage(group, message);
    }

    groups.forEach(group => {
        sendMessageToGroup().then(e => console.log("Enviado os novos jogos da Epic Games!"));
    })

    setTimeout(mainLoop, 60 * 1000 * 60);
}

const freeEpicGames = async () => {
    const freeGames = [];
    const res = await superagent.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?country=BR');
    const resElements = res?._body?.data?.Catalog.searchStore.elements;
    for (let i = 0; i <= resElements.length-1; i++){
        let element = resElements[i];
        let promotionalOffers = element.promotions.promotionalOffers.length > 0 ? element.promotions.promotionalOffers[0] : element.promotions.upcomingPromotionalOffers[0];

        promotionalOffers = promotionalOffers.promotionalOffers[0];

        let obj = {
            title: element.title,
            id: element.id,
            description: element.description,
            startDate: new Date (promotionalOffers.startDate || ''),
            endDate: new Date (promotionalOffers.endDate || '')
        }
        freeGames.push(obj);
    }
    return freeGames;
}

const getFreeGameMessage = async () => {
    let games = await freeEpicGames();

    const gamesInfo = []
    for(let i = 0; i < games.length; i++){
        let game = games[i];
        gamesInfo.push(`🕹*${game.title}* \n🧾_*Descrição:*_ ${game.description}\n⏳_*Data de ínicio:*_ ${game.startDate.toLocaleString('pt-BR')} \n⌛_*Data de encerramento:*_ ${game.endDate.toLocaleString('pt-BR')}`);
    }

    const message = `🎮*Jogos grátis da Epic Games:* \n\n${gamesInfo.join('\n\n')}`;
    return message;
}

const freeGames = async (msg) => {
    myModule.bot.sendMessage(msg.from, await getFreeGameMessage());
}

module.exports = { init };
