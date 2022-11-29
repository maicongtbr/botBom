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
            console.log(`Carregado a location ${location.name} da regiao ${parseInt(region) + 1} (${global.regions[parseInt(region)]})`);

        }
    }

    var st = getStorage("pokemonModuleLocation");
    if (!st) {
        new Storage("pokemonModuleLocation", (storage) => {
            console.log(`Carregadas ${parsedRegions.length} regiões com pokémon capturáveis.`)
            var timeAfter = new Date();
            console.log("Localizações atualizadas em " + (timeAfter.getMilliseconds() - timeBefore.getMilliseconds())/60000 + " minutos");
            global.locales = storage;
        }, parsedRegions);
    } else {
        st.setValue(st.value.concat(parsedRegions));
    }

}

updateLocationCache()


module.exports = { updateCache: async (cb) => {
    await updateLocationCache(cb);
    cb();
    new Storage("pokemonModuleLoaded", () => console.log("Pokemon Module Done"), true);
}}
