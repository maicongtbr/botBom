const {Module} = require("../mod");
const { getRandomIntRange, Storage, getStorage, getStorageValue } = require("../../libs");
const { getEncounter } = require("./encounter");
const { MessageMedia, Buttons } = require("whatsapp-web.js");
const db = require("../../database");
const { PlayerPokemon } = require("./classes");
const superagent = require("superagent");
var encounterPercentage = 5;
var myModule = {};



const tryCatch = async (msg) => {
    var splited = msg.body.split(" ");
    var pokeName = splited[1];

    var _storage = getStorageValue("pokemonModuleCurrentServerPokemon");
    var storage = _storage[msg.from];
    if(!storage || storage.catch || !storage.pokemon) return;

    if(pokeName.toUpperCase() == storage.pokemon.toUpperCase()) {
        await msg.reply("Você acertou e captoru um " + storage.pokemon);
        storage.catch = true;
        storage.ignora = true;
        getStorage("pokemonModuleCurrentServerPokemon").setValue(_storage);
        var pokemonSpecies = await superagent.get('https://pokeapi.co/api/v2/pokemon-species/' + storage.pokemon.toLowerCase());
        var growthRate = pokemonSpecies._body.growth_rate.name;
        var levels = getStorageValue('pokemonModuleLevels');
        var pokeLevel = levels[growthRate][storage.level - 1];
        var catchPokemon = new PlayerPokemon(storage.pokemon, storage.level, pokeLevel.experience, 0, 0, 0, 0);
        var PokemonPlayerDB = db.getModel("PokemonPlayer");
        PokemonPlayerDB.findOne({
            id: msg.author
        }).then( async user => {
            if(!user) {
                PokemonPlayerDB.create({ 
                    id: msg.author,
                    repel: false,
                    playing: true,
                    pokemon: [ catchPokemon ],
                    items: [],
                    coins: 0,

                }).catch(console.error);
            } else {
                if(user.pokemon.length > 6) {
                   var boxModel = db.getModel("PokemonBox");
                   boxModel.findOne({
                    id: msg.author
                   }).then(box => {
                    if (!box) {
                        boxModel.create({
                            id: msg.author,
                            pokemon: [ catchPokemon ]
                        });
                    } else {
                        box.pokemon.push(catchPokemon);
                        boxModel.updateOne({
                            id: msg.author
                        },
                        {
                            pokemon: box.pokemon
                        })
                    }
                   })
                } else {
                    var arr = [];
                    // console.log(user.pokemon)
                    arr.push(catchPokemon);
                    // console.log(arr);
                    var newPokemon = arr.concat(user.pokemon);
                    // console.log(newPokemon);
                    PokemonPlayerDB.updateOne({
                        id: msg.author
                    },{
                        user,
                        pokemon: newPokemon
                    }).then(() => {}).catch(console.error)
                }
            }
        })
    } else {
        await msg.reply("Você errou!");
        storage.tries += 1;
        var randomTries = getRandomIntRange(6, 10);
        if(storage.tries >= randomTries) {
            await myModule.bot.sendMessage(msg.from, "O Pokémon fugiu!");
            storage.ignora = true;
            getStorage("pokemonModuleCurrentServerPokemon").setValue(_storage);
        }
    }
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
            Pokemon.push(`${e.name}, Level: ${e.level}`);
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
        var _m = "Seus Pokémon na Party:\n"+ Pokemon.join("\n");
        msg.reply(_m);
    })
}

const starters = [ "Charamnder", "Bulbasaur", "Squirtle" ];

const getStarter = async (msg) => {
    var buttons = [];
    starters.forEach(e => {
        buttons.push({
            buttonId: "!starter "+e,
            type: 1,
            buttonText: {displayText: e}
        })
    })
    let button = new Buttons('Escolha seu inicial!', buttons);
    myModule.bot.sendMessage(msg.from, button);
}

var commands = [
    { name:'!capturar', callback: (msg) => tryCatch(msg) },
    { name:'!pokemon', callback: (msg) => showPokemon(msg) },
    { name:'!boxpokemon', callback: (msg) => showBox(msg) },
    { name: "!inicial", callback: (msg) => getStarter(msg) }
]

var commandsMap = new Map();

commands.forEach((value) => {
    commandsMap.set(value.name, value.callback);
})

var havePokemon = [];

const getPokemon = async (msg, private) => {
    var pokemon = await getEncounter(private);
    var id = msg.from ? msg.from : msg.chatId;
    if (private) {
        id = msg.author;
    }

    if(havePokemon[id]) {
        setTimeout(() => {
            havePokemon[id] = false;
        }, 60000 * 5)
        return;
    }
    if(!pokemon) {
        return;
    }
    const sticker = await MessageMedia.fromUrl(pokemon.image, {
        unsafeMime: true
    });
    var bot = myModule.bot;

    havePokemon[id] = true;

    var storage = getStorage("pokemonModuleCurrentServerPokemon");
    
    var svStorage = storage.value && storage.value[msg.from] || {};

    svStorage.pokemon = pokemon.name;
    svStorage.gender = pokemon.gender;
    svStorage.level = pokemon.level;
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

    await bot.sendMessage(id, pokemon.phrase);
    await bot.sendMessage(id, sticker, {
        sendMediaAsSticker:true
    });
    await bot.sendMessage(id, "Acerte o nome do Pokémon com o comando \"!capturar <nome do pokemon\" para captura-lo!");

}

const onMessage = async (msg) => {
    try {
        var id = msg.from ? msg.from : msg.chatId;
        if(havePokemon[id]) {
            setTimeout(() => {
                havePokemon[id] = false;
            }, 60000 * 5)
            return;
        }
        var chat = await msg.getChat();
        // if(!chat.isGroup || chat.name != "bot test chamber") return; /// lock pra test chamber
        var storage = getStorageValue("pokemonModuleCurrentServerPokemon");
        var id = msg.from ? msg.from : msg.chatId;

        if(storage[id] && (storage[id].catch == true || storage[id].ignore)) {
            storage[id] = {};
            getStorage("pokemonModuleCurrentServerPokemon").setValue(storage);
            return;
        }

        var canEncounterPokemon = getRandomIntRange(1, 100) <= encounterPercentage;
        if(!canEncounterPokemon) {
            if(getRandomIntRange(1, 100) <= encounterPercentage * 2) {
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
    }, 1); // o int no ultimo param é a chance 1 = 1%

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