const request = require('request');
const express = require('express');
const axios = require('axios')
require('dotenv/config');

const app = express();

app.use(express.json());

const users = [];
const callQueue = [];
var nextId = "";
var newNext = "";


function sendDiscord(message){
axios
  .post(DISCORD_URL_BOT, {
    todo: message
  })
  .then(res => {
    console.log(`statusCode: ${res.statusCode}`)
    console.log(res)
  })
  .catch(error => {
    console.error(error)
  })
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

function server(){
    request(process.env.ASKOZIA_QUEUE_SHOW_STATUS, function (error, response, body) {  
        if (!error && response.statusCode == 200) {
            const { agents } = JSON.parse(body);
            // console.table(agents);

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
                } else {
                    callQueue[callQueueIndex] = user;
                }
            });

        }
    });
    var record = 0;
    callQueue.forEach(function (user, array) {
        const lastCall = new Date('2020-01-01 ' + user.lastCall);
        if(lastCall == '00:00:00'){
            lastCall == '10:00:00';
        }
        if ( record < lastCall) {
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
            //message = users[agentIndex].callerid + " are the next!";
            //sendDiscord(message);
        }
    }
    console.table(callQueue);
}

setInterval(server, 1000);

app.listen(3333)