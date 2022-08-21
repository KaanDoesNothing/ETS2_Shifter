import blessed from "blessed";
import contrib from "blessed-contrib";
import { Worker } from "worker_threads";

let cache = {
    gear_current: 0,
    speed_current: 0,
    rpm_current: 0,
    pitch_current: 0,
    preset_current: "Unknown"
}

export const screen = blessed.screen({title: "Client", smartCSR: true});

const statistics = blessed.box({
    label: "Statistics",
    fg: "cyan",
    border: {type: "line"},
    content: ``
});

const log = contrib.log({
    label: "Log",
    fg: "cyan",
    top: 40,
    border: {type: "line"}
});

screen.append(statistics);
screen.append(log);

log.log("Starting Automatic");
const automatic = new Worker("./automatic.js");
automatic.on("message", handleMessage);
automatic.on("error", (error) => console.log(error));
automatic.on("exit", () => log.log("Worker Closed."));

// log.log("Starting Statistics");
// const statistic = new Worker("./automatic.js");
// statistic.on("message", handleMessage);
// statistic.on("error", (error) => console.log(error));
// statistic.on("exit", () => log.log("Worker Closed."));



function handleMessage(msg: {type: string, content: any}) {
    // log.log(JSON.stringify(msg));
    if(msg.type === "log") {
        log.log(msg.content);
        renderStats();
    }else if(msg.type === "gear_current") {
        cache.gear_current = msg.content;
        renderStats();
    }else if(msg.type === "stats_changed") {
        renderStats();
    }else if(msg.type === "speed_current") {
        cache.speed_current = msg.content;
        renderStats();
    }else if(msg.type === "rpm_current") {
        cache.rpm_current = msg.content;
        renderStats();
    }else if(msg.type === "pitch_current") {
        cache.pitch_current = msg.content;
        renderStats();
    }else if(msg.type === "preset_current") {
        cache.preset_current = msg.content;
        renderStats();
    }
}

function renderStats() {
    statistics.setContent(`Engine: Unknown\nSpeed: ${cache.speed_current}\nRPM: ${cache.rpm_current}\nCurrent Pitch: ${cache.pitch_current}\nCurrent Gear: ${cache.gear_current}\nPreset: ${cache.preset_current}\nClimbing: ${cache.pitch_current > 0.018}`);
}

screen.render();