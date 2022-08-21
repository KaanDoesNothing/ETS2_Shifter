import tst from "trucksim-telemetry";
import {parentPort} from "worker_threads";

parentPort?.postMessage({type: "log", content: "Starting."});

const sleep = (time: number) => new Promise(r => setTimeout(r, time));;

const client = tst();
client.watch();

async function waitForConnection() {
    return new Promise((resolve, reject) => {
        while(!client.getTruck()) {
            continue;
        }

        parentPort?.postMessage({type: "log", content: "Connected."});

        resolve(true);
    });
}

client.watch({interval: 50}, update);

function update(data: any) {
    console.log(data.truck);
}