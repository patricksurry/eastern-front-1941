width 72

add_label $4700 THINK
add_label $6e00 INIT
add_label $c9 TURN
add_label $5752 ARR55
add_label $0690 TOTGS
add_label $0691 TOTRS
add_label $0692 OFR
add_label $0698 IFR
add_label $4d38 IFRN
add_label $4da0 IFRE
add_label $4e08 IFRS
add_label $4e70 IFRW
add_label $7a91 OBJX
add_label $5398 OBJY

add_label $4c70 DIRTO
add_label $0682 TEMPX
add_label $0683 TEMPY

fill 0:THINK 0
load apxdump.dat THINK
fill 4d38:4ed8 ee

assemble $e45c rts  ; nop out vbi registry

; patch the IFR tie-breaking

add_label 4c86 _G_2
add_label 4c9a _G_3
add_label 4ca5 _G_4
add_label 4cb4 _G_5

d 4c70:4cb4

a 4c70 lda TEMPX
a 4c73 bpl _G_2
a 4c75 lda TEMPY
a 4c78 bpl _G_4
a 4c7a ldx #$02
a 4c7c cmp TEMPX
a 4c7f bcc _G_5
a 4c81 beq _G_5
a 4c83 DEX
a 4c84 BNE _G_5
a 4c86 LDA TEMPY
a 4c89 BPL _G_3
a 4c8b JSR $4d32
a 4c8e LDX #$03
a 4c90 CMP TEMPX
a 4c93 BEQ _G_5
a 4c95 BCC _G_5
a 4c97 DEX
a 4c98 BNE _G_5

d 4c70:4cb4

;  test a layout like this:
;
;       x x x x x       2 1 0 f e       N N N N E       N N N N E       N N N N E
;       x . . . x       3 . . . d       W . . . E       W . . . E       W . . . E
;       x . + . x       4 . + . c       W . + . E       W . + . E       W . + . E
;       x . . . x       5 . . . b       W . . . S       W . . . S       W . . . E
;       x x x x x       6 7 8 9 a       S S S E S       W S S E S       W S S S S

fill 4000:401f 0 2  1 2  2 2  2 1  2 0  2 ff  2 fe  1 fe  0 fe  ff fe  fe fe  fe ff  fe 0  fe 1  fe 2  ff 2
fill 4020:403f 0
add_label $4040 TESTDIR
a 4040 ldy #$0
a 4042 lda $4000,y
a 4045 sta TEMPX
a 4048 lda $4001,y
a 404b sta TEMPY
a 404e jsr DIRTO
a 4051 tya
a 4052 lsr
a 4053 tay
a 4054 txa
a 4055 sta $4020,y
a 4058 iny
a 4059 tya
a 405a asl
a 405b tay
a 405c cpy #$20
a 405e bne TESTDIR+2
a 4060 brk

d 4040:4060

a $4cb4 rts

goto TESTDIR

mem 4000:402f

fill 4cb4 b9 ; restore previous service...

add_breakpoint THINK
add_breakpoint $4b2a ; stop after one pass of thinking

add_breakpoint $4752 ; stop to fix OFR

goto INIT
fill TURN 1
continue  ; from THINK
fill OFR $14  ; set OFR to 20 to match our calculation
continue  ; after OFR calc

mem TOTGS:TOTRS
mem OFR
mem IFRN:IFRN+55
mem IFRE:IFRE+55
mem IFRS:IFRS+55
mem IFRW:IFRW+55
mem IFR:IFR+55
mem OBJX:OBJX+55
mem OBJY:OBJY+55
