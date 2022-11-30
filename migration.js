const db = require("./database");
const { v4 } = require('uuid');

// migration para adicionar GUID v4 nos pokemon que não tem
var PokemonPlayerDB = db.getModel("PokemonPlayer");
PokemonPlayerDB.find().then(async res => {
   var a = res.find(e => e.id && e.id.includes("5522996075240"));
   console.log(a)
})

