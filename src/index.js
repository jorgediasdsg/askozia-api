const request = require('request');
const express = require('express');
const Discord = require('discord.js');
const {
    askozia_get_all_extensions,
    askozia_queue_show_status,
    discord_key
} = require('../config')

const app = express();

app.use(express.json());

const users = [];
const fila = [];
var nextId = "";
var newNext = "";

function sendDiscord(message){
    const client = new Discord.Client();

    client.on('ready', () => {
      console.log(`Logged in as ${client.user.tag}!`);
    });
    
    client.on('message', msg => {
      msg.reply(message);

      if (msg.content === 'ping') {
        msg.reply('Pong!');
      }
    });
    client.login(discord_key);
};

function logRequest(request, response, next){
    const { method, url } = request;

    const logLabel = `[${method.toUpperCase()}] ${url}`;

    console.time(logLabel)

    next();

    console.timeEnd(logLabel);
}
app.use(logRequest);

function loadUsers(){
    //load branch
    request(askozia_get_all_extensions, function (error, response, body) {  
        if (!error && response.statusCode == 200) {
            const all = JSON.parse(body);
            all.forEach(function (extension, array) {
                const userId = extension.extension;
                const userIndex = users.findIndex(user => user.userId == userId);

                const user = {
                    userId: extension.extension,
                    callerid: extension.callerid,
                    descr: extension.descr,
                  };
                if (userIndex < 0){
                    console.log("add "+user.userId+" Name:"+user.callerid)
                    users.push(user);
                } else {
                    users[userIndex] = user;
                }
                
            });
        }
    });
}
loadUsers();

app.get('/loadUsers', (req, res)=>{
    return res.send(users);
})

function server(){
    request(askozia_queue_show_status, function (error, response, body) {  
        if (!error && response.statusCode == 200) {
            const { agents } = JSON.parse(body);
            // console.table(agents);

            agents.forEach(function (extension, array) {
                const userId = extension.extension;
                const ramal = "20"+extension.extension
                const callToday = extension.calls_today
                const lastCall = extension.last_call
                const agentIndex = users.findIndex(user => user.userId == ramal);
                if (agentIndex < 0){
                    var name = "SDS"
                } else {
                    var name = users[agentIndex].callerid;
                }

                user = {
                    userId,
                    ramal,
                    name,
                    callToday,
                    lastCall,
                    next: 0
                }
                const filaIndex = fila.findIndex(user => user.userId == userId);
                if (filaIndex < 0){
                    fila.push(user);
                } else {
                    fila[filaIndex] = user;
                }
            });

        }
    });
    // Descobrir a espera mais alta
    var record = 0;
    fila.forEach(function (user, array) {
        const lastCall = new Date('2020-01-01 ' + user.lastCall);
        if ( record < lastCall ) {
            record = lastCall;
            user.next = "== next ==";
            if (nextId != user.userId){
                newNext = user.userId;
            }
            nextId = user.userId;
        } else {
            user.next = "";
        }
    })
    if (newNext != nextId){
        const filaIndex = users.findIndex(user => user.userId == nextId);
        if (agentIndex < 0){
            fila[filaIndex].next = "";
        }
        nextId = newNext

        const agentIndex = users.findIndex(user => user.userId == nextId);
        if (agentIndex < 0){
            console.log("Não encontramos o usuário")
        } else {
            message = users[agentIndex].callerid + " é o proximo da fila!";
            sendDiscord(message);
        }
    }
    console.table(fila);
}

setInterval(server, 1000);

app.listen(3333)