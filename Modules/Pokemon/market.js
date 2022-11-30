const superagent = require("superagent")

const normalPokeballs = {
    title: "Pokébolas Normais",
    
}
// 33 34
var PokeballsItemCategories = [ 34 ]
const updatePokeballCache = async () => {
    try {
        for (category of PokeballsItemCategories) {
            var res = await superagent.get(`https://pokeapi.co/api/v2/item-category/${category}/`);
            let body = res._body;
            for (item of body.items) {
                var item = await superagent.get(`https://pokeapi.co/api/v2/item-category/${category}/`);
            }
        }
    } catch (e) {
        console.warn(e);
    }
}
updatePokeballCache();