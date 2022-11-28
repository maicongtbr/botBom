const superagent = require("superagent");
const { Storage } = require("../../libs");
const Areas = require("./areas");

global.regions = [
    "kanto", "johto", "hoenn"
]

const updateLocationCache = async () => {
    var parsedRegions = [ ];

    regions.forEach(async (region, i) => {
        superagent.get(`https://pokeapi.co/api/v2/region/${region}`)
            .then((res, data) => {
                const _result = res._body;
                _result.locations.forEach(location => {
                    superagent.get(location.url)
                        .then((res) => {
                            var infos = res._body;
                            var name = infos.names.find(x => x.language.name == "en");
                            res._body.areas.forEach( async area => {
                                parsedRegions.push(await Areas.getPokemonArea(area, name.name))
                            })
                        });
                }) 
                
            })
    })
    new Storage("pokemonModuleLocation", (storage) => {
        console.log("Localizações atualizadas")
        global.locales = storage;
    }, parsedRegions);
}

module.exports = { updateCache: (cb) => {
    updateLocationCache(cb);
    setTimeout(() => {
        cb();
        new Storage("pokemonModuleLoaded", () => console.log("Pokemon Module Done"), true);
    }, 1000)
} }

