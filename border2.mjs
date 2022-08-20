const url = "https://belarusborder.by/info/monitoring?" + 
    new URLSearchParams({
        checkpointId: "7e46a2d1-ab2f-11ec-bafb-ac1f6bf889c1",
        token: "bts47d5f-6420-4f74-8f78-42e8e4370cc4"
});
let registrationNumber = "2699TH7";
const refreshInterval = 120000;
const averageThroughputCalculationTimePeriods = {
    min: 600000,
    max: 7200000
};
const queueHistory = [];

const alarm = new Audio("mixkit-morning-clock-alarm-1003.wav");
alarm.loop = true;

function onTrackButtonClicked() {
    registrationNumber = document.getElementById("registrationNumber").value || registrationNumber;
    log(`tracking car ${registrationNumber}`);
    (async function() {await trackPosition();}())
    setInterval(trackPosition, refreshInterval);
}

function onStopAlarmButtonClicked() {
    alarm.pause();
}

function onTestButtonClicked() {
    alert("test");
}

async function trackPosition() {
    const currentPosition = await getCurrentPosition();
    const eta = getETA(currentPosition);

    log(
        `[${now()}] current position - ${currentPosition}, estimated wait time - ${formatETA(eta)}`
    );

    if (!(currentPosition > 30) || eta < 1800000) {
        alarm.play();
    }
}

async function getCurrentPosition() {
    return (await getBorderQueueState())
        .carLiveQueue.filter(item => item.regnum === registrationNumber)[0].order_id;
}

async function getBorderQueueState() {
    return await (
        (await fetch(url)).json()
    );
}

function getETA(currentPosition) {
    queueHistory.push({
        timestamp: new Date(),
        position: currentPosition
    });

    const historyLengthLowerLimit = averageThroughputCalculationTimePeriods.min / refreshInterval;
    const historyLengthUpperLimit = averageThroughputCalculationTimePeriods.max / refreshInterval;
    if (queueHistory.length < historyLengthLowerLimit) {
        return NaN;
    }
    
    const periodStart = (queueHistory.length < historyLengthUpperLimit) ? 0 : (queueHistory.length - historyLengthUpperLimit);
    const periodEnd = queueHistory.length - 1;
    const calculationPeriod = {
        start: queueHistory[periodStart],
        end: queueHistory[periodEnd]
    }

    const averageThroughput = 
        (calculationPeriod.start.position - calculationPeriod.end.position) / 
        (calculationPeriod.end.timestamp - calculationPeriod.start.timestamp);
    return calculationPeriod.end.position / averageThroughput;
}

function formatETA(eta) {
    if (isNaN(eta)) {
        return "N/A";
    }
    if (!isFinite(eta)) {
        return "∞";
    }
    return convertMsToHM(eta);
}

function log(entry) {
    console.log(entry);

    const logTextArea = document.getElementById("log");
    logTextArea.value += `${entry}\n`;
    setTimeout(() => logTextArea.scrollTop = logTextArea.scrollHeight);
}

function now() {
    return formatDate(new Date());
}

function formatDate(date) {
    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
        ].join('-') +
        ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds()),
        ].join(':')
    );
}

function convertMsToHM(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    // 👇️ if seconds are greater than 30, round minutes up (optional)
    minutes = seconds >= 30 ? minutes + 1 : minutes;

    minutes = minutes % 60;

    // 👇️ If you don't want to roll hours over, e.g. 24 to 00
    // 👇️ comment (or remove) the line below
    // commenting next line gets you `24:00:00` instead of `00:00:00`
    // or `36:15:31` instead of `12:15:31`, etc.
    // hours = hours % 24;

    return `${padTo2Digits(hours)} h ${padTo2Digits(minutes)} m`;
}

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}