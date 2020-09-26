const request = require('request');
const express = require('express');
const axios = require('axios');
require('dotenv/config');

const app = express();

app.use(express.json());

const users = [];
var callQueue = [];
var nextId = "";
var newNext = "";
var record = 0;
var oldQueue = [];
var history = [];
async function alert(msg){
    await axios.post(process.env.ROCKET_CHAT, {
        "alias":"Askozia Bot",
        "text":msg
        // "attachments":[{
        //     "title":"Rocket.Chat",
        //     "title_link":"https://rocket.chat",
        //     "text":"Rocket.Chat, the best open source chat",
        //     "image_url":"https://kinsta.com/pt/wp-content/uploads/sites/3/2019/07/encontrar-url-login-wordpress-1024x512.jpg",
        //     "color":"#764FA5"
        // }]
    }).then(function(response){
        console.log(`Send message ${msg} to rocket.chat`)
    }).catch(function(error){
        if(error){
            console.log(error)
        }
    })
    await axios.post(process.env.DISCORD_BOT, {
        content: msg
    }).then(function(response){
        console.log(`Send message ${msg} to discord chat`)
    }).catch(function(error){
        if(error){
            console.log(error)
        }
    })
    history.unshift(msg)
}


function loadUsers(){
    //load callQueue
    request(process.env.ASKOZIA_GET_ALL_EXTENSIONS, function (error, response, body) {  
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
app.get('/history', (req, res)=>{
    return res.send({oldQueue, history});
})

alert(":desktop: Servidor de monitoramento iniciado!")
alert(`:desktop: Confira o histórico em ${process.env.DNS_APPLICATION}/history`)
function server(){
    request(process.env.ASKOZIA_QUEUE_SHOW_STATUS, function (error, response, body) {  
        if (!error && response.statusCode == 200) {
            const { agents } = JSON.parse(body);
            if (!agents){
                console.log("Askozia offline")
                return
            }
            agents.forEach(function (extension, array) {
                const userId = extension.extension;
                const ramal = "20"+extension.extension
                const callToday = extension.calls_today
                const lastCall = extension.last_call
                //Only a very boring person will find that comment. @jorgediasdsg
                const agentIndex = users.findIndex(user => user.userId == ramal);
                if (agentIndex < 0){
                    var name = "ND"
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
                const callQueueIndex = oldQueue.findIndex(user => user.userId == userId);
                if (callQueueIndex < 0){
                    callQueue.push(user);
                    console.log(`Usuário ${user.name} acabou de logar!`)
                    alert(`:arrow_up_small: Usuário ${user.name} acabou de logar!`);
                } else {
                    callQueue[callQueueIndex] = user;
                }
            });
        }
    });    
    callQueue.forEach(function (user, array) {
        if(user.lastCall == '00:00:00'){
            user.lastCall='12:00:00';
        }
        const lastCall = new Date('2020-01-01 ' + user.lastCall);
        if ( record <= lastCall) {
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
        const callQueueIndex = users.findIndex(user => user.userId == nextId);
        if (agentIndex < 0){
            callQueue[callQueueIndex].next = "";
        }
        nextId = newNext

        const agentIndex = users.findIndex(user => user.userId == nextId);
        if (agentIndex < 0){
            console.log("User not found!")
        } else {
            message = users[agentIndex].callerid + " are the next!";
            alert(message);
        }
    }
    console.table(callQueue);
    oldQueue.forEach(function (user, array) {
        const userId = user.userId; 
        const userIndex = callQueue.findIndex(user => user.userId == userId);
        if (userIndex < 0){
            alert(`:arrow_down_small: Usuário ${user.name} acabou de sair!`);
        }
    });
    oldQueue = callQueue;
    callQueue = [];
}
setInterval(server, 1000);
app.listen(3333)