width 72


load cartridge.rom $8000

;  test a layout like this:
;
;       x x x x x       2 1 0 f e       N N N N E       N N N N E       N N N N E       N N N N E
;       x . . . x       3 . . . d       W . . . E       W . . . E       W . . . E       W . . . E
;       x . + . x       4 . + . c       W . + . E       W . + . E       W . + . E       W . + . E
;       x . . . x       5 . . . b       W . . . S       W . . . S       W . . . E       W . . . E
;       x x x x x       6 7 8 9 a       S S S E S       W S S E S       W S S S S       S S S S E
;
;      test points      numbered       APX original    tie breaking    fix SE test      cartridge

add_label $b812 DIRTO
add_label $e1 SQX
add_label $e2 SQY

a $b84c rts

d DIRTO:b84c

fill 4000:401f 0 2  1 2  2 2  2 1  2 0  2 ff  2 fe  1 fe  0 fe  ff fe  fe fe  fe ff  fe 0  fe 1  fe 2  ff 2
fill 4020:403f 0

add_label $4040 TESTDIR
a 4040 ldy #$0
a 4042 lda $4000,y
a 4045 sta SQX
a 4047 nop
a 4048 lda $4001,y
a 404b sta SQY
a 404d nop
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

goto TESTDIR

mem 4000:402f
