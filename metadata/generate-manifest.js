const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

async function readDirectory(directory) {
    try {
        const listing = await promisify(fs.readdir)(directory);
        
        let manifest = [];

        await Promise.all(listing.map(async itemName => {
            const fullItemName = path.join(directory, itemName);
            if (fs.lstatSync(fullItemName).isDirectory()) {
                (await readDirectory(fullItemName)).forEach(item => manifest.push(item));
            } else if (/.json$/.test(fullItemName)) {
                manifest.push(await readFile(directory, itemName));
            }
        }));

        return manifest;
    } catch(error) {
        console.error(`Error reading directory ${directory}: ${error}`);
    }
}

async function readFile(directory, filename) {
    const fullFilename = path.join(directory, filename);
    try {
        const stringData = await promisify(fs.readFile)(fullFilename, { encoding: 'utf-8' });

        const fileObj = JSON.parse(stringData);

        return {
            filename: fullFilename,
            category: directory.split('/').slice(-1)[0],
            name: fileObj.name,
            instructions: fileObj.instructions
        };
    } catch(error) {
        console.error(`Error reading file ${fullFilename}: ${error}`);
    }
}

readDirectory('controls').then(manifest => fs.writeFileSync('./metadata/manifest.json', JSON.stringify(manifest)));
