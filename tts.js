const Say = require ('say').Say;
const { MessageMedia } = require('whatsapp-web.js');

const say = new Say('win32');

//Teste TTS. Precisa converter o audio para .OGG???
const tts = async (textToSpeach, msg, bot) => {
    try {
        console.log(kekw);
        say.export(textToSpeach, 'Maria', 1, 'audioToSend.wav', (err) => {          
            console.log('Text has been saved to audioToSend.wav.');
          })
        
        var media = MessageMedia.fromFilePath('./audioToSend.wav');  
        msg.reply(media, {
            sendAudioAsVoice: true
        })
    } catch (err) {
        console.log(err);
    }}

module.exports = { tts };
