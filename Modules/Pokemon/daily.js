const { getRandomIntRange } =  require("../../libs");

var dailyItemsByChance = [   ]

const updateDailyItems = () => {
    dailyItemsByChance = [
        { item: global.itemMap["Ultra Ball"], amount: {min: 1, max: 1 }, chance: 5},
        { item: global.itemMap["Great Ball"], amount: {min: 2, max: 2 }, chance: 40},
        { item: global.itemMap["Poké Ball"], amount: {min: 2, max: 15 }, chance: 1000},

    ]
}

const getDailyItem = () => {
    const itemAmount = getRandomIntRange(1, dailyItemsByChance.length);
    var items = [];
    for (let index = 0; index <= itemAmount; index++) {
       for (let j = 0; j < dailyItemsByChance.length; j++) {
            let element = dailyItemsByChance[j];
            let rng = getRandomInt(100);
            if(rng <= element.chance|| element.chance >= 100) {
                var found = items.find(x => x.internalName == element.item.internalName);
                if(found) {
                    found.amount += getRandomIntRange(element.amount.min, element.amount.max);
                } else {
                    items.push({ ...element.item, amount: getRandomIntRange(element.amount.min, element.amount.max)});
                }
                break;
            }
       }
        
    }

    return items;
}

module.exports = { getDailyItem, updateDailyItems }