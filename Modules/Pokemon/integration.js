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
var log;



const tryCatch = async (msg) => {
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

    var _storage = getStorageValue("pokemonModuleCurrentServerPokemon");
    var storage = _storage[msg.from];
    if(!storage || storage.catch || !storage.pokemon) return;
    var __id = msg.from ? msg.from : msg.chatId;

    if(pokeName.toUpperCase() == storage.pokemon.toUpperCase()) {
        var PokemonPlayerDB = db.getModel("PokemonPlayer");
        var player = await PokemonPlayerDB.findOne({
            id: msg.author
        });
        if(player && player.pokemon && player.pokemon.length >= 6) {
            await msg.reply("Você acertou e capturou um " + storage.pokemon + "\nVocê já tem 6 Pokémon na Party, seu novo Pokémon foi para a Box!\nPara conferir a box digite !boxpokemon");
        } else {
            await msg.reply("Você acertou e capturou um " + storage.pokemon);

        }
        storage.catch = true;
        havePokemon[__id] = false;
        storage.ignore = true;
        getStorage("pokemonModuleCurrentServerPokemon").setValue(_storage);
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
        throw "Pokemon sem nome, tentnado adicionar para " + await msg.getContact().pushname;
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
        id: msg.author
    }).then(async player => {
        if(!player) {
            msg.reply("Você não tem Pokémon na Party");
            return;
        }


        var contact = await msg.getContact();
        var playerInfos = { coins: player.coins, name: contact.pushname, image: await contact.getProfilePicUrl() }
        var Pokemon = [];
        player.pokemon.forEach(e=> {
            Pokemon.push({name: e.name, level: e.level, hp: { current: e.currentHp, max: e.maxHp }, shiny: e.shiny });
        })
        var img = await PokeParty.getPokemonPartyImage(playerInfos, Pokemon);
        msg.reply(img);
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

    return await msg.reply(list);
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

var commands = [
    { name:'!capturar', callback: (msg) => tryCatch(msg) },
    { name:'!pokemon', callback: (msg) => showPokemon(msg) },
    { name:'!boxpokemon', callback: (msg) => showBox(msg) },
    { name: "!inicial", callback: (msg) => getStarter(msg) },
    { name: "!pokedex", callback: (msg) => getPokedex(msg) },
    { name: "!pokestop", callback: (msg) => stopModule(msg)},
    { name: "!pokespawnrate", callback: (msg) => changeSpawnRate(msg)},
    { name: "!pokesummon", callback: async (msg) => {
        if (! await userIsAdmin(await msg.getChat(), msg.author)) {
            msg.reply("Somente Admins.");
            return;
        }
        var id = msg.from ? msg.from : msg.chatId;
        havePokemon[id] = false;
        await getPokemon(msg);
    }},
    { name: "!pokemarket", callback: async (msg) => {
        var chat = await msg.getChat();
        if(chat.isGroup) 
        {
            await msg.reply("Não é possível utilizar em grupos.");
            return;
        }

        marketState[msg.from] = 1;
        var buttons = new Buttons("Bem-vindo ao Mercado Pokémon",
        [
            { buttonId:'1',body:'Comprar Items',type: 1 },
            { buttonId:'2',body:"Vender Items (em breve)",type: 1 },
        ])
        msg.reply(buttons);
    }},
    { name: "!pokebag", callback: async (msg) => getMyItems(msg)}
]

var commandsMap = new Map();

commands.forEach((value) => {
    commandsMap.set(value.name, value.callback);
})

var havePokemon = [];

const getPokemon = async (msg, private) => {
    var id = msg.from ? msg.from : msg.chatId;
    if(havePokemon[id]) {
        return;
    }
    havePokemon[id] = true;
    var pokemon = await getEncounter(private);
    if (private) {
        // id = msg.author;
    }
    if(!pokemon) {
        havePokemon[id] = false;
        return;
    }

    var rng = getRandomIntRange(0, 9999);
    var imgName = `/home/life4gamming2/bot-aop/temp/out${id}${rng}.gif`;
    var imgNameWebp = `/home/life4gamming2/bot-aop/temp/out${id}${rng}.webp`;
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
            await bot.sendMessage(id, "O *primeiro* a acertar o nome do Pokémon com o comando \"!capturar <nome do pokemon\" irá captura-lo!");
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

    awaitPokemonPlayerDB.updateOne({
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

        if(storage[id] && (storage[id].catch == true || storage[id].ignore)) {
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

const initPokemonModule = (bot) => {
    var callbacks = { onMessage, onLevelUp };
    myModule = new Module("PokéBom", bot, callbacks, commands);
    log = (...args) => myModule.log(args);
    require("./main")(log); // start

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