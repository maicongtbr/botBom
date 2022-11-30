const { List } = require("whatsapp-web.js");
const updatePokeballCache = require("./pokeballs");

global.MarketItems = [];
global.Items = {
    pokeballs: []
}
global.itemMap = [];

const updateMarket = async () => {
    await updatePokeballCache();
}

const getMarket = async (msg) => {
    var list = new List(
        "Seja bem-vindo ao Mercado Pokémon!\nClique abaixo para Comprar Items!",
        "Comprar Itens",
        global.MarketItems
    )

    await msg.reply(list);
}


module.exports = { getMarket, updateMarket };