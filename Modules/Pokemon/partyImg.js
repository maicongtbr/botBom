const jimp = require('jimp');

const pokemonBadgeParam = [ //coordenadas de encaixa dos Icons (x, y)
[24, 6], //pokeName
[52, 15], //pokeLevel
[3, 4], //pokeIcon
[112, 15], //pokeHP
[132, 15], //pokeMaxHP
//[97, 9] //pokeHpBar //até [145, 12]
];
const backgroundYParam = [10, 34, 58, 82, 106, 130]; //x = 87

const font = await jimp.loadFont(Jimp.FONT_SANS_32_BLACK); //alterar a fonte depois
const backgroundTemplate = jimp.read('./background.png'); //background file
const badgeTemplate = await jimp.read('./pokeBadge.png');
const partyIcons = [ ];

const pokeTest = {
    {
        name: 'Mamaico',
        level: 24,
        icon: await jimp.read('./iconTest.png'),
        hp: 5,
        hpMax: 20,
    },
}

const getIcons = async (pokeParty) => {
    for (e in pokeParty) {
        partyIcons.push(await jimp.read(pokeParty[e].icon));
    }
}

const createPokeBadge = async (pokeParty) => { 
    var pokebadges = [ ];
    for (e in pokeParty) {
        for (i = 0; i >= pokemonBadgeParam.lenght; i++) {
            let pokeBadge = badgeTemplate;
            switch (i) {
                case 0:
                    pokeBadge = await pokeBadge.print(font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], pokeParty[e].name);
                    break;
                case 1:
                    pokeBadge = await pokeBadge.print(font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], pokeParty[e].level);
                    break;
                case 2:
                    pokeBadge = await pokeBadge.print(font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], pokeParty[i].icon);
                    break;
                case 3:
                    pokeBadge = await pokeBadge.print(font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], pokeParty[i].hp);
                    break;
                case 4:
                    pokeBadge = await pokeBadge.print(font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], pokeParty[i].hpMax);
                    pokebadges.push(pokeBadge);
                    break;
                // case 5:
                //     pokeBadge = await pokeBadge.print(font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], pokeParty[i].hpBar);
                //     pokebadges.push(pokeBadge);
                //     break;
            }
        }
    }
}

const blitBadgeinBackground = async () => {
    var background = backgroundTemplate;
    for (i = 0; i >= pokebadges[i]; i++) {
        background = await background.blit(pokebadges[i], 87, backgroundYParam[i]);
    }
    background.write('./partyCardTemp.png');
}

createPokeBadge(pokeTest)
