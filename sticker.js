const { MessageMedia } = require('whatsapp-web.js');

const downloadMessageMedia = async (msg) => {
    var messageToDowloadMedia = msg;
    if (msg.hasQuotedMsg){
        let quotedMsg = await msg.getQuotedMessage();
        return; //só enquanto o bot ta crashando com quotedMsg
        if (quotedMsg.hasMedia){
            messageToDowloadMedia = quotedMsg;
        }
    }
    var ret = await messageToDowloadMedia.downloadMedia();
    return ret;
}

const sendRandomSticker = (msg, fileName, num, bot) => {
    media = MessageMedia.fromFilePath(`./${fileName[getRandomInt(num)]}`);
    bot.sendMessage(msg.from, media, {
        sendMediaAsSticker:true
        })
}

const sendSticker = async (msg, fileName, bot) => {
    media = MessageMedia.fromFilePath(`./${fileName}`);
    return bot.sendMessage(msg.from, media, {
        sendMediaAsSticker:true
    })
}

const makeSticker = async (msg) => {
    if (msg.type === 'chat') return msg.reply('O comando de Sticker não está funcionando mencionando mensagens. Tente enviando diretamente a imagem.');
    if (msg.type != 'image') return msg.reply('O comando de Sticker só funciona com arquivos de imagem.');

    var media = await downloadMessageMedia(msg);
    msg.reply(media, undefined, {
        sendMediaAsSticker:true,
        stickerName: 'Feito com o Bot Bom da AOP',
        sticketAuthor: 'Bot Bom'
    })
}

module.exports = { sendRandomSticker, sendSticker, makeSticker };