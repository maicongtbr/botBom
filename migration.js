const db = require("./database");
const { v4 } = require('uuid');
const { PlayerPokemon } = require("./Modules/Pokemon/classes");

// migration para adicionar GUID v4 nos pokemon que não tem
var PokemonPlayerDB = db.getModel("PokemonBox");
PokemonPlayerDB.find().then(async res => {
  res.forEach(e => {
         if(!e.pokemon) {
            console.log("hm")
            return;
         }

         // console.log("running migration for ", e)
         var newPokemon = [];
         e.pokemon.forEach(pokemon => {
            if(!pokemon.maxHp || !pokemon.currentHp)
            {
               var _pokemon = new PlayerPokemon (
                  ...pokemon
               )
               
               console.log(_pokemon);
               
            }
         });

         // console.log(newPokemon);
         // PokemonPlayerDB.updateOne({
         //    _id: e._id,
         //    id: e.id
         // },
         // {
         //    pokemon: newPokemon
         // }).catch(console.log).then(console.log);
   })
   
})

