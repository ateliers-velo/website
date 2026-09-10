#!/usr/bin/env node

const fs = require("fs");
const util = require("util");

const USER_AGENT = "bum.bike/1.0.0 (bumbumvelo@riseup.net)"
const OVERPASS_URL = "https://overpass.private.coffee/api/interpreter";
const QUERY = `[out:json][timeout:60][maxsize:1Mi];area["name"="Montréal"] ->.searchArea;node["shop"="bicycle"]["service:bicycle:diy"="yes"](area.searchArea);out;`;

const BLACK_LIST = ["Atelier Olympia"]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


function format_ateliers_info(data) {
    const formatted = {};

    for(const elem of data.elements) {
        const name = elem.tags.name ?? elem.tags["name:en"];

        if (!BLACK_LIST.includes(name)) {
            formatted[name] =
                {
                    address: elem.tags["addr:housenumber"] + " " + elem.tags["addr:street"],
                    email: elem.tags.email,
                    opening_hours: elem.tags.opening_hours,
                    website: elem.tags.website,
                    latitude: elem.lat,
                    longitude: elem.lon
                };
        }
    };

    return formatted
};


async function fetchAteliersInfo(url, query, maxAttempts = 5, delay = 30000) {
    for(let attempt = 1; attempt <= maxAttempts; attempt++){
        try{
            console.log(`Query attempt ${attempt}...`)
            const response = await fetch(
                url,
                {
                    method: "POST",
                    headers: {"User-Agent": USER_AGENT},
                    body: "data=" + encodeURIComponent(query)
                }
            );

            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    throw new Error(`Client Error: ${response.status} ${response.statusText}`)
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}`)
            }

            const result = await response.json()

            if (result.elements.length == 0) {
                throw new Error(`API Error: returned 0 query results.`)
            };

            console.log(`Query succeeded after ${attempt} attempts.`)
            return format_ateliers_info(result)

        } catch (error) {
            if (attempt == maxAttempts || error.message.startsWith("Client Error")) { throw error; }
            
            console.warn(`Attempt ${attempt} failed: ${error.message}, retrying in ${delay}ms...`)
            await sleep(delay);

        };
    };
};


async function writeAteliersInfo(ateliers_info, ateliers_info_path) {
    const jsonData = JSON.stringify(ateliers_info, null, 2);
    await fs.writeFile(ateliers_info_path, jsonData, err => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Written successfully to ${ateliers_info_path}!`)
        }
    });
};


async function syncAteliersInfo(ateliers_info){
    const ateliers_info_path = "src/_data/ateliers_info.json"

    if (!fs.existsSync(ateliers_info_path)) {
        await writeAteliersInfo(ateliers_info, ateliers_info_path);
        console.log("Written a brand new ateliers_info.json");
        return
    
    }else{
        const _info = fs.readFileSync(ateliers_info_path, "utf8");
        const current_info = JSON.parse(_info);
        const new_info = {};

        for (const [name, info] of Object.entries(current_info)) {
            if (ateliers_info[name]) {
                const updates = {};

                for (const k of Object.keys(info)){
                    updates[k] = ateliers_info[name][k]; 
                };

                new_info[name] = updates;
            };
        };

        if (util.isDeepStrictEqual(current_info, new_info)) {
            console.log("No changes were synced.");
        } else {
            await writeAteliersInfo(new_info, ateliers_info_path);
            console.log("Updated ateliers_info.json");
        }
    };
};


async function main(){
    const ateliers_info = await fetchAteliersInfo(OVERPASS_URL, QUERY);
    await syncAteliersInfo(ateliers_info)
};


main().catch((err) => {
  console.error(err);
  process.exit(1);
});
