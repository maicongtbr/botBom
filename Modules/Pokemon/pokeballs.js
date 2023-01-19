const superagent = require("superagent");

global.MarketItems = [];
global.Items = {
    pokeballs: []
}

global.itemMap = [];

var itemsMarket = [
    { list: {title: "Pokébolas", rows: []},  id: 34, name: "Pokébolas" },
    { list: {title: "Pokébolas Especiais", rows: []},  id: 33, name: "Pokébolas Especiais" },
    { list: {title: "Evolutivos", rows: []},  id: 10, name: "Evolutivos" }
]

const updatePokeballCache = async () => {
    try {
        for (catId in itemsMarket) {
            let category = itemsMarket[catId];
            var res = await superagent.get(`https://pokeapi.co/api/v2/item-category/${category.id}/`);
            let body = res._body;
            for (item of body.items) {
                var item = await superagent.get(item.url);
                body = item._body;

                var name = body.names.find(x => x.language.name == "en");
                if (!name) continue;
                let retItem = {
                    price: parseInt(body.cost),
                    name: name.name,
                    internalName: body.name,
                    type: category.name
                }
                if(retItem.price > 0) {
                    if(category.id == 34 || category.id == 33) {
                        if (retItem.internalName == "premier-ball") {
                            continue;
                        }
                        global.Items.pokeballs.push(retItem);
                    }

                    category.list.rows.push({
                        id: retItem.internalName,
                        title: retItem.name,
                        description: `Preço: ${retItem.price} BomCoins`,
                        price: retItem.price
                    })

                    global.itemMap[name.name] = retItem;
                }
            }
            category.list.rows.sort((a,b) => {
                return a.price > b.price ? 1 : -1;
            });
    
            global.MarketItems.push(category.list);
        }


    } catch (e) {
        console.warn(e);
    }
}


module.exports = updatePokeballCache;
