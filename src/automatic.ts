import tst from "trucksim-telemetry";
import robot from "kbm-robot";
import {parentPort} from "worker_threads";
import { presets } from "./presets";

parentPort?.postMessage({type: "log", content: "Starting."});

const sleep = (time: number) => new Promise(r => setTimeout(r, time));;

const client = tst();

client.watch({interval: 100}, async (data) => {
    const isPaused = data.game.paused;

    if(isPaused) return;

    const truckData = data.truck;
    const gear = truckData.transmission.gear.displayed;
    const speed = truckData.speed.kph;
    const pitch = truckData.orientation.pitch;
    
    parentPort?.postMessage({type: "speed_current", content: speed});
    parentPort?.postMessage({type: "gear_current", content: gear});
    parentPort?.postMessage({type: "rpm_current", content: truckData.engine.rpm.value});
    parentPort?.postMessage({type: "pitch_current", content: pitch});
});

robot.startJar();

async function ensureGear(gear: number) {
    const truckData = client.getTruck();
    let currentGear = truckData.transmission.gear.displayed;
    const pitch = truckData.orientation.pitch;

    let gearsToShift = currentGear - gear;
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

async function waitForConnection() {
    return new Promise((resolve, reject) => {
        while(!client.getTruck()) {
            continue;
        }

        parentPort?.postMessage({type: "log", content: "Connected."});

        resolve(true);
    });
}

async function main() {
    await waitForConnection();
    while (true) {
        const isPaused = client.getGame().paused;

        if(isPaused) continue;

        const truckData = client.getTruck();
        const gear = truckData.transmission.gear.displayed;
        const speed = truckData.speed.kph;
        const pitch = truckData.orientation.pitch;

        if(gear < 0) continue;

        let presetToUse = "default";

        if(!client.getTrailer().attached) presetToUse = "no_trailer";

        parentPort?.postMessage({type: "preset_current", content: presetToUse});

        //@ts-ignore
        const preset: any = presets[presetToUse];

        const gearToShift = preset(speed);

        if(gearToShift) await ensureGear(gearToShift);

        await sleep(500);
    }
}

main();