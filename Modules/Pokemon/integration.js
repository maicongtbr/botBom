const {Module} = require("../mod");
const { getRandomIntRange, Storage, getStorage, getStorageValue, userIsAdmin } = require("../../libs");
const { getEncounter } = require("./encounter");
const { MessageMedia, Buttons, List } = require("whatsapp-web.js");
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

    if(pokeName.toUpperCase() == storage.pokemon.toUpperCase()) {
        await msg.reply("Você acertou e capturou um " + storage.pokemon);
        storage.catch = true;
        storage.ignora = true;
        getStorage("pokemonModuleCurrentServerPokemon").setValue(_storage);
        var pokemonSpecies = await superagent.get('https://pokeapi.co/api/v2/pokemon-species/' + storage.pokemon.toLowerCase());
        var growthRate = pokemonSpecies._body.growth_rate.name;
        var levels = getStorageValue('pokemonModuleLevels');
        var pokeLevel = levels[growthRate][storage.level - 1];
        var catchPokemon = await createPokemon(storage.pokemon, storage.level, pokeLevel.experience);
        addPokemonToPlayer(msg, catchPokemon);
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
                if(user.pokemon.length > 6) {
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
                        box.pokemon.push(pokemon);
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
                    }).then(() => {}).catch(console.error)
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
        var _m = "Seus Pokémon na Party:\n"+ Pokemon.join("\n");
        msg.reply(_m);
    })
}

const starters = {
    kanto: [ "Charmander", "Squirtle", "Bulbasaur", "Voltar" ],
    johto: [ "Cyndaquil", "Totodile", "Chicorita", "Voltar" ],
    hoenn: [ "Torchic", "Mudkip", "Treecko", "Voltar" ],
}

const enabledRegions = [ "Kanto", "Johto", "Hoenn" ]

const state = [];

const getStarter = async (msg) => {
    var PokemonPlayerDB = db.getModel("PokemonPlayer");
    var player = await PokemonPlayerDB.findOne({
        id: msg.author
    });
    if (player && player.hasStarter) {
        msg.reply("Você já tem um inicial!");
        return;
    }

    if(!state[msg.author]) {
        state[msg.author] = 0;
    }

    switch(state[msg.author]) {
        case 0:
            let buttons = [];
            enabledRegions.forEach(e => {
                buttons.push({
                    buttonId: e,
                    type: 1,
                    body: "!inicial "+e
                })
            })
            let button = new Buttons('Escolha sua região!', buttons);
            await myModule.bot.sendMessage(msg.from, button);
            state[msg.author]++;
            break;
        case 1:
            var splited = msg.body.split(" ");
            var region = splited[1] && splited[1].toLowerCase();
            if(!region) {
                state[msg.author]--;
                return getStarter(msg);
            }
            if(!starters[region]) return;
            let _buttons = [];
            starters[region].forEach(e => {
                _buttons.push({
                    buttonId: e,
                    type: 1,
                    body: "!inicial "+e
                })
            })
            let _button = new Buttons('Escolha seu inicial!', _buttons);
            state[msg.author]++;
            await myModule.bot.sendMessage(msg.from, _button);
            break;
        case 2:
            let _splited = msg.body.split(" ");
            let pokemon = _splited[1] && _splited[1].toLowerCase();
            if(pokemon == "Voltar") {
                state[msg.author]--;
                return getStarter(msg);
            }

            var starter = await createPokemon(capitalize(pokemon), 1, 0);
            if(typeof(starter) == "string") {
                msg.reply(starter);
                state[msg.author]--;
                return;
            }
            
            addPokemonToPlayer(msg, starter, true);
            myModule.bot.sendMessage(msg.from, `Você escolheu o inicial ${capitalize(pokemon)}.`);

            state[msg.author]++;
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

    myModule.enabled = false;
}

var commands = [
    { name:'!capturar', callback: (msg) => tryCatch(msg) },
    { name:'!pokemon', callback: (msg) => showPokemon(msg) },
    { name:'!boxpokemon', callback: (msg) => showBox(msg) },
    { name: "!inicial", callback: (msg) => getStarter(msg) },
    { name: "!pokedex", callback: (msg) => getPokedex(msg) },
    { name: "!stopPokemon", callback: (msg) => stopModule(msg)},
    { name: "!lllist", callback: (msg) => {
        const productsList = new List(
            "Here's our list of products at 50% off",
            "View all products",
            [
              {
                title: "Products list",
                rows: [
                  { id: "apple", title: "Apple" },
                  { id: "mango", title: "Mango" },
                  { id: "banana", title: "Banana" },
                ],
              },
            ],
            "Please select a product"
          );
          myModule.bot.sendMessage(msg.from, productsList);
    }}
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
        // id = msg.author;
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

    download.image({
        url: pokemon.image,
        dest: "/home/life4gamming2/bot-aop/temp/out.gif",
        extractFilename: false,
    }).then(({filename}) => {
        console.log(filename);
        webp.gwebp("/home/life4gamming2/bot-aop/temp/out.gif","/home/life4gamming2/bot-aop/temp/poke.webp","-q 80",logging="-v").then(async e=> {
            const pokemonGif = MessageMedia.fromFilePath("/home/life4gamming2/bot-aop/temp/poke.webp");
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

            var bot = myModule.bot;
    
            await bot.sendMessage(id, pokemon.phrase);
            await bot.sendMessage(id, pokemonGif, {
                sendMediaAsSticker:true
            });
            await bot.sendMessage(id, "O primeiro a acerter o nome do Pokémon com o comando \"!capturar <nome do pokemon\" irá captura-lo!");
            fs.unlink("/home/life4gamming2/bot-aop/temp/out.gif", (err) => {
                if (!err) return;
                console.log(err)
            });
            fs.unlink("/home/life4gamming2/bot-aop/temp/poke.webp", (err) => {
                if (!err) return;
                console.log(err)
            });

        });
    })

    
    

    

}

const onMessage = async (msg) => {
    try {
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
            setTimeout(() => {
                havePokemon[id] = false;
            }, 60000 * 5)
            return;
        }
        var chat = await msg.getChat();
        let ep = encounterPercentage;
        if(!chat.isGroup || chat.name != "bot test chamber") ep = 999999; /// lock pra test chamber
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