const fs = require('fs').promises;
const path = require('path');

// Define the opcode replacement table
const opcodeReplacements = [
    {
        instruction: 'cmp.w',
        existingOpcode: '0C40', // cmp.w #$<immediate>,d0
        newOpcode: 'B07C'     // cmp.w #$<immediate>,d7
    },
    {
        instruction: 'cmpi.w',
        existingOpcode: '0C40', // cmp.w #$<immediate>,d0
        newOpcode: 'B07C'     // cmp.w #$<immediate>,d7
    },
    {
        instruction: 'cmp',
        existingOpcode: '0C40', // cmp.w #$<immediate>,d0
        newOpcode: 'B07C'     // cmp.w #$<immediate>,d7
    },
    // Add more entries as needed, e.g.:
    /*
    {
      instruction: 'move.w',
      existingOpcode: '3040', // move.w d0,d0
      newOpcode: '3140'      // move.w d0,d1
    },
    {
      instruction: 'add.w',
      existingOpcode: 'D040', // add.w d0,d0
      newOpcode: 'D142'      // add.w d1,d2
    }
    */
];

// Function to parse the .lst file and find instructions matching the replacement table
async function parseListingFile(lstFilePath) {
    try {
        const data = await fs.readFile(lstFilePath, 'utf8');
        const lines = data.split('\n');
        const matches = []; // Array of { offset, newOpcode }

        for (const line of lines) {
            for (const { instruction, existingOpcode, newOpcode } of opcodeReplacements) {
                // Create regex for this instruction
                // Matches: 8-digit address, opcode, optional operand bytes, instruction, any operands, optional comment
                const regex = new RegExp(
                    `^\\s*([0-9A-Fa-f]{8})\\s+([0-9A-Fa-f]{4})(?:\\s+[0-9A-Fa-f]{0,})?\\s+${instruction}\\s+[^;]*(?:;.*)?$`,
                    'i'
                );

                const match = line.match(regex);
                if (match) {
                    const offset = parseInt(match[1], 16);
                    const opcode = match[2].toUpperCase();
                    if (opcode === existingOpcode.toUpperCase()) {
                        matches.push({ offset, newOpcode });
                        console.log(
                            `Matched ${instruction} at offset 0x${offset.toString(16).padStart(8, '0').toUpperCase()} with opcode ${opcode}`
                        );
                    }
                }
            }
        }

        return matches;
    } catch (error) {
        console.error('Error reading listing file:', error.message);
        throw error;
    }
}

// Function to modify the binary file at specified offsets
async function modifyBinaryFile(binFilePath, matches) {
    try {
        // Read the binary file into a buffer
        const binaryData = await fs.readFile(binFilePath);
        const buffer = Buffer.from(binaryData);

        // Modify opcodes at specified offsets
        for (const { offset, newOpcode } of matches) {
            // Verify the offset is within the binary file
            if (offset + 2 > buffer.length) {
                console.warn(
                    `Warning: Offset 0x${offset.toString(16).padStart(8, '0').toUpperCase()} is beyond binary file length. Skipping.`
                );
                continue;
            }
            // Verify the opcode at the offset matches expected
            const currentOpcode = buffer.readUInt16BE(offset);
            const expectedOpcode = parseInt(
                opcodeReplacements.find((r) => r.newOpcode.toUpperCase() === newOpcode.toUpperCase()).existingOpcode,
                16
            );
            if (currentOpcode === expectedOpcode) {
                // Write new opcode
                const newOpcodeValue = parseInt(newOpcode, 16);
                buffer.writeUInt16BE(newOpcodeValue, offset);
                console.log(
                    `Modified opcode at offset 0x${offset.toString(16).padStart(8, '0').toUpperCase()} from ${currentOpcode
                        .toString(16)
                        .padStart(4, '0')
                        .toUpperCase()} to ${newOpcode.toUpperCase()}`
                );
            } else {
                console.warn(
                    `Warning: Opcode at offset 0x${offset.toString(16).padStart(8, '0').toUpperCase()} is 0x${currentOpcode
                        .toString(16)
                        .padStart(4, '0')
                        .toUpperCase()}, expected 0x${expectedOpcode
                            .toString(16)
                            .padStart(4, '0')
                            .toUpperCase()}. Skipping.`
                );
            }
        }

        // Write the modified buffer to a new binary file
        const outputPath = path.join(path.dirname(binFilePath), `modified_${path.basename(binFilePath)}`);
        await fs.writeFile(outputPath, buffer);
        console.log(`Modified binary written to ${outputPath}`);
    } catch (error) {
        console.error('Error modifying binary file:', error.message);
        throw error;
    }
}

// Main function to process the files
async function main() {
    try {
        // Get command-line arguments
        const [lstFilePath, binFilePath] = process.argv.slice(2);

        if (!lstFilePath || !binFilePath) {
            console.error('Usage: node script.js <listing.lst> <binary.bin>');
            process.exit(1);
        }

        // Parse the listing file to get offsets and new opcodes
        console.log(`Parsing listing file: ${lstFilePath}`);
        const matches = await parseListingFile(lstFilePath);
        console.log(`Found ${matches.length} instructions to modify`);

        if (matches.length === 0) {
            console.log('No modifications needed.');
            return;
        }

        // Modify the binary file
        console.log(`Modifying binary file: ${binFilePath}`);
        await modifyBinaryFile(binFilePath, matches);
    } catch (error) {
        console.error('Script failed:', error.message);
        process.exit(1);
    }
}

// Run the script
main();