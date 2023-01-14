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

}


module.exports = { getMarket, updateMarket };