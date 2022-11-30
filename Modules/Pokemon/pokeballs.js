const superagent = require("superagent")

const normalPokeballs = {
    title: "Pokébolas",
    rows: []
}

// 33 34
var PokeballsItemCategories = [ 34 ]
const updatePokeballCache = async () => {
    try {
        for (category of PokeballsItemCategories) {
            var res = await superagent.get(`https://pokeapi.co/api/v2/item-category/${category}/`);
            let body = res._body;
            for (item of body.items) {
                var item = await superagent.get(item.url);
                body = item._body;

                var name = body.names.find(x => x.language.name == "en");
                let retItem = {
                    price: body.cost,
                    name: name.name,
                    internalName: body.name,
                    type: "Pokébola"
                }
                if(retItem.price > 0 && retItem.internalName != "sport-ball") {
                    global.Items.pokeballs.push(retItem);
                    normalPokeballs.rows.push({
                        id: retItem.internalName,
                        title: retItem.name,
                        description: `Preço: ${retItem.price} BomCoins`,
                        price: retItem.price
                    })

                    global.itemMap[name.name] = retItem;
                }

            }
        }

        normalPokeballs.rows.sort((a,b) => {
            return a.price > b.price ? 1 : -1;
        });

        global.MarketItems.push(normalPokeballs);
    } catch (e) {
        console.warn(e);
    }
}

module.exports = updatePokeballCache;
