const request = require('request');
const express = require('express');
const { Curl } = require('node-libcurl');
require('dotenv/config');
 
const app = express();

app.use(express.json());

const users = [];
var callQueue = [];
var nextId = "";
var newNext = "";
var record = 0;
var oldQueue = [];





function sendDiscord(message){
    const urlRocket="https://flin.rocket.chat/hooks/Nf7dtuaikgsi64aCa/ayLSatokYP2Z3gpYAWEDsg5zp7iDPxPPY6AkEfwJkRHgiCqb"
    const urlAzkozia="http://187.49.226.34:23600/cfe/wallboard/wallboard.php?queue=CALLFLOW-29969517258331e2684e1b-QUEUE-60&size=medium&show_agents&colorize"
    // const msgJson="{\"alias\":\"Azkozia Bot\",\"text\": \"${message}\",\"attachments\":[{\"title\":\"AZKOZIA\",\"title_link\": \"${urlAzkozia}\",\"text\":\"Call\",\"color\":\"#FFAAAA\"}]}";
    // curl -H "Content-Type: application/json" -X POST -d "{\"alias\":\"Nagios Bot\",\"text\": \"$MSG\",\"attachments\":[{\"title\":\"NAGIOS\",\"title_link\": \"$LINK\",\"text\":\"$HEADER\",\"color\":\"#FFAAAA\"}]}" $url_rocket

    const curl = new Curl();
 
    curl.setOpt('URL', urlRocket);
    curl.setOpt('FOLLOWLOCATION', true);
    
    curl.on('end', function (statusCode, data, headers) {
    console.info(statusCode);
    console.info('---');
    console.info(data.length);
    console.info('---');
    console.info(this.getInfo( 'TOTAL_TIME'));
    
    this.close();
});

curl.on('error', curl.close.bind(curl));
curl.perform();

}
sendDiscord("Sistema de monitoramento iniciado!");

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

function server(){
    request(process.env.ASKOZIA_QUEUE_SHOW_STATUS, function (error, response, body) {  
        if (!error && response.statusCode == 200) {
            const { agents } = JSON.parse(body);
            console.table(agents);
            if (!agents){
                console.log("Askozia offline")
                return
            } else {
                console.log("Askozia Online")
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
                const callQueueIndex = callQueue.findIndex(user => user.userId == userId);
                if (callQueueIndex < 0){
                    callQueue.push(user);
                    console.log(`"Usuário ${user.name} acabou de logar!`)
                } else {
                    callQueue[callQueueIndex] = user;
                }
            });
        }
    });
    oldQueue.forEach(function (user, array) {
        const userIndex = callQueue.findIndex(user => user.userId == userId);
        if (userIndex < 0){
            console.log(`Usuário ${user.name} acabou de sair!`)
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
            sendDiscord(message);
        }
    }
    console.table(callQueue);

    oldQueue = callQueue;
    callQueue = [];
}

setInterval(server, 1000);

app.listen(3333)