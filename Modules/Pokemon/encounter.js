const { getRandomIntRange, getStorageValue, getRandomInt } = require("../../libs");
const superagent = require("superagent");
var capitalize = require('capitalize');


const isShiny = () => {
    return getRandomInt(4096) == 4096;
}

const getCorrectImage = (images, female, shiny) => {
    var str = "front_default";
    if(female) {
        if(shiny) {
            str = "front_shiny_female";
        } else {
            str = "front_female";
        }
    } else if (shiny) {
        str = "front_shiny"
    }
    return images[str]
}

const slicePokeName = (pokeName) => {
    var pokeNameLenght = pokeName.length -1;
    var str = [];
    for(var e = 0; e <= pokeNameLenght; e++) {
        if (e == 0){
            str[e] = pokeName[e];
            continue;
        }
        var chance = 90;
        if (str[e -1] == "_") {
            chance = 10
        }
        if (getRandomInt(100) <= chance){
            str[e] = '_';
        } 
        else {
            str[e] = pokeName[e];
        }
    }
    return str.join("");
}

var encounterMessages = {
    private: [ "Você estava %mode% e um %pokemon% selvagem apareceu!" ],
    group: [ "Um %pokemon% selvagem apareceu!" ]
}

const { Conditions } = require("./classes");


const getEncounter = async (msg, private) => {
    var locales = getStorageValue("pokemonModuleLocation");
    var id = getRandomInt(locales.length - 1);
    var pokes = locales[id];
    var _isShiny = isShiny();
    if(!pokes || !pokes.pokemon || pokes.pokemon.length -1 <= 0) {
        return;
    }
    var pokemon = pokes.pokemon[getRandomInt(pokes.pokemon.length - 1)];
    if(!pokemon || !pokemon.condition) {
        return;
    }

    if(pokemon.condition.condition) {
        var date = new Date();
        var hours =  date.getHours();
        var canCatch = true;
        switch(pokemon.condition.condition) {
            case(Conditions.Day):
                if(hours >= 18 || hours <= 06 ) {
                    canCatch = false;
                }
                break;
            case(Conditions.Night):
                if(hours <= 18 || hours >= 06 ) {
                    canCatch = false;
                }
                break;
            default:
                break;
        }

        if(!canCatch) {
            console.log("NAo da para pegar o pokemon", pokemon);
            return;
        };
    }

    var res = await superagent.get(pokemon.url);
    var resBody = res._body;
    var speciesInfo = await superagent.get(resBody.species.url);
    var speciesBody = speciesInfo._body;

    if(speciesBody.is_legendary && getRandomInt(100) >= 5) {
        console.log("NAo da para pegar o pokemon", pokemon);
        return await getEncounter(); 
    }// Se for lendario 5% de chance de continuar, se nao gera outro

    var genderRate = speciesBody.gender_rate;
    var hasGender = genderRate != -1;
    var isFemale = hasGender && getRandomInt(genderRate) == genderRate;
    var hasGenderDiff = speciesBody.has_gender_differences;

    var image = getCorrectImage(resBody.sprites, hasGenderDiff && isFemale, _isShiny);

    var level = getRandomIntRange(Math.floor(pokemon.minLevel/2), pokemon.maxLevel);
    var phrase = private ? encounterMessages.private : encounterMessages.group;
    phrase = phrase[getRandomInt(phrase.length - 1)];
    var name = capitalize(resBody.name);

    phrase = phrase.replace("%pokemon%", slicePokeName(name)).replace("mode", pokemon.condition.string);
    var ret = { image, gender: isFemale ? "Fêmea" : "Macho", name, level, phrase };
    return ret;
}

module.exports = { getEncounter }