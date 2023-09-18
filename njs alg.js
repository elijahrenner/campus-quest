const fs = require('fs');
const readline = require('readline');
const haversine = require('haversine');
const Papa = require('papaparse')

const coordinatesObject = {};

async function getUserInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

async function processCSVData(school) {
    const csvContent = fs.readFileSync('dataset 2.csv', 'utf8');
    const parsedCSV = Papa.parse(csvContent, { header: true }).data;

    for (const row of parsedCSV) {
        if (row['INSTNM'] === school) { 
            const lat = parseFloat(row['LATITUDE']); 
            const lon = parseFloat(row['LONGITUD']); 
            coordinatesObject[school] = { latitude: lat, longitude: lon };
            console.log(lat, lon);
            break;
        }
    }
}


async function main() {
    while (true) {
        const school = await getUserInput('School: ');

        if (school === '') {
            break;
        }

        await processCSVData(school);
    }

    const schools = Object.keys(coordinatesObject);
    const numSchools = schools.length;

    for (let i = 0; i < numSchools; i++) {
        for (let j = i + 1; j < numSchools; j++) {
            const school1 = schools[i];
            const school2 = schools[j];
            const loc1 = coordinatesObject[school1];
            const loc2 = coordinatesObject[school2];
            const distanceMiles = haversine(loc1, loc2, {unit: 'mile'})
            console.log(`Distance between ${school1} and ${school2}: ${distanceMiles.toFixed(2)} miles`);
        }
    }
}

main();
