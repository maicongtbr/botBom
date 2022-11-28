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

    var pokeInfo = await superagent.get(`https://pokeapi.co/api/v2/pokemon/${pokeName}/`);
    pokeInfo = pokeInfo._body;

    var sprite = MessageMedia.fromUrl(pokeInfo.sprites.front_default);

    var types = [];
    pokeInfo.types.forEach(t => {
        types.push(capitalize(t.type.name));
    })

    var evolutions = [];

    var speciesInfo = await superagent.get(`https://pokeapi.co/api/v2/pokemon-species/${pokeName.toLowerCase()}/`);
    var evolutionsInfo = await superagent.get(speciesInfo._body.evolution_chain.url);

    var evolutions = getChain(evolutionsInfo._body.chain);
    var evolutionsMessages = [];
    console.log(evolutions)
    evolutions.forEach( (e, index) => {
        evolutionsMessages.push(getEvoString(e, evolutions[index+1]));

        if(e.evolutions) {

        }
    })

    var message = `*${capitalize(pokeInfo.name)}*
    Número na Pokedex: ${pokeInfo.id}
    Tamanho: ${pokeInfo.height/10}
    Peso: ${pokeInfo.height/10}kg
    Tipos: ${types.join(", ")}
    Evoluções: ${evolutions}`
    console.log(message);
}

const getEvoString = (chain, next) => {
    console.log(chain, next)
    var methods = [];
    if(next.min_level) {
        methods.push(`Nível: ${next.min_level}`)
    }
    if(next.min_happiness) {
        methods.push(`Felicidade: ${next.min_happiness}`)
    }
    var str = `${chain.name} evolui para ${next.name}, condições: ${methods.join(", ")}`;

    return str

}

const getChain = (chain, notBase) => {
    var evolutions = [];
    if (!notBase) {
        evolutions[0] = { base: true, name: capitalize(chain.species.name) }
    }

    chain.evolves_to.forEach(e => {
        var details = e.evolution_details;
        var obj = { ...details[0], name: capitalize(e.species.name) };
        if(e.evolves_to.length > 0) {
            obj.evolutions = [];
            obj.evolutions.push(getChain(e, true))
        }
        evolutions.push(obj)
    })

    return evolutions;
}

getPokedex({ body: "!pokedex eevee" });

module.exports = { getPokedex }
