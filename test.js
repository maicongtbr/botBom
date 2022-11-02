const pokemon = require('pokemon.js');

pokemon.setLanguage('english');

//Testar com a PokeAPI, já que tem mais informações que eu preciso, como a raridade dos pokemons

var PokeInfo = new Object('habilidades:', )

const randomNumber = () => {
    return Math.floor(Math.random() * (386 - 1 + 1));
}

const getRandomPokemon = async () => {
    selectedPoke = await pokemon.getPokemon(randomNumber());

    var pokeSprite = selectedPoke.sprites.front_default;
    var pokeName = selectedPoke.name;
    var pokeId = selectedPoke.id;
    var pokeStats = selectedPoke.stats;
    var pokeType = [];
    selectedPoke.types.forEach((element) => {
        pokeType.push(element.name);
    })
    
    // console.log(await pokemon.getPokemon(259));
    console.log('Link da Sprite: ' + pokeSprite + '\nTipo: ' + pokeType + '\nID: ' + pokeId + '\nNome: ' + pokeName + '\nStats: \n' + pokeStats);
}

getRandomPokemon();
