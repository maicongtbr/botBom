const { List } = require("whatsapp-web.js");
const updatePokeballCache = require("./pokeballs");

global.MarketItems = [];
global.Items = {
    pokeballs: []
}

const updateMarket = async () => {
    await updatePokeballCache();
}

const getMarket = async (msg) => {
    var list = new List(
        "Mercado Pokémon!",
        "Comprar Itens",
        global.MarketItems
    )

    msg.reply(list);
}


module.exports = { getMarket, updateMarket };