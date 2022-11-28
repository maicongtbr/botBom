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

class PlayerPokemon {
    constructor(name, level, exp, hp, hpMax, moves, ability){
        this.name = name
        this.level = level
        this.exp = exp
        this.hp = hp
        this.hpMax = hpMax
        this.moves = moves 
        this.ability = ability
    }
}

const Conditions = {
    Walk: 0,
    Day: 1,
    Night: 2,
}

module.exports = { Pokemon, Conditions, PlayerPokemon };