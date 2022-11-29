const { Pokemon, Conditions } = require("./classes");
const superagent = require("superagent");
var capitalize = require('capitalize');

const Areas = {
    getMethodString: (condition) => {
        switch(condition) {
            case Conditions.Walking:
                return "Andando"
            case Conditions.Day:
                return "Andando durante o dia"
            case Conditions.Night:
                return "Andando durante a noite"
            default:
                return;
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

    getPokemonArea: async (area, name) => {
        var res = await superagent.get(area.url);
        var region = {
            name, pokemon: [ ],
        };
        var body = res._body;
        await body.pokemon_encounters.forEach(encounter => {
            var encounterInfos = encounter.version_details[0].encounter_details[0];
            var condition = encounterInfos;
            if(encounterInfos.condition_values && encounterInfos.condition_values[0]) {
                switch(encounterInfos.condition_values[0].name) {
                    case "time-day":
                        condition.mode = Conditions.Day;
                        break;
                    case "time-night":
                        condition.mode = Conditions.Night;
                        break;
                    default:
                        condition.mode = Conditions.Walk;
                        break;
                }
            }

            var pokemonCondition = Areas.getMethodString(condition.mode) && { condition: condition.mode, string: Areas.getMethodString(condition.mode) }
            var pokemon = new Pokemon(
                capitalize(Areas.getRealName(encounter.pokemon.name)),
                encounter.pokemon.url,
                pokemon.id,
                condition.chance,
                condition.min_level,
                condition.max_level,
                pokemonCondition && pokemonCondition
            )
            region.pokemon.push(pokemon)
        });
        return region;
    }
}

module.exports = Areas;