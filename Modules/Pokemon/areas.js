const { Pokemon, Conditions } = require("./classes");
const superagent = require("superagent");
var capitalize = require('capitalize');

const Areas = {
    getMethodString: (condition) => {
        switch(condition) {
            case Conditions.Walking:
                return "andando"
            case Conditions.Day:
                return "andando durante o dia"
            case Conditions.Night:
                return "andando durante a noite"
            case Conditions.Surf:
                return "surfando"
            case Conditions.Fish:
                return "pescando"
            default:
                return "andando";
        }   
    },

    getRealName: (name) => {
        switch (name) {
            case "nidoran-m":
            case "nidoran-f":
                return "Nidoran"
            default:
                return name;
        }
    },

    getConditionMode: (encounterInfos) => {
        var condition = { ...encounterInfos }
            var method = encounterInfos.condition_values[0] ? encounterInfos.condition_values[0].name : encounterInfos.method.name;
            console.log(method);
            if(method) {
            switch(method) {
                case "time-day":
                    condition.mode = Conditions.Day;
                    break;
                case "time-night":
                    condition.mode = Conditions.Night;
                    break;
                case "old-rod":
                case "super-rod":
                case "ultra-rod":
                    condition.mode = Conditions.Fisb;
                    break;
                case "surf":
                case "surfing":
                    condition.mode = Conditions.Surf;
                    break
                default:
                    condition.mode = Conditions.Walk;
                    break;
            }
        }

        condition.string = Areas.getMethodString(condition.mode);

        return condition;
    },

    getPokemonArea: async (area, name) => {
        var res = await superagent.get(area.url);
        var region = {
            name, pokemon: [ ],
        };
        var body = res._body;
        await body.pokemon_encounters.forEach(encounter => {
            var encounterInfos = encounter.version_details[0].encounter_details[0];
            var condition = Areas.getConditionMode(encounterInfos);
            

            var pokemonId = encounter.pokemon.url.replace("https://pokeapi.co/api/v2/pokemon/", "").replace("/", "")
            var pokemon = new Pokemon(
                capitalize(Areas.getRealName(encounter.pokemon.name)),
                encounter.pokemon.url,
                pokemonId,
                condition.chance,
                condition.min_level,
                condition.max_level,
                condition
            )
            region.pokemon.push(pokemon)
        });
        return region;
    }
}

module.exports = Areas;