const jimp = require('jimp');

const pokemonBadgeParam = [ //coordenadas de encaixa dos Icons (x, y)
[24, 6], //pokeName
[52, 15], //pokeLevel
[-9, -6], //pokeIcon
[112, 15], //pokeHP
[132, 15], //pokeMaxHP
//[97, 9] //pokeHpBar //até [145, 12]
];

var coords = [
    {
        pokeName: { x: 300, y: 100},
        health: { x: 123}
    },
    {

    }
]

// pokemonParty
for(x in pokemonParty) {
    let pokemon = pokemonParty[x];
    let pokeCoords = coords[x];
    pokeCoords.pokeName
}
const backgroundYParam = [10, 34, 58, 82, 106, 130]; //x = 87

const pokebadges = [ ];

const pokeTest = [
    {
        name: 'Mamaico',
        level: 24,
        icon: partyIcons,
        hp: 5,
        hpMax: 20, //adicionar exp depois
    },
]

const getIcons = async (pokeParty) => {
    for (e of pokeParty) {
        partyIcons.push(await jimp.read(pokeParty[e].icon));
    }
}

const createPokeBadge = async (pokeParty) => { 
    var pokeBadge = await jimp.read('./pokeBadge.png');
    const _font = await font;
    var ret = [];
    for (e of pokeParty) {
        for (var i = 0; i < pokemonBadgeParam.length; i++) {
            switch (i) {
                case 0:
                    pokeBadge = pokeBadge.print(_font, pokemonBadgeParam[i][0], pokemonBadgeParam[i][1], e.name);
                    break;
                case 1:
                    pokeBadge = pokeBadge.print(_font, pokemonBadgeParam[i][0], pokemonBadgeParam[i][1], e.level);
                    break;
                case 2:
                    pokeBadge = pokeBadge.blit( await e.icon, pokemonBadgeParam[i][0], pokemonBadgeParam[i][1]);
                    break;
                case 3:
                    pokeBadge = pokeBadge.print(_font, pokemonBadgeParam[i][0], pokemonBadgeParam[i][1], e.hp);
                    break;
                case 4:
                    pokeBadge = pokeBadge.print(_font, pokemonBadgeParam[i][0], pokemonBadgeParam[i][1], e.hpMax);
                    ret.push(pokeBadge);
                    break;
                // case 5:
                //     pokeBadge = await pokeBadge.print(_font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], pokeParty[i].hpBar);
                //     pokebadges.push(pokeBadge);
                //     break;
            }
        }
    }

    return ret;
}


const blitBadgeinBackground = async (badges) => {
    var background = await backgroundTemplate;

    for (i = 0; i < badges.length; i++) {
        background.blit(badges[i], 87, backgroundYParam[i]);
    }
    // (await pokebadges[0]).writeAsync('./pokeBadgeTemp.png');
    await background.writeAsync('./partyCardTemp.png');
}
setTimeout(async () => {
    await blitBadgeinBackground(await createPokeBadge(pokeTest));
}, 2000);

module.exports = {};
