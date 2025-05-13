# NHL Hockey (also known as NHL 92'): Project Setup

This project contains tools for compiling NHL Hockey for the Sega Genesis using ASM68K compiler.

## Initial Setup

1. Clone/extract this repository
2. Open in VSCode or editor of choice (Not required if just building the ROM)

## Project Structure

```
Root/
├── assembler/            # Assembler
├── notebooks/            # Jupyter Notebooks for Additional Tooling (Not Required)
├── output/               # Build output
├── src/                  # Source assembly files and assets
│   ├── _docs/              # Documentation files
│   ├── graphics/           # Graphic assets
│   ├── macros/             # Assembly macros
│   ├── sega/               # Sega-init code
│   ├── sound/              # Sound assets
│   └── *.asm               # Assembly files
└── build.bat             # Batch File for Invoking Assembler to Compile Source Code
```

## Building (Windows)

1. Run the build.bat file from the command prompt or terminal.
2. Batch file should generate files in the `output` folder

## Building (Mac or Linux)

1. Requires Docker to be installed.
2. Clone the repo.
3. CD into NHLHockey folder.
4. Run the following comand to build the source files.
```
mkdir -p output && \
docker run --rm \
    -v "$(pwd)/src:/src" \
    -v "$(pwd)/output:/output" \
    rhargreaves/asm68k \
    /p /m /g /o d- /o s- /o r+ /o l+ /o l. /o ow+ /o op- /o os+ /o oz+ /o omq- /o oaq+ /o osq+ \
    "hockey.asm,/output/nhl92.bin,/output/nhl92,/output/nhl92" > output/build.log 2>&1
```
## Output
```
    output/
    ├── Build.log             # Log file containing any errors during compilation.
    ├── nhl92.bin             # ROM file if the build was successful without errors.
    ├── nhl92.lst             # Debug information generated during the build.
    └── nhl92.map             # Symbol file used for debugging.
```

## Developer Info

1. For more detailed development information, please refer to the [wiki](https://github.com/Mhopkinsinc/NHLHockey/wiki).


Code is aligned up to D70 - EALogo
1164 - still aligned
1168 -- aligned
116a - extra 4e73
11CA - misaligned
11D6 - misaligned
1200 - misaligned
138C - misaligned
15B5 - misaligned-- retail has 2 more bytes
1A06 - misaligned-- retail has 2 more bytes
22D2 - misaligned-- retail has 2 more bytes
3FF2 - misaligned-- retail has 2 more bytes