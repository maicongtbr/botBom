const superagent = require("superagent");
const { Storage, getStorage } = require("../../libs");
const Areas = require("./areas");

global.regions = [
    "kanto", "johto", "hoenn", "sinnoh", "unova" // por as regioes em ordem, nao pular nenhuma
]

const updateLocationCache = async () => {
    var parsedRegions = [ ];
    var timeBefore = new Date();

    for (region in regions) {
        var res = await superagent.get(`https://pokeapi.co/api/v2/region/${parseInt(region) + 1}`)
        const _result = res._body;
        for (location of _result.locations) {
            var _res = await superagent.get(location.url)
            var infos = _res._body;
            var name = infos.names.find(x => x.language.name == "en");
            var areas = _res._body.areas;
            for (area of areas) {
                parsedRegions.push(await Areas.getPokemonArea(area, name.name))
            }
        }
    }

    var st = getStorage("pokemonModuleLocation");
    if (!st) {
        new Storage("pokemonModuleLocation", (storage) => {
            log(`Carregadas ${parsedRegions.length} regiões com pokémon capturáveis.`)
            var timeAfter = new Date();

            var hours = timeAfter.getHours() - timeBefore.getHours();
            var minutes = timeAfter.getMinutes() - timeBefore.getMinutes();
            var seconds = timeAfter.getSeconds() - timeBefore.getSeconds();
            var msg = "";
            if(hours) {
                msg += hours + "h";
            }
            if(minutes) {
                msg += minutes + "m";
            }
            if(seconds) {
                msg += seconds + "s";
            }
            log("Localizações atualizadas em " + msg);
            global.locales = storage;
        }, parsedRegions);
    } else {
        st.setValue(st.value.concat(parsedRegions));
    }

}

var log;

module.exports = { updateCache: async (_log, cb) => {
    log = _log;
    log("Iniciando localizações...");
    await updateLocationCache(cb);
    new Storage("pokemonModuleLoaded", () => log("Pokemon Module Done"), true);
}}
