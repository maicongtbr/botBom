
const { getEncounter } = require("./encounter");
const { updateCache } = require("./locations");
const superagent = require("superagent");
const { Storage } = require("../../libs");
const { updateMarket } = require("./market");
const PokeParty = require("./pokeParty.js")



module.exports = (log) => {
    superagent.get('https://pokeapi.co/api/v2/growth-rate/').then((res) => {
        var levels = [];
        res._body.results.forEach(e => {
            superagent.get(e.url).then((res) => {
                levels[e.name] = res._body.levels;
            })
        });
        new Storage("pokemonModuleLevels", () => {}, levels);
    })

    updateMarket();
    PokeParty.init();
    updateCache(log);
}
