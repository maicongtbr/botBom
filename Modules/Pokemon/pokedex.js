const superagent = require("superagent");
const { MessageMedia } = require("whatsapp-web.js");
var capitalize = require('capitalize');

const getPokedex = async (msg) => {
    var splited = msg.body.split(" ");
    var pokeName = splited[1];
    if (!pokeName) {
        return;
    }

    pokeName = pokeName.toLowerCase();

    try {
        var pokeInfo = await superagent.get(`https://pokeapi.co/api/v2/pokemon/${pokeName}/`);
        pokeInfo = pokeInfo._body;
    
        var sprite = await MessageMedia.fromUrl(pokeInfo.sprites.front_default, {
            unsafeMime: true
        });
    
        var types = [];
        pokeInfo.types.forEach( async t => {
            types.push(capitalize(t.type.name));
        })
    
    
        var speciesInfo = await superagent.get(`https://pokeapi.co/api/v2/pokemon-species/${pokeName.toLowerCase()}/`);
        var evolutionsInfo = await superagent.get(speciesInfo._body.evolution_chain.url);
    
        var chain = getChain(evolutionsInfo._body.chain);
        var evolutionsMessages = await getChainString(chain);
    
    
    
        var message = `*${capitalize(pokeInfo.name)}*\nNúmero na Pokedex: ${pokeInfo.id}\nTamanho: ${pokeInfo.height/10}m\nPeso: ${pokeInfo.height/10}kg\nTipos: ${types.join(", ")}`;
        if(evolutionsMessages.length > 0) {
            message += `\nEvoluções: \t\n${evolutionsMessages.join("\n")}`
        }
    
        msg.reply(sprite, msg.from, {caption: message});
    } catch (error) {
        console.warn(error);
        msg.reply('Esse Pokémon não existe ou não está disponível.');
    }
}

const getChainString = async (chain) => {
    let ret = []
    for(var i = 0; i < chain.evolutions.length; i++) {
        var e = chain.evolutions[i];
        if(chain.name != e.name) {
            var string = await getEvoString(chain.name, e);
            ret.push(string);
        }
        if(e.evolutions) {
            var otherArr = await getChainString(e);
            ret = ret.concat(otherArr); 
        }
    }
    return ret
}

const getEvoString = async (baseName, evolution) => {
    var methods = [];
    console.log(evolution)
    if(evolution.min_level) {
        methods.push(`Nível: ${evolution.min_level}`);
    }
    if(evolution.min_happiness) {
        methods.push(`Felicidade: ${evolution.min_happiness}`);
    }
    if(evolution.min_affection) {
        methods.push(`Amizade: ${evolution.min_affection}`);
    }
    if(evolution.trigger.name=="trade") {
        methods.push("Durante uma Troca");
    }
    if(evolution.time_of_day) {
        switch(evolution.time_of_day) {
            case "night":
                methods.push("Durante a Noite");
                break;
            case "day":
                methods.push("Durante o dia");
                break;
            default: break;
        }
    }
    if(evolution.known_move_type) {
        methods.push(`Possuir um movimento do tipo ${capitalize(evolution.known_move_type.name)}`);

    }
    if(evolution.location) {
        methods.push(`Ao subir de nível em uma localização específica`);
    }
    if(evolution.item) {
        var item = await superagent.get(evolution.item.url);
        var name = item._body.names.find(x => x.language.name == "en");
        methods.push(`Item: ${name.name}`)
    }
    var str = `${baseName} evolui para ${evolution.name}, condições: ${methods.join(" e ")}`;

    return str
}

const getChain = (chain, notBase) => {
    let ret = { base: true, name: capitalize(chain.species.name), evolutions: [] }

    for(var i = 0; i < chain.evolves_to.length; i++) {
        var e = chain.evolves_to[i];
        var details = e.evolution_details;
        var evo = []
        if(e.evolves_to.length > 0) {
            evo.push(getChain(e, true))
        }
        var obj = { ...details[0], name: capitalize(e.species.name), evolutions: evo };
        ret.evolutions.push(obj)
    }

    return ret;
}

// getPokedex({body:"!pokedex gengar"})

module.exports = { getPokedex }
