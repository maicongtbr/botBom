const jimp = require('jimp');
const capitalize = require("capitalize");
const { getCorrectImage } = require("./encounter");
const superagent = require('superagent');
const download = require('image-downloader');
const { getRandomInt } = require('../../libs');


const init = async () => {
    let defaults = {
        font: await jimp.loadFont(jimp.FONT_SANS_32_BLACK),
        levelFont: await jimp.loadFont(jimp.FONT_SANS_16_BLACK),
        template: await jimp.read('./img/background.png'),
        healthBarTemplate: await jimp.read('./img/healthBarTemplate.png'),
        pokeCoords: [
            {
                pokeName: { x: 6, y: 451 },
                pokeHp: { x: 56, y: 522 },
                pokeLvl: { x: 56, y: 545 },
                pokeIcon: { x: 290, y: 380 },
                pokeHealthBar: { x: 8, y: 500 }
            }, {}, {}, {}, {}, {}
        ],
        playerCoords: {
            playerName: { x: 406, y: 16 },
            playericon: { x: 179, y: 137 },
            playerCoins: { x: 468, y: 377}
        }
    };

    global.PartyConfig = defaults;
}

const getPokemonPartyImage = async (player, party) => {
    // player = { name: ..., image: ..., coins: ... }
    // party = [ { name: ..., level: ..., hp: { current, max }} ]
    var template = global.PartyConfig.template;

    var int = getRandomInt(99999);
    for(i in party) {
        let coords = global.PartyConfig.pokeCoords[i];
        if(!coords) break;
        let pokemon = party[i]; // = { name: ..., level: ..., hp: { current, max }}
        let font = global.PartyConfig.font;
        template.print(font, coords.pokeName.x, coords.pokeName.y, capitalize(pokemon.name));
        template.print(global.PartyConfig.levelFont, coords.pokeHp.x, coords.pokeHp.y, `${pokemon.hp.current}/${pokemon.hp.max}`);
        template.print(global.PartyConfig.levelFont, coords.pokeLvl.x, coords.pokeLvl.y, pokemon.level);

        let pokeBody = await superagent.get("https://pokeapi.co/api/v2/pokemon/" + pokemon.name.toLowerCase())
        pokeBody = pokeBody._body;
        var image = getCorrectImage(pokeBody.sprites, pokemon.gender == "Fêmea", pokemon.shiny);
        // var iconLocation = "/Users/ceetros/Documents/BotAOP/Modules/Pokemon/img/temp/icon"+int+int+".png";
        var iconLocation = "/Users/ceetros/Documents/BotAOP/Modules/Pokemon/img/temp/icon"+int+int+".png";
        ///Users/ceetros/Documents/BotAOP/Modules/Pokemon/img/temp
        await download.image(({
            url: image,
            dest: iconLocation,
            extractFilename: false,
        }));

        var icon = await jimp.read(iconLocation);

        await icon.resize(250, 250);

        await template.blit(icon, coords.pokeIcon.x, coords.pokeIcon.y);
        let healthBar = await getHealthBar(pokemon.hp);
        await template.blit(healthBar, coords.pokeHealthBar.x, coords.pokeHealthBar.y);

        break;
    }

    await template.writeAsync(`./img/temp/party${int}${int}.png`);

    //var ret = await MessageMedia.fromPath();

    // deletar imgs
    //return ret;
}

//308

const getHealthBar = async (health) => {
    let healthPercentage = (100 * health.current) / health.max;
    var healthBar = global.PartyConfig.healthBarTemplate;

    if(healthPercentage <= 50 && healthPercentage >= 10) {
        await healthBar.color([
            { apply: 'mix', params: [{r: 255, g: 234, b: 0}] },
        ]);
        console.log("mix");
    } else if(healthPercentage <= 10) {
        await healthBar.color([
            { apply: 'mix', params: [{r: 255, g: 0, b: 0}] },
        ]);
    } else if ( healthPercentage > 50) {
        await healthBar.color([
            { apply: 'mix', params: [{r: 143, g: 255, b: 75}] },
        ]);
    }

    await healthBar.resize(308 * (healthPercentage/100), 17);

    return healthBar;
    
}

init().then( () => {
    getPokemonPartyImage({name: "Penis", image: "https://i.pinimg.com/236x/c6/ab/55/c6ab55e21551826cfec62e656c651786.jpg", coins: 20 },
    [
        { name: "Pikachu", level: 15, hp: { current: 1, max: 15 }, shiny: true },
        { name: "Charizard", level: 15, hp: { current: 5, max: 15 } },
        { name: "Eevee", level: 15, hp: { current: 5, max: 15 } },
        { name: "Sylveon", level: 15, hp: { current: 5, max: 15 } },
        { name: "Blastoice", level: 15, hp: { current: 5, max: 15 } },
        { name: "Venusaur", level: 15, hp: { current: 5, max: 15 } },
    ])
})

module.exports = { init, getPokemonPartyImage };
