const superagent = require('superagent');

const getTabela = async (msg, bot) => {
    /* Endpoint desabilitado para free tier
    var rodada = await superagent.get('https://api.api-futebol.com.br/v1/campeonatos/10/rodadas').set('Authorization', 'Bearer live_5da0f7f9ac2040f89d6bd1d862a39d');
    for (e of rodada._body){
        if(e.status === 'agendada'){
            var rodadaAtual = e.rodada;
            break;
        }
        else if (!e.rodada){
            var rodadaAtual = 38;
        }
    }
    */

    var tabela = await superagent.get('https://api.api-futebol.com.br/v1/campeonatos/10/tabela').set('Authorization', 'Bearer live_5da0f7f9ac2040f89d6bd1d862a39d');
    var teamStats = `⚽️Campeonato Brasileiro Série A⚽️\n\n🔵${tabela._body[0].posicao}° - ${tabela._body[0].time.nome_popular} ▶️Pts: ${tabela._body[0].pontos}\n`;

    for (let i = 1; i <= 19; i++) {
        var team = tabela._body[i].time.nome_popular;
        if(i <= 3){//libertadores
            teamStats = teamStats + `🔵${tabela._body[i].posicao}° - ${team} ▶️Pts: ${tabela._body[i].pontos}\n`;
        }
        else if(i > 3 && i <= 5){//pré-libertadores
            teamStats = teamStats + `🟠${tabela._body[i].posicao}° - ${team} ▶️Pts: ${tabela._body[i].pontos}\n`;
        }
        else if(i > 5 && i <= 11){//sulamericana
            teamStats = teamStats + `🟢${tabela._body[i].posicao}° - ${team} ▶️Pts: ${tabela._body[i].pontos}\n`;
        }
        else if(i >= 16 && i <19){//zona de rebaixamento
            teamStats = teamStats + `🔴${tabela._body[i].posicao}° - ${team} ▶️Pts: ${tabela._body[i].pontos}\n`;
        }
        else if(i >= 19){//pra não quebrar linha no ultimo colocado
            teamStats = teamStats + `🔴${tabela._body[i].posicao}° - ${team} ▶️Pts: ${tabela._body[i].pontos}`;
        }
        else{//meio de tabela
            teamStats = teamStats + `⚪️${tabela._body[i].posicao}° - ${team} ▶️Pts: ${tabela._body[i].pontos}\n`;
        }
    }

    bot.sendMessage(msg.from, teamStats);
}

module.exports = { getTabela };
