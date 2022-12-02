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
        playerNameFont: await jimp.loadFont(jimp.FONT_SANS_64_BLACK),
        template: await jimp.read('./img/background.png'),
        healthBarTemplate: await jimp.read('./img/healthBarTemplate.png'),
        pokeCoords: [
            {
                pokeName: { x: 6, y: 455 },
                pokeHp: { x: 56, y: 522 },
                pokeLvl: { x: 56, y: 547 },
                pokeIcon: { x: 300, y: 390 },
                pokeHealthBar: { x: 8, y: 500 }
            }, 
            {
                pokeName: { x: 6, y: 650 }, //y diff = 195
                pokeHp: { x: 56, y: 717 }, 
                pokeLvl: { x: 56, y: 742 }, 
                pokeIcon: { x: 300, y: 585 }, 
                pokeHealthBar: { x: 8, y: 694 } 
            }, 
            {
                pokeName: { x: 6, y: 845 }, 
                pokeHp: { x: 56, y: 912 }, 
                pokeLvl: { x: 56, y: 937 }, 
                pokeIcon: { x: 300, y: 780 }, 
                pokeHealthBar: { x: 8, y: 890 - 4} 
            }, 
            {
                pokeName: { x: 686, y: 450 }, 
                pokeHp: { x: 738, y: 517 + 5}, 
                pokeLvl: { x: 738, y: 542 + 10}, 
                pokeIcon: { x: 470, y: 381 }, 
                pokeHealthBar: { x: 687, y: 495 } 
            },
            {
                pokeName: { x: 686, y: 646 }, 
                pokeHp: { x: 738, y: 716 }, 
                pokeLvl: { x: 738, y: 746 }, 
                pokeIcon: { x: 470, y: 584 }, 
                pokeHealthBar: { x: 689, y: 689 } 
            }, 
            {
                pokeName: { x: 686, y: 836 }, 
                pokeHp: { x: 738, y: 903 + 5}, 
                pokeLvl: { x: 738, y: 928 + 10}, 
                pokeIcon: { x: 470, y: 771 }, 
                pokeHealthBar: { x: 689, y: 881 } 
            }
        ],
        playerCoords: {
            playerName: { x: 406, y: 30 },
            playerIcon: { x: 379, y: 137 },
            playerCoins: { x: 468, y: 377}
        }
    };

    global.PartyConfig = defaults;
}

const getPokemonPartyImage = async (player, party) => {
    var template = global.PartyConfig.template;
    var int = getRandomInt(99999);
    var playerCoords = global.PartyConfig.playerCoords;
    var font = global.PartyConfig.font;
    var playerfont = global.PartyConfig.playerNameFont;
    var playerIcon = await jimp.read(player.image);
    playerIcon = playerIcon.resize(242, 242);

    template.print(playerfont, playerCoords.playerName.x, playerCoords.playerName.y, player.name);
    template.print(font, playerCoords.playerCoins.x, playerCoords.playerCoins.y, player.coins);
    template.blit(playerIcon, playerCoords.playerIcon.x, playerCoords.playerIcon.y);
    

    for(i in party) {
        let coords = global.PartyConfig.pokeCoords[i];
        if(!coords.pokeName) break;
        let pokemon = party[i]; // = { name: ..., level: ..., hp: { current, max }}
        let levelFont = global.PartyConfig.levelFont
        template.print(font, coords.pokeName.x, coords.pokeName.y, capitalize(pokemon.name));
        template.print(levelFont, coords.pokeHp.x, coords.pokeHp.y, `${pokemon.hp.current}/${pokemon.hp.max}`);
        template.print(levelFont, coords.pokeLvl.x, coords.pokeLvl.y, pokemon.level);

        let pokeBody = await superagent.get("https://pokeapi.co/api/v2/pokemon/" + pokemon.name.toLowerCase())
        pokeBody = pokeBody._body;
        var image = getCorrectImage(pokeBody.sprites, pokemon.gender == "Fêmea", pokemon.shiny);
        var iconLocation = "/Users/ceetros/Documents/BotAOP/Modules/Pokemon/img/temp/icon"+int+int+".png";
        await download.image(({
            url: image,
            dest: iconLocation,
            extractFilename: false,
        }));

        var icon = await jimp.read(iconLocation);

        icon.resize(230, 230);

        template.blit(icon, coords.pokeIcon.x, coords.pokeIcon.y);
        let healthBar = await getHealthBar(pokemon.hp);
        template.blit(healthBar, coords.pokeHealthBar.x, coords.pokeHealthBar.y);

        // break;
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
    getPokemonPartyImage({name: "João Raphael", image: "https://i.pinimg.com/236x/c6/ab/55/c6ab55e21551826cfec62e656c651786.jpg", coins: 20 },
    [
        { name: "Pikachu", level: 15, hp: { current: 1, max: 15 }, shiny: true },
        { name: "Charizard", level: 15, hp: { current: 5, max: 15 } },
        { name: "Eevee", level: 15, hp: { current: 5, max: 15 } },
        { name: "Snorlax", level: 15, hp: { current: 15, max: 15 } },
        { name: "Blastoise", level: 15, hp: { current: 5, max: 15 } },
        { name: "Venusaur", level: 15, hp: { current: 5, max: 15 } },
    ])
})

module.exports = { init, getPokemonPartyImage };