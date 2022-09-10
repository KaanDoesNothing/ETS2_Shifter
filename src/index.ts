import blessed from "blessed";
import contrib from "blessed-contrib";
import { Worker } from "worker_threads";
import tst from "trucksim-telemetry";

let gameData: any = undefined;

let cache = {
    preset_current: "Unknown"
}

export const screen = blessed.screen({title: "Client", smartCSR: true});

const statistics = blessed.box({
    label: "Statistics",
    fg: "cyan",
    border: {type: "line"},
    content: ``,
    // right: 100
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

function handleMessage(msg: {type: string, content: any}) {
    if(msg.type === "log") {
        log.log(msg.content);
    }else if(msg.type === "preset_current") {
        cache.preset_current = msg.content;
    }
}

function renderStats() {
    statistics.setContent(`Engine: ${gameData.truck.engine.enabled ? "On" : "Off"}\nSpeed: ${gameData.truck.speed.kph}\nRPM: ${gameData.truck.engine.rpm.value.toFixed()}\nCurrent Pitch: ${gameData.truck.orientation.pitch}\nCurrent Gear: ${gameData.truck.transmission.gear.displayed}\nPreset: ${cache.preset_current}\nClimbing: ${gameData.truck.orientation.pitch > 0.018}`);
    screen.render();
}

const client = tst();

client.truck.on("gear-change", (current: number) => {
    automatic.postMessage({type: "gear_change", content: current});

    log.log("Finished Shifting.");
});

client.watch({interval: 10}, (data) => {
    gameData = data;

    renderStats();

    automatic.postMessage({type: "game_data", content: data});
});

screen.render();