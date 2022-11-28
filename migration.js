const db = require("./database");
const { v4 } = require('uuid');

// migration para adicionar GUID v4 nos pokemon que não tem
var PokemonPlayerDB = db.getModel("PokemonPlayer");
PokemonPlayerDB.find().then(res => {
    res.forEach(element => {
        var needUpdate = false;
        element.pokemon.forEach( p => {
            if(!p.id) {
                p.id = v4();
                needUpdate = true;
            }
        })

        if(needUpdate) {
            PokemonPlayerDB.updateOne({
                id: element.id
            }, element).then(() => { console.log("Migration atualizada para o id ", element.id)})
        }

    });
})

