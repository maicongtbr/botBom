global.storageCache = { }
global.globalCache = { };

const StorageTypes = {
    Number: 1,
    Object: 2,
    String: 3
}

class UserStorage {
    constructor(id, type) {
        this.id = id;
        this.playerStorages = {};
        this.type = type;
        if(storageCache[id]) {
            console.error(`Duplicated id for ${id}.`);
            return;
        }

        storageCache[id] = this;
    }

    setStorage(id, newValue) {
        this.playerStorages[id] = newValue;
    }

    increaseStorage(id, diff) {
        if (this.type != StorageTypes.Number) return;
        var currentStorage = this.playerStorages[id] || 0;
        currentStorage += diff;

        this.playerStorages[id] = currentStorage;
    }

    decreaseStorage(id, diff) {
        if (this.type != StorageTypes.Number) return;
        var currentStorage = this.playerStorages[id] || 0;
        currentStorage -= diff;

        this.playerStorages[id] = currentStorage;
    }

    getStorage(id) {
        return this.playerStorages[id] || null;
    }
}

const getUserStorage = (id) => {
    return storageCache[id];
}

// server

class Storage {
    constructor(id, callback, initialValue) {
        this.id = id;
        this.callback = callback;
        this.value = initialValue;
        if(globalCache[id]) {
            console.error("Duplicated Storage for id " + id);
            return;
        }
        globalCache[id] = this;
        callback(this.value);
    }

    setValue(value) {
        this.value = value;
        this.callback(this.value);
    }
}

const getStorageValue = (id) => globalCache[id].value;
const getStorage = (id) => globalCache[id].value;

const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
}

const getRandomIntRange = (min, max) => { 
    return Math.floor(Math.random() * (max - min) + min);
} 

module.exports = { getUserStorage, UserStorage, StorageTypes, Storage, getStorage, getStorageValue, getRandomInt, getRandomIntRange }
