const superagent = require("superagent");
const { getRandomIntRange } = require("../../libs");
const { v4 } = require('uuid');

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
    constructor(name, level, exp){
        this.name = name
        this.level = level
        this.exp = exp
        this.id = v4();
    }

    async levelUp() {
        // TODO: selecionar novo move e ver como vai ser a logica de selecionar o move replace
    }

    async generateMove() {
        var pokemon = await superagent.get('https://pokeapi.co/api/v2/pokemon/' + this.name.toLowerCase());
        var body = pokemon._body;

        var move = body.moves.filter(x => {
            var ret = x.version_group_details.find(y => {
                return y.level_learned_at <= this.level && y.move_learn_method.name == "level-up";
            });

            if(ret) {
                return true;
            } else {
                return false;
            }

            
        });

        if(move.length -1 <= 3) {
            var pokeMoves = [];
            for( var x = 0; x <= move.length -1; x++) {
                var element = move[x];
                var a = await superagent.get(element.move.url);
                var name = a._body.names.find(y => {
                    return y.language.name == "en";
                });
                
                pokeMoves.push({ name: name.name, pp: a._body.pp })
            }

            this.moves = pokeMoves;
        } else {
            var pokeMoves = [];
            for(var i = 0; i < 3; i++) {
                for( var x = 0; x <= move.length -1; x++) {
                    var element = move[x];
                    var a = await superagent.get(element.move.url);
                    var name = a._body.names.find(y => {
                        return y.language.name == "en";
                    });
                    if(pokeMoves.find(x => x.name == name.name)) {
                        continue;
                    }

                    
                    pokeMoves.push({ name: name.name, pp: a._body.pp })
                    break;
                }
            }

            this.moves = pokeMoves;
        }
    

    }

    async generateHealth() {
        var pokemon = await superagent.get('https://pokeapi.co/api/v2/pokemon/' + this.name.toLowerCase());
        var stat = pokemon._body.stats.find(x => x.stat.name == "hp");
        var baseStat = stat.base_stat;

        var healthIv = getRandomIntRange(0, 15);
        this.healthIv = healthIv;

        var hp = ((((baseStat + healthIv) * 2) + Math.sqrt(22850)/4) * this.level / 100) + this.level + 10;
        this.currentHp = Math.floor(hp);
        this.maxHp = Math.floor(hp);
    }
}

const createPokemon = async (name, level, exp) => {
    try {
        var Pokemon = new PlayerPokemon(name, level, exp);
        await Pokemon.generateMove();
        await Pokemon.generateHealth();
        //await Pokemon.generateAbility();
        return Pokemon;
    } catch (error) {
        return "Invalid Pokemon";
    }
}

const Conditions = {
    Walk: 0,
    Day: 1,
    Night: 2,
}

module.exports = { Pokemon, Conditions, createPokemon };