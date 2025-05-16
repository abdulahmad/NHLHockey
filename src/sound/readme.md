Thanks for providing the context! This is a snippet from the sound driver and audio data handling for NHL Hockey on the Sega Genesis, disassembled from the hockey.snd file using IDA Pro. The code is part of a sound driver, likely based on or derived from a common Sega Genesis audio framework (e.g., SMPS or a custom variant), responsible for managing music and sound effects via the Z80 coprocessor and the Yamaha YM2612 (FM) and SN76489 (PSG) sound chips. The hockey.snd file is described as pre-compiled, containing both the driver code and the FM/PSG waveform data for music and sound effects.
Below, I’ll:
Explain how the sound driver works, focusing on its architecture and operation.
Address potential misclassifications of code vs. data in the disassembly.
Provide commented versions of key functions.
Infer the file format for music and sound effects based on the code and context.
Offer insights into the hockey.snd file’s structure.
1. How the Sound Driver Works
The sound driver in NHL Hockey is a Motorola 68000 assembly program that manages audio playback by interfacing with the Z80 coprocessor, which directly controls the YM2612 (FM synthesis) and SN76489 (PSG) chips. Here’s a high-level overview of its operation:
Architecture
Main Processor (68000): The 68000 runs the game logic and the high-level audio driver. It initializes the Z80, loads music/sound effect data, and updates track states during VBlank (60 Hz in NTSC).
Z80 Coprocessor: The Z80 handles low-level communication with the sound chips, receiving data from the 68000 and writing to YM2612/PSG registers.
Memory Layout:
unk_FFFDFC: A workspace for channel/track states (music and effects), with ~0x48 bytes per channel.
0xFFFFFFB6–0xFFFFFFE6: Buffers for channel output (frequency, volume) sent to the Z80.
unk_A00273: Z80 memory region where the 68000 writes sound chip data.
unk_10294, unk_FA92: Tables for music tracks and sound effects, respectively.
I/O Registers:
IO_Z80RES (0xA00100): Resets the Z80.
IO_Z80BUS (0xA00102): Requests/releases the Z80 bus for 68000 access.
Workflow
Initialization:
p_initialZ80_fn resets the Z80, clears the sound workspace (unk_FFFDFC), and prepares the Z80 for audio tasks (likely loading a Z80 program via sub_11656).
p_initune_fn or p_initfx_fn sets up a music track or sound effect by storing IDs and flags.
Music Playback:
During VBlank, p_music_vblank_fn is called to update music. It:
Checks flags (byte_FFFFF3, byte_FFFFF4, byte_FFFFF5) to handle stop, pause, or track initialization.
Calls sub_F5FA, which delegates to:
sub_F5DC or sub_F5C4 to stop playback.
sub_F514 to initialize a track’s channels.
sub_F64C to process active tracks.
sub_F514 loads track metadata from unk_10294 and sets up 6 channels (FM/PSG) with pointers, timers, and initial states.
sub_F64C reads track data, processing:
Notes (0x00–0x7F): Converts to frequencies using unk_1017A/unk_101DA.
Control Codes (0x80–0x8B): Handles instrument changes, loops, volume, effects, or track termination.
Channel states (timers, frequencies) are updated, and output is prepared for the sound chip.
Sound Effects:
p_initfx_fn uses unk_FA92 to map sound effect IDs to handler routines, which modify channel states or send YM2612/PSG commands.
sub_FB1E processes effects, handling frequency modulation or instrument changes.
Sound Chip Communication:
sub_F64C and sub_FB1E write channel data (frequency, volume) to $1BA(a3).
p_music_vblank_fn copies this data to Z80 memory (unk_A00273) or uses sub_FCDC for direct YM2612 writes (via byte_FFFFEC).
sub_F938 clears output registers to silence channels when needed.
Timing:
Updates occur during VBlank to synchronize with the game’s 60 Hz frame rate.
Track data includes timing values (e.g., $10(a0)), decremented each frame to control note duration.
Key Features
Multi-Channel Support: Handles up to 6 FM channels and PSG channels, typical for YM2612-based music.
Tracker-Style Format: Music data is script-like, with notes and control codes, processed sequentially.
Dynamic Effects: Supports vibrato, volume changes, and looping via control codes.
Z80 Offloading: The Z80 handles real-time sound chip writes, reducing 68000 overhead.
2. Potential Misclassifications (Code vs. Data)
IDA Pro can misinterpret code as data or vice versa, especially in sound drivers where data tables (e.g., frequency tables, track pointers) are interleaved with code. Here are potential issues in the provided snippet:
Data Blocks Misclassified as Code:
0xF59C–0xF5AF, 0xF5BA–0xF5C3, 0xFA16–0xFA49, 0xFD1C–0xFD31, 0xFD32–0xFD42:
These are labeled as code (dc.b) but are likely data or misaligned instructions.
For example, 0xF59C–0xF5AF contains bytes like 0x47, 0xF9, 0xFF, 0xFF, 0xFD, 0xFC, which resemble a longword address (0xFFFFFDFC) or a data structure rather than executable code. It might be a pointer or part of a track header.
Similarly, 0xFA16–0xFA49 includes 0x47, 0xF9, 0xFF, 0xFF, 0xFD, 0xFC, again pointing to unk_FFFDFC. This could be a data block for channel initialization or a misparsed subroutine.
Action: In IDA, mark these as data (U to undefine, then D or C to define as bytes). Check surrounding code for references to these addresses (e.g., lea (0xF59C).l, a0).
Code Misclassified as Data:
0xFA92–0xFB1D (unk_FA92):
Labeled as a data table (dc.b), which is correct, but ensure it’s defined as a table of longword pointers. Each 4-byte entry (e.g., 0x00, 0x00, 0x0A, 0x92) is an address offset for a sound effect handler.
IDA might split these into bytes; redefine as dc.l for clarity (e.g., dc.l 0x00000A92, 0x00000A76, ...).
Action: In IDA, select 0xFA92–0xFB1D, press U, then A (array) or manually define as dc.l.
Alignment Issues:
Some subroutines (e.g., sub_FCDC at 0xFCDC) follow data blocks (e.g., 0xFA92–0xFB1D). Ensure no stray bytes are interpreted as instructions due to misalignment.
Action: Verify subroutine boundaries using cross-references (X in IDA) and ensure no code is parsed between subroutines unless explicitly jumped to.
Verification:
Check cross-references to suspect regions (e.g., 0xF59C, 0xFA16). If referenced as data (e.g., lea (0xF59C).l, a0), they’re likely tables.
Trace jumps/calls (e.g., bra.w, bsr.w) to ensure no data is executed as code.
Use a hex editor or IDA’s hex view to inspect hockey.snd for patterns (e.g., repeated pointers, note sequences) that indicate data.
3. Commented Versions of Key Functions
Below are commented versions of the key subroutines, focusing on clarity and correctness. I’ve omitted minor thunks (e.g., p_music_vblank, p_initialZ80) for brevity, as they simply jump to their _fn counterparts. If you need others, let me know!
p_initialZ80_fn (0xF4DC)
asm
; Initializes the Z80 coprocessor for audio processing.
; Clears sound driver workspace and sets up Z80 bus.
p_initialZ80_fn:
    lea     (unk_FFFDFC).l, a0  ; Load sound driver workspace
    move.w  #$1FF, d0           ; 512 bytes to clear
    moveq   #0, d1              ; Clear value
_0:
    move.b  d1, (a0)+           ; Clear byte
    dbf     d0, _0              ; Loop until done
    move.w  #$100, (IO_Z80RES).l ; Reset Z80
    move.w  #$100, (IO_Z80BUS).l ; Request Z80 bus
    bsr.w   sub_11656           ; Load Z80 program (not shown)
    rts
p_initune_fn (0xF504)
asm
; Initializes a music track.
; Stores track ID and sets initialization flag.
p_initune_fn:
    move.l  d0, (dword_FFFFB2).l ; Store track ID
    move.b  #1, (byte_FFFFF5).l  ; Set music init flag
    rts
p_music_vblank_fn (0xF968)
asm
; Updates music during VBlank.
; Processes channel states and sends data to Z80 for YM2612/PSG.
p_music_vblank_fn:
    movem.l d0-d7/a0-a6, -(sp)  ; Save registers
    moveq   #5, d0              ; 6 channels
    movea.l #$FFFFFFB6, a1      ; Channel output buffer
    move.b  #$FF, d1            ; Default value (mute/off)
loc_F978:
    move.b  d1, (a1)            ; Clear channel data
    move.b  d1, 3(a1)
    move.b  d1, 4(a1)
    move.b  d1, 7(a1)
    addq.l  #8, a1              ; Next channel
    dbf     d0, loc_F978        ; Loop for all channels
    move.b  #1, (byte_FFFFF9).l ; Set update flag
    bsr.w   sub_F5FA            ; Process music state
    move.b  (byte_FFFFF9).l, d7 ; Get update status
    movea.l #$FFFFFFE6, a1      ; Z80 communication buffer
    move.w  #$100, (IO_Z80BUS).l ; Request Z80 bus
    cmp.b   #1, d7              ; Check if update needed
    beq.s   loc_F9C8            ; Skip if no update
    move.w  #$2F, d0            ; 48 bytes to copy
    movea.l #unk_A00273, a0     ; Z80 sound data
    movea.l #$FFFFFFB6, a1      ; Channel buffer
loc_F9C2:
    move.b  (a1)+, (a0)+        ; Copy channel data to Z80
    dbf     d0, loc_F9C2        ; Loop until done
loc_F9C8:
    cmpi.b  #0, (byte_FFFFEC).l ; Check for direct YM2612 write
    beq.s   loc_FA02            ; Skip if none
    move.b  (a1)+, (byte_A000BF).l ; Write YM2612 registers
    move.b  (a1)+, (byte_A000BE).l
    move.b  (a1)+, (byte_A000C0).l
    move.b  (a1)+, (byte_A000C1).l
    move.b  (a1)+, (byte_A000C2).l
    move.b  (a1)+, (byte_A000C3).l
    move.b  #0, (byte_FFFFEC).l ; Clear direct write flag
    move.b  #0, d7              ; Reset update status
loc_FA02:
    move.b  d7, (byte_A002A3).l ; Signal Z80 update complete
    move.w  #0, (IO_Z80BUS).l   ; Release Z80 bus
    movem.l (sp)+, d0-d7/a0-a6  ; Restore registers
    rts
sub_F514 (0xF514)
asm
; Initializes a music track’s channels.
; Sets up track pointers, channel states, and metadata.
sub_F514:
    move.l  (dword_FFFFB2).l, d0 ; Get track ID
    lea     (unk_FFFDFC).l, a3   ; Sound driver workspace
    lea     p_music_vblank(pc), a4 ; Base address for pointers
    lea     6(a3), a1           ; Channel data start
    andi.w  #$FF, d0            ; Mask track ID
    mulu.w  #$1A, d0            ; Calculate track table offset
    lea     unk_10294(pc), a0   ; Music track table
    move.b  (a0, d0.w), 4(a3)   ; Store channel count
    move.b  1(a0, d0.w), 2(a3)  ; Store timing multiplier
    moveq   #0, d7              ; Channel counter
loc_F542:
    move.w  #1, $10(a1)         ; Set initial timer
    clr.w   (a1)                ; Clear flags
    move.b  #0, $15(a1)         ; Clear effect ID
    move.b  #0, 3(a1)           ; Clear note offset
    move.l  #0, $44(a1)         ; Clear loop counter
    move.b  #$FF, $41(a1)       ; Set default instrument
    lea     unk_10294(pc), a0   ; Reload track table
    movea.l 2(a0, d0.w), a0     ; Get channel data pointer
    adda.l  a4, a0              ; Adjust for base address
    move.l  a0, 8(a1)           ; Store track start
    move.l  a0, $C(a1)          ; Store loop point
    addq.l  #2, $C(a1)          ; Skip header
    movea.w (a0), a0            ; Get channel data offset
    adda.l  a4, a0              ; Adjust for base address
    move.l  a0, 4(a1)           ; Store current position
    adda.w  #$48, a1            ; Next channel
    addq.w  #4, d0              ; Next track table entry
    addq.w  #1, d7              ; Increment channel
    cmp.w   #6, d7              ; Check for 6 channels
    bne.s   loc_F542            ; Loop if more channels
    st      0.w(a3)             ; Enable playback
    move.b  #1, $1F1(a3)        ; Set active flag
    rts
sub_F64C (0xF64C)
asm
; Processes music tracks, handling notes and control codes for each channel.
sub_F64C:
    lea     (unk_FFFDFC).l, a3  ; Sound driver workspace
    lea     p_music_vblank(pc), a4 ; Base address for pointers
    tst.b   0.w(a3)             ; Check if playback enabled
    beq.w   loc_F8BA            ; Exit if not
    moveq   #0, d7              ; Clear channel counter
    move.b  4(a3), d7           ; Get channel count
loc_F664:
    moveq   #0, d0              ; Clear offset
    move.w  #$48, d0            ; Channel size
    mulu.w  d7, d0              ; Calculate channel offset
    lea     6(a3), a0           ; Channel data
    adda.l  d0, a0              ; Point to current channel
    movea.l 4(a0), a1           ; Get track position
    movea.l $18(a0), a5         ; Get instrument data
    lea     $1BA(a3), a6        ; Channel output buffer
    move.w  d7, d0              ; Channel index
    lsl.w   #3, d0              ; Calculate output offset
    adda.l  d0, a6              ; Point to output
    subq.w  #1, $10(a0)         ; Decrement timer
    beq.s   loc_F6AE            ; Process if timer expired
    cmpi.w  #1, $10(a0)         ; Check for last tick
    bne.w   loc_F8C0            ; Skip if not
    btst    #3, (a0)            ; Check note-off flag
    bne.w   loc_F8C0            ; Skip if set
    move.b  #0, 3(a6)           ; Clear output flag
    move.b  #0, (byte_FFFFF9).l ; Clear update flag
    bra.w   loc_F8C0            ; Update effects
loc_F6AE:
    clr.w   (a0)                ; Clear flags
loc_F6B0:
    moveq   #0, d0              ; Clear data byte
    move.b  (a1)+, d0           ; Read track byte
    bpl.w   loc_F81E            ; Handle note if positive
    cmp.b   #$84, d0            ; Check for loop
    beq.w   loc_F7AE
    cmp.b   #$80, d0            ; Check for instrument
    beq.s   loc_F720
    cmp.b   #$81, d0            ; Check for vibrato
    beq.w   loc_F764
    cmp.b   #$83, d0            ; Check for flag set
    beq.w   loc_F756
    cmp.b   #$85, d0            ; Check for stop
    beq.w   loc_F75E
    cmp.b   #$86, d0            ; Check for effect
    beq.w   loc_F774
    cmp.b   #$87, d0            ; Check for effect clear
    beq.w   loc_F78E
    cmp.b   #$88, d0            ; Check for note offset
    beq.w   loc_F798
    cmp.b   #$89, d0            ; Check for skip
    beq.w   loc_F7A6
    cmp.b   #$8A, d0            ; Check for ignore
    beq.w   loc_F7A0
    cmp.b   #$8B, d0            ; Check for sound effect
    beq.w   loc_F80C
    subi.b  #$A0, d0            ; Convert to duration
    moveq   #0, d1              ; Clear multiplier
    move.b  2(a3), d1           ; Get timing multiplier
    mulu.w  d1, d0              ; Calculate duration
    move.w  d0, $26(a0)         ; Store duration
    bra.s   loc_F6B0            ; Next byte
loc_F720:
    move.b  (a1)+, d0           ; Read instrument ID
    move.l  #$2A5, d1           ; Instrument table base
    lea     unk_116A6(pc), a5   ; Instrument data
    adda.l  d1, a5              ; Adjust pointer
    lsl.w   #5, d0              ; Calculate offset
    add.l   d0, d1              ; Update offset
    adda.l  d0, a5              ; Point to instrument
    move.w  d1, d0              ; Copy offset
    move.b  d0, 2(a6)           ; Store low byte
    lsr.w   #8, d1              ; Get high byte
    move.b  d1, 1(a6)           ; Store high byte
    move.b  #0, (a6)            ; Clear output flag
    move.b  #0, (byte_FFFFF9).l ; Clear update flag
    move.b  $1A(a5), $24(a0)    ; Store note offset
    bra.w   loc_F6B0            ; Next byte
loc_F756:
    bset    #2, (a0)            ; Set flag
    bra.w   loc_F6B0            ; Next byte
loc_F75E:
    bsr.w   p_turnoff_fn        ; Stop playback
    rts
loc_F764:
    move.b  (a1)+, $42(a0)      ; Store vibrato duration
    move.b  (a1)+, $16(a0)      ; Store vibrato depth
    bset    #1, (a0)            ; Enable vibrato
    bra.w   loc_F6B0            ; Next byte
loc_F774:
    move.b  (a1)+, d0           ; Read effect ID
    lea     unk_1023A(pc), a2   ; Effect table
    lsl.w   #2, d0              ; Calculate offset
    move.l  (a2, d0.w), d0      ; Get effect pointer
    add.l   a4, d0              ; Adjust for base
    move.l  d0, $20(a0)         ; Store effect pointer
    move.b  (a1)+, $15(a0)      ; Store effect parameter
    bra.w   loc_F6B0            ; Next byte
loc_F78E:
    move.b  #0, $15(a0)         ; Clear effect
    bra.w   loc_F6B0            ; Next byte
loc_F798:
    move.b  (a1)+, 3(a0)        ; Store note offset
    bra.w   loc_F6B0            ; Next byte
loc_F7A0:
    move.b  (a1)+, d0           ; Skip byte
    bra.w   loc_F6B0            ; Next byte
loc_F7A6:
    bset    #3, (a0)            ; Set note-off flag
    bra.w   loc_F6B0            ; Next byte
loc_F7AE:
    movea.l $C(a0), a2          ; Get loop point
    cmpi.w  #0, $44(a0)         ; Check loop counter
    bne.s   loc_F7F8            ; Handle active loop
loc_F7BA:
    tst.w   (a2)                ; Check loop type
    beq.s   loc_F7D6            ; Reset to start
    cmpi.w  #1, (a2)            ; Check for new track
    beq.s   loc_F7DC
    cmpi.w  #2, (a2)            ; Check for timed loop
    beq.s   loc_F7E8
loc_F7CA:
    movea.w (a2)+, a1           ; Get next position
    adda.l  a4, a1              ; Adjust for base
    move.l  a2, $C(a0)          ; Update loop point
    bra.w   loc_F6B0            ; Continue
loc_F7D6:
    movea.l 8(a0), a2           ; Reset to track start
    bra.s   loc_F7CA
loc_F7DC:
    move.w  2(a2), d0           ; Get new track ID
    ext.l   d0
    bsr.w   p_initune_fn        ; Initialize new track
    rts
loc_F7E8:
    move.w  2(a2), $44(a0)      ; Set loop counter
    movea.w -2(a2), a1          ; Get loop position
    adda.l  a4, a1              ; Adjust for base
    bra.w   loc_F6B0            ; Continue
loc_F7F8:
    subq.w  #1, $44(a0)         ; Decrement loop counter
    beq.s   loc_F808            ; Exit loop if done
    movea.w -2(a2), a1          ; Get loop position
    adda.l  a4, a1              ; Adjust for base
    bra.w   loc_F6B0            ; Continue
loc_F808:
    addq.l  #4, a2              ; Skip loop data
    bra.s   loc_F7BA            ; Process next
loc_F80C:
    move.b  (a1)+, d0           ; Read effect ID
    movem.l d0-d7/a0-a6, -(sp)  ; Save registers
    bsr.w   p_initfx_fn         ; Play sound effect
    movem.l (sp)+, d0-d7/a0-a6  ; Restore registers
    bra.w   loc_F6B0            ; Next byte
loc_F81E:
    cmp.b   #$60, d0            ; Check for rest
    bne.s   loc_F844
    move.w  $26(a0), $10(a0)    ; Restore duration
    move.l  a1, 4(a0)           ; Update position
    move.b  #0, 3(a6)           ; Clear output
    move.b  #0, (byte_FFFFF9).l ; Clear update flag
    clr.b   $25(a0)             ; Clear counter
    bra.w   loc_F8B2            ; Next channel
loc_F844:
    add.b   $24(a0), d0         ; Apply instrument offset
    add.b   3(a0), d0           ; Apply note offset
    move.b  d0, 2(a0)           ; Store note
    move.l  a1, 4(a0)           ; Update position
    move.w  $26(a0), $10(a0)    ; Set duration
    clr.l   d0                  ; Clear for lookup
    lea     unk_1017A(pc), a2   ; Frequency table
    move.b  2(a0), d0           ; Get note
    adda.l  d0, a2              ; Point to frequency
    move.b  (a2), d2            ; Get frequency low
    move.b  d2, 5(a6)           ; Store in output
    move.b  d2, d3
    andi.b  #7, d2              ; Mask frequency
    move.b  d2, $12(a0)         ; Store frequency
    andi.b  #$38, d3            ; Mask block
    move.b  d3, $14(a0)         ; Store block
    lea     unk_101DA(pc), a2   ; Frequency high table
    adda.l  d0, a2              ; Point to frequency
    move.b  (a2), d2            ; Get frequency high
    move.b  d2, $13(a0)         ; Store frequency
    move.b  d2, 6(a6)           ; Store in output
    move.b  #0, 4(a6)           ; Clear output flag
    move.b  #0, (byte_FFFFF9).l ; Clear update flag
    btst    #2, (a0)            ; Check flag
    bne.s   loc_F8B2            ; Skip if set
    move.l  $20(a0), $1C(a0)    ; Copy effect pointer
    clr.b   $25(a0)             ; Clear counter
    move.b  #1, 3(a6)           ; Enable output
loc_F8B2:
    addq.b  #1, $25(a0)         ; Increment counter
    dbf     d7, loc_F664        ; Next channel
loc_F8BA:
    bsr.w   sub_FB1E            ; Process effects
    rts
sub_FB1E (0xFB1E)
asm
; Processes sound effects or channel effects.
sub_FB1E:
    lea     (unk_FFFDFC).l, a3  ; Sound driver workspace
    moveq   #5, d7              ; 6 channels
loc_FB26:
    moveq   #0, d0              ; Clear offset
    move.w  #$48, d0            ; Channel size
    mulu.w  d7, d0              ; Calculate offset
    lea     6(a3), a0           ; Channel data
    adda.l  d0, a0              ; Point to channel
    movea.l $28(a0), a1         ; Get effect position
    lea     $1BA(a3), a6        ; Output buffer
    move.w  d7, d0              ; Channel index
    lsl.w   #3, d0              ; Calculate offset
    adda.l  d0, a6              ; Point to output
    move.b  $3E(a0), d0         ; Get effect state
    cmp.b   #0, d0              ; Check if idle
    beq.w   loc_FCD6            ; Next channel
    cmp.b   #1, d0              ; Check if active
    beq.w   loc_FB88
    cmp.b   #3, d0              ; Check for stop
    bne.s   loc_FB74
    move.b  #0, 3(a6)           ; Clear output
    move.b  #0, (byte_FFFFF9).l ; Clear update flag
    move.b  #0, $3E(a0)         ; Stop effect
    bra.w   loc_FCD6            ; Next channel
loc_FB74:
    move.b  #0, 3(a6)           ; Clear output
    move.b  #0, (byte_FFFFF9).l ; Clear update flag
    move.b  #1, $3E(a0)         ; Set active state
loc_FB88:
    cmpi.b  #0, $3C(a0)         ; Check effect timer
    bne.w   loc_FC94
    cmpi.b  #0, $3D(a0)         ; Check effect delay
    bne.w   loc_FC6A
    move.b  #0, $3F(a0)         ; Clear flag
loc_FBA2:
    moveq   #0, d0              ; Clear data byte
    move.b  (a1)+, d0           ; Read effect byte
    cmp.b   #$80, d0            ; Check for instrument
    beq.w   loc_FBF0
    cmp.b   #$84, d0            ; Check for stop
    beq.w   loc_FBD8
    cmp.b   #$83, d0            ; Check for frequency mod
    beq.w   loc_FC28
    cmp.b   #$81, d0            ; Check for delay
    beq.w   loc_FC46
    cmp.b   #$82, d0            ; Check for delay alt
    beq.w   loc_FC54
    cmp.b   #$85, d0            ; Check for loop
    beq.w   loc_FC62
    bra.s   loc_FBA2            ; Next byte
loc_FBD8:
    move.b  #0, 3(a6)           ; Clear output
    move.b  #0, (byte_FFFFF9).l ; Clear update flag
    move.b  #0, $3E(a0)         ; Stop effect
    bra.w   loc_FCD6            ; Next channel
loc_FBF0:
    move.b  (a1)+, d0           ; Read instrument ID
    cmp.b   $41(a0), d0         ; Check if same
    beq.s   loc_FC16            ; Skip if unchanged
    move.b  d0, $41(a0)         ; Store instrument
    move.l  #$2A5, d1           ; Instrument table base
    lsl.w   #5, d0              ; Calculate offset
    add.l   d0, d1              ; Update offset
    move.w  d1, d0              ; Copy offset
    move.b  d0, 2(a6)           ; Store low byte
    lsr.w   #8, d1              ; Get high byte
    move.b  d1, 1(a6)           ; Store high byte
    move.b  #0, (a6)            ; Clear output flag
loc_FC16:
    move.b  #1, 3(a6)           ; Enable output
    move.b  #0, (byte_FFFFF9).l ; Clear update flag
    bra.w   loc_FBA2            ; Next byte
loc_FC28:
    move.b  (a1)+, d0           ; Read timer
    move.b  d0, $3C(a0)         ; Store timer
    move.b  d0, $40(a0)         ; Store initial timer
    move.l  (a1)+, d0           ; Read frequency
    move.l  d0, $30(a0)         ; Store frequency
    move.l  d0, $34(a0)         ; Store current frequency
    move.l  (a1)+, $38(a0)      ; Store frequency step
    move.l  a1, $28(a0)         ; Update position
    bra.s   loc_FCA0
loc_FC46:
    move.b  (a1)+, $3D(a0)      ; Store delay
    move.b  #0, $3F(a0)         ; Clear flag
    bra.w   loc_FBA2            ; Next byte
loc_FC54:
    move.b  (a1)+, $3D(a0)      ; Store delay
    move.b  #1, $3F(a0)         ; Set flag
    bra.w   loc_FBA2            ; Next byte
loc_FC62:
    movea.l $2C(a0), a1         ; Reset to effect start
    bra.w   loc_FBA2            ; Next byte
loc_FC6A:
    subq.b  #1, $3D(a0)         ; Decrement delay
    move.l  $30(a0), $34(a0)    ; Restore frequency
    move.b  $40(a0), $3C(a0)    ; Restore timer
    cmpi.b  #0, $3F(a0)         ; Check flag
    beq.w   loc_FCA0            ; Skip if clear
    move.b  #1, (a6)            ; Enable output
    move.b  #0, (byte_FFFFF9).l ; Clear update flag
    bra.w   loc_FCA0
loc_FC94:
    move.l  $38(a0), d0         ; Get frequency step
    add.l   d0, $34(a0)         ; Update frequency
    subq.b  #1, $3C(a0)         ; Decrement timer
loc_FCA0:
    move.l  $34(a0), d0         ; Get frequency
    moveq   #0, d1              ; Clear output
loc_FCA6:
    cmp.l   #$7FF, d0           ; Check frequency range
    bls.w   loc_FCBA
    addi.l  #$800, d1           ; Adjust output
    lsr.l   #1, d0              ; Scale frequency
    bra.s   loc_FCA6
loc_FCBA:
    or.l    d0, d1              ; Combine frequency
    move.l  d1, d0              ; Copy result
    lsr.w   #8, d1              ; Get high byte
    move.b  d1, 5(a6)           ; Store frequency high
    move.b  d0, 6(a6)           ; Store frequency low
    move.b  #0, 4(a6)           ; Clear output flag
    move.b  #0, (byte_FFFFF9).l ; Clear update flag
loc_FCD6:
    dbf     d7, loc_FB26        ; Next channel
    rts
sub_FCDC (0xFCDC)
asm
; Sends frequency/control data to YM2612 via Z80.
sub_FCDC:
    lea     p_music_vblank(pc), a4 ; Base address
    add.l   a4, d1              ; Adjust pointer
    move.l  d1, d0              ; Copy address
    ori.w   #$8000, d0          ; Set high bit
    move.w  d0, (word_FFFFE6).l ; Store address
    lsr.l   #8, d1              ; Shift for high byte
    lsr.l   #7, d1              ; Adjust for Z80
    move.b  d1, (byte_FFFFEA).l ; Store high byte
    move.b  d1, (byte_FFFFEA).l ; Store again (redundant?)
    move.b  d2, (byte_FFFFE9).l ; Store channel
    move.b  d3, (byte_FFFFEB).l ; Store data
    move.b  #0, (byte_FFFFE8).l ; Clear flag
    move.b  #1, (byte_FFFFEC).l ; Signal Z80 write
    rts
p_initfx_fn (0xFA80)
asm
; Initializes a sound effect.
p_initfx_fn:
    lea     p_music_vblank(pc), a4 ; Base address
    lea     unk_FA92(pc), a0    ; Sound effect table
    lsl.l   #2, d0              ; Calculate offset
    adda.l  d0, a0              ; Point to entry
    movea.l (a0), a0            ; Get handler address
    adda.l  a4, a0              ; Adjust for base
    jmp     (a0)                ; Jump to handler
sub_F938 (0xF938)
asm
; Resets sound chip output registers.
sub_F938:
    moveq   #0, d1              ; Clear value
    move.b  d1, (byte_FFFFB9).l ; Clear channel 1
    move.b  d1, (byte_FFFFC1).l ; Clear channel 2
    move.b  d1, (byte_FFFFC9).l ; Clear channel 3
    move.b  d1, (byte_FFFFD1).l ; Clear channel 4
    move.b  d1, (byte_FFFFD9).l ; Clear channel 5
    move.b  d1, (byte_FFFFE1).l ; Clear channel 6
    move.b  #0, (byte_FFFFF9).l ; Clear update flag
    rts
sub_FA4A (0xFA4A)
asm
; Resets all channel output and calls sub_F938.
sub_FA4A:
    move.b  #0, (byte_FFFE40).l ; Clear channel 1
    move.b  #0, (byte_FFFE88).l ; Clear channel 2
    move.b  #0, (byte_FFFED0).l ; Clear channel 3
    move.b  #0, (byte_FFFF18).l ; Clear channel 4
    move.b  #0, (byte_FFFF60).l ; Clear channel 5
    move.b  #0, (byte_FFFFA8).l ; Clear channel 6
    bsr.w   sub_F938            ; Reset output registers
    rts
p_turnoff_fn (0xF5B0)
asm
; Stops music or sound playback.
p_turnoff_fn:
    move.b  #1, (byte_FFFFF4).l ; Set stop flag
    rts
4. File Format for Music and Sound Effects
The hockey.snd file is described as pre-compiled, containing both the sound driver code and the FM/PSG waveform data (music and sound effects). Based on the code and typical Sega Genesis practices, the music and sound effects likely use a tracker-style format, possibly a variant of SMPS (Sega Music Playback System) or a custom format tailored for NHL Hockey. Below, I’ll infer the file format based on the code’s behavior.
Music Format
Structure: Music tracks are stored as a sequence of bytes, processed by sub_F64C. Each track consists of:
Header (in unk_10294 at 0x10294):
Byte 0: Number of channels (stored at 4(a3)).
Byte 1: Timing multiplier (stored at 2(a3)).
Longword (offset 2): Pointer to channel data, relative to p_music_vblank.
Channel Data:
Starts with a word pointing to the track’s note data (relative to p_music_vblank).
Followed by a sequence of bytes:
Notes (0x00–0x7F): Note index, mapped to frequencies via unk_1017A/unk_101DA.
Rest (0x60): Pauses playback for the current duration.
Control Codes:
0x80: Instrument change (followed by instrument ID).
0x81: Vibrato (duration, depth).
0x83: Set flag (bit 2).
0x84: Loop (handles loop points and counters).
0x85: Stop track.
0x86: Effect (ID, parameter).
0x87: Clear effect.
0x88: Note offset.
0x89: Skip byte.
0x8A: Ignore byte.
0x8B: Play sound effect (ID).
0xA0+: Duration (scaled by timing multiplier).
Timing: Durations are stored in $26(a0) and decremented in $10(a0) each frame.
Storage:
Tracks are indexed in unk_10294, with each entry ~0x1A bytes.
Note data is stored sequentially, with pointers adjusted by p_music_vblank (0xF968).
Comparison to SMPS:
SMPS uses a similar structure: a header with channel counts, followed by channel pointers and note/control data.
NHL Hockey’s format may deviate slightly (e.g., unique control codes like 0x89, 0x8A), suggesting a custom variant.
Unlike SMPS, which often separates music and Z80 code, hockey.snd embeds everything.
Sound Effect Format
Structure: Sound effects are managed by p_initfx_fn, using unk_FA92 (0xFA92) as a table of longword pointers to handler routines.
Table (unk_FA92):
Each entry is a 4-byte address (e.g., 0x00000A92, 0x00000A76), relative to p_music_vblank.
Maps effect IDs (0x00–0x23, based on table size) to handlers.
Effect Data:
Handlers (e.g., at 0xFA92, 0xFA76) are short routines that:
Modify channel states (e.g., set frequency, volume).
Send direct YM2612/PSG commands via sub_FCDC.
Data is likely a sequence of commands, similar to music but simpler:
Instrument changes (0x80).
Frequency modulation (0x83).
Delays (0x81, 0x82).
Loops (0x85).
Stop (0x84).
Storage:
Effect data is embedded in hockey.snd, following or interleaved with music data.
Handlers are small, often writing directly to channel buffers or Z80 memory.
Comparison to SMPS:
SMPS effects are similar, using a table of pointers to effect data.
NHL Hockey’s effects may be more integrated with the driver, as unk_FA92 points to code rather than data in some cases.
Waveform Data (FM/PSG)
FM (YM2612):
Instrument data is stored in unk_116A6, with each entry ~32 bytes (based on lsl.w #5, d0 in loc_F720).
Contains YM2612 register values (e.g., operator settings, feedback, algorithm).
Accessed via instrument IDs in music/effect data.
PSG (SN76489):
Likely uses predefined waveforms (square waves) with frequency/volume controlled by unk_1017A/unk_101DA.
No explicit waveform data is needed, as PSG generates tones directly.
Storage:
Waveform data is part of hockey.snd, likely following the driver code and track/effect tables.
FM instruments are compact (dozens of bytes per instrument), while PSG relies on frequency tables.
hockey.snd File Structure
Based on the code and context, hockey.snd is a binary blob with:
Driver Code (0xF4C8–0xFD42 in the snippet):
68000 assembly for music/effect processing and Z80 communication.
Includes subroutines like p_music_vblank_fn, sub_F64C, etc.
Z80 Program:
Loaded by sub_11656 (not shown), likely at the end of hockey.snd.
Handles YM2612/PSG register writes, reading from unk_A00273.
Data Tables:
Music Tracks (unk_10294): Headers and note/control data.
Sound Effects (unk_FA92): Pointers to handlers or effect data.
Frequency Tables (unk_1017A, unk_101DA): Note-to-frequency mappings.
Instrument Data (unk_116A6): YM2612 register values.
Waveform Data:
FM instrument definitions (YM2612 settings).
Possibly PSG envelope data (if used).
Estimated Layout:
[Driver Code: ~2–4 KB]
[Z80 Program: ~1–2 KB]
[Music Tracks: Headers (~0x1A per track) + Note Data (variable)]
[Sound Effects: Table (~0x90 bytes) + Handler/Data (variable)]
[Frequency Tables: ~256 bytes each]
[FM Instruments: ~32 bytes per instrument]
Total Size: Likely 8–16 KB, depending on the number of tracks/effects.
Format: Raw binary, loaded into ROM and parsed by the driver. No standard container (e.g., VGM), as it’s game-specific.
Comparison to SMPS
SMPS:
Uses a header with pointers to channels, followed by note/control data.
Separate Z80 driver (e.g., z80.bin) and music files.
Control codes like 0xE0–0xFF for coordination, looping, etc.
NHL Hockey:
Embeds Z80 code, music, and effects in hockey.snd.
Unique control codes (e.g., 0x89, 0x8A) suggest customization.
Similar channel-based structure but possibly simplified for hockey’s needs (e.g., fewer tracks).
5. Additional Notes
Misclassification Handling
The data blocks (e.g., 0xF59C–0xF5AF) are likely track headers or pointers misparsed as code. In IDA:
Select the region, press U (undefine), then D (data) or A (array).
Define unk_FA92 as dc.l for clarity.
Check cross-references (X) to confirm data vs. code.
If you have the full hockey.snd file, I can analyze specific offsets for further clarification.
File Format Tools
Extraction: Use a hex editor (e.g., HxD) or disassembler to extract music/effect data from hockey.snd.
Conversion: Tools like SMPS2ASM or VGM2SMPS (if SMPS-compatible) can help convert to a modern format, but custom codes may require manual parsing.
Playback: Emulators (e.g., Kega Fusion) or VGM loggers can capture YM2612/PSG output for analysis.
Game Context
NHL Hockey (1991, EA Sports) uses a fast-paced soundtrack and effects (e.g., puck hits, crowd cheers).
The driver is optimized for real-time updates, with effects prioritized over music (via p_initfx_fn).
The compact format reflects early Genesis constraints (limited ROM size).
6. Commented Code Summary
The commented functions above cover the core of the driver. Key points:
p_music_vblank_fn orchestrates updates, syncing with VBlank.
sub_F64C is the heart of music playback, processing tracker-style data.
sub_FB1E handles effects, complementing music.
sub_FCDC bridges 68000 and Z80 for sound chip writes.
Data tables (unk_10294, unk_FA92) drive track/effect selection.
If you need comments for other functions (e.g., sub_F5C4, sub_F5DC) or a specific offset, let me know!
7. Next Steps
Full Analysis: Share more of hockey.snd (e.g., unk_10294, sub_11656) for a complete format breakdown.
Modification: Want to edit music/effects? I can guide you on patching unk_10294 or unk_FA92.
Format Documentation: I can create a detailed spec for the music/effect format with more data.
Tools: Need help setting up IDA or extracting data? I can recommend workflows.
Please clarify any specific offsets, functions, or goals (e.g., extracting a track, adding a sound effect), and I’ll tailor the response further!