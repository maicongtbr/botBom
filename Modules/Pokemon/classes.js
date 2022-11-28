class Pokemon {
    constructor(name, url, chance, minLevel, maxLevel, condition){
        this.name = name
        this.url = url
        this.chance = chance
        this.minLevel = minLevel
        this.maxLevel = maxLevel
        this.condition = condition
    }
}

const Conditions = {
    Walk: 0,
    Day: 1,
    Night: 2,
}

module.exports = { Pokemon, Conditions };