const db = require("./database");
const { v4 } = require('uuid');

// migration para adicionar GUID v4 nos pokemon que não tem
var PokemonPlayerDB = db.getModel("PokemonPlayer");
PokemonPlayerDB.find().then(res => {
   var a = res.find(e => e.id.includes("5516993174303"));
   console.log(a);
})

