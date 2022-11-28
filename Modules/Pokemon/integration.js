const {Module} = require("../mod");
const { getRandomIntRange, Storage, getStorage, getStorageValue } = require("../../libs");
const { getEncounter } = require("./encounter");
const { MessageMedia } = require("whatsapp-web.js");
var encounterPercentage = 5;
var myModule = {};

const tryCatch = async (msg) => {
    var splited = msg.split(" ");
    var pokeName = splited[1];

    var storage = getStorageValue("pokemonModuleCurrentServerPokemon")[msg.from];
    if(!storage || storage.catch) return;

    if(pokeName.ToUpperCase() == storage.pokemon.ToUpperCase()) {
        await msg.reply("Você acertou e captoru um " + storage.pokemon);
        storage.catch = true;
    } else {
        await msg.reply("Você errou!");
        storage.tries += 1;
        if(storages.tries >= 10) {
            await myModule.bot.sendMessage(msg.from, "O Pokémon fugiu!");
        }
    }
}

var commands = [
    { name:'!capturar', callback: (msg) => tryCatch(msg) }
]

var commandsMap = new Map();

commands.forEach((value) => {
    commandsMap.set(value.name, value.callback);
})

const getPokemon = async (msg, private) => {
    var pokemon = await getEncounter(private);
    if(!pokemon) {
        return;
    }
    console.log(pokemon);
    var sticker = await MessageMedia.fromUrl(pokemon.image);
    var id = msg.from ? msg.from : msg.chatId;
    await bot.sendMessage(id, pokemon.phrase);
    await bot.sendMessage(id, sticker, {
        sendMediaAsSticker:true
    });
    await bot.sendMessage(id, "Acerte o nome do Pokémon com o comando '!capturar <nome do pokemon> para captura-lo!");
    var storage = getStorage("pokemonModuleCurrentServerPokemon");
    
    var svStorage = storage.value[msg.from] || {};

    svStorage.pokemon = pokemon.name;
    svStorage.gender = pokemon.gender;
    svStorage.level = pokemon.level;
    svStorage.tries = 0;

    storage.value[msg.from] = svStorage;

    storage.setValue(storage.value);
}

const onMessage = async (msg) => {
    try {
        var chat = await msg.getChat();
        if(!chat.isGroup || chat.name != "bot test chamber") return; /// lock pra test chamber
        var canEncounterPokemon = getRandomIntRange(1, 100) >= encounterPercentage;
        if(!canEncounterPokemon) {
            if(getRandomIntRange(1, 100) >= encounterPercentage * 2) {
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
    }, 50);

    new Storage("pokemonModuleCurrentServerPokemon", (value) => {
        value.forEach(element => {
            if(!element.notificated) {
                console.log(`Um ${element.pokemon} selvagem apareceu no servidor ${element.server}!`);
                element.notificated = true;
            }
        });
    }, []);
}

module.exports = { initPokemonModule }