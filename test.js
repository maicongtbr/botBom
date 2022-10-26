const deepai = require('deepai');

deepai.setApiKey('quickstart-QUdJIGlzIGNvbWluZy4uLi4K');

(async function() {
    var resp = await deepai.callStandardApi("text2img", {
            text: "deyverson flamengo",
    });
    console.log(resp);
})()