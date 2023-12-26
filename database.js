const mongoose = require('mongoose');
const { dbUrl } = require('./dbUrl.js');

class Database {
    connection =  undefined;
    constructor(){
        var url = dbUrl;
        this.connection = mongoose.createConnection(url);
        this.connection.model('Experiencia', new mongoose.Schema({
            id: String,
            userName: String,
            exp: Number,
            level: Number,
            group: String,
            groupName: String,
            nextLevelExp: Number
        }, {
            collection: 'WhatsApp'
        }));
        this.connection.model('PokemonPlayer', new mongoose.Schema({
            id: String,
            repel: Boolean,
            playing: Boolean,
            pokemon: Array,
            itens: Array,
            coins: Number,
            hasStarter: Boolean
        }, {
            collection: 'PokemonPlayerModule'
        }));
        this.connection.model('PokemonBox', new mongoose.Schema({
            id: String,
            boxId: Boolean,
            pokemon: Array
        }, {
            collection: 'PokemonBoxModule'
        }));
        this.connection.model('Cache', new mongoose.Schema({
            info:  Object,
            name: String
        }, {
            collection: 'Cache'
        }));
        this.connection.model('ModuleSwitch', new mongoose.Schema({
            groupId: String,
            groupName: String,
            epicGames: Boolean,
            pokeBom: Boolean,
        }, {
            collection: 'ModuleSwitch'
        }));
    };

    getModel(name){
        return this.connection.model(name);
    }
}

const _db = new Database();

module.exports = _db;
