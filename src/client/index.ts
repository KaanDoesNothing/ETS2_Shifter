import SocketIO from "socket.io-client";
import tst from "trucksim-telemetry";
import robotjs from "robotjs";
import blessed from "blessed";
import contrib from "blessed-contrib";

const client = SocketIO("http://localhost:7999");

const tsclient = tst();

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


tsclient.watch({interval: 10}, (data) => {
  client.emit("message", {type: "game_data", content: data});

  gameData = data;

  renderStats();
});

tsclient.truck.on("gear-change", (current: number) => {
  client.emit("message", {type: "gear_change", content: current});

  log.log("Finished shifting");
});

client.on("message", async (msg) => {
  if(msg.type === "log") {
    log.log(msg.content)
  }else if(msg.type === "shift_up") {
    log.log("Has to shift up");
    await robotjs.keyTap("up");
  }else if(msg.type === "shift_down") {
    log.log("Has to shift down");
    await robotjs.keyTap("down");
  }
});

screen.render();