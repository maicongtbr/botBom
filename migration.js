const db = require("./database");
const { v4 } = require('uuid');

// migration para adicionar GUID v4 nos pokemon que não tem
var PokemonPlayerDB = db.getModel("PokemonBox");
PokemonPlayerDB.find().then(async res => {
  res.forEach(e => {
         if(!e.pokemon) {
            console.log("hm")
            return;
         }

         console.log("running migration for ", e)
         var newPokemon = [];
         e.pokemon.forEach(pokemon => {
            if(pokemon.name)
            {
               if(pokemon.level == 0) pokemon.level = 1;
               newPokemon.push(pokemon);
            }
         });

         console.log(newPokemon);
         PokemonPlayerDB.updateOne({
            _id: e._id,
            id: e.id
         },
         {
            pokemon: newPokemon
         }).catch(console.log).then(console.log);
   })
   
})

