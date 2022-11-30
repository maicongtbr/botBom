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

//SOCORRO ESQUECI QUE NÃO CONSIGO USAR AWAIT EM TOP LEVEL E NÃO QUERO ENCHER ESSA PORRA DE .THEN
const font = (async () => {
    return await jimp.loadFont(jimp.FONT_SANS_32_BLACK);
})(); //alterar a fonte depois
const backgroundTemplate = (async () => {
    return await jimp.read('./background.png');
})(); //background file

const badgeTemplate = (async () => {
    return await jimp.read('./pokeBadge.png');
})();

const partyIcons = (async () => {
    return await jimp.read('./iconTest.png');
})();
const pokebadges = [ ];

const pokeTest = [
    {
        name: 'Mamaico',
        level: 24,
        icon: partyIcons,
        hp: 5,
        hpMax: 20,
    },
]

const getIcons = async (pokeParty) => {
    for (e of pokeParty) {
        partyIcons.push(await jimp.read(pokeParty[e].icon));
    }
}

const createPokeBadge = async (pokeParty) => { 
    for (e of pokeParty) {
        console.log('BadgeTemplate \n\n' + badgeTemplate);
        console.log(e.name);
        for (var i = 0; i <= pokemonBadgeParam.lenght; i++) {
            let pokeBadge = badgeTemplate; 
            switch (i) {
                case 0:
                    pokeBadge = await pokeBadge.print(font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], e.name);
                    break;
                case 1:
                    pokeBadge = await pokeBadge.print(font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], e.level);
                    break;
                case 2:
                    pokeBadge = await pokeBadge.print(font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], e.icon);
                    break;
                case 3:
                    pokeBadge = await pokeBadge.print(font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], e.hp);
                    break;
                case 4:
                    pokeBadge = await pokeBadge.print(font, pokemonBadgeParam[i[0]], pokemonBadgeParam[i[1]], e.hpMax);
                    pokebadges.push(pokeBadge);
                    console.log("AOPA TO AQUI");
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
        await background.blit(pokebadges[i], 87, backgroundYParam[i]);
    }
    // (await pokebadges[0]).writeAsync('./pokeBadgeTemp.png');
    (await background).writeAsync('./partyCardTemp.png');
}
setTimeout(async () => {
    await createPokeBadge(pokeTest);
}, 2000);

module.exports = {};
