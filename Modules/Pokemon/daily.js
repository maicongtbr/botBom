const { getRandomIntRange } =  require("../../libs");

var dailyItemsByChance = [   ]

const updateDailyItems = () => {
    dailyItemsByChance = [
        { item: global.itemMap["Poké Ball"], amount: {min: 2, max: 15 }, chance: 100},
        { item: global.itemMap["Great Ball"], amount: {min: 2, max: 2 }, chance: 40},
        { item: global.itemMap["Ultra Ball"], amount: {min: 1, max: 1 }, chance: 5}
    ]
}

const getDailyItem = () => {
    const itemAmount = getRandomIntRange(1, dailyItemsByChance.length);
    const items = [];
    for (let index = 0; index <= itemAmount; index++) {
       for (let index = 0; index < dailyItemsByChance.length; index++) {
            const element = dailyItemsByChance[index];
            if(element.chance <= getRandomIntRange(0, 100)) {
                items.push({ item: element.item, amount: getRandomIntRange(element.amount.min, element.amount.max)});
                break;
            }
       }
        
    }

    return items;
}

module.exports = { getDailyItem, updateDailyItems }