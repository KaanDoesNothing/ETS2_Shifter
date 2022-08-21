import robot from "kbm-robot";
import {parentPort} from "worker_threads";
import { presets } from "./presets";

parentPort?.postMessage({type: "log", content: "Starting."});

const sleep = (time: number) => new Promise(r => setTimeout(r, time));;

robot.startJar();

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
            await robot.type("DOWN").go();
        }
    }else {
        for (let i = 0; i < fixedNumber; i++) {
            if(pitch > 0.018) {
                return;
            }
            parentPort?.postMessage({type: "log", content: `Shifting Up to ${currentGear + i - 1}th gear.`});
            await robot.type("UP").go();
        }
    }
}

async function main() {
    parentPort?.postMessage({type: "log", content: `${isHandling}`});
    if(!gameData) return isHandling = false;

    const isPaused = gameData.game.paused;

    if(isPaused) return isHandling = false;

    const truckData = gameData.truck;
    const gear = truckData.transmission.gear.displayed;
    const speed = truckData.speed.kph;

    if(gear < 0) return isHandling = false;

    let presetToUse = "default";

    if(gameData.trailer.attached) presetToUse = "no_trailer";

    parentPort?.postMessage({type: "preset_current", content: presetToUse});

    //@ts-ignore
    const preset: any = presets[presetToUse];

    const gearToShift = preset(speed);

    if(gearToShift) await ensureGear(gearToShift);

    await sleep(500);

    isHandling = false;
}