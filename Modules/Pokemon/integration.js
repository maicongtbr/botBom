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
const { getMarket } = require("./market");



const tryCatch = async (msg) => {
    var PokemonPlayerDB = db.getModel("PokemonPlayer");
    var player = await PokemonPlayerDB.findOne({
        id: msg.author
    });

    if(player && !player.playing) {
        await msg.reply("Você não está jogando, comece a jogar com !inicial");
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
        var catchPokemon = await createPokemon(storage.pokemon, storage.level, pokeLevel ? pokeLevel.experience : 0, storage.shiny);
        addPokemonToPlayer(msg, catchPokemon);
    } else {
        await msg.reply("Você errou!");
        storage.tries += 1;
        var randomTries = getRandomIntRange(6, 10);
        if(storage.tries >= randomTries) {
            await myModule.bot.sendMessage(msg.from, "O Pokémon fugiu!");
            havePokemon[__id] = false;
            storage.ignore = true;
            getStorage("pokemonModuleCurrentServerPokemon").setValue(_storage);
        }
    }
}

const addPokemonToPlayer = (msg, pokemon, isStarter) => {
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
                        arr.push(pokemon);
                        var newPokemon = arr.concat(box.pokemon);
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
                    // console.log(user.pokemon)
                    arr.push(pokemon);
                    // console.log(arr);
                    var newPokemon = arr.concat(user.pokemon);
                    // console.log(newPokemon);
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

const showPokemon = (msg) => {
    var PokemonPlayerDB = db.getModel("PokemonPlayer");
    PokemonPlayerDB.findOne({
        id: msg.author
    }).then(async player => {
        if(!player) {
            msg.reply("Você não tem Pokémon na Party");
            return;
        }
        var Pokemon = [];
        player.pokemon.forEach(e=> {
            var moves = [];
            e.moves.forEach( m => {
                moves.push(m.name);
            })
            Pokemon.push(`${e.name}, Level: ${e.level}, Moves: ${moves.join(", ")}, HP: ${e.currentHp}/${e.maxHp}`);
        })
        var _m = "Seus Pokémon na Party:\n"+ Pokemon.join("\n");
        msg.reply(_m);
    })
}

const showBox = (msg) => {
    var PokemonBox = db.getModel("PokemonBox");
    PokemonBox.findOne({
        id: msg.author
    }).then(async player => {
        if(!player) {
            msg.reply("Você não tem Pokémon na Box");
            return;
        }
        var Pokemon = [];
        player.pokemon.forEach(e=> {
            Pokemon.push(`${e.name}, Level: ${e.level}`);
        })
        var _m = "Seus Pokémon na Box:\n"+ Pokemon.join("\n");
        msg.reply(_m);
    })
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
            
            addPokemonToPlayer(msg, starter, true);
            myModule.bot.sendMessage(msg.from, `Você escolheu o inicial ${capitalize(pokemon)}.`);

            starterState[msg.author] = 0;
            break;
        default:
            msg.reply(`Opção inválida.`);
            break;
    }
}

const stopModule = async (msg) => {
    if (!userIsAdmin(await msg.getChat(), msg.author)) {
        msg.reply("Somente Admins.");
        return;
    }

    myModule.enabled = !myModule.enabled;
    msg.reply("O estado do PokéModule está " + myModule.enabled ? "Ativado" : "Desativado")
}

const changeSpawnRate = async (msg) => {
    if (!userIsAdmin(await msg.getChat(), msg.author)) {
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
        if (!userIsAdmin(await msg.getChat(), msg.author)) {
            msg.reply("Somente Admins.");
            return;
        }
        var id = msg.from ? msg.from : msg.chatId;
        havePokemon[id] = false;
        await getPokemon(msg);
    }},
    { name: "!compraritems", callback: async (msg) => {
        var chat = await msg.getChat();
        if(chat.isGroup) return;
        marketState[msg.author] = 0;
        getMarket(msg);
    }}
]

var commandsMap = new Map();

commands.forEach((value) => {
    commandsMap.set(value.name, value.callback);
})

var havePokemon = [];

const getPokemon = async (msg, private) => {
    var id = msg.from ? msg.from : msg.chatId;
    if(havePokemon[id]) {
        havePokemon[id] = false;
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
        console.log(filename);
        webp.gwebp(imgName,imgNameWebp,"-q 80",logging="-v").then(async e=> {
            const pokemonGif = MessageMedia.fromFilePath(imgNameWebp);
    
            var storage = getStorage("pokemonModuleCurrentServerPokemon");
            
            var svStorage = storage.value && storage.value[msg.from] || {};
    
            svStorage.pokemon = pokemon.name;
            svStorage.gender = pokemon.gender;
            svStorage.level = pokemon.level;
            svStorage.shiny = pokemon.shiny;
            svStorage.ignore = false;
            var chat = await msg.getChat();
            svStorage.server = chat.name;
            svStorage.tries = 0;
    
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
            await bot.sendMessage(id, "O *primeiro* a acerter o nome do Pokémon com o comando \"!capturar <nome do pokemon\" irá captura-lo!");
            fs.unlink(imgName, (err) => {
                if (!err) return;
                console.log(err)
            });
            fs.unlink(imgNameWebp, (err) => {
                if (!err) return;
                console.log(err)
            });

        });
    })

}

const pokeGroups = [
    "Aldeia Oculta dos Patos",
    "bot test chamber"
]

const buyItem = async (msg) => {
    var args = msg.body.split("\nPreço: ")
    var name = args[0];
    var price = args[1].split(" ")[0];
    console.log(price, name);
    var PokemonPlayerDB = db.getModel("PokemonPlayer");
    var player = await PokemonPlayerDB.findOne({
        id: msg.author
    });

    if (!player || player.coins <= price) {
        msg.reply(`Você não tem ${price} BomCoins para comprar o item ${name}`);
        return;
    }
}

const onMessage = async (msg) => {
    try {
        if(msg.type == MessageTypes.LIST_RESPONSE) {
            if(starterState[msg.author]) {
                return getStarter(msg);
            }
            if(marketState[msg.author]) {
                return buyItem(msg);
            }
        }

        if(!myModule.enabled){
            return;
        }
        var PokemonPlayerDB = db.getModel("PokemonPlayer");
        var player = await PokemonPlayerDB.findOne({
            id: msg.author
        });

        if(player && !player.playing) {
            return;
        }
        var id = msg.from ? msg.from : msg.chatId;
        if(havePokemon[id]) {
            havePokemon[id] = false;
            return;
        }
        var chat = await msg.getChat();
        let ep = encounterPercentage;
        if(!chat.isGroup || chat.name == "bot test chamber") ep = 999999; /// lock pra test chamber

        if(!pokeGroups.find(x => x == chat.name)) {
            return;
        }
    
        var storage = getStorageValue("pokemonModuleCurrentServerPokemon");
        var id = msg.from ? msg.from : msg.chatId;

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
        console.warn("Erro onMessage PokémonModule", e);
    }
}

const onLevelUp = (msg) => {

}

const initPokemonModule = (bot) => {
    var callbacks = { onMessage, onLevelUp };
    myModule = new Module("Pokémon", bot, callbacks, commands);
    require("./main"); // start

    new Storage("pokemonModuleEncounterRate", (value) => {
        encounterPercentage = value;
    }, 3); // o int no ultimo param é a chance 1 = 1%

    new Storage("pokemonModuleCurrentServerPokemon", (value) => {
        for (vae in value) {
            element = value[vae]
            if(!element.notificated && element.pokemon && element.server) {
                console.log(`Um ${element.pokemon} selvagem apareceu no servidor ${element.server}!`);
                element.notificated = true;
            }
        }
    }, []);
}

module.exports = { initPokemonModule }