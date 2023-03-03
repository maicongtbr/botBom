const {Module} = require("../mod");
const { getRandomIntRange, Storage, getStorage, getStorageValue, userIsAdmin } = require("../../libs");
const { getEncounter } = require("./encounter");
const { MessageMedia, Buttons, List, MessageTypes } = require("whatsapp-web.js");
const db = require("../../database");
const { PlayerPokemon, createPokemon } = require("./classes");
const superagent = require("superagent");
const { getPokedex } = require("./pokedex");
const capitalize = require("capitalize");
var encounterPercentage = 5;
var myModule = {};
const webp = require('webp-converter');
const fs = require('fs');
const download = require('image-downloader');
const PokeParty = require("./pokeParty.js");
const { getDailyItem } = require("./daily");
var log;



const tryCatch = async (msg) => {
    var __id = msg.from ? msg.from : msg.chatId;
    if(flees[__id]) return;
    var _storage = getStorageValue("pokemonModuleCurrentServerPokemon");
    var storage = _storage[msg.from];
    if(!storage || storage.catch || !storage.pokemon) return;

    var PokemonPlayerDB = db.getModel("PokemonPlayer");
    var player = await PokemonPlayerDB.findOne({
        id: msg.author
    });


    if(player && !player.playing) {
        await msg.reply("Você não está jogando, comece a jogar com !inicial");
        return;
    }

    if(!player) {
        return;
    }

    var splited = msg.body.split(" ");
    var pokeName = splited[1];

    if(!pokeName) {
        return;
    }

    if(pokeName.toUpperCase() == storage.pokemon.toUpperCase()) {
        storage.catch = true;
        havePokemon[__id] = false;
        storage.ignore = true;
        _storage[__id] = storage;
        getStorage("pokemonModuleCurrentServerPokemon").setValue(_storage);
        var money = (100 - storage.catchRate) * getRandomIntRange(2, 8);
        money = money <= 0 ? 100 : parseInt(money);

        await giveMoneyToPlayer(msg, money);
        var PokemonPlayerDB = db.getModel("PokemonPlayer");
        var player = await PokemonPlayerDB.findOne({
            id: msg.author
        });
        if(player && player.pokemon && player.pokemon.length >= 6) {
            await msg.reply("Você acertou e capturou um " + storage.pokemon + "\nVocê já tem 6 Pokémon na Party, seu novo Pokémon foi para a Box!\nPara conferir a box digite !boxpokemon"+ ".\nVocê ganhou B$" + money + " por essa captura.");
        } else {
            await msg.reply("Você acertou e capturou um " + storage.pokemon + ".\nVocê ganhou B$" + money + " por essa captura.");

        }
        var pokemonSpecies = await superagent.get('https://pokeapi.co/api/v2/pokemon-species/' + storage.pokemon.toLowerCase());
        var growthRate = pokemonSpecies._body.growth_rate.name;
        var levels = getStorageValue('pokemonModuleLevels');
        var pokeLevel = levels[growthRate][storage.level - 1];
        var catchPokemon = await createPokemon(storage.pokemon, storage.level, pokeLevel ? pokeLevel.experience : 0, storage.shiny, storage.gender);
        await addPokemonToPlayer(msg, catchPokemon);
    } else {
        await msg.reply("Você errou!");
        storage.tries += 1;
        storage.pokemonAttempt--;
        var randomTries = getRandomIntRange(6, 10);
        if(storage.tries >= randomTries || storage.pokemonAttempt <= 0) {
            await flee(storage, __id);
        }
        _storage[msg.from] = storage;
        getStorage("pokemonModuleCurrentServerPokemon").setValue(_storage);
    }
}
const flees = []
const flee = async (storage, id) =>
{
    if(flees[id]) return;
    flees[id] = true;
    havePokemon[id] = false;
    await myModule.bot.sendMessage(id, `O Pokémon ${storage.pokemon} fugiu!`);
    storage.ignore = true;
    flees[id] = false;
}

const addPokemonToPlayer = async (msg, pokemon, isStarter) => {
    if(!msg.author) {
        return;
    }

    if(!pokemon.name) {
        throw "Pokemon sem nome, tentando adicionar para " + await msg.getContact().pushname;
    }

    if (isStarter) {
        var items = { ... global.itemMap["Poké Ball"], amount: 10};
        addItem(msg, items);
    }

    var PokemonPlayerDB = db.getModel("PokemonPlayer");
        PokemonPlayerDB.findOne({
            id: msg.author
        }).then( async user => {
            if(!user) {
                PokemonPlayerDB.create({ 
                    id: msg.author,
                    repel: false,
                    playing: true,
                    pokemon: [ pokemon ],
                    items: [],
                    hasStarter: isStarter,
                    coins: 0,
                }).catch(console.error);
            } else {
                if(user.pokemon.length >= 6) {
                   var boxModel = db.getModel("PokemonBox");
                   boxModel.findOne({
                    id: msg.author
                   }).then(box => {
                    if (!box) {
                        boxModel.create({
                            id: msg.author,
                            pokemon: [ pokemon ]
                        });
                    } else {
                        var arr = [];
                        var newPokemon = arr.concat(box.pokemon);
                        newPokemon.push(pokemon);
                        boxModel.updateOne({
                            id: msg.author
                        },
                        {
                            box,
                            pokemon: newPokemon
                        }).then(() => {}).catch(console.error);
                    }
                   })
                } else {
                    var arr = [];
                    var newPokemon = arr.concat(user.pokemon);
                    newPokemon.push(pokemon);
                    PokemonPlayerDB.updateOne({
                        id: msg.author
                    },{
                        user,
                        pokemon: newPokemon,
                        hasStarter: isStarter,
                    }).then(() => {}).catch(console.error);
                }
            }
        })
}

const showPokemon = async (msg) => {
    var PokemonPlayerDB = db.getModel("PokemonPlayer");
    PokemonPlayerDB.findOne({
        id: msg.author || msg.from
    }).then(async player => {
        if(!player) {
            msg.reply("Você não tem Pokémon na Party");
            return;
        }

        var chat = await msg.getChat();
        var contact = await msg.getContact();
        if (chat.isGroup) {
            const pokemonList = [{
                title: `Party de ${contact.pushname}`,
                rows: []
            }];
            player.pokemon.forEach(e=> {
                const name = e.shiny ? `Shiny ${e.name}` : e.name;
                pokemonList[0].rows.push({title: name, description: `Level: ${e.level}\nVida: ${e.currentHp}/${e.maxHp}`})
            })

            const list = new List(`B$: ${player.coins}\nPokémon na Party: ${pokemonList[0].rows.length}\nClique abaixo para conferir a party`,
            `Conferir Party de ${contact.pushname}`, pokemonList, `Party de ${contact.pushname}`,"Formato reduzido para evitar spam em grupos. Para a versão completa use o privado do bot!");

            await msg.reply(list);
            return;
        }
        
        let playerInfos = { coins: player.coins, name: contact.pushname, image: await contact.getProfilePicUrl() }
        let Pokemon = [];
        for (let index = 0; index < player.pokemon.length; index++) {
            const e = player.pokemon[index];
            Pokemon.push({name: e.name, level: e.level, hp: { current: e.currentHp, max: e.maxHp }, shiny: e.shiny });
        }

        let img = await PokeParty.getPokemonPartyImage(playerInfos, Pokemon);
        return await msg.reply(img);
    })
}

const paginateBox = (info) => {
    const box = [];

    const boxAmount = Math.ceil((info.length - 1) /10);

    for(var i = 0; i <= boxAmount; i++)
    {
        const thisBox = {
            title: `Box ${i + 1}`,
            rows: []
        }

        for( var j = i * 10; j <=( i + 1) * 10; j++)
        {
            let pokemon = info[j];
            if(info.length < j || !pokemon) break;
            thisBox.rows.push({title: capitalize(pokemon.name), description: `Level: ${pokemon.level}`});
        }

        if(thisBox.rows.length<1) continue;

        box.push(thisBox);


    }

    return box;
}

const showBox = async (msg) => {
     var PokemonBox = db.getModel("PokemonBox");
    var player = await PokemonBox.findOne({
        id: msg.author || msg.from
    });

    if(!player) {
        await msg.reply("Você não tem Pokémon na Box");
        return;
    }

    var box = paginateBox(player.pokemon);

    var contact = await msg.getContact();
    const list = new List(`Pokémon reservas de ${contact.pushname}`, "Abrir",
    box);

    var chat = await msg.getChat();
    if(chat.isGroup)
    {
        await msg.reply("Esse comando não pode ser usado em grupos!");
        await myModule.bot.sendMessage(msg.author, list);
    } else {
        await msg.reply(list);
    }
}

const starterList =  new List(
    "Escolhe seu Pokémon Inicial",
    "Ver todos Iniciais",
    [
      {
        title: "Kanto",
        rows: [
          { id: "Charmander", title: "Charmander" },
          { id: "Squirtle", title: "Squirtle" },
          { id: "Bulbasaur", title: "Bulbasaur" },
        ],
      },
      {
        title: "Johto",
        rows: [
          { id: "Cyndaquil", title: "Cyndaquil" },
          { id: "Totodile", title: "Totodile" },
          { id: "Chikorita", title: "Chikorita" },
        ],
      },
      {
        title: "Hoenn",
        rows: [
          { id: "Torchic", title: "Torchic" },
          { id: "Mudkip", title: "Mudkip" },
          { id: "Treecko", title: "Treecko" },
        ],
      },
      {
        title: "Sinnoh",
        rows: [
          { id: "Chimchar", title: "Chimchar" },
          { id: "Piplup", title: "Piplup" },
          { id: "Turtwig", title: "Turtwig" },
        ],
      },
      {
        title: "Unova",
        rows: [
          { id: "Oshawott", title: "Oshawott" },
          { id: "Tepig", title: "Tepig" },
          { id: "Snivy", title: "Snivy" },
        ],
      },
    ]
);


const starterState = [];

const getStarter = async (msg) => {
    var PokemonPlayerDB = db.getModel("PokemonPlayer");
    var player = await PokemonPlayerDB.findOne({
        id: msg.author
    });
    if (player && player.hasStarter) {
        msg.reply("Você já tem um inicial!");
        return;
    }

    if(!starterState[msg.author]) {
        starterState[msg.author] = 0;
    }

    switch(starterState[msg.author]) {
        case 0:

            await myModule.bot.sendMessage(msg.from, starterList);
            starterState[msg.author]++;
            break;
        case 1:
            let pokemon = msg.body.toLowerCase();

            var starter = await createPokemon(capitalize(pokemon), 1, 0);
            if(typeof(starter) == "string") {
                msg.reply(starter);
                starterState[msg.author]--;
                return;
            }
            
           await  addPokemonToPlayer(msg, starter, true);
            myModule.bot.sendMessage(msg.from, `Você escolheu o inicial ${capitalize(pokemon)}.`);

            starterState[msg.author] = 0;
            break;
        default:
            msg.reply(`Opção inválida.`);
            break;
    }
}

const stopModule = async (msg) => {
    if (! await userIsAdmin(await msg.getChat(), msg.author)) {
        msg.reply("Somente Admins.");
        return;
    }

    myModule.enabled = !myModule.enabled;
    msg.reply("O estado do PokéModule está " + myModule.enabled ? "Ativado" : "Desativado")
}

const changeSpawnRate = async (msg) => {
    if (! await userIsAdmin(await msg.getChat(), msg.author)) {
        msg.reply("Somente Admins.");
        return;
    }

    let _splited = msg.body.split(" ");
    let chance = _splited[1] && parseInt(_splited[1]);
    if (!chance) {
        msg.reply("Chance inválida.");
        return;
    }

    getStorage("pokemonModuleEncounterRate").setValue(chance);
    msg.reply(`Spawn rate alterada para ${chance}`);
    return;

}

const marketState = [];

const dailies = [];
const dayTime = 1000 * 60 * 60 * 24;
const getDaily = async (msg) => {
    var chat = await msg.getChat();
    if(chat.isGroup) return await msg.reply("Esse comando não pode ser usado em grupos.");

    const id = msg.author || msg.from;
    const date = new Date();
    if(dailies[id] && dailies[id].date >= date) return await msg.reply("Você ja recebeu seus items hoje");

    const items = getDailyItem();
    var rows = [];
    for (let index = 0; index < items.length; index++) {
        const e = items[index];
        await addItem(msg, e);
        rows.push({title: e.name, description: `Quantidade: ${e.amount}`, id:`itemdaily${id}${id-1}`});
    }

    const ls = [
        {
            title: "Items Diários",
            rows: rows
        }
    ];

    const list = new List("Itens diários recebidos!", "Ver items", ls)
    dailies[id] = { date: new Date(date.getTime() + dayTime) };
    await msg.reply(list);
}

var commands = [
    { name:'!capturar', callback: (msg) => tryCatch(msg) },
    { name:'!pokebom', callback: (msg) => showPokemon(msg) },
    { name:'!boxpokemon', callback: (msg) => showBox(msg) },
    { name: "!inicial", callback: (msg) => getStarter(msg) },
    { name: "!pokedex", callback: (msg) => getPokedex(msg) },
    { name: "!pokestop", callback: (msg) => stopModule(msg)},
    { name: "!pokespawnrate", callback: (msg) => changeSpawnRate(msg)},
    { name: "!pokedaily", callback: (msg) => getDaily(msg)},
    { name: "!pokesummon", callback: async (msg) => {
        if (! await userIsAdmin(await msg.getChat(), msg.author)) {
            msg.reply("Somente Admins.");
            return;
        }
        var id = msg.from ? msg.from : msg.chatId;
        havePokemon[id] = false;
        await getPokemon(msg, null, true);
    }},
    { name: "!pokemarket", callback: async (msg) => {

        marketState[msg.from] = 1;
        var buttons = new Buttons("Bem-vindo ao Mercado Pokémon",
        [
            { buttonId:'1',body:'Comprar Items',type: 1 },
            { buttonId:'2',body:"Vender Items (em breve)",type: 1 },
        ])
        var chat = await msg.getChat();
        if(chat.isGroup) 
        {
            await myModule.bot.sendMessage(msg.author, buttons);
        } else {
            await msg.reply(buttons);
        }
    }},
    { name: "!pokebag", callback: async (msg) => getMyItems(msg)}
]

var commandsMap = new Map();

commands.forEach((value) => {
    commandsMap.set(value.name, value.callback);
})

var havePokemon = [];

const getPokemon = async (msg, private, force) => {
    var id = msg.from ? msg.from : msg.chatId;
    if(havePokemon[id]) {
        if(force) {
            havePokemon[id] = false;
            await msg.reply("Nenhum Pokémon apareceu...");
        }
        return;
    }
    havePokemon[id] = true;
    var pokemon = await getEncounter(private);
    if (private) {
        // id = msg.author;
    }
    if(!pokemon) {
        if(force) {
            await msg.reply("Nenhum Pokémon apareceu...");
        }
        havePokemon[id] = false
        return;
    }
    
    var rng = getRandomIntRange(0, 9999);
    var imgName = `/home/maiconkekw/BotAOP/temp/out${id}${rng}.gif`;
    var imgNameWebp = `/home/maiconkekw/BotAOP/temp/out${id}${rng}.webp`;
    download.image({
        url: pokemon.image,
        dest: imgName,
        extractFilename: false,
    }).then(({filename}) => {
        webp.gwebp(imgName,imgNameWebp,"-q 80",logging="-v").then(async e=> {
            const pokemonGif = MessageMedia.fromFilePath(imgNameWebp);
    
            var storage = getStorage("pokemonModuleCurrentServerPokemon");
            
            var svStorage = storage.value && storage.value[msg.from] || {};
    
            svStorage.pokemon = pokemon.name;
            svStorage.gender = pokemon.gender;
            svStorage.level = pokemon.level;
            svStorage.shiny = pokemon.shiny;
            svStorage.gender = pokemon.gender;
            svStorage.catchRate = pokemon.catchRate;
            svStorage.ignore = false;
            var chat = await msg.getChat();
            svStorage.server = chat.name;
            svStorage.tries = 0;
            svStorage.pokemonAttempt = getRandomIntRange(10, 15); // msgs para fugir
    
            if(storage.value) {
                storage.value[msg.from] = svStorage;
                storage.setValue(storage.value);
    
            } else {
                var a = [];
                a[msg.from] = svStorage;
                storage.setValue(a);
            }

            var bot = myModule.bot;
    
            await bot.sendMessage(id, pokemon.phrase);
            await bot.sendMessage(id, pokemonGif, {
                sendMediaAsSticker:true
            });
            await bot.sendMessage(id, "O *primeiro* a acertar o nome do Pokémon com o comando \"!capturar <nome do pokemon\" irá captura-lo!\n O Pokemon irá fugir em 5 minutos.");
            fs.unlink(imgName, (err) => {
                if (!err) return;
                log(err)
            });
            fs.unlink(imgNameWebp, (err) => {
                if (!err) return;
                log(err)
            });

        });
    })

}

const pokeGroups = [
    "Aldeia Oculta dos Patos",
    "bot test chamber"
]

// {
//     title: "Pokébolas",
//     rows: []
// }

const giveMoneyToPlayer = async (msg, amount) => {
    var PokemonPlayerDB = db.getModel("PokemonPlayer");
    var player =  await PokemonPlayerDB.findOne({
        id: msg.author
    });

    var coins = player.coins || 0;

    await PokemonPlayerDB.updateOne({
       id: msg.author
    },
    {
        coins: coins + amount
    }, { upsrt: true });
}

const getMyItems = async (msg) => {
    var spec = [];

    var PokemonPlayerDB = db.getModel("PokemonPlayer");
    var player = await PokemonPlayerDB.findOne({
        id: msg.author || msg.from
    });

    if(!player || player.itens.length <= 0) {
        await msg.reply("Você não tem nenhum item");
        return;
    }

    for (item of player.itens) {
        var _spec = spec.find(x => x.title == item.type);
        if(!_spec) {
            _spec = {
                title: item.type,
                rows: []
            }

            _spec.rows.push({title: item.name, description: `Quantidade: ${item.amount}`});
            spec.push(_spec);
            continue;
        }
        _spec.rows.push({title: item.name, description: `Quantidade: ${item.amount}`});
    }

    var contact = await msg.getContact();
    var list = new List(`Mochila de ${contact.pushname}`, "Abrir Mochila", spec);

    await msg.reply(list);
}

const addItem = async (msg, item) => {
    if(!item) {
        return;
    }
    var PokemonPlayerDB = db.getModel("PokemonPlayer");
    var player = await PokemonPlayerDB.findOne({
        id: msg.author || msg.from
    });

    if(!player) {
        return;
    }

    var itens = player.itens;

    thisItem = itens.find(x => x.internalName == item.internalName);
    if (thisItem) {
        thisItem.amount++;
    } else {
        amount = item.amount || 1;
        itens.push({ ...item, amount});
    }

    var ret = await PokemonPlayerDB.updateOne({
        id: msg.author || msg.from
    },{
        itens
    });
    return ret;
}

const buyItem = async (msg) => {
    var args = msg.body.split("\nPreço: ")
    var name = args[0];
    var price = args[1].split(" ")[0];
    var PokemonPlayerDB = db.getModel("PokemonPlayer");
    var player = await PokemonPlayerDB.findOne({
        id: msg.from
    });

    if (!player || player.coins < parseInt(price)) {
        msg.reply(`Você não tem ${price} BomCoins para comprar o item ${name}`);
        marketState[msg.from] = 0;
        return;
    }
    var update = await PokemonPlayerDB.updateOne({
        id: msg.from
    }, { coins: player.coins - parseInt(price)})
    if(update.modifiedCount > 0) {
        marketState[msg.from] = 0;
        await addItem(msg, global.itemMap[name]);
        await msg.reply(`Item ${name} comprado com sucesso!`);
    }

}

const onMessage = async (msg) => {
    try {
        if(msg.type == MessageTypes.LIST_RESPONSE) {
            if(starterState[msg.author]) {
                return getStarter(msg);
            }else if(marketState[msg.from]) {
                return buyItem(msg);
            }
        } else if (msg.type == MessageTypes.BUTTONS_RESPONSE) {
            if(marketState[msg.from]) {
                if(msg.body == "Comprar Items") {
                    var list = new List(
                        "Seja bem-vindo ao Mercado Pokémon!\nClique abaixo para Comprar Items!",
                        "Comprar Itens",
                        global.MarketItems,
                        "Pokébom Market"
                    )

                    await myModule.bot.sendMessage(msg.from, list);
                    marketState[msg.from]++
                } else {
                    marketState[msg.from]++
                    await msg.reply("Feature em construção");
                }
            }
        }

        if(!myModule.enabled){
            return;
        }
        var PokemonPlayerDB = db.getModel("PokemonPlayer");
        var player = await PokemonPlayerDB.findOne({
            id: msg.author
        });

        if(!player) {
            return;
        }

        if(player && !player.playing) {
            return;
        }
        var id = msg.from ? msg.from : msg.chatId;
        var storage = getStorageValue("pokemonModuleCurrentServerPokemon");
        if(havePokemon[id]) {
            if(flees[id]) return;

            var _storage = storage[id];
            if(!_storage) {
                return;
            }
            _storage.pokemonAttempt--;
            if(_storage && _storage.pokemonAttempt <= 0) {
                await flee(_storage, id);
            }
            getStorage("pokemonModuleCurrentServerPokemon").setValue(storage);
            return;
        }
        var chat = await msg.getChat();
        let ep = encounterPercentage;
        if(!chat.isGroup || chat.name == "bot test chamber") ep = 999999; /// lock pra test chamber

        if(!pokeGroups.find(x => x == chat.name)) {
            return;
        }

        if(storage && storage[id] && (storage[id].catch == true || storage[id].ignore)) {
            storage[id] = {};
            getStorage("pokemonModuleCurrentServerPokemon").setValue(storage);
            return;
        }

        var canEncounterPokemon = getRandomIntRange(1, 100) <= ep;
        if(!canEncounterPokemon) {
            if(getRandomIntRange(1, 100) <= ep * 2) {
                getPokemon(msg, true);
            } else {
                return;
            }
        }
        getPokemon(msg);

    } catch (e) {
        console.warn("Erro onMessage PokéBom", e);
    }
}

const onLevelUp = (msg) => {

}

const initPokemonModule = async (bot) => {
    var callbacks = { onMessage, onLevelUp };
    myModule = new Module("PokéBom", bot, callbacks, commands);
    log = (...args) => myModule.log(args);
    await require("./main")(log); // start

    new Storage("pokemonModuleEncounterRate", (value) => {
        encounterPercentage = value;
    }, 3); // o int no ultimo param é a chance 1 = 1%

    new Storage("pokemonModuleCurrentServerPokemon", (value) => {
        for (vae in value) {
            element = value[vae]
            if(!element.notificated && element.pokemon && element.server) {
                log(`Um ${element.pokemon} selvagem apareceu no servidor ${element.server}!`);
                element.notificated = true;
            }
        }
    }, []);
}

module.exports = { initPokemonModule }