
const { getEncounter } = require("./encounter");
const { updateCache } = require("./locations");

updateCache(getEncounter);