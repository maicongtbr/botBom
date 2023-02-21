const superagent = require('superagent');
const {Module} = require("../mod");
const db = require("../../database");

const Cache = db.getModel('Cache');


var myModule;
var log;

var commands = [
    { name:'!epicgames', callback: (msg) => freeGames(msg) },
]

const init = async (bot) => {
    myModule = new Module("freeGames", bot, { }, commands);
    log = (...args) => myModule.log(args);

    await mainLoop();
}

const MAIN_LOOP_TIME = 10 * 60 * 1000; // 10min
var newGameLoop;

const scheduleMainLoop = (time) => {
    var next = time || MAIN_LOOP_TIME
    log(`Tempo para nova checagem: ${new Date(new Date().getTime()  + next).toLocaleString('pt-BR', { timeZone: "America/Sao_Paulo" })}`)
    return setTimeout(mainLoop, next);
}

const mainLoop = async () => {
    log("Checando jogos da epic games...");
    const games = await freeEpicGames();

    const curGames = await Cache.findOne({
        name: "EpicGames"
    });


    if (curGames) {
        var newGame = false;
        for(let i = 0; i < games.length; i++) {
            var game = games[i];
            if(!curGames.info || curGames.info && curGames.info.games &&  !curGames.info.games.includes(game.id)) {
                newGame = true;
                break;
            }
        } 
        if(!newGame) {
            log("Nenhum jogo novo.");
            var nextTime = 0;
            const time = new Date();
            games.forEach(element => {
                if(element.startDate > time) {
                    nextTime = element.startDate.getTime() - time.getTime();
                    console.log(nextTime);
                }
            });
            scheduleMainLoop(); // marca para 10min
            if(newGameLoop){
                clearTimeout(newGameLoop);
            }
            newGameLoop = scheduleMainLoop(nextTime); // marca para quando o prox jogo sair
            return;
        };
    }

    var databaseGames = [];

    for(let i = 0; i < games.length; i++) {
        var e = games[i];
        databaseGames.push(e.id);
    } 

   await Cache.updateOne({
        name: "EpicGames"
    },
    {
        info : { games: databaseGames  }
    },
    { upsert: true });

    const message = await getFreeGameMessage();

   const aop = await myModule.bot.getChats();
   for ( var i = 0; i < aop.length; i++)
   {
        let group =aop[i]
        if(group.isGroup) {
            group.sendMessage(message);
        }
   }

   log("Jogos atualizados!");

   scheduleMainLoop();
}

const freeEpicGames = async () => {
    const freeGames = [];
    const res = await superagent.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?country=BR');
    const resElements = res?._body?.data?.Catalog.searchStore.elements;
    for (let i = 0; i <= resElements.length-1; i++){
        let element = resElements[i];
        if (!element.promotions){
            continue;
        }
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

    const gamesInfo = [];
    games.sort((a, b) => {
        if(a.startDate < b.startDate) return -1;
        return 1;
    })
    for(let i = 0; i < games.length; i++){
        let game = games[i];
        gamesInfo.push(`🕹*${game.title}* \n🧾_*Descrição:*_ ${game.description}\n⏳_*Data de ínicio:*_ ${game.startDate.toLocaleString('pt-BR', { timeZone: "America/Sao_Paulo" })} \n⌛_*Data de encerramento:*_ ${game.endDate.toLocaleString('pt-BR', { timeZone: "America/Sao_Paulo" })}`);
    }

    const message = `🎮*Jogos grátis da Epic Games:* \n\n${gamesInfo.join('\n\n')}`;
    return message;
}

const freeGames = async (msg) => {
    myModule.bot.sendMessage(msg.from, await getFreeGameMessage());
}

module.exports = { init };
