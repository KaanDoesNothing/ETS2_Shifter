import robotjs from "robotjs";
import {parentPort} from "worker_threads";
import { presets } from "./presets";
import { GearPresetResult } from "./types";

parentPort?.postMessage({type: "log", content: "Starting."});

const sleep = (time: number) => new Promise(r => setTimeout(r, time));;

let gameData: any = undefined;
let isHandling = false;

parentPort?.on("message", (msg) => {
    if(msg.type === "game_data") {
        gameData = msg.content;
    }

    if(isHandling) return;
    isHandling = true;

    main();
});

async function ensureGear(gear: number) {
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
    if(!gameData) return isHandling = false;

    const isPaused = gameData.game.paused;

    if(isPaused) return isHandling = false;

    const truckData = gameData.truck;
    const gear = truckData.transmission.gear.displayed;
    const speed = truckData.speed.kph;

    if(gear < 0) return isHandling = false;

    let presetToUse = "no_trailer";

    if(gameData.trailer.attached) presetToUse = "default";

    parentPort?.postMessage({type: "preset_current", content: presetToUse});

    //@ts-ignore
    const preset = presets[presetToUse];

    const gearToShift: GearPresetResult = preset(speed);

    if(gearToShift) await ensureGear(gearToShift);

    await sleep(500);

    isHandling = false;
}