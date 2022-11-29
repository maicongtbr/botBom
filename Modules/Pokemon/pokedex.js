const superagent = require("superagent");
const { MessageMedia } = require("whatsapp-web.js");
var capitalize = require('capitalize');
const download = require('image-downloader');

const getPokedex = async (msg) => {
    var splited = msg.body.split(" ");
    var pokeName = splited[1];
    if (!pokeName) {
        return;
    }
    try {

        pokeName = pokeName.toLowerCase();
    
        var pokeInfo = await superagent.get(`https://pokeapi.co/api/v2/pokemon/${pokeName}/`);
        if(!pokeInfo) {
            return;
        }
        pokeInfo = pokeInfo._body;

        var imagePath = pokeInfo.sprites;
        if(imagePath.versions && imagePath.versions["generation-v"]  && imagePath.versions["generation-v"]["black-white"] && imagePath.versions["generation-v"]["black-white"].animated) {
            imagePath = pokeInfo.sprites.versions["generation-v"]["black-white"].animated.front_default;
        } else {
            imagePath = imagePath.front_default;
        }
    
        download.image({
            url: imagePath,
            dest: "/home/life4gamming2/bot-aop/temp/dex.gif",
            extractFilename: false,
        }).then(({filename}) => {
            webp.gwebp("/home/life4gamming2/bot-aop/temp/dex.gif","/home/life4gamming2/bot-aop/temp/dex.webp","-q 80",logging="-v")
                .then(async e => {
                    var sprite = MessageMedia.fromFilePath("/home/life4gamming2/bot-aop/temp/dex.webp");
                    var types = [];
                    pokeInfo.types.forEach( async t => {
                        types.push(capitalize(t.type.name));
                    })
                
                
                    var speciesInfo = await superagent.get(`https://pokeapi.co/api/v2/pokemon-species/${pokeName.toLowerCase()}/`);
                    var evolutionsInfo = await superagent.get(speciesInfo._body.evolution_chain.url);
                
                    var chain = getChain(evolutionsInfo._body.chain);
                    var evolutionsMessages = await getChainString(chain);
   
                    var message = `*${capitalize(pokeInfo.name)}*\nNúmero na Pokedex: ${pokeInfo.id}\nTamanho: ${pokeInfo.height/10}m\nPeso: ${pokeInfo.height/10}kg\nTipos: ${types.join(", ")}`;
                    if(evolutionsMessages.length > 0) {
                        message += `\nEvoluções: \t\n${evolutionsMessages.join("\n")}`
                    }
                
                    msg.reply(sprite, msg.from, {caption: message});
                    fs.unlink("/home/life4gamming2/bot-aop/temp/dex.gif", (err) => {
                        if (!err) return;
                        console.log(err)
                    });
                    fs.unlink("/home/life4gamming2/bot-aop/temp/dex.webp", (err) => {
                        if (!err) return;
                        console.log(err)
                    });
                })
            
        })
    
        msg.reply(sprite, msg.from, {caption: message});
    } catch (error) {
        console.log(error);
        msg.reply('Esse Pokémon não existe ou não está disponível.');
    }
}

const getChainString = async (chain) => {
    let ret = []
    for(var i = 0; i < chain.evolutions.length; i++) {
        var e = chain.evolutions[i];
        if(chain.name != e.name) {
            var string = await getEvoString(chain.name, e);
            ret.push(string);
        }
        if(e.evolutions) {
            var otherArr = await getChainString(e);
            ret = ret.concat(otherArr); 
        }
    }
    return ret
}

const getEvoString = async (baseName, evolution) => {
    var methods = [];
    if(evolution.min_level) {
        methods.push(`Nível: ${evolution.min_level}`);
    }
    if(evolution.min_happiness) {
        methods.push(`Felicidade: ${evolution.min_happiness}`);
    }
    if(evolution.min_affection) {
        methods.push(`Amizade: ${evolution.min_affection}`);
    }
    if(evolution.trigger.name=="trade") {
        methods.push("Durante uma Troca");
    }
    if(evolution.time_of_day) {
        switch(evolution.time_of_day) {
            case "night":
                methods.push("Durante a Noite");
                break;
            case "day":
                methods.push("Durante o dia");
                break;
            default: break;
        }
    }
    if(evolution.known_move_type) {
        methods.push(`Possuir um movimento do tipo ${capitalize(evolution.known_move_type.name)}`);

    }
    if(evolution.location) {
        methods.push(`Ao subir de nível em uma localização específica`);
    }
    if(evolution.item) {
        var item = await superagent.get(evolution.item.url);
        var name = item._body.names.find(x => x.language.name == "en");
        methods.push(`Item: ${name.name}`)
    }
    var str = `${baseName} evolui para ${evolution.name}, condições: ${methods.join(" e ")}`;

    return str
}

const getChain = (chain, notBase) => {
    let ret = { base: true, name: capitalize(chain.species.name), evolutions: [] }

    for(var i = 0; i < chain.evolves_to.length; i++) {
        var e = chain.evolves_to[i];
        var details = e.evolution_details;
        var evo = []
        if(e.evolves_to.length > 0) {
            evo.push(getChain(e, true))
        }
        var obj = { ...details[0], name: capitalize(e.species.name), evolutions: evo };
        ret.evolutions.push(obj)
    }

    return ret;
}

// getPokedex({body:"!pokedex gengar"})

module.exports = { getPokedex }
