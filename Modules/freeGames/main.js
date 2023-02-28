const superagent = require('superagent');
const {Module} = require("../mod");
const db = require("../../database");
const { getGroup } = require("../../libs");

const Cache = db.getModel('Cache');
const Switch = db.getModel('ModuleSwitch');

var myModule;
var log;

var commands = [
    { name:'!epicfreegames', callback: (msg) => freeGames(msg) },
    { name:'!epicgames on', callback: (msg) => changeModuleState(msg) },
    { name:'!epicgames off', callback: (msg) => changeModuleState(msg) },
]

const changeModuleState = async (msg) => {
    var group = await getGroup(msg);
    if(!group) return msg.reply('Este comando só pode ser usado em grupos.');

    var groupId = group.id._serialized;
    var groupName = group.name;

    Switch.findOne({groupId: groupId})
    .then((group) => {
        if(group) {
            if(group.epicGames = true){
                if(msg.body.toLowerCase().includes('!epicgames on')) return msg.reply('O modulo já está habilitado.');

                Switch.updateOne({groupId: groupId}, {epicGames: false});
                msg.reply('O modulo da Epic Games está desabilitado.');
                console.log(`[freeGames] Modulo desabilitado para o grupo ${groupName}`);
            }
            else if(group.epicGames = false){
                if(msg.body.toLowerCase().includes('!epicgames off')) return msg.reply('O modulo já está desabilitado.');

                Switch.updateOne({groupId: groupId}, {epicGames: true});
                msg.reply('O modulo da Epic Games está habilitado.');
                console.log(`[freeGames] Modulo habilitado para o grupo ${groupName}`);
            }
        }
        else{
            Switch.create({
                groupId: groupId,
                groupName,
                epicGames: true,
            })
            console.log(`[freeGames] Modulo habilitado para o grupo ${groupName}`);
        }
    })
}

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
        info: { games: databaseGames  }
    },
    { upsert: true });

    const message = await getFreeGameMessage();

    const enabledGroups = Switch.find({epicGames: true});

    const aop = await myModule.bot.getChats();
    for (var i = 0; i < enabledGroups.length; i++)
    {
        let groupId = enabledGroups[i].groupId;
        myModule.bot.sendMessage(groupId, message);
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
