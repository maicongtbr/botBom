const states = {}

const updateState = async(state, newValue) => {
    states[name] = value;
}

const useState = async(name, initialValue, cb) => {
    states[name] = initialValue;

    var ret = {}
    let setName = `set${name}`;
    ret[setName] = (value) => {
        updateState(name, value);
        cb(value);
    }

    ret[name] = states[name];
    return ret;
}

module.exports = { useState };
