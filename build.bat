@echo off
setlocal

REM Get the directory of this batch file
set "workspaceFolder=%~dp0"

REM Set default values for rev and checksum if not provided
if not defined rev   set "rev=0"
if not defined checksum set "checksum=1"

REM Create the output directory
if not exist "%workspaceFolder%output" mkdir "%workspaceFolder%output"

REM Change to the workspace src directory
cd /d "%workspaceFolder%src"

REM Determine revision flag
if "%rev%"=="0" (
    set "revFlag=/e retail"
) else (
    set "revFlag=/e reva"
)

REM Determine checksum flag
if "%checksum%"=="0" (
    set "checksumFlag=/e nochecksum"
) else (
    set "checksumFlag=/e checksum"
)

REM Run the assembler with all flags
"%workspaceFolder%assembler\Assembler.exe" ^
  /p /m /g ^
  /o d- /o s- /o r+ /o l+ /o l. /o ow+ /o op- /o os+ /o oz+ /o omq- /o oaq+ /o osq+ ^
  %revFlag% %checksumFlag% ^
  "%workspaceFolder%src\hockey.asm,%workspaceFolder%output\nhl92.bin,%workspaceFolder%output\nhl92,%workspaceFolder%output\nhl92" ^
  > "%workspaceFolder%output\Build.log"

endlocal
