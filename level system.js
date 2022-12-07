const db = require('./database');
const { Client } = require('whatsapp-web.js');
const { getGroup } = require('./callback');
const { userIsAdmin } = require('./libs');

const getNextLevelExp = (level) => {
    if(level < 50) {
        return Math.floor((Math.pow(level, 2) * ( 100 - level )) / 50);
    } else if(level <= 68) {
        return Math.floor((Math.pow(level, 2) * ( 150 - level )) / 100);
    } else if(level <= 98) {
        return Math.floor((Math.pow(level, 2) * ( (1911 - (10 * level)) / 3)) / 500);
    } else if(level <= 100) {
        return Math.floor((Math.pow(level, 2) * ( 160 - level )) / 100);
    } else {
        return 10000;
    }
}

const getLevel = async (msg, bot) => {
    const Exp = db.getModel('Experiencia');
    console.log(typeof(getGroup));
    const group = await getGroup(msg);
    const mentionedUsers = await msg.getMentions();
    if (group) {
        var isAdmin = await userIsAdmin(group, msg.author);
    }

    if (!group) {
        Exp.find({
            id: msg.id.remote
        }).then(async user => {
            if(!user) {
                msg.reply('*Você ainda não tem exp.*');
                return;
            }

            var userLevelArr = [];

            for (element of user) {
                let exp = element.exp;
                let level = element.level;
                let group = element.groupName;
                let expToNextLevel = getNextLevelExp(level + 1) - exp;

                let userLevel = `💎Nível no grupo *${group}*\n✨Exp: ${exp}\n🎇Level: ${level}\n🎆Exp para o próximo level: ${expToNextLevel}`

                userLevelArr.push(userLevel);
            }
            let _userLevel = `💎*Esse é seu nível em cada grupo:*\n\n${userLevelArr.join('\n\n')}`;
            bot.sendMessage(msg.from, _userLevel); 
        })
        return;
    }

    if (mentionedUsers && mentionedUsers.length > 0) {
        if (isAdmin) {
            console.log(mentionedUsers);
            Exp.findOne({
                id: mentionedUsers[0].id._serialized,
                group: group.id._serialized
            }).then(async user => {
                let userName = user.userName;
                let exp = user.exp;
                let level = user.level;
                let group = user.groupName;
                let expToNextLevel = getNextLevelExp(level + 1) - exp;

                bot.sendMessage(msg.from, `Nível de *${userName}* no grupo *${group}*\n\n✨Exp: ${exp}\n🎇Level: ${level}\n🎆Exp para o próximo level: ${expToNextLevel}`);
            })
            return;
        }
    }

    Exp.findOne({
        id: msg.author,
        group: group.id._serialized
    }).then(async user => {
        if(!user) {
            msg.reply('*Você ainda não tem exp.*');
            return;
        }
        let userName = user.userName;
        let exp = user.exp;
        let level = user.level;
        let group = user.groupName;
        let expToNextLevel = getNextLevelExp(level + 1) - exp;

        bot.sendMessage(msg.from, `Nível de *${userName}* no grupo *${group}*\n\n✨Exp: ${exp}\n🎇Level: ${level}\n🎆Exp para o próximo level: ${expToNextLevel}`);
    })
}

const getRanking = async (msg, bot) => {
    const Exp = db.getModel('Experiencia');
    const group = await getGroup(msg);
    
    Exp.find({
        group: group.id._serialized
    }).then(async users => {
        users.sort((a, b) => {
            if (a.level == b.level){
                return (a.exp > b.exp) ? -1 : 1;
            }
            return (a.level > b.level) ? -1 : 1;
        })
        
        let ranking = [];

        var max = 10;
        if(users.length < 10) {
            max = users.length;
        }

        for (var i = 0; i < max; i++) {
            let element = users[i];
            let place = users.indexOf(element) + 1;
            let placeMessage = "";
            switch(place) {
                case 1:
                    placeMessage = "🥇";
                    break;
                case 2:
                    placeMessage = "🥈";
                    break;
                case 3:
                    placeMessage = "🥉";
                    break;
                default:
                    break;
            }
            let message = `${placeMessage} *${place}° Lugar*: ${element.userName}, *Level*: ${element.level}, *Exp*: ${element.exp}.`;
            ranking.push(message);
        }

        let _message = `🏆 Top 10 no grupo *${group.name}*\n\n${ranking.join("\n")}`;
        bot.sendMessage(msg.from, _message);
    });
}

module.exports = { getRanking, getLevel, getNextLevelExp };
