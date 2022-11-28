const { getRandomIntRange, getStorageValue, getRandomInt } = require("../../libs");
const superagent = require("superagent");
var capitalize = require('capitalize');


const isShiny = () => {
    return getRandomInt(4096) == 4096;
}

const getCorrectImage = (images, female, shiny) => {
    var str = `front${shiny ? "_shiny" : ""}`;
    str = str + female ? "_female" : "_default";
    console.log(images, str)

    return images[str]
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
        console.warn("Warn on Pokemon", pokes);
        return;
    }
    var pokemon = pokes.pokemon[getRandomInt(pokes.pokemon.length - 1)];
    if(!pokemon || !pokemon.condition) {
        console.warn("Warn on Pokemon", pokemon);
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

    var image = getCorrectImage(resBody.sprites, isFemale, _isShiny);
    console.log(image);

    var level = getRandomIntRange(Math.floor(pokemon.minLevel/2), pokemon.maxLevel);
    var phrase = private ? encounterMessages.private : encounterMessages.group;
    phrase = phrase[getRandomInt(phrase.length - 1)];
    var name = capitalize(resBody.name);

    phrase = phrase.replace("%pokemon%", name).replace("mode", pokemon.condition.string);
    var ret = { image, gender: isFemale ? "Fêmea" : "Macho", name, level, phrase };
    return ret;
}

module.exports = { getEncounter }