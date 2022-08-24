import robotjs from "robotjs";
import {parentPort} from "worker_threads";
import { presets } from "./presets";
import { GearPresetResult } from "./types";

parentPort?.postMessage({type: "log", content: "Starting."});

const sleep = (time: number) => new Promise(r => setTimeout(r, time));;

const state = new Map();

function getHandling() {
    return state.get("is_handling") || false;
}

function setHandling(value: boolean) {
    return state.set("is_handling", value);
}

function getGameData() {
    return state.get("game_data");
}

function setGameData(value: object) {
    return state.set("game_data", value);
}

async function ensureGear(gear: number) {
    const gameData = getGameData();

    const currentGear = gameData.truck.transmission.gear.displayed;
    const pitch = gameData.truck.orientation.pitch;

    const gearsToShift = currentGear - gear;
    const fixedNumber = parseInt(gearsToShift.toString().replace("-", ""));

    if(fixedNumber === 0) return;
    if(gearsToShift === 0) return;

    parentPort?.postMessage({type: "log", content: `Shifting ${fixedNumber} Gears.`});

    if(gearsToShift > 0) {
        for (let i = 0; i < gearsToShift; i++) {
            parentPort?.postMessage({type: "log", content: `Shifting Down to ${currentGear - i - 1}th gear.`});
            robotjs.keyTap("down");
        }
    }else {
        for (let i = 0; i < fixedNumber; i++) {
            if(pitch > 0.018) {
                return;
            }
            parentPort?.postMessage({type: "log", content: `Shifting Up to ${currentGear + i - 1}th gear.`});
            robotjs.keyTap("up");;
        }
    }
}

async function main() {
    const gameData = getGameData();
    if(!gameData) return setHandling(false);

    const isPaused = gameData.game.paused;
    if(isPaused) return setHandling(false);

    const truckData = gameData.truck;
    const gear = truckData.transmission.gear.displayed;
    const speed = truckData.speed.kph;

    if(gear < 0) return setHandling(false);

    let presetToUse = "no_trailer";

    if(gameData.trailer.attached) presetToUse = "default";

    parentPort?.postMessage({type: "preset_current", content: presetToUse});

    //@ts-ignore
    const preset = presets[presetToUse];

    const gearToShift: GearPresetResult = preset(speed);

    if(gearToShift) await ensureGear(gearToShift);

    await sleep(500);

    setHandling(false)
}

parentPort?.on("message", (msg) => {
    if(msg.type === "game_data") {
        if(getHandling()) return;

        setGameData(msg.content);
        setHandling(true);

        main();
    }
});