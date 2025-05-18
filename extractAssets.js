const fs = require('fs').promises;
const path = require('path');
const crc32 = require('crc-32'); // Requires 'crc-32' package: npm install crc-32

// Asset definitions from the .lst file
const assets = [
    { name: 'Hockey.snd', folder: 'Sound', start: 0x0000F4C8, end: 0x00024214 },
    { name: 'GameSetUp.map.jim', folder: 'Graphics', start: 0x00024214, end: 0x00025642 },
    { name: 'Title1.map.jim', folder: 'Graphics', start: 0x00025642, end: 0x0002ADF0 },
    { name: 'Title2.map.jim', folder: 'Graphics', start: 0x0002ADF0, end: 0x0002C0FE },
    { name: 'NHLSpin.map.jim', folder: 'Graphics', start: 0x0002C0FE, end: 0x0002E9EC },
    { name: 'Puck.anim', folder: 'Graphics', start: 0x0002E9EC, end: 0x0002F262 },
    { name: 'Scouting.map.jim', folder: 'Graphics', start: 0x0002F262, end: 0x00033590 },
    { name: 'Framer.map.jim', folder: 'Graphics', start: 0x00033590, end: 0x000336B0 },
    { name: 'FaceOff.map.jim', folder: 'Graphics', start: 0x000336B0, end: 0x00033AAE },
    { name: 'IceRink.map.jim', folder: 'Graphics', start: 0x00033AAE, end: 0x0003A3DC },
    { name: 'Refs.map.jim', folder: 'Graphics', start: 0x0003A3DC, end: 0x0003D5EE },
    { name: 'Sprites.anim', folder: 'Graphics', start: 0x0003D5EE, end: 0x0007216C },
    { name: 'Crowd.anim', folder: 'Graphics', start: 0x0007216C, end: 0x00075790 },
    { name: 'FaceOff.anim', folder: 'Graphics', start: 0x00075790, end: 0x0007716C },
    { name: 'Zam.anim', folder: 'Graphics', start: 0x0007716C, end: 0x000778D2 },
    { name: 'BigFont.map.jim', folder: 'Graphics', start: 0x000778D2, end: 0x00078C20 },
    { name: 'SmallFont.map.jim', folder: 'Graphics', start: 0x00078C20, end: 0x00079C2E },
    { name: 'TeamBlocks.map.jim', folder: 'Graphics', start: 0x00079C2E, end: 0x0007E79C },
    { name: 'Arrows.map.jim', folder: 'Graphics', start: 0x0007E79C, end: 0x0007EB12 },
    { name: 'Stanley.map.jim', folder: 'Graphics', start: 0x0007EB12, end: 0x0007FC20 },
    { name: 'EASN.map.jim', folder: 'Graphics', start: 0x0007FC20, end: 0x0007FE8A }
];

// Expected CRC32 checksum (2641653F in hexadecimal)
const EXPECTED_CRC32 = 0x2641653F;

async function verifyCRC32(filePath) {
    try {
        const data = await fs.readFile(filePath);
        const calculatedCRC = crc32.buf(data) >>> 0; // Convert to unsigned 32-bit integer
        return calculatedCRC === EXPECTED_CRC32;
    } catch (error) {
        console.error(`Error reading ROM file for CRC32 check: ${error.message}`);
        return false;
    }
}

async function extractAssets(romPath) {
    try {
        // Verify CRC32
        const isValid = await verifyCRC32(romPath);
        if (!isValid) {
            console.error('CRC32 checksum mismatch. Expected 2641653F. Aborting extraction.');
            return;
        }

        // Read the ROM file
        const romData = await fs.readFile(romPath);

        // Create base Extracted directory
        const baseDir = 'Extracted';
        await fs.mkdir(baseDir, { recursive: true });

        // Extract each asset
        for (const asset of assets) {
            // Create output directory
            const outputDir = path.join(baseDir, asset.folder);
            await fs.mkdir(outputDir, { recursive: true });

            // Extract data
            const assetData = romData.slice(asset.start, asset.end);

            // Write to file
            const outputPath = path.join(outputDir, asset.name);
            await fs.writeFile(outputPath, assetData);
            console.log(`Extracted ${asset.name} to ${outputPath}`);
        }

        console.log('Extraction completed successfully.');
    } catch (error) {
        console.error(`Error during extraction: ${error.message}`);
    }
}

// Run the script with the provided ROM file
const romFile = process.argv[2];
if (!romFile) {
    console.error('Please provide the path to the NHL Hockey ROM file.');
    console.error('Usage: node script.js <rom_file_path>');
    process.exit(1);
}

extractAssets(romFile);