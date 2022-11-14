; converted with pydisass6502 by awsm of mayday!

* = $4700

THINK:      ldx #$01                         ; 4700 a201    Initialize.  NB call with A=0; X indexes TOTGS/TOTRS
            sta TEMPR                        ; 4702 85c5    
            sta TOTRS                        ; 4704 8d9106  
            sta TOTGS                        ; 4707 8d9006  
            ldy #$9e                         ; 470a a09e    
_THINK_1:   lda ARRIVE,y                     ; 470c b91b57  . arrival turns
            cmp TURN                         ; 470f c5c9    
            bcs _THINK_2                     ; 4711 b00d    
            lda TEMPR                        ; 4713 a5c5    
            clc                              ; 4715 18      
            adc CSTRNG,y                     ; 4716 79dd55  . combat strengths
            sta TEMPR                        ; 4719 85c5    
            bcc _THINK_2                     ; 471b 9003    
            inc TOTGS,x                      ; 471d fe9006
_THINK_2:   dey                              ; 4720 88      
            cpy #$37                         ; 4721 c037    
            bcs _THINK_1                     ; 4723 b0e7    
            ldx #$00                         ; 4725 a200    Bug: TEMPR doesn't get zero'd so TOTGS starts with TOTRS remainder
            cpy #$00                         ; 4727 c000    
            bne _THINK_1                     ; 4729 d0e1    
            lda TOTRS                        ; 472b ad9106  Calc TOTGS*16/TOTRS by right shift numerator until overflow then left shft denom
            sta TEMPR                        ; 472e 85c5    
            lda TOTGS                        ; 4730 ad9006  
            ldx #$04                         ; 4733 a204    
_THINK_3:   asl                              ; 4735 0a      
            bcc _THINK_5                     ; 4736 9008    
            ror                              ; 4738 6a      
_THINK_4:   lsr TEMPR                        ; 4739 46c5    
            dex                              ; 473b ca      
            bne _THINK_4                     ; 473c d0fb    
            beq _THINK_6                     ; 473e f003    
_THINK_5:   dex                              ; 4740 ca      
            bne _THINK_3                     ; 4741 d0f2    
_THINK_6:   ldy #$ff                         ; 4743 a0ff    Calc OFR by repeated subtraction of denom from numerator
            ldx TEMPR                        ; 4745 a6c5    
            beq _THINK_8                     ; 4747 f006    
            sec                              ; 4749 38      
_THINK_7:   iny                              ; 474a c8      
            sbc TEMPR                        ; 474b e5c5    
            bcs _THINK_7                     ; 474d b0fb    
_THINK_8:   sty OFR                          ; 474f 8c9206  . Overall force ratio
            ldx #$9e                         ; 4752 a29e    Loop through to calc Russian IFR
_THINK_9:   stx ARMY                         ; 4754 86c2    
            lda ARRIVE,x                     ; 4756 bd1b57  . arrival turns
            cmp TURN                         ; 4759 c5c9    
            bcs _THINK_10                    ; 475b b00f    
            jsr CALIFR                       ; 475d 20234c  . determines individual force ratios IFRx in all four directions
            lda CORPSX,x                     ; 4760 bd0054  . longitude of all units
            sta OBJX-55,x                    ; 4763 9d5a7a  
            lda CORPSY,x                     ; 4766 bd9f54  . latitude of all units
            sta OBJY-55,x                    ; 4769 9d6153  
_THINK_10:  dex                              ; 476c ca      
            cpx #$37                         ; 476d e037    
            bcs _THINK_9                     ; 476f b0e3    
MLOOP:      ldx #$9e                         ; 4771 a29e    outer loop for whole Russian army
ALOOP:      stx ARMY                         ; 4773 86c2    Inner loop for individual russian units
            lda ARRIVE,x                     ; 4775 bd1b57  . arrival turns
            cmp TURN                         ; 4778 c5c9    
            bcc _ALOOP_2                     ; 477a 9003
_ALOOP_1:   jmp TOGSCN                       ; 477c 4c114b

_ALOOP_2:   lda CORPT,x                      ; 477f bdca58  . codes for unit types
            cmp #$04                         ; 4782 c904    militia? (no move)
            beq _ALOOP_1                     ; 4784 f0f6
            lda OFR                          ; 4786 ad9206  . Overall force ratio
            lsr                              ; 4789 4a      
            cmp IFR-55,x                     ; 478a dd6106  IFR = OFR/2 implies no local threat -> reinforcement
            bne _ALOOP_5                     ; 478d d056
            sta BSTVAL                       ; 478f 8d3106  . best value, was BVAL
            ldy #$9e                         ; 4792 a09e    find nearby beleagured units
BLGRLP:     lda ARRIVE,y                     ; 4794 b91b57  . arrival turns
            cmp TURN                         ; 4797 c5c9    
            bcs _ALOOP_4                     ; 4799 b033
            lda CORPSX,y                     ; 479b b90054  . longitude of all units
            sec                              ; 479e 38      
            sbc CORPSX,x                     ; 479f fd0054  . longitude of all units
            jsr ABSA                         ; 47a2 20304d  . A -> abs(A)
            sta TEMPR                        ; 47a5 85c5    
            lda CORPSY,y                     ; 47a7 b99f54  . latitude of all units
            sec                              ; 47aa 38      
            sbc CORPSY,x                     ; 47ab fd9f54  . latitude of all units
            jsr ABSA                         ; 47ae 20304d  . A -> abs(A)
            clc                              ; 47b1 18      
            adc TEMPR                        ; 47b2 65c5    
            lsr                              ; 47b4 4a      
            lsr                              ; 47b5 4a      
            lsr                              ; 47b6 4a      taxicab dist / 8
            bcs _ALOOP_4                     ; 47b7 b015    trying to check if <= 8 but wrong??
            sta TEMPR                        ; 47b9 85c5    
            lda IFR-55,y                     ; 47bb b96106  
            sec                              ; 47be 38      
            sbc TEMPR                        ; 47bf e5c5    
            bcc _ALOOP_4                     ; 47c1 900b    find highest value of IFR - dist / 8
            cmp BSTVAL                       ; 47c3 cd3106  . best value, was BVAL
            bcc _ALOOP_4                     ; 47c6 9006
            sta BSTVAL                       ; 47c8 8d3106  . best value, was BVAL
            sty BSTIDX                       ; 47cb 8c3206  . best index, was BONE
BLGRNX:     dey                              ; 47ce 88
            cpy #$37                         ; 47cf c037    
            bcs _ALOOP_3                     ; 47d1 b0c1
            ldy BSTIDX                       ; 47d3 ac3206  most beleagured army
            lda CORPSX,y                     ; 47d6 b90054  . longitude of all units
            sta OBJX-55,x                    ; 47d9 9d5a7a  
            lda CORPSY,y                     ; 47dc b99f54  . latitude of all units
            sta OBJY-55,x                    ; 47df 9d6153  
            jmp TOGSCN                       ; 47e2 4c114b  

_ALOOP_5:   lda #$ff                         ; 47e5 a9ff    front line army
            sta DIR                          ; 47e7 8d3306  direction of #$ff means stay put
            sta BSTIDX                       ; 47ea 8d3206  . best index, was BONE
            lda #$00                         ; 47ed a900    
            sta BSTVAL                       ; 47ef 8d3106  . best value, was BVAL
            lda IFRE-55,x                    ; 47f2 bd694d  ad hoc logic for surrounded army
            cmp #$10                         ; 47f5 c910    
            bcs _ALOOP_6                     ; 47f7 b009
            lda MSTRNG,x                     ; 47f9 bd3e55  . muster strengths
            lsr                              ; 47fc 4a      
            cmp CSTRNG,x                     ; 47fd dddd55  . combat strengths
            bcc DRLOOP                       ; 4800 9010    
_ALOOP_6:   lda CORPSX,x                     ; 4802 bd0054  . longitude of all units
            sec                              ; 4805 38      
            sbc #$05                         ; 4806 e905    out of supply, head due east!
            bcs _ALOOP_7                     ; 4808 b002
            lda #$00                         ; 480a a900    
_ALOOP_7:   sta OBJX-55,x                    ; 480c 9d5a7a
            jmp TOGSCN                       ; 480f 4c114b  

DRLOOP:     lda OBJX-55,x                    ; 4812 bd5a7a  
            ldy DIR                          ; 4815 ac3306  
            bmi _DRLOOP_1                    ; 4818 3004    
            clc                              ; 481a 18      
            adc XINC,y                       ; 481b 79f27b  
_DRLOOP_1:  sta TARGX                        ; 481e 8d3406  . square under consideration
            lda OBJY-55,x                    ; 4821 bd6153  
            ldy DIR                          ; 4824 ac3306  
            bmi _DRLOOP_2                    ; 4827 3004    
            clc                              ; 4829 18      
            adc YINC,y                       ; 482a 79f17b  . note YINC/XINC overlap
_DRLOOP_2:  sta TARGY                        ; 482d 8d3506  
            lda #$00                         ; 4830 a900    
            sta SQVAL                        ; 4832 85ce    
            lda DIR                          ; 4834 ad3306  
            bmi _DRLOOP_3                    ; 4837 3010    
            sta WHORDS,x                     ; 4839 9d145e  . what unit orders are (2 bits per order)
            jsr CALCNXT                      ; 483c 20de72  
            ldy ARMY                         ; 483f a4c2    
            lda EXEC,y                       ; 4841 b9616d  . unit execution times
            bpl _DRLOOP_3                    ; 4844 1003    is square accessible?
            jmp EVALSQ                       ; 4846 4cd64a  else skip this square

_DRLOOP_3:  lda #$00                         ; 4849 a900    now fill in the direct line array
            sta LINCOD                       ; 484b 8d3906  . code value of line config
            lda TARGX                        ; 484e ad3406  . square under consideration
            sta SQX                          ; 4851 8d3606  . adjacent square
            lda TARGY                        ; 4854 ad3506  
            sta SQY                          ; 4857 8d3706  . adj sq; also OCOLUM
            ldy #$17                         ; 485a a017    
_DRLOOP_4:  sty JCNT                         ; 485c 8c3806  . counter for adj squares
            lda JSTP,y                       ; 485f b99c79  . Dirs to spiral around 5x5 square (incl 3x3 steps)
            tay                              ; 4862 a8      
            lda SQX                          ; 4863 ad3606  . adjacent square
            clc                              ; 4866 18      
            adc XINC,y                       ; 4867 79f27b  
            sta SQX                          ; 486a 8d3606  . adjacent square
            lda SQY                          ; 486d ad3706  . adj sq; also OCOLUM
            clc                              ; 4870 18      
            adc YINC,y                       ; 4871 79f17b  . note YINC/XINC overlap
            sta SQY                          ; 4874 8d3706  . adj sq; also OCOLUM
            ldx #$9e                         ; 4877 a29e    
_DRLOOP_5:  lda ARRIVE,x                     ; 4879 bd1b57  . arrival turns
            cmp TURN                         ; 487c c5c9    
            beq _DRLOOP_6                    ; 487e f002    
            bcs _DRLOOP_7                    ; 4880 b019    
_DRLOOP_6:  lda OBJX-55,x                    ; 4882 bd5a7a  
            cmp SQX                          ; 4885 cd3606  . adjacent square
            bne _DRLOOP_7                    ; 4888 d011    
            lda OBJY-55,x                    ; 488a bd6153  
            cmp SQY                          ; 488d cd3706  . adj sq; also OCOLUM
            bne _DRLOOP_7                    ; 4890 d009    
            cpx ARMY                         ; 4892 e4c2    
            beq _DRLOOP_8                    ; 4894 f00a    
            lda MSTRNG,x                     ; 4896 bd3e55  . muster strengths
            bne _DRLOOP_9                    ; 4899 d007    
_DRLOOP_7:  dex                              ; 489b ca      
            cpx #$37                         ; 489c e037    
            bcs _DRLOOP_5                    ; 489e b0d9    
_DRLOOP_8:  lda #$00                         ; 48a0 a900    
_DRLOOP_9:  ldy JCNT                         ; 48a2 ac3806  . counter for adj squares
            ldx NDX,x                        ; 48a5 bed97b  
            sta LINARR,x                     ; 48a8 9d6306  
            dey                              ; 48ab 88      
            bpl _DRLOOP_4                    ; 48ac 10ae    
            ldx ARMY                         ; 48ae a6c2    
            lda MSTRNG,x                     ; 48b0 bd3e55  . muster strengths
            sta LINARR+12                    ; 48b3 8d6f06  
            lda #$00                         ; 48b6 a900    
            sta ACCLO                        ; 48b8 85c7    
            sta ACCHI                        ; 48ba 85c8    
            sta SECDIR                       ; 48bc 8d4806  . secondary direction
__A__:      ldx #$00                         ; 48bf a200    build LV array
            stx POTATO                       ; 48c1 8e4906  . stupid temp
_A_1:       ldy #$00                         ; 48c4 a000
_A_2:       lda LINARR,x                     ; 48c6 bd6306
            bne _A_3                         ; 48c9 d006
            inx                              ; 48cb e8      
            iny                              ; 48cc c8      
            cpy #$05                         ; 48cd c005    
            bne _A_2                         ; 48cf d0f5
_A_3:       ldx POTATO                       ; 48d1 ae4906  . stupid temp
            tya                              ; 48d4 98      
            sta LV,x                         ; 48d5 9d8406  . line value array
            inx                              ; 48d8 e8      
            stx POTATO                       ; 48d9 8e4906  . stupid temp
            cpx #$01                         ; 48dc e001    
            bne _A_4                         ; 48de d004
            ldx #$05                         ; 48e0 a205    
            bne _A_1                         ; 48e2 d0e0
_A_4:       cpx #$02                         ; 48e4 e002
            bne _A_5                         ; 48e6 d004
            ldx #$0a                         ; 48e8 a20a    
            bne _A_1                         ; 48ea d0d8
_A_5:       cpx #$03                         ; 48ec e003
            bne _A_6                         ; 48ee d004
            ldx #$0f                         ; 48f0 a20f    
            bne _A_1                         ; 48f2 d0d0
_A_6:       cpx #$04                         ; 48f4 e004
            bne _A_7                         ; 48f6 d004
            ldx #$14                         ; 48f8 a214    
            bne _A_1                         ; 48fa d0c8
_A_7:       lda #$00                         ; 48fc a900
            ldy #$04                         ; 48fe a004    
_A_8:       ldx LV,x                         ; 4900 be8406  . line value array
            cpx #$05                         ; 4903 e005    
            beq _A_9                         ; 4905 f003
            clc                              ; 4907 18      
            adc #$28                         ; 4908 6928    
_A_9:       dey                              ; 490a 88
            bpl _A_8                         ; 490b 10f3
            ldy LINARR+10                    ; 490d ac6d06  add bonus if central column is otherwise empty
            bne _A_10                        ; 4910 d012
            ldy LINARR+11                    ; 4912 ac6e06  
            bne _A_10                        ; 4915 d00d
            ldy LINARR+13                    ; 4917 ac7006  
            bne _A_10                        ; 491a d008
            ldy LINARR+14                    ; 491c ac7106  
            bne _A_10                        ; 491f d003
            clc                              ; 4921 18      
            adc #$30                         ; 4922 6930    
_A_10:      sta LPTS                         ; 4924 8d8906  . line points: evaluating strength of the line
            ldx #$00                         ; 4927 a200    evaluate blocking penalty
_A_11:      lda LV,x                         ; 4929 bd8406  . line value array
            cmp #$04                         ; 492c c904    
            bcs _A_13                        ; 492e b01f
            sta TEMPR                        ; 4930 85c5    
            stx TEMPZ                        ; 4932 86c6    
            txa                              ; 4934 8a      
            asl                              ; 4935 0a      
            asl                              ; 4936 0a      
            adc TEMPZ                        ; 4937 65c6    
            adc TEMPR                        ; 4939 65c5    
            tay                              ; 493b a8      
            iny                              ; 493c c8      
            lda LINARR,y                     ; 493d b96306  
            beq _A_13                        ; 4940 f00d
            lda LPTS                         ; 4942 ad8906  . line points: evaluating strength of the line
            sec                              ; 4945 38      
            sbc #$20                         ; 4946 e920    
            bcs _A_12                        ; 4948 b002
            lda #$00                         ; 494a a900    
_A_12:      sta LPTS                         ; 494c 8d8906  . line points: evaluating strength of the line
_A_13:      inx                              ; 494f e8
            cpx #$05                         ; 4950 e005    
            bne _A_11                        ; 4952 d0d5
            ldy #$00                         ; 4954 a000    evaluate vulnerability to penetrations
_A_14:      sty OCOLUM                       ; 4956 8c8b06
            ldx #$00                         ; 4959 a200    
_A_15:      stx COLUM                        ; 495b 8e8a06
            cpx OCOLUM                       ; 495e ec8b06  
            beq _A_18                        ; 4961 f021
            lda LV,x                         ; 4963 bd8406  . line value array
            sec                              ; 4966 38      
            sbc LV,y                         ; 4967 f98406  . line value array
            beq _A_18                        ; 496a f018
            bmi _A_18                        ; 496c 3016
            tax                              ; 496e aa      
            lda #$01                         ; 496f a901    
_A_16:      asl                              ; 4971 0a
            dex                              ; 4972 ca      
            bne _A_16                        ; 4973 d0fc
            sta TEMPR                        ; 4975 85c5    
            lda LPTS                         ; 4977 ad8906  . line points: evaluating strength of the line
            sec                              ; 497a 38      
            sbc TEMPR                        ; 497b e5c5    
            bcs _A_17                        ; 497d b002
            lda #$00                         ; 497f a900    
_A_17:      sta LPTS                         ; 4981 8d8906  . line points: evaluating strength of the line
_A_18:      ldx COLUM                        ; 4984 ae8a06
            inx                              ; 4987 e8      
            cpx #$05                         ; 4988 e005    
            bne _A_15                        ; 498a d0cf
            iny                              ; 498c c8      
            cpy #$05                         ; 498d c005    
            bne _A_14                        ; 498f d0c5
            ldx ARMY                         ; 4991 a6c2    get overall line value weighted by danger vector
            ldy SECDIR                       ; 4993 ac4806  . secondary direction
            bne _A_19                        ; 4996 d006
            lda IRRN-55,x                    ; 4998 bd014d  
            jmp __B__                        ; 499b 4cb549

_A_19:      cpy #$01                         ; 499e c001
            bne _A_20                        ; 49a0 d006
            lda IFRE-55,x                    ; 49a2 bd694d  
            jmp __B__                        ; 49a5 4cb549

_A_20:      cpy #$02                         ; 49a8 c002
            bne _A_21                        ; 49aa d006
            lda IFRS-55,x                    ; 49ac bdd14d  
            jmp __B__                        ; 49af 4cb549

_A_21:      lda IFRW-55,x                    ; 49b2 bd394e
__B__:      sta TEMPR                        ; 49b5 85c5
            ldx LPTS                         ; 49b7 ae8906  . line points: evaluating strength of the line
            beq _B_3                         ; 49ba f013
            lda ACCLO                        ; 49bc a5c7    
            clc                              ; 49be 18      
_B_1:       adc TEMPR                        ; 49bf 65c5
            bcc _B_2                         ; 49c1 9009
            inc ACCHI                        ; 49c3 e6c8    
            clc                              ; 49c5 18      
            bne _B_2                         ; 49c6 d004
            lda #$ff                         ; 49c8 a9ff    
            sta ACCHI                        ; 49ca 85c8    
_B_2:       dex                              ; 49cc ca
            bne _B_1                         ; 49cd d0f0
_B_3:       iny                              ; 49cf c8      next secondary direction
            cpy #$04                         ; 49d0 c004    
            beq _B_6                         ; 49d2 f01f
            sty SECDIR                       ; 49d4 8c4806  . secondary direction
            ldx #$18                         ; 49d7 a218    rotate array
_B_4:       lda LINARR,x                     ; 49d9 bd6306
            sta BAKARR,x                     ; 49dc 9d4a06  
            dex                              ; 49df ca      
            bpl _B_4                         ; 49e0 10f7
            ldx #$18                         ; 49e2 a218    
_B_5:       ldy ROTARR,x                     ; 49e4 bc787a
            lda BAKARR,x                     ; 49e7 bd4a06  
            sta LINARR,y                     ; 49ea 996306  
            dex                              ; 49ed ca      
            bpl _B_5                         ; 49ee 10f4
            jmp __A__                        ; 49f0 4cbf48

_B_6:       lda ACCHI                        ; 49f3 a5c8
            sta SQVAL                        ; 49f5 85ce    
            ldy #$36                         ; 49f7 a036    get range to closest German into NBVAL
            lda #$ff                         ; 49f9 a9ff    
            sta NBVAL                        ; 49fb 8d3a06  . another best value
_B_7:       lda ARRIVE,y                     ; 49fe b91b57  . arrival turns
            cmp TURN                         ; 4a01 c5c9    
            beq _B_8                         ; 4a03 f002
            bcs _B_9                         ; 4a05 b021
_B_8:       lda CORPSX,y                     ; 4a07 b90054  . longitude of all units
            sec                              ; 4a0a 38      
            sbc TARGX                        ; 4a0b ed3406  . square under consideration
            jsr ABSA                         ; 4a0e 20304d  . A -> abs(A)
            sta TEMPR                        ; 4a11 85c5    
            lda CORPSY,y                     ; 4a13 b99f54  . latitude of all units
            sec                              ; 4a16 38      
            sbc TARGY                        ; 4a17 ed3506  
            jsr ABSA                         ; 4a1a 20304d  . A -> abs(A)
            clc                              ; 4a1d 18      
            adc TEMPR                        ; 4a1e 65c5    
            cmp NBVAL                        ; 4a20 cd3a06  . another best value
            bcs _B_9                         ; 4a23 b003
            sta NBVAL                        ; 4a25 8d3a06  . another best value
_B_9:       dey                              ; 4a28 88
            bpl _B_7                         ; 4a29 10d3
            ldx ARMY                         ; 4a2b a6c2    determine whether to use offensive or defensive strategy
            lda IFR-55,x                     ; 4a2d bd6106  
            sta TEMPR                        ; 4a30 85c5    
            lda #$0f                         ; 4a32 a90f    
            sec                              ; 4a34 38      
            sbc TEMPR                        ; 4a35 e5c5    
            bcc _B_10                        ; 4a37 900c
            asl                              ; 4a39 0a      OK, let's fool the routine
            sta TEMPR                        ; 4a3a 85c5    
            lda #$09                         ; 4a3c a909    
            sec                              ; 4a3e 38      
            sbc NBVAL                        ; 4a3f ed3a06  I know that NBVAL<9 for all front line units
            sta NBVAL                        ; 4a42 8d3a06  . another best value
_B_10:      ldy NBVAL                        ; 4a45 ac3a06  add NBVAL*IFR to SQVAL with defensive bonus
            bne _B_11                        ; 4a48 d005    this square occupied by a German?
            sty SQVAL                        ; 4a4a 84ce    yes, do not enter!!!
            jmp EVALSQ                       ; 4a4c 4cd64a  

_B_11:      ldy TRNTYP                       ; 4a4f a4cd
            lda DEFNC,y                      ; 4a51 b9b479  . Defensive combat modifiers; 1 -> half, 2 -> no effect, 3 -> double
            clc                              ; 4a54 18      
            adc NBVAL                        ; 4a55 6d3a06  . another best value
            tay                              ; 4a58 a8      
            lda #$00                         ; 4a59 a900    
            clc                              ; 4a5b 18      
_B_12:      adc TEMPR                        ; 4a5c 65c5
            bcc _B_13                        ; 4a5e 9004
            lda #$ff                         ; 4a60 a9ff    
            bmi _B_14                        ; 4a62 3003
_B_13:      dey                              ; 4a64 88
            bne _B_12                        ; 4a65 d0f5
_B_14:      clc                              ; 4a67 18
            adc SQVAL                        ; 4a68 65ce    
            bcc _B_15                        ; 4a6a 9002
            lda #$ff                         ; 4a6c a9ff    
_B_15:      sta SQVAL                        ; 4a6e 85ce
            ldy #$9e                         ; 4a70 a09e    extract penalty if somebody else has dibs on this square
_B_16:      lda OBJX-55,y                    ; 4a72 b95a7a
            cmp TARGX                        ; 4a75 cd3406  . square under consideration
            bne _B_18                        ; 4a78 d01e
            lda OBJY-55,y                    ; 4a7a b96153  
            cmp TARGY                        ; 4a7d cd3506  
            bne _B_18                        ; 4a80 d016
            cpy ARMY                         ; 4a82 c4c2    
            beq _B_18                        ; 4a84 f012
            lda ARRIVE,y                     ; 4a86 b91b57  . arrival turns
            cmp TURN                         ; 4a89 c5c9    
            beq _B_17                        ; 4a8b f002
            bcs _B_18                        ; 4a8d b009
_B_17:      lda SQVAL                        ; 4a8f a5ce
            sbc #$20                         ; 4a91 e920    
            sta SQVAL                        ; 4a93 85ce    
            jmp EVALSQ                       ; 4a95 4cd64a  

_B_18:      dey                              ; 4a98 88
            cpy #$37                         ; 4a99 c037    
            bcs _B_16                        ; 4a9b b0d5
            lda CORPSX,x                     ; 4a9d bd0054  extract distance penalty
            sec                              ; 4aa0 38      
            sbc TARGX                        ; 4aa1 ed3406  . square under consideration
            jsr ABSA                         ; 4aa4 20304d  . A -> abs(A)
            sta TEMPR                        ; 4aa7 85c5    
            lda CORPSY,x                     ; 4aa9 bd9f54  . latitude of all units
            sec                              ; 4aac 38      
            sbc TARGY                        ; 4aad ed3506  
            jsr ABSA                         ; 4ab0 20304d  . A -> abs(A)
            clc                              ; 4ab3 18      
            adc TEMPR                        ; 4ab4 65c5    
            cmp #$07                         ; 4ab6 c907    
            bcc _B_19                        ; 4ab8 9006
            lda #$00                         ; 4aba a900    this square is too far away
            sta SQVAL                        ; 4abc 85ce    
            beq EVALSQ                       ; 4abe f016    
_B_19:      tax                              ; 4ac0 aa
            lda #$01                         ; 4ac1 a901    
_B_20:      asl                              ; 4ac3 0a
            dex                              ; 4ac4 ca      
            bpl _B_20                        ; 4ac5 10fc
            sta TEMPR                        ; 4ac7 85c5    
            lda SQVAL                        ; 4ac9 a5ce    
            sec                              ; 4acb 38      
            sbc TEMPR                        ; 4acc e5c5    
            sta SQVAL                        ; 4ace 85ce    
            bcs EVALSQ                       ; 4ad0 b004    
            lda #$00                         ; 4ad2 a900    
            sta SQVAL                        ; 4ad4 85ce    
EVALSQ:     ldy DIR                          ; 4ad6 ac3306  evaluate this square
            ldx ARMY                         ; 4ad9 a6c2    
            lda SQVAL                        ; 4adb a5ce    
            cmp BSTVAL                       ; 4add cd3106  . best value, was BVAL
            bcc _EVALSQ_1                    ; 4ae0 9006    
            sta BSTVAL                       ; 4ae2 8d3106  . best value, was BVAL
            sty BSTIDX                       ; 4ae5 8c3206  . best index, was BONE
_EVALSQ_1:  iny                              ; 4ae8 c8      
            cpy #$04                         ; 4ae9 c004    
            beq _EVALSQ_2                    ; 4aeb f006    
            sty DIR                          ; 4aed 8c3306  
            jmp DRLOOP                       ; 4af0 4c1248  

_EVALSQ_2:  lda OBJX-55,x                    ; 4af3 bd5a7a  
            ldy BSTIDX                       ; 4af6 ac3206  . best index, was BONE
            bmi _EVALSQ_3                    ; 4af9 3004    
            clc                              ; 4afb 18      
            adc XINC,y                       ; 4afc 79f27b  
_EVALSQ_3:  sta OBJX-55,x                    ; 4aff 9d5a7a  
            lda OBJY-55,x                    ; 4b02 bd6153  
            ldy BSTIDX                       ; 4b05 ac3206  . best index, was BONE
            bmi _EVALSQ_4                    ; 4b08 3004    
            clc                              ; 4b0a 18      
            adc YINC,y                       ; 4b0b 79f17b  . note YINC/XINC overlap
_EVALSQ_4:  sta OBJY-55,x                    ; 4b0e 9d6153  
TOGSCN:     lda GRAFP3 / TRIG0               ; 4b11 ad10d0  . W: gfx shape for P3 / R: joystick 0 trigger (0=press)
            beq _TOGSCN_1                    ; 4b14 f00c    ignore game console if red button is down
            lda #$08                         ; 4b16 a908    
            sta CONSOL                       ; 4b18 8d1fd0  . Check for OPTION/SELECT/START press (not RESET)
            lda CONSOL                       ; 4b1b ad1fd0  . Check for OPTION/SELECT/START press (not RESET)
            and #$01                         ; 4b1e 2901    
            beq WRAPUP                       ; 4b20 f00b    
_TOGSCN_1:  dex                              ; 4b22 ca      
            cpx #$37                         ; 4b23 e037    
            bcc _TOGSCN_2                    ; 4b25 9003    
            jmp ALOOP                        ; 4b27 4c7347  . Inner loop for individual russian units

_TOGSCN_2:  jmp MLOOP                        ; 4b2a 4c7147  . outer loop for whole Russian army

WRAPUP:     ldx #$9e                         ; 4b2d a29e    
__C__:      stx ARMY                         ; 4b2f 86c2
            lda ARRIVE,x                     ; 4b31 bd1b57  . arrival turns
            cmp TURN                         ; 4b34 c5c9    
            bcc _C_1                         ; 4b36 9003
            jmp __F__                        ; 4b38 4c1a4c

_C_1:       lda OBJX-55,x                    ; 4b3b bd5a7a
            ldy #$03                         ; 4b3e a003    
            sec                              ; 4b40 38      
            sbc CORPSX,x                     ; 4b41 fd0054  . longitude of all units
            bpl _C_2                         ; 4b44 1005
            ldy #$01                         ; 4b46 a001    
            jsr NEGA                         ; 4b48 20324d  . A -> -A
_C_2:       sty HDIR                         ; 4b4b 8c3d06  . horiz dir
            sta HRNGE                        ; 4b4e 8d4106  . horiz range
            ldy #$00                         ; 4b51 a000    
            lda OBJY-55,x                    ; 4b53 bd6153  
            sec                              ; 4b56 38      
            sbc CORPSY,x                     ; 4b57 fd9f54  . latitude of all units
            bpl _C_3                         ; 4b5a 1005
            ldy #$02                         ; 4b5c a002    
            jsr NEGA                         ; 4b5e 20324d  . A -> -A
_C_3:       sty VDIR                         ; 4b61 8c3e06  . vert dir
            sta VRNGE                        ; 4b64 8d4206  . vert range
            cmp HRNGE                        ; 4b67 cd4106  . horiz range
            bcc _C_4                         ; 4b6a 9015
            sta LRNGE                        ; 4b6c 8d4306  . larger range
            lda HRNGE                        ; 4b6f ad4106  . horiz range
            sta SRNGE                        ; 4b72 8d4406  . smaller range
            lda HDIR                         ; 4b75 ad3d06  . horiz dir
            sta SDIR                         ; 4b78 8d4006  . smaller dir
            sty LDIR                         ; 4b7b 8c3f06  . larger dir
            jmp __D__                        ; 4b7e 4c934b

_C_4:       sta SRNGE                        ; 4b81 8d4406  . smaller range
            sty SDIR                         ; 4b84 8c4006  . smaller dir
            lda HRNGE                        ; 4b87 ad4106  . horiz range
            sta LRNGE                        ; 4b8a 8d4306  . larger range
            ldy HDIR                         ; 4b8d ac3d06  . horiz dir
            sty LDIR                         ; 4b90 8c3f06  . larger dir
__D__:      lda #$00                         ; 4b93 a900
            sta RCNT                         ; 4b95 8d4706  . counter for Russian orders
            sta RORD1                        ; 4b98 8d3b06  . Russian orders
            sta RORD2                        ; 4b9b 8d3c06  
            lda LRNGE                        ; 4b9e ad4306  . larger range
            clc                              ; 4ba1 18      
            adc SRNGE                        ; 4ba2 6d4406  . smaller range
            sta RANGE                        ; 4ba5 8d4606  
            beq _E_2                         ; 4ba8 f05c
            lda LRNGE                        ; 4baa ad4306  . larger range
            lsr                              ; 4bad 4a      
            sta CHRIS                        ; 4bae 8d4506  . midway counter
_D_1:       lda CHRIS                        ; 4bb1 ad4506  . midway counter
            clc                              ; 4bb4 18      
            adc SRNGE                        ; 4bb5 6d4406  . smaller range
            sta CHRIS                        ; 4bb8 8d4506  . midway counter
            sec                              ; 4bbb 38      
            sbc RANGE                        ; 4bbc ed4606  
            bcs _D_2                         ; 4bbf b005
            lda LDIR                         ; 4bc1 ad3f06  . larger dir
            bcc _D_3                         ; 4bc4 9006
_D_2:       sta CHRIS                        ; 4bc6 8d4506  . midway counter
            lda SDIR                         ; 4bc9 ad4006  . smaller dir
_D_3:       sta DIR                          ; 4bcc 8d3306
            lda RCNT                         ; 4bcf ad4706  . counter for Russian orders
            and #$03                         ; 4bd2 2903    
            tay                              ; 4bd4 a8      
            sta TEMPR                        ; 4bd5 85c5    
            lda RCNT                         ; 4bd7 ad4706  . counter for Russian orders
            lsr                              ; 4bda 4a      
            lsr                              ; 4bdb 4a      
            tax                              ; 4bdc aa      
            lda DIR                          ; 4bdd ad3306  
__E__:      dey                              ; 4be0 88
            bmi _E_1                         ; 4be1 3005
            asl                              ; 4be3 0a      
            asl                              ; 4be4 0a      
            jmp __E__                        ; 4be5 4ce04b

_E_1:       ldy TEMPR                        ; 4be8 a4c5
            eor RORD1,x                      ; 4bea 5d3b06  . Russian orders
            and MASKO,y                      ; 4bed 39de5f  . mask values for decoding orders
            eor RORD1,x                      ; 4bf0 5d3b06  . Russian orders
            sta RORD1,x                      ; 4bf3 9d3b06  . Russian orders
            ldx RCNT                         ; 4bf6 ae4706  . counter for Russian orders
            inx                              ; 4bf9 e8      
            stx RCNT                         ; 4bfa 8e4706  . counter for Russian orders
            cpx #$08                         ; 4bfd e008    
            bcs _E_2                         ; 4bff b005
            cpx RANGE                        ; 4c01 ec4606  
            bcc _D_1                         ; 4c04 90ab
_E_2:       ldx ARMY                         ; 4c06 a6c2
            lda RORD1                        ; 4c08 ad3b06  . Russian orders
            sta WHORDS,x                     ; 4c0b 9d145e  . what unit orders are (2 bits per order)
            lda RORD2                        ; 4c0e ad3c06  
            sta WHORDH,x                     ; 4c11 9db35e  . unit orders (high bits?)
            lda RCNT                         ; 4c14 ad4706  . counter for Russian orders
            sta HMORDS,x                     ; 4c17 9d755d  . how many orders queued for each unit
__F__:      dex                              ; 4c1a ca
            cpx #$37                         ; 4c1b e037    
            bcc _F_1                         ; 4c1d 9003
            jmp __C__                        ; 4c1f 4c2f4b

_F_1:       rts                              ; 4c22 60

CALIFR:     ldy #$00                         ; 4c23 a000    determines individual force ratios IFRx in all four directions
            sty IFR0                         ; 4c25 8c7c06  initialize vectors
            sty IFR1                         ; 4c28 8c7d06  
            sty IFR2                         ; 4c2b 8c7e06  
            sty IFR3                         ; 4c2e 8c7f06  
            sty IFRHI                        ; 4c31 8c8c06  
            iny                              ; 4c34 c8      
            sty RFR                          ; 4c35 84cc    . Russian force ratio: local Russian strength
            lda CORPSX,x                     ; 4c37 bd0054  . longitude of all units
            sta XLOC                         ; 4c3a 8d8006  
            lda CORPSY,x                     ; 4c3d bd9f54  . latitude of all units
            sta YLOC                         ; 4c40 8d8106  
            ldy #$9e                         ; 4c43 a09e    
__G__:      lda ARRIVE,y                     ; 4c45 b91b57  . arrival turns
            cmp TURN                         ; 4c48 c5c9    
            bcs _G_1                         ; 4c4a b021
            lda CORPSY,y                     ; 4c4c b99f54  . latitude of all units
            sec                              ; 4c4f 38      
            sbc YLOC                         ; 4c50 ed8106  
            sta TEMPY                        ; 4c53 8d8306  save signed vector
            jsr ABSA                         ; 4c56 20304d  . A -> abs(A)
            sta TEMPR                        ; 4c59 85c5    
            lda CORPSX,y                     ; 4c5b b90054  . longitude of all units
            sec                              ; 4c5e 38      
            sbc XLOC                         ; 4c5f ed8006  
            sta TEMPX                        ; 4c62 8d8206  
            jsr ABSA                         ; 4c65 20304d  . A -> abs(A)
            clc                              ; 4c68 18      
            adc TEMPR                        ; 4c69 65c5    
            cmp #$09                         ; 4c6b c909    no point in checking if he's too far
_G_1:       bcs __H__                        ; 4c6d b067
            lsr                              ; 4c6f 4a      
            sta TEMPR                        ; 4c70 85c5    this is half of range to unit -- unused?
            lda TEMPX                        ; 4c72 ad8206  
            bpl _G_2                         ; 4c75 1010
            lda TEMPY                        ; 4c77 ad8306  select which IFR gets this German
            bpl _G_4                         ; 4c7a 1029
            ldx #$02                         ; 4c7c a202    south-east quadrant
            cmp TEMPX                        ; 4c7e cd8206  bug: both negative, need flip sense of comp
            bcs _G_5                         ; 4c81 b031
            ldx #$01                         ; 4c83 a201    
            bcc _G_5                         ; 4c85 902d
_G_2:       lda TEMPY                        ; 4c87 ad8306
            bpl _G_3                         ; 4c8a 100e
            jsr NEGA                         ; 4c8c 20324d  . A -> -A
            ldx #$02                         ; 4c8f a202    south-west quadrant
            cmp TEMPX                        ; 4c91 cd8206  
            bcs _G_5                         ; 4c94 b01e
            ldx #$03                         ; 4c96 a203    
            bcc _G_5                         ; 4c98 901a
_G_3:       ldx #$00                         ; 4c9a a200    north-west quadrant
            cmp TEMPX                        ; 4c9c cd8206  
            bcs _G_5                         ; 4c9f b013
            ldx #$03                         ; 4ca1 a203    
            bcc _G_5                         ; 4ca3 900f
_G_4:       lda TEMPX                        ; 4ca5 ad8206  north-east quadrant
            jsr NEGA                         ; 4ca8 20324d  . A -> -A
            ldx #$01                         ; 4cab a201    
            cmp TEMPY                        ; 4cad cd8306  
            bcs _G_5                         ; 4cb0 b002
            ldx #$00                         ; 4cb2 a200    
_G_5:       lda CSTRNG,y                     ; 4cb4 b9dd55  . combat strengths
            lsr                              ; 4cb7 4a      
            lsr                              ; 4cb8 4a      
            lsr                              ; 4cb9 4a      
            lsr                              ; 4cba 4a      
            cpy #$37                         ; 4cbb c037    
            bcc _G_7                         ; 4cbd 900c
            clc                              ; 4cbf 18      
            adc RFR                          ; 4cc0 65cc    . Russian force ratio: local Russian strength
            bcc _G_6                         ; 4cc2 9002
            lda #$ff                         ; 4cc4 a9ff    
_G_6:       sta RFR                          ; 4cc6 85cc    . Russian force ratio: local Russian strength
            jmp __H__                        ; 4cc8 4cd64c

_G_7:       clc                              ; 4ccb 18
            adc IFR0,x                       ; 4ccc 7d7c06  
            bcc _G_8                         ; 4ccf 9002
            lda #$ff                         ; 4cd1 a9ff    
_G_8:       sta IFR0,x                       ; 4cd3 9d7c06
__H__:      dey                              ; 4cd6 88
            beq _H_1                         ; 4cd7 f003
            jmp __G__                        ; 4cd9 4c454c

_H_1:       ldx #$03                         ; 4cdc a203
            lda #$00                         ; 4cde a900    
_H_2:       clc                              ; 4ce0 18
            adc IFR0,x                       ; 4ce1 7d7c06  
            bcc _H_3                         ; 4ce4 9002
            lda #$ff                         ; 4ce6 a9ff    
_H_3:       dex                              ; 4ce8 ca
            bpl _H_2                         ; 4ce9 10f5
            asl                              ; 4ceb 0a      
            rol IFRHI                        ; 4cec 2e8c06  
            asl                              ; 4cef 0a      
            rol IFRHI                        ; 4cf0 2e8c06  
            asl                              ; 4cf3 0a      
            rol IFRHI                        ; 4cf4 2e8c06  
            asl                              ; 4cf7 0a      
            rol IFRHI                        ; 4cf8 2e8c06  
            ldx #$00                         ; 4cfb a200    
            sec                              ; 4cfd 38      
__I__:      sbc RFR                          ; 4cfe e5cc    . Russian force ratio: local Russian strength
            bcs _IRRN-55_1                   ; 4d00 b006    
IRRN-55 = $4d01  ; self-modifying code?
            dec IFRHI                        ; 4d02 ce8c06  
            sec                              ; 4d05 38      
            bmi _IRRN-55_2                   ; 4d06 3004    
_IRRN-55_1: inx                              ; 4d08 e8      
            jmp __I__                        ; 4d09 4cfe4c

_IRRN-55_2: txa                              ; 4d0c 8a      
            ldx ARMY                         ; 4d0d a6c2    
            clc                              ; 4d0f 18      
            adc OFR                          ; 4d10 6d9206  remember strategic situation
            ror                              ; 4d13 6a      average strategic with tactical
            sta IFR-55,x                     ; 4d14 9d6106  
            lda IFR0                         ; 4d17 ad7c06  keep a record of danger vector
            sta IRRN-55,x                    ; 4d1a 9d014d  
            lda IFR1                         ; 4d1d ad7d06  
            sta IFRE-55,x                    ; 4d20 9d694d  
            lda IFR2                         ; 4d23 ad7e06  
            sta IFRS-55,x                    ; 4d26 9dd14d  
            lda IFR3                         ; 4d29 ad7f06  
            sta IFRW-55,x                    ; 4d2c 9d394e  
            rts                              ; 4d2f 60      

ABSA:       bpl _NEGA_1                      ; 4d30 1005    A -> abs(A)
NEGA:       eor #$ff                         ; 4d32 49ff    A -> -A
            clc                              ; 4d34 18      
            adc #$01                         ; 4d35 6901    
_NEGA_1:    rts                              ; 4d37 60      

IFRN:  ; indexed by unit no, but only for Russian, last 55 of 159
    !byte $01,$60,$4e,$60,$10,$05,$49,$ff,$18,$69,$01,$60,$06,$9d,$6e,$4d   ; 4d38 .`N`..I..i.`..nM
    !byte $ad,$7e,$06,$9d,$b9,$00,$ad,$7f,$06,$9d,$11,$01,$60,$10,$05,$49   ; 4d48 -~..9.-.....`..I
    !byte $ff,$18,$69,$01,$60,$7e,$06,$9d,$da,$4d,$ad,$7f,$06,$9d,$32,$4e   ; 4d58 ..i.`~..ZM-...2N
    !byte $60                                                               ; 4d68 `
IFRE-55:
    !byte $10,$05,$49,$ff,$18,$69,$01,$60,$69,$01,$60,$9d,$b3,$5e,$ad,$4d   ; 4d69 ..I..i.`i.`.3^-M
    !byte $06,$9d,$75,$5d,$ca,$e0,$47,$90,$03,$4c,$8d,$4c,$60,$a9,$00,$8d   ; 4d79 ..u]J`G..L.L`)..
    !byte $82,$06,$8d,$83,$06,$8d,$84,$06,$8d,$85,$06,$8d,$92,$06,$8d,$93   ; 4d89 ................
    !byte $06,$bd,$00,$54,$8d,$86,$06                                       ; 4d99 .=.T...
IFRE:
    !byte $bd,$9f,$54,$8d,$87,$06,$a0,$9e,$b9,$1b,$57,$cd,$23,$06,$90,$03   ; 4da0 =.T... .9.WM#...
    !byte $4c,$4b,$4e,$b9,$9f,$54,$38,$ed,$87,$06,$8d,$89,$06,$10,$05,$49   ; 4db0 LKN9.T8m.......I
    !byte $ff,$18,$69,$01,$85,$c5,$b9,$00,$54,$38,$ed,$86,$06,$8d,$88,$06   ; 4dc0 ..i..E9.T8m.....
    !byte $10                                                               ; 4dd0 .
IFRS-55:
    !byte $05,$49,$ff,$18,$69,$01,$18,$65,$c5,$c9,$09,$b0,$6d,$4a,$85,$c5   ; 4dd1 .I..i..eEI.0mJ.E
    !byte $ad,$88,$06,$10,$10,$ad,$89,$06,$10,$2b,$a2,$02,$cd,$88,$06,$b0   ; 4de1 -....-...+".M..0
    !byte $35,$a2,$01,$90,$31,$ad,$89,$06,$10,$10,$49,$ff,$18,$69,$01,$a2   ; 4df1 5"..1-....I..i."
    !byte $02,$cd,$88,$06,$b0,$20,$a2                                       ; 4e01 .M..0 "
IFRS:
    !byte $03,$90,$1c,$a2,$00,$cd,$88,$06,$b0,$15,$a2,$03,$90,$11,$ad,$88   ; 4e08 ...".M..0."...-.
    !byte $06,$49,$ff,$18,$69,$01,$a2,$01,$cd,$89,$06,$b0,$02,$a2,$00,$b9   ; 4e18 .I..i.".M..0.".9
    !byte $dd,$55,$4a,$4a,$4a,$4a,$c0,$47,$90,$0e,$18,$6d,$92,$06,$90,$02   ; 4e28 ]UJJJJ@G...m....
    !byte $a9                                                               ; 4e38 )
IFRW-55:
    !byte $ff,$8d,$92,$06,$4c,$4b,$4e,$18,$7d,$82,$06,$90,$02,$a9,$ff,$9d   ; 4e39 ....LKN.}....)..
    !byte $82,$06,$88,$f0,$03,$4c,$a8,$4d,$a2,$03,$a9,$00,$18,$7d,$82,$06   ; 4e49 ...p.L(M".)..}..
    !byte $90,$02,$a9,$ff,$ca,$10,$f5,$0a,$2e,$93,$06,$0a,$2e,$93,$06,$0a   ; 4e59 ..).J.u.........
    !byte $2e,$93,$06,$0a,$2e,$93,$06                                       ; 4e69 .......
IFRW:
    !byte $a2,$00,$38,$ed,$92,$06,$b0,$06,$ce,$93,$06,$38,$30,$04,$e8,$4c   ; 4e70 ".8m..0.N..80.hL
    !byte $73,$4e,$8a,$a6,$c2,$18,$6d,$99,$06,$6a,$9d,$e0,$3d,$ad,$82,$06   ; 4e80 sN.&B.m..j.`=-..
    !byte $9d,$5f,$4e,$ad,$83,$06,$9d,$b7,$4e,$ad,$84,$06,$9d,$0f,$4f,$ad   ; 4e90 ._N-...7N-....O-
    !byte $85,$06,$9d,$67,$4f,$60,$a6,$c2,$18,$6d,$99,$06,$6a,$9d,$e0,$3d   ; 4ea0 ...gO`&B.m..j.`=
    !byte $ad,$82,$06,$9d,$82,$4e,$ad,$83,$06,$9d,$da,$4e,$ad,$84,$06,$9d   ; 4eb0 -....N-...ZN-...
    !byte $32,$4f,$ad,$85,$06,$9d,$8a,$4f,$60,$00,$00,$00,$00,$00,$00,$00   ; 4ec0 2O-....O`.......
    !byte $00,$00,$00,$00,$00,$00,$00,$00                                   ; 4ed0 ........

COMBAT:     lda #$00                         ; 4ed8 a900    
            sta VICTRY                       ; 4eda 8d9706  clear victory flag
            ldx ARMY                         ; 4edd a6c2    
            cpx #$2a                         ; 4edf e02a    Finns can't attack
            beq _COMBAT_1                    ; 4ee1 f004    
            cpx #$2b                         ; 4ee3 e02b    
            bne _COMBAT_2                    ; 4ee5 d001    
_COMBAT_1:  rts                              ; 4ee7 60      

_COMBAT_2:  ldy UNITNO                       ; 4ee8 a4c3    
            sty DEFNDR                       ; 4eea 84c4    
            ldx DEFNDR                       ; 4eec a6c4    make combat graphics
            lda SWAP,x                       ; 4eee bd7c56  . terrain code underneath unit
            pha                              ; 4ef1 48      
            lda #$ff                         ; 4ef2 a9ff    Choose solid red or white square
            cpx #$37                         ; 4ef4 e037    Russian unit?
            bcs _COMBAT_3                    ; 4ef6 b002    
            lda #$7f                         ; 4ef8 a97f    make it white for Germans
_COMBAT_3:  sta SWAP,x                       ; 4efa 9d7c56  . terrain code underneath unit
            stx CORPS                        ; 4efd 86b4    . Number of unit under window
            lda CORPSX,x                     ; 4eff bd0054  . longitude of all units
            sta CHUNKX                       ; 4f02 85be    . Cursor coords (pixel frame)
            lda CORPSY,x                     ; 4f04 bd9f54  . latitude of all units
            sta CHUNKY                       ; 4f07 85bf    
            jsr SWITCH                       ; 4f09 20ef79  . Swap map CHUNKX/Y with SWAP,x; x = CORPS, y = map offset
            ldy #$08                         ; 4f0c a008    
            ldx #$8f                         ; 4f0e a28f    
_COMBAT_4:  stx AUDC1 / POT1                 ; 4f10 8e01d2  . W: Audio ch1 ctrl / R: paddle 1
            sty AUDF1 / POT0                 ; 4f13 8c00d2  . W: Audio ch1 freq / R: paddle 0
            jsr STALL                        ; 4f16 200072  
            tya                              ; 4f19 98      
            clc                              ; 4f1a 18      
            adc #$08                         ; 4f1b 6908    
            tay                              ; 4f1d a8      
            dex                              ; 4f1e ca      
            cpx #$7f                         ; 4f1f e07f    
            bne _COMBAT_4                    ; 4f21 d0ed    
            jsr SWITCH                       ; 4f23 20ef79  replace original unit character
            ldx DEFNDR                       ; 4f26 a6c4    
            pla                              ; 4f28 68      
            sta SWAP,x                       ; 4f29 9d7c56  . terrain code underneath unit
            jsr TERRTY                       ; 4f2c 206973  . convert map chr in TRNCOD -> TRNTYP, also y reg
            ldx DEFNC,x                      ; 4f2f beb479  ?? Shouldn't this be DEFENC,y and CSTRNG,x
            lda CSTRNG,y                     ; 4f32 b9dd55  . combat strengths
            lsr                              ; 4f35 4a      adjust for terrain, max 255
_COMBAT_5:  dex                              ; 4f36 ca      
            beq _COMBAT_6                    ; 4f37 f005    
            rol                              ; 4f39 2a      
            bcc _COMBAT_5                    ; 4f3a 90fa    
            lda #$ff                         ; 4f3c a9ff    
_COMBAT_6:  ldx HMORDS,x                     ; 4f3e be755d  now adjust for defender's motion [cf. 1740 Y16 LDX HMORDS,Y]
            beq DOBATL                       ; 4f41 f001    
            lsr                              ; 4f43 4a      penalty if moving
DOBATL:     cmp SKREST / RANDOM              ; 4f44 cd0ad2  evaluate defender's strike
            bcc ATAKR                        ; 4f47 9017    
            ldx ARMY                         ; 4f49 a6c2    
            dec MSTRNG,x                     ; 4f4b de3e55  . muster strengths
            lda CSTRNG,x                     ; 4f4e bddd55  . combat strengths
            sbc #$05                         ; 4f51 e905    
            sta CSTRNG,x                     ; 4f53 9ddd55  . combat strengths
            beq _DOBATL_1                    ; 4f56 f002    
            bcs _DOBATL_2                    ; 4f58 b003    
_DOBATL_1:  jmp DEAD                         ; 4f5a 4cab51  . Remove unit X

_DOBATL_2:  jsr BRKCHK                       ; 4f5d 20ce51  . Maybe break unit X, reset orders, SEC on break
ATAKR:      ldx ARMY                         ; 4f60 a6c2    evaluate attacker's strike
            lda CORPSX,x                     ; 4f62 bd0054  . longitude of all units
            sta LON                          ; 4f65 85cb    
            lda CORPSY,x                     ; 4f67 bd9f54  . latitude of all units
            sta LAT                          ; 4f6a 85ca    
            jsr TERR                         ; 4f6c 204072  . TRNCOD <- terrain chr @ LAT/LON, maybe under unit
            jsr TERRTY                       ; 4f6f 206973  . convert map chr in TRNCOD -> TRNTYP, also y reg
            lda OFFNC,y                      ; 4f72 b9f67b  . Offence combat modifiers, 1 -> half, 2 -> no effect
            tay                              ; 4f75 a8      
            ldx ARMY                         ; 4f76 a6c2    
            lda CSTRNG,x                     ; 4f78 bddd55  . combat strengths
            dey                              ; 4f7b 88      
            beq _ATAKR_1                     ; 4f7c f001    
            lsr                              ; 4f7e 4a      river attack penalty
_ATAKR_1:   cmp SKREST / RANDOM              ; 4f7f cd0ad2  . W: Reset serial port status register / R: Random byte
            bcc _ATAKR_3                     ; 4f82 9014    
            ldx DEFNDR                       ; 4f84 a6c4    attacker strikes defender
            dec MSTRNG,x                     ; 4f86 de3e55  . muster strengths
            lda CSTRNG,x                     ; 4f89 bddd55  . combat strengths
            sbc #$05                         ; 4f8c e905    
            sta CSTRNG,x                     ; 4f8e 9ddd55  . combat strengths
            beq _ATAKR_2                     ; 4f91 f002    
            bcs _ATAKR_4                     ; 4f93 b006    
_ATAKR_2:   jsr DEAD                         ; 4f95 20ab51  . Remove unit X
_ATAKR_3:   jmp ENDCOM                       ; 4f98 4c1c50  

_ATAKR_4:   jsr BRKCHK                       ; 4f9b 20ce51  . Maybe break unit X, reset orders, SEC on break
            bcc _ATAKR_3                     ; 4f9e 90f8    
            ldy ARMY                         ; 4fa0 a4c2    
            lda WHORDS,y                     ; 4fa2 b9145e  . what unit orders are (2 bits per order)
            and #$03                         ; 4fa5 2903    
            tay                              ; 4fa7 a8      first retreat priority : away from attacker
            jsr RETRET                       ; 4fa8 202250  . check if unit X retreat dir Y is legal. SEC if lives else CLC;  zero set if retreat open, clear if blocked
            bcc VICCOM                       ; 4fab 9054    
            beq DEFRTRT                      ; 4fad f030    
            ldy #$01                         ; 4faf a001    second priority: east/west
            cpx #$37                         ; 4fb1 e037    
            bcs _ATAKR_5                     ; 4fb3 b002    
            ldy #$03                         ; 4fb5 a003    
_ATAKR_5:   jsr RETRET                       ; 4fb7 202250  . check if unit X retreat dir Y is legal. SEC if lives else CLC;  zero set if retreat open, clear if blocked
            bcc VICCOM                       ; 4fba 9045    
            beq DEFRTRT                      ; 4fbc f021    
            ldy #$02                         ; 4fbe a002    third priority: north
            jsr RETRET                       ; 4fc0 202250  . check if unit X retreat dir Y is legal. SEC if lives else CLC;  zero set if retreat open, clear if blocked
            bcc VICCOM                       ; 4fc3 903c    
            beq DEFRTRT                      ; 4fc5 f018    
            ldy #$00                         ; 4fc7 a000    fourth priority: south
            jsr RETRET                       ; 4fc9 202250  . check if unit X retreat dir Y is legal. SEC if lives else CLC;  zero set if retreat open, clear if blocked
            bcc VICCOM                       ; 4fcc 9033    
            beq DEFRTRT                      ; 4fce f00f    
            ldy #$03                         ; 4fd0 a003    last priority: west/east
            cpx #$37                         ; 4fd2 e037    
            bcs _ATAKR_6                     ; 4fd4 b002    
            ldy #$01                         ; 4fd6 a001    
_ATAKR_6:   jsr RETRET                       ; 4fd8 202250  . check if unit X retreat dir Y is legal. SEC if lives else CLC;  zero set if retreat open, clear if blocked
            bcc VICCOM                       ; 4fdb 9024    
            bne ENDCOM                       ; 4fdd d03d    
DEFRTRT:    stx CORPS                        ; 4fdf 86b4    retreat defender to validated square !! referenced as both code and data
            lda CORPSX,x                     ; 4fe1 bd0054  . longitude of all units
            sta CHUNKX                       ; 4fe4 85be    . Cursor coords (pixel frame)
            lda CORPSY,x                     ; 4fe6 bd9f54  . latitude of all units
            sta CHUNKY                       ; 4fe9 85bf    
            jsr SWITCH                       ; 4feb 20ef79  . Swap map CHUNKX/Y with SWAP,x; x = CORPS, y = map offset
            ldx CORPS                        ; 4fee a6b4    . Number of unit under window
            lda LAT                          ; 4ff0 a5ca    
            sta CORPSY,x                     ; 4ff2 9d9f54  . latitude of all units
            sta CHUNKY                       ; 4ff5 85bf    
            lda LON                          ; 4ff7 a5cb    
            sta CORPSX,x                     ; 4ff9 9d0054  . longitude of all units
            sta CHUNKX                       ; 4ffc 85be    . Cursor coords (pixel frame)
            jsr SWITCH                       ; 4ffe 20ef79  . Swap map CHUNKX/Y with SWAP,x; x = CORPS, y = map offset
VICCOM:     ldx ARMY                         ; 5001 a6c2    
            stx CORPS                        ; 5003 86b4    . Number of unit under window
            lda CORPSX,x                     ; 5005 bd0054  . longitude of all units
            sta CHUNKX                       ; 5008 85be    . Cursor coords (pixel frame)
            lda CORPSY,x                     ; 500a bd9f54  . latitude of all units
            sta CHUNKY                       ; 500d 85bf    
            lda ACCLO                        ; 500f a5c7    defender's coordinates
            sta LON                          ; 5011 85cb    
            lda ACCHI                        ; 5013 a5c8    
            sta LAT                          ; 5015 85ca    
            lda #$ff                         ; 5017 a9ff    
            sta VICTRY                       ; 5019 8d9706  
ENDCOM:     ldx ARMY                         ; 501c a6c2    
            inc EXEC,x                       ; 501e fe616d  . unit execution times
            rts                              ; 5021 60      

RETRET:     lda CORPSX,x                     ; 5022 bd0054  check if unit X retreat dir Y is legal. SEC if lives else CLC;  zero set if retreat open, clear if blocked
            clc                              ; 5025 18      
            adc XINC,y                       ; 5026 79f27b  
            sta LON                          ; 5029 85cb    
            lda CORPSY,x                     ; 502b bd9f54  . latitude of all units
            clc                              ; 502e 18      
            adc YINC,y                       ; 502f 79f17b  . note YINC/XINC overlap
            sta LAT                          ; 5032 85ca    
            jsr TERR                         ; 5034 204072  . TRNCOD <- terrain chr @ LAT/LON, maybe under unit
            jsr TERRTY                       ; 5037 206973  . convert map chr in TRNCOD -> TRNTYP, also y reg
            ldx DEFNDR                       ; 503a a6c4    
            lda UNITNO                       ; 503c a5c3    anybody in this square?
            bne _RETRET_4                    ; 503e d03d    
            lda TRNTYP                       ; 5040 a5cd    no
            cmp #$07                         ; 5042 c907    coastline, estuary -> check illegal hex
            bcc _RETRET_3                    ; 5044 9027    
            cmp #$09                         ; 5046 c909    Impassable, takes damage
            beq _RETRET_4                    ; 5048 f033    
            ldy #$15                         ; 504a a015    
_RETRET_1:  lda LAT                          ; 504c a5ca    
            cmp BHY1,y                       ; 504e d91f6d  
            bne _RETRET_2                    ; 5051 d017    
            lda LON                          ; 5053 a5cb    
            cmp BHX1,y                       ; 5055 d9096d  . intraversible square-pair coords
            bne _RETRET_2                    ; 5058 d010    
            lda CORPSX,x                     ; 505a bd0054  . longitude of all units
            cmp BHX2,y                       ; 505d d9356d  
            bne _RETRET_2                    ; 5060 d008    
            lda CORPSY,x                     ; 5062 bd9f54  . latitude of all units
            cmp BHY2,y                       ; 5065 d94b6d  
            beq _RETRET_4                    ; 5068 f013    
_RETRET_2:  dey                              ; 506a 88      
            bpl _RETRET_1                    ; 506b 10df    
_RETRET_3:  jsr CHKZOC                       ; 506d 204051  any blocking ZOC's?
            ldx DEFNDR                       ; 5070 a6c4    
            lda ZOC                          ; 5072 ad9406  
            cmp #$02                         ; 5075 c902    no retreat into ZOC
            bcs _RETRET_4                    ; 5077 b004    retreat is possible
            lda #$00                         ; 5079 a900    
            sec                              ; 507b 38      
            rts                              ; 507c 60      

_RETRET_4:  lda CSTRNG,x                     ; 507d bddd55  retreat not possible,extract penalty
            sec                              ; 5080 38      
            sbc #$05                         ; 5081 e905    
            sta CSTRNG,x                     ; 5083 9ddd55  . combat strengths
            beq _RETRET_5                    ; 5086 f002    
            bcs _RETRET_6                    ; 5088 b004    
_RETRET_5:  jsr DEAD                         ; 508a 20ab51  . Remove unit X
            clc                              ; 508d 18      
_RETRET_6:  lda #$ff                         ; 508e a9ff    
            rts                              ; 5090 60      

SUPPLY:     lda ARRIVE,x                     ; 5091 bd1b57  supply evaluation routine
            cmp TURN                         ; 5094 c5c9    
            beq _SUPPLY_1                    ; 5096 f003    
            bcc _SUPPLY_1                    ; 5098 9001    
            rts                              ; 509a 60      

_SUPPLY_1:  lda #$18                         ; 509b a918    max 24 failures in trace?
            cpx #$37                         ; 509d e037    Russian skips seasonal effect
            bcs _SUPPLY_2                    ; 509f b01b    
            lda #$18                         ; 50a1 a918    
            ldy EARTH                        ; 50a3 ac0606  
            cpy #$02                         ; 50a6 c002    mud?
            beq _J_3                         ; 50a8 f06b
            cpy #$0a                         ; 50aa c00a    snow?
            bne _SUPPLY_2                    ; 50ac d00e    
            lda CORPSX,x                     ; 50ae bd0054  this discourages gung-ho corps
            asl                              ; 50b1 0a      
            asl                              ; 50b2 0a      
            adc #$4a                         ; 50b3 694a    4 * LON + 74 (max 45*4+74=254)
            cmp SKREST / RANDOM              ; 50b5 cd0ad2  . W: Reset serial port status register / R: Random byte
            bcc _J_3                         ; 50b8 905b
            lda #$10                         ; 50ba a910    harder to get supplies in winter (max 16 failures?)
_SUPPLY_2:  sta ACCLO                        ; 50bc 85c7    
            ldy #$01                         ; 50be a001    Russians go east
            cpx #$37                         ; 50c0 e037    
            bcs _SUPPLY_3                    ; 50c2 b002    
            ldy #$03                         ; 50c4 a003    Germans go west
_SUPPLY_3:  sty HOMEDR                       ; 50c6 8c9306  
            lda CORPSX,x                     ; 50c9 bd0054  . longitude of all units
            sta LON                          ; 50cc 85cb    
            lda CORPSY,x                     ; 50ce bd9f54  . latitude of all units
            sta LAT                          ; 50d1 85ca    
            lda #$00                         ; 50d3 a900    
            sta RFR                          ; 50d5 85cc    . Russian force ratio: local Russian strength
_SUPPLY_4:  lda LON                          ; 50d7 a5cb    
            sta SQX                          ; 50d9 8d3606  . adjacent square
            lda LAT                          ; 50dc a5ca    
            sta SQY                          ; 50de 8d3706  . adj sq; also OCOLUM
__J__:      lda SQX                          ; 50e1 ad3606  . adjacent square
            clc                              ; 50e4 18      
            adc XINC,y                       ; 50e5 79f27b  
            sta LON                          ; 50e8 85cb    
            lda SQY                          ; 50ea ad3706  . adj sq; also OCOLUM
            clc                              ; 50ed 18      
            adc YINC,y                       ; 50ee 79f17b  . note YINC/XINC overlap
            sta LAT                          ; 50f1 85ca    
            jsr CHKZOC                       ; 50f3 204051  try moving step towards home
            cpx #$37                         ; 50f6 e037    germans allowed supply by sea
            bcc _J_1                         ; 50f8 900a
            jsr TERRB                        ; 50fa 204672  . TRNCOD <- chr @ LAT/LON, zero set if it's a unit
            lda TRNCOD                       ; 50fd ad2b06  
            cmp #$bf                         ; 5100 c9bf    
            beq _J_2                         ; 5102 f009    solid (sea)
_J_1:       lda ZOC                          ; 5104 ad9406
            cmp #$02                         ; 5107 c902    
            bcc _J_6                         ; 5109 901c
            inc RFR                          ; 510b e6cc    . Russian force ratio: local Russian strength
_J_2:       inc RFR                          ; 510d e6cc    . Russian force ratio: local Russian strength
            lda RFR                          ; 510f a5cc    . Russian force ratio: local Russian strength
            cmp ACCLO                        ; 5111 c5c7    
            bcc _J_5                         ; 5113 9009
_J_3:       lsr CSTRNG,x                     ; 5115 5edd55  halve combat strength if OOS
            bne _J_4                         ; 5118 d003
            jmp DEAD                         ; 511a 4cab51  . Remove unit X

_J_4:       rts                              ; 511d 60

_J_5:       lda SKREST / RANDOM              ; 511e ad0ad2  . W: Reset serial port status register / R: Random byte
            and #$02                         ; 5121 2902    
            tay                              ; 5123 a8      
            jmp __J__                        ; 5124 4ce150

_J_6:       ldy HOMEDR                       ; 5127 ac9306
            lda LON                          ; 512a a5cb    
            cpy #$01                         ; 512c c001    
            bne _J_7                         ; 512e d00b
            cmp #$ff                         ; 5130 c9ff    russian passed board edge
            bne _SUPPLY_4                    ; 5132 d0a3    
            inc MSTRNG,x                     ; 5134 fe3e55  Russian replacements
            inc MSTRNG,x                     ; 5137 fe3e55  . muster strengths
            rts                              ; 513a 60      

_J_7:       cmp #$2e                         ; 513b c92e    german hit board edge at lat=46
            bne _SUPPLY_4                    ; 513d d098    
            rts                              ; 513f 60      

CHKZOC:     lda #$00                         ; 5140 a900    check for zone of control for unit in X
            sta ZOC                          ; 5142 8d9406  
            lda #$40                         ; 5145 a940    
            cpx #$37                         ; 5147 e037    german or russian?
            bcs _CHKZOC_1                    ; 5149 b002    
            lda #$c0                         ; 514b a9c0    
_CHKZOC_1:  sta TEMPR                        ; 514d 85c5    
            jsr TERRB                        ; 514f 204672  . TRNCOD <- chr @ LAT/LON, zero set if it's a unit
            bne _CHKZOC_4                    ; 5152 d01e    
            lda TRNCOD                       ; 5154 ad2b06  
            and #$c0                         ; 5157 29c0    
            cmp TEMPR                        ; 5159 c5c5    
            beq _CHKZOC_3                    ; 515b f00f    
            lda CORPSX,x                     ; 515d bd0054  . longitude of all units
            cmp LON                          ; 5160 c5cb    
            bne _CHKZOC_2                    ; 5162 d007    
            lda CORPSY,x                     ; 5164 bd9f54  . latitude of all units
            cmp LAT                          ; 5167 c5ca    
            beq _CHKZOC_4                    ; 5169 f007    
_CHKZOC_2:  rts                              ; 516b 60      

_CHKZOC_3:  lda #$02                         ; 516c a902    
            sta ZOC                          ; 516e 8d9406  
            rts                              ; 5171 60      

_CHKZOC_4:  ldx #$07                         ; 5172 a207    
_CHKZOC_5:  ldy JSTP+16,x                    ; 5174 bcac79  . Dirs to spiral from loc around 3x3 (reverse order)
            lda LON                          ; 5177 a5cb    
            clc                              ; 5179 18      
            adc XINC,y                       ; 517a 79f27b  
            sta LON                          ; 517d 85cb    
            lda LAT                          ; 517f a5ca    
            clc                              ; 5181 18      
            adc YINC,y                       ; 5182 79f17b  . note YINC/XINC overlap
            sta LAT                          ; 5185 85ca    
            jsr TERRB                        ; 5187 204672  . TRNCOD <- chr @ LAT/LON, zero set if it's a unit
            bne _CHKZOC_6                    ; 518a d015    
            lda TRNCOD                       ; 518c ad2b06  
            and #$c0                         ; 518f 29c0    
            cmp TEMPR                        ; 5191 c5c5    
            bne _CHKZOC_6                    ; 5193 d00c    
            txa                              ; 5195 8a      
            and #$01                         ; 5196 2901    
            clc                              ; 5198 18      
            adc #$01                         ; 5199 6901    
            adc ZOC                          ; 519b 6d9406  
            sta ZOC                          ; 519e 8d9406  
_CHKZOC_6:  dex                              ; 51a1 ca      
            bpl _CHKZOC_5                    ; 51a2 10d0    
            dec LAT                          ; 51a4 c6ca    
            dec LON                          ; 51a6 c6cb    
            ldx ARMY                         ; 51a8 a6c2    
            rts                              ; 51aa 60      

DEAD:       lda #$00                         ; 51ab a900    Remove unit X
            sta MSTRNG,x                     ; 51ad 9d3e55  . muster strengths
            sta CSTRNG,x                     ; 51b0 9ddd55  . combat strengths
            sta HMORDS,x                     ; 51b3 9d755d  . how many orders queued for each unit
            lda #$ff                         ; 51b6 a9ff    
            sta EXEC,x                       ; 51b8 9d616d  . unit execution times
            sta ARRIVE,x                     ; 51bb 9d1b57  . arrival turns
            stx CORPS                        ; 51be 86b4    . Number of unit under window
            lda CORPSX,x                     ; 51c0 bd0054  . longitude of all units
            sta CHUNKX                       ; 51c3 85be    . Cursor coords (pixel frame)
            lda CORPSY,x                     ; 51c5 bd9f54  . latitude of all units
            sta CHUNKY                       ; 51c8 85bf    
            jsr SWITCH                       ; 51ca 20ef79  . Swap map CHUNKX/Y with SWAP,x; x = CORPS, y = map offset
            rts                              ; 51cd 60      

BRKCHK:     cpx #$37                         ; 51ce e037    Maybe break unit X, reset orders, SEC on break
            bcs _BRKCHK_1                    ; 51d0 b00e    
            lda CORPT,x                      ; 51d2 bdca58  . codes for unit types
            and #$f0                         ; 51d5 29f0    
            bne _BRKCHK_1                    ; 51d7 d007    
            lda MSTRNG,x                     ; 51d9 bd3e55  . muster strengths
            lsr                              ; 51dc 4a      
            jmp __K__                        ; 51dd 4cee51

_BRKCHK_1:  lda MSTRNG,x                     ; 51e0 bd3e55  . muster strengths
            lsr                              ; 51e3 4a      
            lsr                              ; 51e4 4a      
            lsr                              ; 51e5 4a      
            sta TEMPR                        ; 51e6 85c5    
            lda MSTRNG,x                     ; 51e8 bd3e55  . muster strengths
            sec                              ; 51eb 38      
            sbc TEMPR                        ; 51ec e5c5    
__K__:      cmp CSTRNG,x                     ; 51ee dddd55  . combat strengths
            bcc _K_1                         ; 51f1 900a
            lda #$ff                         ; 51f3 a9ff    
            sta EXEC,x                       ; 51f5 9d616d  . unit execution times
            lda #$00                         ; 51f8 a900    
            sta HMORDS,x                     ; 51fa 9d755d  reset orders if break
_K_1:       rts                              ; 51fd 60

    !byte $0a                                                               ; 51fe .
PLYR0-1:
    !byte $a9                                                               ; 51ff )
PLYR0:  ; Player 0 sprite data
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5200 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5210 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5220 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5230 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5240 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5250 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5260 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5270 ................
PLYR1:  ; Player 1 sprite data
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5280 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5290 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52a0 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52b0 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52c0 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52d0 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52e0 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52f0 ................
PLYR2:  ; Player 2 sprite data
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5300 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5310 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5320 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5330 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5340 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5350 ................
    !byte $00                                                               ; 5360 .
OBJY-55:
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5361 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$e0   ; 5371 ...............`
    !byte $47,$b0,$0e,$bd,$ca,$58,$29,$f0,$d0,$07,$bd,$3e,$55,$4a,$4c,$a0   ; 5381 G0.=JX)pP.=>UJL 
    !byte $53,$bd,$3e,$55,$4a,$4a,$4a                                       ; 5391 S=>UJJJ
OBJY:
    !byte $85,$c5,$bd,$3e,$55,$38,$e5,$c5,$dd,$dd,$55,$b0,$0a,$a9,$ff,$9d   ; 5398 .E=>U8eE]]U0.)..
    !byte $61,$6d,$a9,$00,$9d,$75,$5d,$60,$00,$00,$00,$00,$00,$00,$00,$00   ; 53a8 am)..u]`........
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 53b8 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 53c8 ................
    !byte $00,$e0,$47,$b0,$0e,$bd,$ca,$58,$29,$f0,$d0,$07,$bd,$3e,$55,$4a   ; 53d8 .`G0.=JX)pP.=>UJ
    !byte $4c,$f9,$53,$bd,$3e,$55,$4a,$4a,$4a,$85,$c5,$bd,$3e,$55,$38,$e5   ; 53e8 LyS=>UJJJ.E=>U8e
    !byte $c5,$dd,$dd,$55,$60,$00,$00,$00                                   ; 53f8 E]]U`...
CORPSX:  ; longitude of all units
    !byte $00,$28,$28,$28,$28,$28,$29,$28,$29,$29,$29,$2a,$2a,$2a,$2a,$2b   ; 5400 .((((()()))****+
    !byte $2b,$2b,$29,$28,$28,$29,$29,$2a,$2a,$2a,$28,$29,$2a,$29,$2a,$2a   ; 5410 ++)(())***()*)**
    !byte $2b,$29,$2a,$2b,$1e,$1e,$1f,$21,$23,$25,$23,$24,$24,$2d,$2d,$26   ; 5420 +)*+...!#%#$$--&
    !byte $2d,$1f,$2d,$2d,$20,$2d,$2d,$1d,$1b,$18,$17,$14,$0f,$00,$00,$00   ; 5430 -.-- --.........
    !byte $00,$00,$00,$00,$00,$00,$00,$15,$15,$1e,$1e,$27,$26,$17,$13,$22   ; 5440 ...........'&.."
    !byte $22,$1f,$1b,$21,$29,$28,$27,$2a,$27,$27,$27,$27,$27,$25,$27,$27   ; 5450 "..!)('*'''''%''
    !byte $27,$28,$29,$29,$27,$24,$22,$20,$23,$1e,$1c,$19,$1d,$20,$21,$1a   ; 5460 '())'$" #.... !.
    !byte $15,$1d,$00,$1c,$15,$15,$15,$14,$14,$0c,$00,$00,$00,$00,$00,$00   ; 5470 ................
    !byte $00,$15,$19,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5480 ................
    !byte $00,$00,$00,$00,$00,$26,$15,$0c,$14,$15,$14,$0f,$15,$14,$13       ; 5490 .....&.........
CORPSY:  ; latitude of all units
    !byte $00,$14,$13,$12,$11,$10,$14,$13,$12,$11,$10,$14,$13,$12,$11,$13   ; 549f ................
    !byte $12,$11,$17,$16,$15,$15,$16,$16,$17,$18,$0f,$0e,$0d,$0f,$0e,$0c   ; 54af ................
    !byte $0d,$0f,$10,$10,$02,$03,$04,$06,$07,$08,$26,$25,$26,$14,$0f,$08   ; 54bf ..........&%&...
    !byte $10,$01,$14,$13,$01,$11,$12,$20,$1f,$26,$26,$26,$26,$14,$08,$12   ; 54cf ....... .&&&&...
    !byte $0a,$0e,$21,$0b,$0f,$14,$0a,$1c,$1b,$0e,$0d,$1c,$1c,$1f,$18,$16   ; 54df ..!.............
    !byte $15,$22,$06,$25,$18,$17,$17,$19,$14,$16,$12,$11,$15,$14,$13,$10   ; 54ef .".%............
    !byte $0f,$0e,$0d,$0c,$0b,$09,$08,$06,$09,$04,$02,$06,$0e,$16,$24,$17   ; 54ff ..............$.
    !byte $08,$21,$1c,$1e,$14,$1c,$21,$1b,$1e,$08,$0a,$20,$0b,$19,$0c,$17   ; 550f .!....!.... ....
    !byte $0d,$1d,$1e,$1f,$0f,$1b,$11,$19,$0b,$17,$13,$15,$21,$1c,$0d,$1a   ; 551f ............!...
    !byte $0a,$1d,$23,$1b,$0f,$1e,$16,$08,$0d,$0e,$1c,$03,$03,$03,$02       ; 552f ..#............
MSTRNG:  ; muster strengths
    !byte $00,$cb,$cd,$c0,$c7,$b8,$88,$7f,$96,$81,$88,$6d,$48,$46,$51,$83   ; 553e .KM@G8.....mHFQ.
    !byte $66,$35,$c6,$c2,$81,$7b,$65,$68,$70,$78,$ca,$c3,$bf,$48,$8c,$8e   ; 554e f5FB.{ehpxJC?H..
    !byte $77,$6f,$7a,$4d,$61,$60,$5c,$7d,$83,$6a,$70,$68,$65,$d2,$61,$62   ; 555e wozMa`\}.jpheRab
    !byte $5f,$34,$62,$60,$37,$68,$65,$64,$67,$6e,$65,$5c,$67,$69,$6b,$6f   ; 556e _4b`7hedgne\giko
    !byte $58,$75,$54,$6d,$59,$69,$5d,$3e,$68,$65,$43,$68,$54,$7f,$70,$6f   ; 557e XuTmYi]>heChT.po
    !byte $5b,$4f,$45,$6c,$76,$89,$46,$55,$82,$5b,$83,$47,$56,$4b,$5a,$7b   ; 558e [OElv.FU.[.GVKZ{
    !byte $7c,$97,$80,$58,$4d,$4f,$50,$7e,$4f,$5b,$54,$48,$56,$4c,$63,$43   ; 559e |..XMOP~O[THVLcC
    !byte $4e,$79,$72,$69,$7a,$7f,$81,$69,$6f,$70,$7f,$77,$59,$6c,$71,$69   ; 55ae Nyriz..iop.wYlqi
    !byte $5e,$67,$61,$6c,$6e,$6f,$60,$6d,$70,$5f,$5d,$72,$67,$6b,$69,$5c   ; 55be ^galno`mp_]rgki\
    !byte $6d,$65,$6a,$5f,$63,$65,$76,$6a,$70,$68,$b9,$6c,$5e,$66,$62       ; 55ce mej_cevjph9l^fb
CSTRNG:  ; combat strengths
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 55dd ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 55ed ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 55fd ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 560d ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 561d ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 562d ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 563d ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 564d ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 565d ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00       ; 566d ...............
SWAP:  ; terrain code underneath unit
    !byte $00,$7e,$7e,$7e,$7e,$7e,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d   ; 567c .~~~~~}}}}}}}}}}
    !byte $7d,$7d,$7e,$7e,$7d,$7d,$7d,$7d,$7d,$7d,$7e,$7e,$7e,$7e,$7d,$7d   ; 568c }}~~}}}}}}~~~~}}
    !byte $7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7e,$7d,$7e   ; 569c }}}}}}}}}}}}}~}~
    !byte $7d,$7d,$7d,$7d,$7d,$7d,$7e,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd   ; 56ac }}}}}}~}}}}}}}}}
    !byte $fd,$fe,$fe,$fe,$fe,$fe,$fe,$fe,$fd,$fd,$fe,$fd,$fe,$fd,$fd,$fd   ; 56bc }~~~~~~~}}~}~}}}
    !byte $fe,$fd,$fd,$fd,$fd,$fd,$fe,$fe,$fd,$fd,$fd,$fe,$fe,$fe,$fe,$fd   ; 56cc ~}}}}}~~}}}~~~~}
    !byte $fd,$fd,$fd,$fe,$fe,$fe,$fe,$fd,$fe,$fe,$fe,$fd,$fd,$fd,$fd,$fd   ; 56dc }}}~~~~}~~~}}}}}
    !byte $fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd   ; 56ec }}}}}}}}}}}}}}}}
    !byte $fd,$fe,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fe,$fe,$fe,$fd,$fe   ; 56fc }~}}}}}}}}}~~~}~
    !byte $fd,$fe,$fe,$fd,$fe,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd       ; 570c }~~}~}}}}}}}}}}
ARRIVE:  ; arrival turns
    !byte $ff,$00,$ff,$00,$00,$00,$00,$00,$00,$00,$00,$ff,$ff,$ff,$ff,$ff   ; 571b ................
    !byte $ff,$ff,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$ff,$00,$00   ; 572b ................
    !byte $00,$00,$ff,$ff,$00,$00,$00,$00,$00,$00,$00,$00,$ff,$02,$ff,$02   ; 573b ................
    !byte $05,$06,$09,$0a,$0b,$14,$18,$04,$05,$07,$09,$0b,$0d,$07,$0c,$08   ; 574b ................
    !byte $0a,$0a,$0e,$0f,$10,$12,$07,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 575b ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 576b ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$01,$01,$01,$01,$01   ; 577b ................
    !byte $02,$02,$02,$03,$03,$04,$04,$05,$05,$06,$06,$07,$08,$08,$08,$09   ; 578b ................
    !byte $09,$05,$05,$02,$09,$0a,$0a,$06,$0b,$05,$11,$02,$0b,$14,$15,$16   ; 579b ................
    !byte $17,$18,$1a,$1c,$1e,$02,$03,$03,$03,$03,$06,$06,$04,$04,$04       ; 57ab ...............
WORDS:  ; various words for messages
    !byte $20,$20,$20,$20,$20,$20,$20,$20,$53,$53,$20,$20,$20,$20,$20,$20   ; 57ba         SS      
    !byte $46,$49,$4e,$4e,$49,$53,$48,$20,$52,$55,$4d,$41,$4e,$49,$41,$4e   ; 57ca FINNISH RUMANIAN
    !byte $49,$54,$41,$4c,$49,$41,$4e,$20,$48,$55,$4e,$47,$41,$52,$41,$4e   ; 57da ITALIAN HUNGARAN
    !byte $4d,$4f,$55,$4e,$54,$41,$49,$4e,$47,$55,$41,$52,$44,$53,$20,$20   ; 57ea MOUNTAINGUARDS  
    !byte $49,$4e,$46,$41,$4e,$54,$52,$59,$54,$41,$4e,$4b,$20,$20,$20,$20   ; 57fa INFANTRYTANK    
    !byte $43,$41,$56,$41,$4c,$52,$59,$20,$50,$41,$4e,$5a,$45,$52,$20,$20   ; 580a CAVALRY PANZER  
    !byte $4d,$49,$4c,$49,$54,$49,$41,$20,$53,$48,$4f,$43,$4b,$20,$20,$20   ; 581a MILITIA SHOCK   
    !byte $50,$41,$52,$41,$54,$52,$50,$20,$50,$5a,$52,$47,$52,$4e,$44,$52   ; 582a PARATRP PZRGRNDR
    !byte $20,$20,$20,$20,$20,$20,$20,$20,$4a,$41,$4e,$55,$41,$52,$59,$20   ; 583a         JANUARY 
    !byte $46,$45,$42,$52,$55,$41,$52,$59,$4d,$41,$52,$43,$48,$20,$20,$20   ; 584a FEBRUARYMARCH   
    !byte $41,$50,$52,$49,$4c,$20,$20,$20,$4d,$41,$59,$20,$20,$20,$20,$20   ; 585a APRIL   MAY     
    !byte $4a,$55,$4e,$45,$20,$20,$20,$20,$4a,$55,$4c,$59,$20,$20,$20,$20   ; 586a JUNE    JULY    
    !byte $41,$55,$47,$55,$53,$54,$20,$20,$53,$45,$50,$54,$45,$4d,$42,$52   ; 587a AUGUST  SEPTEMBR
    !byte $4f,$43,$54,$4f,$42,$45,$52,$20,$4e,$4f,$56,$45,$4d,$42,$45,$52   ; 588a OCTOBER NOVEMBER
    !byte $44,$45,$43,$45,$4d,$42,$45,$52,$43,$4f,$52,$50,$53,$20,$20,$20   ; 589a DECEMBERCORPS   
    !byte $41,$52,$4d,$59,$20,$20,$20,$20,$4d,$55,$53,$54,$45,$52,$20,$20   ; 58aa ARMY    MUSTER  
WORDS+256:
    !byte $43,$4f,$4d,$42,$41,$54,$20,$20,$53,$54,$52,$45,$4e,$47,$54,$48   ; 58ba COMBAT  STRENGTH
CORPT:  ; codes for unit types
    !byte $00,$03,$03,$03,$03,$03,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 58ca ................
    !byte $00,$40,$03,$03,$00,$00,$00,$00,$00,$00,$03,$03,$03,$03,$00,$00   ; 58da .@..............
    !byte $00,$00,$00,$00,$30,$30,$30,$00,$00,$00,$20,$20,$20,$03,$00,$53   ; 58ea ....000...   ..S
    !byte $00,$30,$00,$00,$40,$00,$07,$04,$04,$00,$00,$00,$00,$00,$00,$00   ; 58fa .0..@...........
    !byte $00,$01,$01,$01,$01,$01,$02,$01,$00,$00,$02,$00,$01,$00,$00,$00   ; 590a ................
    !byte $01,$04,$00,$04,$00,$00,$01,$01,$00,$00,$00,$01,$01,$02,$02,$00   ; 591a ................
    !byte $00,$00,$00,$01,$01,$01,$02,$00,$01,$02,$02,$00,$04,$00,$04,$00   ; 592a ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 593a ................
    !byte $00,$72,$00,$70,$70,$70,$70,$00,$00,$00,$00,$72,$01,$71,$70,$01   ; 594a .r.pppp....r.qp.
    !byte $70,$01,$01,$00,$00,$00,$00,$00,$00,$00,$04,$04,$04,$04,$04       ; 595a p..............
CORPNO:  ; unit ID numbers
    !byte $00,$18,$27,$2e,$2f,$39,$05,$06,$07,$08,$09,$0c,$0d,$14,$2a,$2b   ; 5969 ..'./9........*+
    !byte $35,$03,$29,$38,$01,$02,$0a,$1a,$1c,$26,$03,$0e,$30,$34,$31,$04   ; 5979 5.)8.....&..041.
    !byte $11,$1d,$2c,$37,$01,$02,$04,$0b,$1e,$36,$02,$04,$06,$28,$1b,$01   ; 5989 ..,7.....6...(..
    !byte $17,$05,$22,$23,$04,$33,$32,$07,$0b,$29,$2a,$2b,$2c,$2d,$2e,$2f   ; 5999 .."#.32..)*+,-./
    !byte $30,$09,$0d,$0e,$0f,$10,$07,$02,$13,$12,$01,$1b,$0a,$16,$15,$0d   ; 59a9 0...............
    !byte $06,$09,$02,$01,$08,$0b,$01,$07,$03,$04,$0a,$05,$08,$03,$06,$05   ; 59b9 ................
    !byte $06,$0c,$1a,$03,$04,$0b,$05,$09,$0c,$04,$02,$07,$02,$0e,$04,$0f   ; 59c9 ................
    !byte $10,$14,$06,$18,$28,$1d,$1e,$1f,$20,$21,$25,$2b,$31,$32,$34,$36   ; 59d9 ....(... !%+1246
    !byte $37,$01,$22,$01,$02,$03,$04,$27,$3b,$3c,$3d,$02,$01,$01,$05,$02   ; 59e9 7."....';<=.....
    !byte $06,$03,$04,$26,$24,$23,$1c,$19,$17,$11,$08,$0a,$03,$05,$06       ; 59f9 ...&$#.........
HDIGIT:  ; hundreds digits for number display
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5a08 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5a18 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5a28 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5a38 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5a48 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5a58 ................
    !byte $00,$00,$00,$00,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01   ; 5a68 ................
    !byte $01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01   ; 5a78 ................
    !byte $01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01   ; 5a88 ................
    !byte $01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01   ; 5a98 ................
    !byte $01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01   ; 5aa8 ................
    !byte $01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01   ; 5ab8 ................
    !byte $01,$01,$01,$01,$01,$01,$01,$01,$02,$02,$02,$02,$02,$02,$02,$02   ; 5ac8 ................
    !byte $02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02   ; 5ad8 ................
    !byte $02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02   ; 5ae8 ................
    !byte $02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02   ; 5af8 ................
TDIGIT:  ; tens digits tables
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$01,$01,$01,$01,$01,$01   ; 5b08 ................
    !byte $01,$01,$01,$01,$02,$02,$02,$02,$02,$02,$02,$02,$02,$02,$03,$03   ; 5b18 ................
    !byte $03,$03,$03,$03,$03,$03,$03,$03,$04,$04,$04,$04,$04,$04,$04,$04   ; 5b28 ................
    !byte $04,$04,$05,$05,$05,$05,$05,$05,$05,$05,$05,$05,$06,$06,$06,$06   ; 5b38 ................
    !byte $06,$06,$06,$06,$06,$06,$07,$07,$07,$07,$07,$07,$07,$07,$07,$07   ; 5b48 ................
    !byte $08,$08,$08,$08,$08,$08,$08,$08,$08,$08,$09,$09,$09,$09,$09,$09   ; 5b58 ................
    !byte $09,$09,$09,$09,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$01,$01   ; 5b68 ................
    !byte $01,$01,$01,$01,$01,$01,$01,$01,$02,$02,$02,$02,$02,$02,$02,$02   ; 5b78 ................
    !byte $02,$02,$03,$03,$03,$03,$03,$03,$03,$03,$03,$03,$04,$04,$04,$04   ; 5b88 ................
    !byte $04,$04,$04,$04,$04,$04,$05,$05,$05,$05,$05,$05,$05,$05,$05,$05   ; 5b98 ................
    !byte $06,$06,$06,$06,$06,$06,$06,$06,$06,$06,$07,$07,$07,$07,$07,$07   ; 5ba8 ................
    !byte $07,$07,$07,$07,$08,$08,$08,$08,$08,$08,$08,$08,$08,$08,$09,$09   ; 5bb8 ................
    !byte $09,$09,$09,$09,$09,$09,$09,$09,$00,$00,$00,$00,$00,$00,$00,$00   ; 5bc8 ................
    !byte $00,$00,$01,$01,$01,$01,$01,$01,$01,$01,$01,$01,$02,$02,$02,$02   ; 5bd8 ................
    !byte $02,$02,$02,$02,$02,$02,$03,$03,$03,$03,$03,$03,$03,$03,$03,$03   ; 5be8 ................
    !byte $04,$04,$04,$04,$04,$04,$04,$04,$04,$04,$05,$05,$05,$05,$05,$05   ; 5bf8 ................
ODIGIT:  ; ones digits tables
    !byte $00,$01,$02,$03,$04,$05,$06,$07,$08,$09,$00,$01,$02,$03,$04,$05   ; 5c08 ................
    !byte $06,$07,$08,$09,$00,$01,$02,$03,$04,$05,$06,$07,$08,$09,$00,$01   ; 5c18 ................
    !byte $02,$03,$04,$05,$06,$07,$08,$09,$00,$01,$02,$03,$04,$05,$06,$07   ; 5c28 ................
    !byte $08,$09,$00,$01,$02,$03,$04,$05,$06,$07,$08,$09,$00,$01,$02,$03   ; 5c38 ................
    !byte $04,$05,$06,$07,$08,$09,$00,$01,$02,$03,$04,$05,$06,$07,$08,$09   ; 5c48 ................
    !byte $00,$01,$02,$03,$04,$05,$06,$07,$08,$09,$00,$01,$02,$03,$04,$05   ; 5c58 ................
    !byte $06,$07,$08,$09,$00,$01,$02,$03,$04,$05,$06,$07,$08,$09,$00,$01   ; 5c68 ................
    !byte $02,$03,$04,$05,$06,$07,$08,$09,$00,$01,$02,$03,$04,$05,$06,$07   ; 5c78 ................
    !byte $08,$09,$00,$01,$02,$03,$04,$05,$06,$07,$08,$09,$00,$01,$02,$03   ; 5c88 ................
    !byte $04,$05,$06,$07,$08,$09,$00,$01,$02,$03,$04,$05,$06,$07,$08,$09   ; 5c98 ................
    !byte $00,$01,$02,$03,$04,$05,$06,$07,$08,$09,$00,$01,$02,$03,$04,$05   ; 5ca8 ................
    !byte $06,$07,$08,$09,$00,$01,$02,$03,$04,$05,$06,$07,$08,$09,$00,$01   ; 5cb8 ................
    !byte $02,$03,$04,$05,$06,$07,$08,$09,$00,$01,$02,$03,$04,$05,$06,$07   ; 5cc8 ................
    !byte $08,$09,$00,$01,$02,$03,$04,$05,$06,$07,$08,$09,$00,$01,$02,$03   ; 5cd8 ................
    !byte $04,$05,$06,$07,$08,$09,$00,$01,$02,$03,$04,$05,$06,$07,$08,$09   ; 5ce8 ................
    !byte $00,$01,$02,$03,$04,$05,$06,$07,$08,$09,$00,$01,$02,$03,$04,$05   ; 5cf8 ................
TXTTBL:  ; more text
    !byte $50,$4c,$45,$41,$53,$45,$20,$45,$4e,$54,$45,$52,$20,$59,$4f,$55   ; 5d08 PLEASE ENTER YOU
    !byte $52,$20,$4f,$52,$44,$45,$52,$53,$20,$4e,$4f,$57,$20,$20,$20,$20   ; 5d18 R ORDERS NOW    
    !byte $20,$20,$20,$20,$20,$20,$20,$20,$20,$20,$47,$41,$4d,$45,$20,$4f   ; 5d28           GAME O
    !byte $56,$45,$52,$20,$20,$20,$20,$20,$20,$20,$20,$20,$20,$20,$20,$20   ; 5d38 VER             
    !byte $46,$49,$47,$55,$52,$49,$4e,$47,$20,$4d,$4f,$56,$45,$3b,$20,$4e   ; 5d48 FIGURING MOVE; N
    !byte $4f,$20,$4f,$52,$44,$45,$52,$53,$20,$41,$4c,$4c,$4f,$57,$45,$44   ; 5d58 O ORDERS ALLOWED
MONLEN:  ; table of month lengths
    !byte $00,$1f,$1c,$1f,$1e,$1f,$1e,$1f,$1f,$1e,$1f,$1e,$1f               ; 5d68 .............
HMORDS:  ; how many orders queued for each unit
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5d75 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5d85 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5d95 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5da5 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5db5 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5dc5 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5dd5 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5de5 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5df5 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00       ; 5e05 ...............
WHORDS:  ; what unit orders are (2 bits per order)
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e14 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e24 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e34 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e44 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e54 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e64 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e74 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e84 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e94 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00       ; 5ea4 ...............
WHORDH:  ; unit orders (high bits?)
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5eb3 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5ec3 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5ed3 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5ee3 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5ef3 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5f03 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5f13 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5f23 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5f33 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00       ; 5f43 ...............
BEEPTB:  ; table of beep tones
    !byte $1e,$28,$32,$3c                                                   ; 5f52 .(2<
ERRMSG:  ; table of error messages
    !byte $20,$20,$20,$20,$54,$48,$41,$54,$20,$49,$53,$20,$41,$20,$52,$55   ; 5f56     THAT IS A RU
    !byte $53,$53,$49,$41,$4e,$20,$55,$4e,$49,$54,$21,$20,$20,$20,$20,$20   ; 5f66 SSIAN UNIT!     
    !byte $20,$20,$20,$4f,$4e,$4c,$59,$20,$38,$20,$4f,$52,$44,$45,$52,$53   ; 5f76    ONLY 8 ORDERS
    !byte $20,$41,$52,$45,$20,$41,$4c,$4c,$4f,$57,$45,$44,$21,$20,$20,$20   ; 5f86  ARE ALLOWED!   
    !byte $20,$20,$50,$4c,$45,$41,$53,$45,$20,$57,$41,$49,$54,$20,$46,$4f   ; 5f96   PLEASE WAIT FO
    !byte $52,$20,$4d,$41,$4c,$54,$41,$4b,$52,$45,$55,$5a,$45,$21,$20,$20   ; 5fa6 R MALTAKREUZE!  
    !byte $20,$20,$20,$4e,$4f,$20,$44,$49,$41,$47,$4f,$4e,$41,$4c,$20,$4d   ; 5fb6    NO DIAGONAL M
    !byte $4f,$56,$45,$53,$20,$41,$4c,$4c,$4f,$57,$45,$44,$21,$20,$20,$20   ; 5fc6 OVES ALLOWED!   
XOFF:  ; offsets for moving maltakreuze
    !byte $00,$08,$00,$f8                                                   ; 5fd6 ...x
YOFF:
    !byte $f8,$00,$08,$00                                                   ; 5fda x...
MASKO:  ; mask values for decoding orders
    !byte $03,$0c,$30,$c0                                                   ; 5fde ..0@
XADD:  ; offsets for moving arrow
    !byte $00,$01,$00,$ff                                                   ; 5fe2 ....
YADD:
    !byte $ff,$00,$01,$00                                                   ; 5fe6 ....
TRTAB:
    !byte $00,$12,$12,$12,$d2,$d8,$d6,$c4,$d4,$c2,$12,$12,$12               ; 5fea ....RXVDTB...
MLTKRZ:  ; maltakreuze shape
    !byte $24,$24,$e7,$00,$00,$e7,$24,$24                                   ; 5ff7 $$g..g$$
DBGFLG:  ; output by debug routine
    !byte $00                                                               ; 5fff .
FONTDATA:
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$08,$1c,$3e,$08,$00,$00,$00   ; 6000 ...........>....
    !byte $00,$00,$00,$08,$1c,$3e,$08,$00,$00,$00,$10,$38,$7c,$10,$00,$00   ; 6010 .....>.....8|...
    !byte $00,$10,$38,$7c,$10,$00,$00,$00,$00,$00,$00,$08,$1c,$3e,$7f,$08   ; 6020 ..8|.........>..
    !byte $00,$08,$1c,$3e,$7f,$08,$00,$00,$02,$5a,$00,$19,$d8,$00,$da,$50   ; 6030 ...>.....Z..X.ZP
    !byte $1a,$1a,$00,$5b,$5a,$00,$5b,$00,$5a,$5b,$00,$4b,$4a,$00,$58,$18   ; 6040 ...[Z.[.Z[.KJ.X.
    !byte $40,$5b,$00,$db,$d2,$00,$59,$40,$00,$22,$14,$08,$00,$11,$0a,$04   ; 6050 @[.[R.Y@."......
    !byte $00,$44,$28,$10,$00,$11,$0a,$04,$00,$22,$14,$08,$00,$44,$28,$10   ; 6060 .D(......"...D(.
    !byte $00,$44,$28,$10,$00,$22,$14,$08,$10,$08,$08,$10,$0b,$04,$00,$00   ; 6070 .D(.."..........
    !byte $08,$08,$10,$21,$42,$4c,$70,$00,$10,$0c,$02,$01,$00,$00,$00,$00   ; 6080 ...!BLp.........
    !byte $10,$10,$0c,$02,$01,$00,$00,$00,$08,$10,$20,$20,$10,$08,$04,$08   ; 6090 ..........  ....
    !byte $10,$08,$08,$04,$04,$0c,$10,$10,$10,$10,$20,$20,$10,$10,$08,$08   ; 60a0 ..........  ....
    !byte $08,$04,$04,$04,$08,$08,$04,$08,$08,$08,$04,$06,$02,$04,$08,$10   ; 60b0 ................
    !byte $10,$20,$20,$20,$40,$40,$20,$10,$08,$08,$30,$c0,$00,$00,$00,$00   ; 60c0 .   @@ ...0@....
    !byte $10,$08,$08,$84,$48,$30,$00,$00,$10,$08,$04,$c2,$22,$24,$18,$00   ; 60d0 ....H0.....B"$..
    !byte $00,$00,$00,$03,$06,$08,$08,$10,$00,$18,$26,$41,$20,$20,$10,$10   ; 60e0 ..........&A  ..
    !byte $00,$00,$00,$06,$09,$10,$10,$10,$00,$00,$00,$c0,$23,$2c,$30,$00   ; 60f0 ...........@#,0.
    !byte $00,$18,$16,$61,$80,$00,$00,$00,$00,$00,$00,$00,$c7,$2c,$10,$00   ; 6100 ...a........G,..
    !byte $00,$30,$48,$8c,$03,$00,$00,$00,$00,$00,$00,$c1,$32,$0a,$04,$00   ; 6110 .0H........A2...
    !byte $00,$00,$00,$00,$c0,$20,$18,$08,$00,$38,$44,$82,$02,$04,$08,$10   ; 6120 ....@ ...8D.....
    !byte $00,$00,$00,$80,$40,$60,$10,$10,$00,$00,$00,$c0,$20,$10,$08,$08   ; 6130 ....@`.....@ ...
    !byte $08,$08,$10,$10,$e0,$10,$08,$08,$e0,$e0,$f0,$f8,$f8,$f8,$f0,$f0   ; 6140 ....`...``pxxxpp
    !byte $f8,$f8,$f0,$e0,$e0,$f0,$f0,$e0,$f0,$e0,$e0,$f0,$fc,$f8,$f0,$f0   ; 6150 xxp``pp`p``p|xpp
    !byte $ff,$ff,$ff,$f3,$60,$00,$00,$00,$ff,$ff,$ff,$ff,$3f,$18,$10,$00   ; 6160 ...s`.......?...
    !byte $ff,$ff,$cf,$cf,$03,$00,$00,$00,$e0,$e0,$f0,$fc,$fc,$ff,$ff,$ff   ; 6170 ..OO....``p||...
    !byte $f8,$f8,$f0,$f0,$c0,$00,$00,$00,$ff,$ff,$ff,$fc,$fc,$f8,$e0,$e0   ; 6180 xxpp@......||x``
    !byte $00,$00,$00,$00,$38,$f8,$fc,$fc,$07,$0f,$1f,$1f,$1e,$06,$00,$00   ; 6190 ....8x||........
    !byte $01,$03,$03,$01,$00,$01,$03,$00,$00,$00,$00,$00,$00,$01,$07,$3f   ; 61a0 ...............?
    !byte $00,$00,$00,$00,$01,$27,$ff,$ff,$00,$00,$00,$0a,$cf,$ff,$ff,$ff   ; 61b0 .....'......O...
    !byte $00,$00,$00,$20,$e3,$ff,$ff,$ff,$00,$03,$0f,$7f,$ff,$ff,$ff,$ff   ; 61c0 ... c...........
    !byte $08,$0c,$1c,$1e,$1f,$0f,$0f,$0f,$ff,$ff,$ff,$7c,$18,$10,$10,$08   ; 61d0 ...........|....
    !byte $f8,$f0,$f0,$f0,$f9,$1e,$00,$00,$00,$7f,$63,$55,$49,$55,$63,$7f   ; 61e0 xpppy.....cUIUc.
    !byte $00,$7f,$41,$5d,$55,$5d,$41,$7f,$ff,$ff,$ff,$ff,$ff,$ff,$ff,$ff   ; 61f0 ..A]U]A.........
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$10,$38,$7c,$00,$04,$0e,$1f   ; 6200 ..........8|....
    !byte $00,$08,$1c,$3e,$00,$04,$0e,$1f,$00,$04,$0e,$1f,$00,$08,$1c,$3e   ; 6210 ...>...........>
    !byte $00,$10,$38,$7c,$00,$08,$1c,$3e,$00,$08,$1c,$3e,$7f,$00,$00,$00   ; 6220 ..8|...>...>....
    !byte $00,$00,$00,$08,$1c,$3e,$7f,$00,$42,$5a,$00,$11,$58,$00,$da,$18   ; 6230 .....>..BZ..X.Z.
    !byte $02,$da,$00,$5b,$5b,$00,$5a,$00,$18,$5b,$00,$4b,$5a,$00,$5b,$08   ; 6240 .Z.[[.Z..[.KZ.[.
    !byte $10,$5b,$00,$da,$d2,$00,$59,$58,$00,$11,$0a,$04,$00,$11,$0a,$04   ; 6250 .[.ZR.YX........
    !byte $00,$44,$28,$10,$00,$11,$0a,$04,$00,$22,$14,$08,$00,$44,$28,$10   ; 6260 .D(......"...D(.
    !byte $00,$44,$28,$10,$00,$22,$14,$08,$10,$10,$10,$08,$0f,$00,$00,$00   ; 6270 .D(.."..........
    !byte $08,$08,$10,$21,$42,$24,$38,$00,$10,$08,$06,$01,$00,$00,$00,$00   ; 6280 ...!B$8.........
    !byte $10,$10,$0c,$04,$07,$00,$00,$00,$10,$10,$20,$20,$20,$18,$04,$08   ; 6290 ..........   ...
    !byte $10,$10,$18,$04,$04,$0c,$08,$10,$08,$08,$04,$04,$02,$02,$0c,$08   ; 62a0 ................
    !byte $08,$04,$04,$c4,$38,$00,$00,$00,$08,$08,$04,$06,$e2,$1c,$00,$00   ; 62b0 ...D8.......b...
    !byte $00,$00,$1c,$23,$40,$40,$20,$10,$00,$00,$00,$07,$04,$08,$08,$08   ; 62c0 ...#@@ .........
    !byte $00,$00,$02,$85,$48,$30,$00,$00,$00,$00,$00,$c3,$22,$24,$18,$00   ; 62d0 ....H0.....C"$..
    !byte $00,$00,$00,$83,$46,$38,$00,$00,$00,$18,$26,$c1,$00,$00,$00,$00   ; 62e0 ....F8....&A....
    !byte $00,$00,$30,$c8,$08,$10,$10,$10,$00,$00,$00,$c0,$20,$20,$30,$08   ; 62f0 ..0H.......@  0.
    !byte $00,$00,$18,$64,$82,$06,$08,$08,$00,$00,$00,$00,$c0,$20,$10,$10   ; 6300 ...d........@ ..
    !byte $08,$10,$60,$93,$0c,$00,$00,$00,$ff,$fe,$78,$18,$1f,$3f,$ff,$ff   ; 6310 ..`......~x..?..
    !byte $0f,$0f,$1f,$0f,$07,$0f,$1f,$0f,$00,$00,$00,$80,$e1,$f7,$ff,$ff   ; 6320 ............aw..
    !byte $00,$00,$00,$05,$cf,$ff,$ff,$ff,$00,$00,$00,$c1,$e7,$f7,$ff,$ff   ; 6330 ....O......Agw..
    !byte $e0,$f0,$f0,$fc,$fe,$ff,$ff,$ff,$e0,$e0,$f0,$f8,$f8,$f9,$ff,$ff   ; 6340 `pp|~...``pxxy..
    !byte $07,$07,$0f,$1f,$df,$ff,$ff,$ff,$0f,$1f,$1f,$0f,$87,$ff,$ff,$ff   ; 6350 ...._...........
    !byte $07,$0f,$1f,$1f,$ff,$ff,$ff,$ff,$f8,$f8,$f0,$f0,$60,$00,$00,$00   ; 6360 ........xxpp`...
    !byte $fc,$fc,$fc,$f8,$30,$00,$00,$00,$00,$00,$00,$00,$0c,$1f,$1f,$0f   ; 6370 |||x0...........
    !byte $00,$00,$00,$00,$01,$03,$03,$0f,$00,$00,$00,$00,$01,$0f,$0f,$1f   ; 6380 ................
    !byte $ff,$ff,$ff,$fc,$fc,$f8,$e0,$e0,$ff,$ff,$ff,$ff,$fc,$f8,$e0,$e0   ; 6390 ...||x``....|x``
    !byte $00,$00,$20,$e0,$e0,$f0,$f8,$f8,$00,$00,$00,$00,$80,$c0,$e0,$f0   ; 63a0 .. ``pxx.....@`p
    !byte $00,$00,$00,$1c,$7f,$ff,$1f,$07,$07,$03,$03,$00,$00,$00,$00,$00   ; 63b0 ................
    !byte $ff,$ff,$ff,$f5,$30,$00,$00,$00,$ff,$ff,$ff,$d8,$00,$00,$03,$0f   ; 63c0 ...u0......X....
    !byte $00,$00,$00,$e0,$3d,$0f,$07,$07,$08,$0c,$1c,$1e,$1f,$ff,$ff,$ff   ; 63d0 ...`=...........
    !byte $08,$08,$10,$10,$70,$f0,$f8,$f8,$00,$7f,$63,$55,$49,$55,$63,$7f   ; 63e0 ....ppxx..cUIUc.
    !byte $00,$7f,$41,$5d,$55,$5d,$41,$7f,$ff,$ff,$ff,$ff,$ff,$ff,$ff,$ff   ; 63f0 ..A]U]A.........
DSPLST:
    !byte $70,$70,$70,$c6,$e0,$64,$90,$90,$f7,$fe,$64,$f7,$2e,$65,$f7,$5e   ; 6400 pppF`d..w~dw.ew^
    !byte $65,$f7,$8e,$65,$f7,$be,$65,$f7,$ee,$65,$f7,$1e,$66,$f7,$4e,$66   ; 6410 ew.ew>ewnew.fwNf
    !byte $f7,$7e,$66,$57,$ae,$66,$90,$c2,$50,$64,$02,$90,$02,$90,$41,$00   ; 6420 w~fW.f.BPd....A.
    !byte $64                                                               ; 6430 d
ARRTAB:  ; arrow shapes; last byte overlaps
    !byte $10,$38,$54,$92,$10,$10,$10,$10,$08,$04,$02,$ff,$02,$04,$08,$00   ; 6431 .8T.............
    !byte $10,$10,$10,$10,$92,$54,$38,$10,$10,$20,$40,$ff,$40,$20,$10       ; 6441 .....T8.. @.@ .
TXTWDW:
    !byte $00,$00,$00,$00,$00,$00,$00,$00                                   ; 6450 ........
TXTWDW+8:
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$25,$21,$33,$34,$25,$32,$2e,$00   ; 6458 ........%!34%2..
    !byte $26,$32,$2f,$2e,$34,$00,$11,$19,$14,$11,$00,$00                   ; 6468 &2/.4.......
TXTWDW+36:
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6474 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$23,$2f,$30,$39,$32,$29,$27,$28,$34   ; 6484 .......#/092)'(4
    !byte $00,$11,$19,$18,$11,$00,$23,$28,$32,$29,$33,$00,$23,$32,$21,$37   ; 6494 ......#(2)3.#2!7
    !byte $26,$2f,$32,$24,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 64a4 &/2$............
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 64b4 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00                   ; 64c4 ............
TXTWDW+128:
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 64d0 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 64e0 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 64f0 ................
MAPDATA:
    !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6500 ................
    !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6510 ................
    !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6520 ................
    !byte $7f,$bf,$bf,$bf,$a9,$00,$00,$00,$00,$00,$00,$00,$00,$b4,$bf,$bf   ; 6530 .???)........4??
    !byte $aa,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6540 *...............
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6550 ................
    !byte $7f,$bf,$bf,$bf,$af,$b2,$00,$00,$00,$b5,$b6,$b8,$b7,$b6,$b3,$bb   ; 6560 .???/2...568763;
    !byte $b0,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6570 0...............
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6580 ................
    !byte $7f,$bf,$bf,$bf,$bf,$af,$b8,$b7,$b9,$bf,$bf,$b1,$b0,$47,$9d,$9b   ; 6590 .????/879??10G..
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 65a0 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 65b0 ................
    !byte $7f,$bf,$bf,$bf,$bf,$bf,$b1,$ac,$ad,$ae,$bb,$bc,$a4,$8d,$94,$8c   ; 65c0 .?????1,-.;<$...
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$9d,$a5,$00,$9c,$a0,$a2,$a6,$00   ; 65d0 .........%.. "&.
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 65e0 ................
    !byte $7f,$bf,$bf,$bf,$bf,$bf,$ab,$00,$00,$00,$ba,$b2,$98,$8e,$95,$01   ; 65f0 .?????+...:2....
    !byte $05,$00,$00,$00,$00,$00,$00,$00,$94,$91,$a1,$9a,$00,$00,$92,$9f   ; 6600 ..........!.....
    !byte $a5,$00,$00,$00,$00,$9c,$a4,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6610 %.....$.........
    !byte $7f,$bf,$bf,$bf,$bf,$bf,$aa,$00,$00,$00,$b4,$aa,$93,$8c,$96,$02   ; 6620 .?????*...4*....
    !byte $06,$00,$00,$00,$00,$00,$00,$00,$97,$00,$00,$00,$00,$00,$00,$9c   ; 6630 ................
    !byte $a8,$48,$00,$9d,$a1,$99,$91,$a0,$a5,$00,$00,$00,$00,$00,$00,$7f   ; 6640 (H..!.. %.......
    !byte $7f,$bf,$bf,$bf,$bf,$bf,$af,$b2,$00,$00,$00,$b0,$95,$8b,$97,$03   ; 6650 .?????/2...0....
    !byte $01,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$95   ; 6660 ................
    !byte $91,$a0,$9f,$9b,$00,$00,$00,$49,$92,$a6,$00,$00,$00,$00,$00,$7f   ; 6670 . .....I.&......
    !byte $7f,$bf,$bf,$bf,$bf,$bf,$bf,$a9,$00,$00,$00,$00,$00,$00,$98,$04   ; 6680 .??????)........
    !byte $03,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$9d,$9a   ; 6690 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$95,$00,$00,$00,$00,$00,$7f   ; 66a0 ................
    !byte $7f,$bf,$bf,$b1,$ac,$bf,$bf,$aa,$48,$00,$00,$00,$00,$00,$94,$00   ; 66b0 .??1,??*H.......
    !byte $02,$00,$00,$00,$00,$00,$00,$00,$02,$00,$00,$00,$00,$00,$96,$00   ; 66c0 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$90,$a2,$9f,$a7,$00,$00,$7f   ; 66d0 ..........".'...
    !byte $7f,$bf,$bf,$aa,$00,$b3,$ad,$bc,$9f,$a0,$a5,$00,$00,$00,$00,$00   ; 66e0 .??*.3-<. %.....
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$01,$00,$00,$00,$00,$00,$97,$00   ; 66f0 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$9c,$99,$00,$00,$7f   ; 6700 ................
    !byte $7f,$bf,$bf,$a9,$00,$00,$00,$00,$00,$00,$8f,$a4,$00,$00,$00,$00   ; 6710 .??).......$....
    !byte $00,$9d,$9b,$00,$00,$00,$49,$00,$00,$00,$4a,$00,$00,$9c,$99,$00   ; 6720 ......I...J.....
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$95,$00,$00,$00,$7f   ; 6730 ................
    !byte $7f,$bf,$bf,$ab,$00,$00,$00,$00,$00,$00,$00,$90,$a1,$a6,$00,$00   ; 6740 .??+........!&..
    !byte $9c,$9a,$00,$00,$00,$00,$00,$03,$06,$00,$00,$00,$00,$98,$00,$00   ; 6750 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$93,$00,$00,$00,$7f   ; 6760 ................
    !byte $7f,$bf,$bf,$af,$b2,$00,$00,$00,$00,$00,$00,$00,$00,$91,$a2,$a3   ; 6770 .??/2........."#
    !byte $99,$00,$00,$00,$02,$97,$04,$01,$02,$9e,$a3,$a1,$9f,$9b,$00,$00   ; 6780 ..........#!....
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$96,$00,$00,$00,$7f   ; 6790 ................
    !byte $7f,$bf,$bf,$bf,$aa,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 67a0 .???*...........
    !byte $00,$00,$00,$9c,$a2,$99,$00,$03,$04,$94,$00,$00,$00,$00,$00,$00   ; 67b0 ...."...........
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$9c,$9a,$00,$00,$00,$7f   ; 67c0 ................
    !byte $7f,$bf,$bf,$b1,$bc,$a0,$9f,$a1,$a4,$00,$00,$00,$02,$06,$05,$00   ; 67d0 .??1< .!$.......
    !byte $00,$9d,$a3,$9a,$47,$00,$01,$06,$00,$93,$00,$00,$98,$00,$00,$00   ; 67e0 ..#.G...........
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$97,$4a,$00,$00,$00,$7f   ; 67f0 ...........J....
    !byte $7f,$bf,$b1,$b0,$00,$00,$00,$00,$91,$a2,$00,$01,$04,$03,$01,$00   ; 6800 .?10....."......
    !byte $9e,$9b,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$97,$00,$00,$00   ; 6810 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$94,$00,$00,$00,$00,$7f   ; 6820 ................
    !byte $7f,$ad,$b0,$00,$00,$00,$00,$00,$00,$00,$00,$02,$06,$4a,$00,$8c   ; 6830 .-0..........J..
    !byte $96,$8b,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$8f,$a2,$a7,$00   ; 6840 ............."'.
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$9e,$9b,$00,$00,$00,$00,$7f   ; 6850 ................
    !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$01,$03,$05,$00,$00,$00,$8e   ; 6860 ................
    !byte $90,$a5,$8d,$00,$00,$00,$00,$00,$00,$47,$00,$00,$00,$00,$96,$49   ; 6870 .%.......G.....I
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$98,$00,$00,$00,$00,$00,$7f   ; 6880 ................
    !byte $7f,$00,$00,$00,$00,$00,$00,$00,$02,$06,$00,$00,$00,$00,$8d,$8b   ; 6890 ................
    !byte $8e,$92,$a7,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$91,$a5   ; 68a0 ..'............%
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$96,$00,$00,$00,$00,$00,$7f   ; 68b0 ................
    !byte $7f,$a6,$49,$00,$00,$00,$00,$00,$05,$04,$00,$00,$8b,$8c,$8e,$8d   ; 68c0 .&I.............
    !byte $8c,$00,$98,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$95   ; 68d0 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$95,$00,$00,$00,$00,$00,$7f   ; 68e0 ................
    !byte $7f,$92,$a5,$00,$00,$00,$00,$00,$03,$01,$00,$00,$8d,$9f,$a3,$a5   ; 68f0 ..%...........#%
    !byte $8e,$8b,$94,$00,$00,$00,$00,$00,$00,$00,$96,$00,$00,$00,$00,$90   ; 6900 ................
    !byte $a1,$a4,$00,$00,$00,$00,$00,$00,$00,$97,$00,$00,$00,$00,$00,$7f   ; 6910 !$..............
    !byte $7f,$00,$8f,$a7,$00,$00,$00,$03,$04,$06,$00,$8b,$8c,$8e,$8d,$91   ; 6920 ...'............
    !byte $a0,$a6,$97,$00,$00,$00,$00,$00,$00,$00,$91,$a6,$00,$00,$00,$00   ; 6930  &.........&....
    !byte $00,$92,$a6,$00,$00,$00,$00,$00,$00,$94,$00,$00,$00,$00,$00,$7f   ; 6940 ..&.............
    !byte $7f,$00,$00,$95,$00,$00,$00,$02,$05,$8b,$8e,$8d,$8b,$8c,$8b,$8e   ; 6950 ................
    !byte $8c,$92,$a8,$00,$00,$00,$00,$00,$00,$00,$00,$97,$00,$00,$00,$00   ; 6960 ..(.............
    !byte $00,$00,$8f,$a3,$9f,$a1,$a0,$a6,$00,$98,$00,$00,$00,$00,$00,$7f   ; 6970 ...#.! &........
    !byte $7f,$00,$9c,$9a,$00,$00,$00,$00,$00,$8c,$8b,$8d,$8e,$8c,$00,$00   ; 6980 ................
    !byte $00,$8b,$94,$00,$00,$00,$00,$00,$00,$00,$4a,$94,$00,$00,$00,$00   ; 6990 ..........J.....
    !byte $00,$00,$00,$00,$00,$00,$00,$93,$47,$8f,$9f,$a0,$a2,$a5,$00,$7f   ; 69a0 ........G.. "%..
    !byte $7f,$99,$97,$00,$00,$00,$00,$00,$00,$00,$8e,$00,$00,$00,$00,$00   ; 69b0 ................
    !byte $00,$47,$95,$00,$00,$00,$00,$00,$00,$00,$00,$90,$a5,$00,$00,$00   ; 69c0 .G..........%...
    !byte $00,$00,$00,$00,$00,$00,$00,$95,$00,$00,$00,$00,$00,$90,$a6,$7f   ; 69d0 ..............&.
    !byte $7f,$01,$06,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 69e0 ................
    !byte $00,$00,$8f,$9c,$a1,$00,$00,$00,$00,$00,$00,$00,$92,$9c,$9b,$9d   ; 69f0 ....!...........
    !byte $9a,$9c,$a0,$00,$00,$00,$00,$94,$00,$00,$00,$00,$00,$00,$92,$7f   ; 6a00 .. .............
    !byte $7f,$02,$05,$03,$04,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6a10 ................
    !byte $00,$00,$00,$00,$91,$9b,$9e,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6a20 ................
    !byte $00,$00,$91,$9d,$9e,$00,$98,$96,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6a30 ................
    !byte $7f,$00,$00,$01,$05,$06,$03,$00,$00,$9c,$a1,$00,$00,$00,$9c,$9f   ; 6a40 ..........!.....
    !byte $00,$00,$00,$00,$00,$00,$90,$9a,$a0,$00,$00,$00,$00,$00,$00,$00   ; 6a50 ........ .......
    !byte $00,$00,$00,$99,$a2,$9b,$97,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6a60 ...."...........
    !byte $7f,$00,$00,$00,$00,$04,$03,$01,$05,$00,$91,$9f,$00,$00,$00,$92   ; 6a70 ................
    !byte $9d,$9e,$00,$00,$00,$00,$00,$00,$92,$9d,$9f,$00,$00,$00,$00,$00   ; 6a80 ................
    !byte $00,$00,$98,$97,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6a90 ................
    !byte $7f,$00,$00,$00,$00,$00,$02,$04,$06,$00,$00,$8f,$9b,$9c,$9a,$a0   ; 6aa0 ............... 
    !byte $00,$8f,$9a,$a1,$00,$00,$00,$00,$00,$00,$8f,$9e,$00,$00,$00,$00   ; 6ab0 ...!............
    !byte $00,$99,$96,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6ac0 ................
    !byte $7f,$00,$00,$00,$00,$00,$00,$01,$03,$05,$00,$00,$00,$00,$00,$90   ; 6ad0 ................
    !byte $9e,$00,$00,$91,$a0,$00,$00,$00,$00,$00,$48,$93,$00,$00,$00,$b0   ; 6ae0 .... .....H....0
    !byte $a5,$bc,$49,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6af0 %<I.............
    !byte $7f,$00,$00,$00,$00,$00,$00,$00,$02,$06,$04,$00,$00,$00,$00,$00   ; 6b00 ................
    !byte $92,$a1,$00,$00,$90,$9f,$00,$00,$00,$00,$99,$96,$00,$b1,$a6,$aa   ; 6b10 .!...........1&*
    !byte $b2,$ae,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6b20 2...............
    !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$05,$01,$06,$00,$a0,$00,$00   ; 6b30 ............. ..
    !byte $00,$8f,$9f,$00,$00,$92,$9e,$00,$00,$00,$95,$00,$af,$ab,$bf,$b3   ; 6b40 ............/+?3
    !byte $ad,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6b50 -...............
    !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$01,$02,$04,$03,$90,$a1,$00   ; 6b60 ..............!.
    !byte $00,$00,$91,$a0,$49,$00,$93,$00,$00,$98,$97,$00,$a4,$bf,$bf,$a8   ; 6b70 ... I.......$??(
    !byte $b4,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6b80 4...............
    !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$05,$03,$06,$02,$01,$8f,$9f   ; 6b90 ................
    !byte $00,$00,$00,$92,$ba,$a5,$bb,$a6,$a7,$bc,$b6,$ac,$bf,$bf,$bf,$b2   ; 6ba0 ....:%;&'<6,???2
    !byte $ae,$00,$4a,$98,$9a,$9d,$9c,$9f,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6bb0 ..J.............
    !byte $7f,$00,$00,$04,$05,$01,$05,$02,$03,$06,$01,$04,$05,$06,$02,$91   ; 6bc0 ................
    !byte $9e,$00,$00,$b0,$aa,$bf,$bf,$bf,$b2,$ad,$b7,$b8,$b8,$b9,$a3,$b5   ; 6bd0 ...0*???2-7889#5
    !byte $99,$9d,$9b,$96,$00,$00,$00,$94,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6be0 ................
    !byte $7f,$00,$00,$05,$03,$06,$04,$01,$04,$02,$00,$03,$04,$01,$06,$00   ; 6bf0 ................
    !byte $92,$ba,$a7,$ab,$bf,$bf,$bf,$bf,$a8,$b4,$00,$00,$b0,$aa,$bf,$a9   ; 6c00 .:'+????(4..0*?)
    !byte $bb,$a6,$a7,$b4,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6c10 ;&'4............
    !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6c20 ................
    !byte $b1,$ac,$bf,$bf,$bf,$bf,$bf,$bf,$bf,$a9,$b5,$af,$ab,$bf,$bf,$bf   ; 6c30 1,???????)5/+???
    !byte $bf,$bf,$bf,$a9,$a5,$b5,$05,$04,$02,$03,$06,$01,$06,$02,$01,$7f   ; 6c40 ???)%5..........
    !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6c50 ................
    !byte $a4,$bf,$bf,$bf,$bf,$bf,$bf,$bf,$bf,$bf,$a8,$ac,$bf,$bf,$bf,$bf   ; 6c60 $?????????(,????
    !byte $bf,$bf,$bf,$bf,$bf,$a8,$a6,$a7,$b5,$01,$02,$03,$04,$03,$03,$7f   ; 6c70 ?????(&'5.......
    !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6c80 ................
    !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6c90 ................
    !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6ca0 ................
    !byte $7f                                                               ; 6cb0 .
STKTAB:  ; joystick decoding table
    !byte $ff,$ff,$ff,$ff,$ff,$ff,$ff,$01,$ff,$ff,$ff,$03,$ff,$02,$00       ; 6cb1 ...............
SSNCOD:  ; season codes
    !byte $ff,$28,$28,$28,$14,$00,$00,$00,$00,$00,$14,$28,$28               ; 6cc0 .(((.......((
TRNTAB:  ; terrain cost tables
    !byte $06,$0c,$08,$00,$00,$12,$0e,$08,$14,$80,$04,$08,$06,$00,$00,$12   ; 6ccd ................
    !byte $0d,$06,$10,$80,$18,$1e,$18,$00,$00,$1e,$1e,$1a,$1c,$80,$1e,$1e   ; 6cdd ................
    !byte $1e,$00,$00,$1e,$1e,$1e,$1e,$80,$0a,$10,$0a,$0c,$0c,$18,$1c,$0c   ; 6ced ................
    !byte $18,$80,$06,$0a,$08,$08,$08,$18,$1c,$08,$14,$80                   ; 6cfd ............
BHX1:  ; intraversible square-pair coords
    !byte $28,$27,$26,$24,$23,$22,$16,$0f,$0f,$0e,$28,$27,$26,$23,$23,$22   ; 6d09 ('&$#"....('&##"
    !byte $16,$0f,$0e,$0e,$13,$13                                           ; 6d19 ......
BHY1:
    !byte $23,$23,$23,$21,$24,$24,$04,$07,$07,$08,$24,$24,$24,$21,$25,$25   ; 6d1f ###!$$....$$$!%%
    !byte $03,$06,$07,$07,$04,$03                                           ; 6d2f ......
BHX2:
    !byte $28,$27,$26,$23,$23,$22,$16,$0f,$0e,$0e,$28,$27,$26,$24,$23,$22   ; 6d35 ('&##"....('&$#"
    !byte $16,$0f,$0f,$0e,$13,$13                                           ; 6d45 ......
BHY2:
    !byte $24,$24,$24,$21,$25,$25,$03,$06,$07,$07,$23,$23,$23,$21,$24,$24   ; 6d4b $$$!%%....###!$$
    !byte $04,$07,$07,$08,$03,$04                                           ; 6d5b ......
EXEC:  ; unit execution times
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6d61 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6d71 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6d81 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6d91 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6da1 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6db1 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6dc1 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6dd1 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6de1 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00       ; 6df1 ...............

INIT:       ldx #$08                         ; 6e00 a208    Main entry point
_INIT_1:    lda ZPVAL,x                      ; 6e02 bdb673  . init for DLSTPT/2, MAP/2, CORPS, CURS{X|Y}/2
            sta DLSTPTL,x                    ; 6e05 95b0    . Zero page pointer to display list
            lda COLTAB,x                     ; 6e07 bdcf73  
            sta PCOLR0,x                     ; 6e0a 9dc002  . Color of player 0 and missile 0, shadows $D012
            dex                              ; 6e0d ca      
            bpl _INIT_1                      ; 6e0e 10f2    
            ldx #$0f                         ; 6e10 a20f    
_INIT_2:    lda PSXVAL,x                     ; 6e12 bdbf73  initialize page six values
            sta XPOSL,x                      ; 6e15 9d0006  . Horiz pos of upper left of screen window
            dex                              ; 6e18 ca      
            bpl _INIT_2                      ; 6e19 10f7    
            lda #$00                         ; 6e1b a900    
            sta SDLSTLL                      ; 6e1d 8d3002  . Starting address of the display list
            sta HSCROL                       ; 6e20 8d04d4  . Horizontal scroll enable
            sta VSCROL                       ; 6e23 8d05d4  . Vertical scroll enable
            lda DLSTPTH                      ; 6e26 a5b1    
            sta SDLSTLH                      ; 6e28 8d3102  . Starting address of the display list
            ldx #$00                         ; 6e2b a200    
_INIT_3:    lda MSTRNG,x                     ; 6e2d bd3e55  . muster strengths
            sta CSTRNG,x                     ; 6e30 9ddd55  . combat strengths
            lda #$00                         ; 6e33 a900    
            sta HMORDS,x                     ; 6e35 9d755d  . how many orders queued for each unit
            lda #$ff                         ; 6e38 a9ff    
            sta EXEC,x                       ; 6e3a 9d616d  . unit execution times
            inx                              ; 6e3d e8      
            cpx #$a0                         ; 6e3e e0a0    
            bne _INIT_3                      ; 6e40 d0eb    
            lda #$50                         ; 6e42 a950    Now set up player window
            sta PMBASE                       ; 6e44 8d07d4  . MSB of the player/missile base address
            lda #$2f                         ; 6e47 a92f    here follow various initializations
            sta SDMCTL                       ; 6e49 8d2f02  . Direct Memory Access (DMA) enable
            lda #$03                         ; 6e4c a903    Enable players and missiles
            sta GRACTL                       ; 6e4e 8d1dd0  . Used with DMACTLto latch all stick and paddle triggers
            lda #$78                         ; 6e51 a978    
            sta HPOSP0 / M0PF                ; 6e53 8d00d0  . W: h.pos of P0 / R: missile 0 to pf collision
            lda #$01                         ; 6e56 a901    
            sta HANDCP                       ; 6e58 8d8f06  
            sta GPRIOR                       ; 6e5b 8d6f02  . Priority selection register
            sta SIZEP0 / M0PL                ; 6e5e 8d08d0  . W: width of P0 / R: missile 0 to plyr collisions
            ldx #$33                         ; 6e61 a233    
            lda #$ff                         ; 6e63 a9ff    
            sta PLYR0,x                      ; 6e65 9d0052  . Player 0 sprite data
            inx                              ; 6e68 e8      
            sta PLYR0,x                      ; 6e69 9d0052  . Player 0 sprite data
            inx                              ; 6e6c e8      
            lda #$81                         ; 6e6d a981    
_INIT_4:    sta PLYR0,x                      ; 6e6f 9d0052  . Player 0 sprite data
            inx                              ; 6e72 e8      
            cpx #$3f                         ; 6e73 e03f    
            bne _INIT_4                      ; 6e75 d0f8    
            lda #$ff                         ; 6e77 a9ff    
            sta PLYR0,x                      ; 6e79 9d0052  . Player 0 sprite data
            sta TURN                         ; 6e7c 85c9    
            inx                              ; 6e7e e8      
            sta PLYR0,x                      ; 6e7f 9d0052  . Player 0 sprite data
            ldy #$00                         ; 6e82 a000    Set VVBLKD handler to $7400, DLISRV to $7b00
            ldx #$74                         ; 6e84 a274    
            lda #$07                         ; 6e86 a907    
            jsr SETVBV                       ; 6e88 205ce4  . Set system timers during the VBLANK routine
            lda #$00                         ; 6e8b a900    This is DLI vector (low byte)
            sta VDSLSTL                      ; 6e8d 8d0002  . The vector for NMI Display List Interrupts (DLI)
            lda #$7b                         ; 6e90 a97b    
            sta VDSLSTH                      ; 6e92 8d0102  . The vector for NMI Display List Interrupts (DLI)
            lda #$c0                         ; 6e95 a9c0    
            sta NMIEN                        ; 6e97 8d0ed4  . Non-maskable interrupt (NMI) enable
NEWTRN:     inc TURN                         ; 6e9a e6c9    
            lda DAY                          ; 6e9c ad0b06  first do calendar calculations
            clc                              ; 6e9f 18      
            adc #$07                         ; 6ea0 6907    
            ldx MONTH                        ; 6ea2 ae0c06  
            cmp MONLEN,x                     ; 6ea5 dd685d  . table of month lengths
            beq _NEWTRN_3                    ; 6ea8 f027    
            bcc _NEWTRN_3                    ; 6eaa 9025    
            cpx #$02                         ; 6eac e002    
            bne _NEWTRN_1                    ; 6eae d00a    
            ldy YEAR                         ; 6eb0 ac0d06  . last chr of YRSTR = $11 or $12 for 1941/1942
            cpy #$2c                         ; 6eb3 c02c    
            bne _NEWTRN_1                    ; 6eb5 d003    
            sec                              ; 6eb7 38      
            sbc #$01                         ; 6eb8 e901    
_NEWTRN_1:  sec                              ; 6eba 38      
            sbc MONLEN,x                     ; 6ebb fd685d  . table of month lengths
            inx                              ; 6ebe e8      
            cpx #$0d                         ; 6ebf e00d    
            bne _NEWTRN_2                    ; 6ec1 d005    
            inc YEAR                         ; 6ec3 ee0d06  . last chr of YRSTR = $11 or $12 for 1941/1942
            ldx #$01                         ; 6ec6 a201    
_NEWTRN_2:  stx MONTH                        ; 6ec8 8e0c06  
            ldy TRTAB,x                      ; 6ecb bcea5f  
            sty TRCOLR                       ; 6ece 8c0506  
_NEWTRN_3:  sta DAY                          ; 6ed1 8d0b06  
            ldy #$93                         ; 6ed4 a093    
            lda #$00                         ; 6ed6 a900    
_NEWTRN_4:  sta TXTWDW,y                     ; 6ed8 995064  
            iny                              ; 6edb c8      
            cpy #$a7                         ; 6edc c0a7    
            bne _NEWTRN_4                    ; 6ede d0f8    
            ldy #$93                         ; 6ee0 a093    
            txa                              ; 6ee2 8a      
            clc                              ; 6ee3 18      
            adc #$10                         ; 6ee4 6910    
            jsr DWORDS                       ; 6ee6 20c079  
            lda DAY                          ; 6ee9 ad0b06  
            jsr DNUMBR                       ; 6eec 20b27b  
            lda #$0c                         ; 6eef a90c    
            sta TXTWDW,y                     ; 6ef1 995064  
            iny                              ; 6ef4 c8      
            iny                              ; 6ef5 c8      
            lda #$11                         ; 6ef6 a911    
            sta TXTWDW,y                     ; 6ef8 995064  
            iny                              ; 6efb c8      
            lda #$19                         ; 6efc a919    
            sta TXTWDW,y                     ; 6efe 995064  
            iny                              ; 6f01 c8      
            ldx YEAR                         ; 6f02 ae0d06  . last chr of YRSTR = $11 or $12 for 1941/1942
            lda #$14                         ; 6f05 a914    
            sta TXTWDW,y                     ; 6f07 995064  
            iny                              ; 6f0a c8      
            lda ODIGIT,x                     ; 6f0b bd085c  . ones digits tables
            clc                              ; 6f0e 18      
            adc #$10                         ; 6f0f 6910    
            sta TXTWDW,y                     ; 6f11 995064  
            lda MONTH                        ; 6f14 ad0c06  now do season calculations
            cmp #$04                         ; 6f17 c904    
            bne _NEWTRN_5                    ; 6f19 d017    
            lda #$02                         ; 6f1b a902    
            sta EARTH                        ; 6f1d 8d0606  
            lda #$40                         ; 6f20 a940    
            sta SEASN1                       ; 6f22 8d0806  
            lda #$01                         ; 6f25 a901    
            sta SEASN3                       ; 6f27 8d0a06  
            lda #$00                         ; 6f2a a900    
            sta SEASN2                       ; 6f2c 8d0906  
            jmp ENDSSN                       ; 6f2f 4ceb6f  

_NEWTRN_5:  cmp #$0a                         ; 6f32 c90a    
            bne _NEWTRN_6                    ; 6f34 d008    
            lda #$02                         ; 6f36 a902    
            sta EARTH                        ; 6f38 8d0606  
            jmp ENDSSN                       ; 6f3b 4ceb6f  

_NEWTRN_6:  cmp #$05                         ; 6f3e c905    
            bne _NEWTRN_7                    ; 6f40 d008    
            lda #$10                         ; 6f42 a910    
            sta EARTH                        ; 6f44 8d0606  
            jmp ENDSSN                       ; 6f47 4ceb6f  

_NEWTRN_7:  cmp #$0b                         ; 6f4a c90b    
            bne _NEWTRN_8                    ; 6f4c d008    
            lda #$0a                         ; 6f4e a90a    
            sta EARTH                        ; 6f50 8d0606  
            jmp FRZRVRS                      ; 6f53 4c716f  

_NEWTRN_8:  cmp #$01                         ; 6f56 c901    
            bne _NEWTRN_9                    ; 6f58 d010    
            lda #$80                         ; 6f5a a980    
            sta SEASN1                       ; 6f5c 8d0806  
            lda #$ff                         ; 6f5f a9ff    
            sta SEASN2                       ; 6f61 8d0906  
            sta SEASN3                       ; 6f64 8d0a06  
            jmp ENDSSN                       ; 6f67 4ceb6f  

_NEWTRN_9:  cmp #$03                         ; 6f6a c903    
            beq FRZRVRS                      ; 6f6c f003    
            jmp ENDSSN                       ; 6f6e 4ceb6f  

FRZRVRS:    lda SKREST / RANDOM              ; 6f71 ad0ad2  freeze those rivers, baby
            and #$07                         ; 6f74 2907    
            clc                              ; 6f76 18      
            adc #$07                         ; 6f77 6907    
            eor SEASN2                       ; 6f79 4d0906  
            sta TEMPR                        ; 6f7c 85c5    
            lda ICELAT                       ; 6f7e ad0706  
            sta OLDLAT                       ; 6f81 8d2a06  
            sec                              ; 6f84 38      
            sbc TEMPR                        ; 6f85 e5c5    
            beq _FRZRVRS_1                   ; 6f87 f002    
            bpl _FRZRVRS_2                   ; 6f89 1002    
_FRZRVRS_1: lda #$01                         ; 6f8b a901    
_FRZRVRS_2: cmp #$27                         ; 6f8d c927    
            bcc _FRZRVRS_3                   ; 6f8f 9002    
            lda #$27                         ; 6f91 a927    
_FRZRVRS_3: sta ICELAT                       ; 6f93 8d0706  
            lda #$01                         ; 6f96 a901    
            sta CHUNKX                       ; 6f98 85be    . Cursor coords (pixel frame)
            sta LON                          ; 6f9a 85cb    
            lda OLDLAT                       ; 6f9c ad2a06  
            sta CHUNKY                       ; 6f9f 85bf    
            sta LAT                          ; 6fa1 85ca    
__L__:      jsr TERR                         ; 6fa3 204072  . TRNCOD <- terrain chr @ LAT/LON, maybe under unit
            and #$3f                         ; 6fa6 293f    
            cmp #$0b                         ; 6fa8 c90b    
            bcc NOTCH                        ; 6faa 901d    
            cmp #$29                         ; 6fac c929    
            bcs NOTCH                        ; 6fae b019    
            ldx CHUNKY                       ; 6fb0 a6bf    
            cpx #$0e                         ; 6fb2 e00e    
            bcs _L_1                         ; 6fb4 b004
            cmp #$23                         ; 6fb6 c923    
            bcs NOTCH                        ; 6fb8 b00f    
_L_1:       ora SEASN1                       ; 6fba 0d0806
            ldx UNITNO                       ; 6fbd a6c3    
            beq _L_2                         ; 6fbf f006
            sta SWAP,x                       ; 6fc1 9d7c56  . terrain code underneath unit
            jmp NOTCH                        ; 6fc4 4cc96f  

_L_2:       sta (MAPPTRL),y                  ; 6fc7 91c0
NOTCH:      inc CHUNKX                       ; 6fc9 e6be    . Cursor coords (pixel frame)
            lda CHUNKX                       ; 6fcb a5be    . Cursor coords (pixel frame)
            sta LON                          ; 6fcd 85cb    
            cmp #$2e                         ; 6fcf c92e    
            bne __L__                        ; 6fd1 d0d0
            lda #$00                         ; 6fd3 a900    
            sta CHUNKX                       ; 6fd5 85be    . Cursor coords (pixel frame)
            sta LON                          ; 6fd7 85cb    
            lda CHUNKY                       ; 6fd9 a5bf    
            cmp ICELAT                       ; 6fdb cd0706  
            beq ENDSSN                       ; 6fde f00b    
            sec                              ; 6fe0 38      
            sbc SEASN3                       ; 6fe1 ed0a06  
            sta CHUNKY                       ; 6fe4 85bf    
            sta LAT                          ; 6fe6 85ca    
            jmp __L__                        ; 6fe8 4ca36f

ENDSSN:     ldx #$9e                         ; 6feb a29e    any reinforcements?
_ENDSSN_1:  lda ARRIVE,x                     ; 6fed bd1b57  . arrival turns
            cmp TURN                         ; 6ff0 c5c9    
            bne __M__                        ; 6ff2 d02c
            lda CORPSX,x                     ; 6ff4 bd0054  . longitude of all units
            sta CHUNKX                       ; 6ff7 85be    . Cursor coords (pixel frame)
            sta LON                          ; 6ff9 85cb    
            lda CORPSY,x                     ; 6ffb bd9f54  . latitude of all units
            sta CHUNKY                       ; 6ffe 85bf    
            sta LAT                          ; 7000 85ca    
            stx CORPS                        ; 7002 86b4    . Number of unit under window
            jsr TERRB                        ; 7004 204672  . TRNCOD <- chr @ LAT/LON, zero set if it's a unit
            beq SORRY                        ; 7007 f00f
            cpx #$37                         ; 7009 e037    
            bcs _ENDSSN_2                    ; 700b b005    
            lda #$0a                         ; 700d a90a    
            sta TXTWDW+36                    ; 700f 8d7464  
_ENDSSN_2:  jsr SWITCH                       ; 7012 20ef79  . Swap map CHUNKX/Y with SWAP,x; x = CORPS, y = map offset
            jmp __M__                        ; 7015 4c2070

SORRY:      lda TURN                         ; 7018 a5c9    if taret occupied, delay a turn
            clc                              ; 701a 18      
            adc #$01                         ; 701b 6901    
            sta ARRIVE,x                     ; 701d 9d1b57  . arrival turns
__M__:      dex                              ; 7020 ca
            bne _ENDSSN_1                    ; 7021 d0ca    
            ldx #$9e                         ; 7023 a29e    
_M_1:       stx ARMY                         ; 7025 86c2
            jsr SUPPLY                       ; 7027 209150  . supply evaluation routine
            ldx ARMY                         ; 702a a6c2    
            dex                              ; 702c ca      
            bne _M_1                         ; 702d d0f6
            lda #$00                         ; 702f a900    calculate some points
            sta ACCLO                        ; 7031 85c7    
            sta ACCHI                        ; 7033 85c8    
            ldx #$01                         ; 7035 a201    
_M_2:       lda #$30                         ; 7037 a930
            sec                              ; 7039 38      
            sbc CORPSX,x                     ; 703a fd0054  . longitude of all units
            sta TEMPR                        ; 703d 85c5    
            lda MSTRNG,x                     ; 703f bd3e55  . muster strengths
            lsr                              ; 7042 4a      
            beq _M_5                         ; 7043 f012
            tay                              ; 7045 a8      
            lda #$00                         ; 7046 a900    
            clc                              ; 7048 18      
_M_3:       adc TEMPR                        ; 7049 65c5
            bcc _M_4                         ; 704b 9007
            inc ACCHI                        ; 704d e6c8    
            clc                              ; 704f 18      
            bne _M_4                         ; 7050 d002
            dec ACCHI                        ; 7052 c6c8    
_M_4:       dey                              ; 7054 88
            bne _M_3                         ; 7055 d0f2
_M_5:       inx                              ; 7057 e8
            cpx #$37                         ; 7058 e037    
            bne _M_2                         ; 705a d0db
_M_6:       lda CORPSX,x                     ; 705c bd0054  . longitude of all units
            sta TEMPR                        ; 705f 85c5    
            lda CSTRNG,x                     ; 7061 bddd55  . combat strengths
            lsr                              ; 7064 4a      
            lsr                              ; 7065 4a      
            lsr                              ; 7066 4a      
            beq _M_9                         ; 7067 f012
            tay                              ; 7069 a8      
            lda #$00                         ; 706a a900    
            clc                              ; 706c 18      
_M_7:       adc TEMPR                        ; 706d 65c5
            bcc _M_8                         ; 706f 9007
            inc ACCLO                        ; 7071 e6c7    
            clc                              ; 7073 18      
            bne _M_8                         ; 7074 d002
            dec ACCLO                        ; 7076 c6c7    
_M_8:       dey                              ; 7078 88
            bne _M_7                         ; 7079 d0f2
_M_9:       inx                              ; 707b e8
            cpx #$9e                         ; 707c e09e    
            bne _M_6                         ; 707e d0dc
            lda ACCHI                        ; 7080 a5c8    
            sec                              ; 7082 38      
            sbc ACCLO                        ; 7083 e5c7    
            bcs _M_10                        ; 7085 b002
            lda #$00                         ; 7087 a900    
_M_10:      ldx #$03                         ; 7089 a203
_M_11:      ldy MOSCOW,x                     ; 708b bcea71
            beq _M_12                        ; 708e f008
            clc                              ; 7090 18      
            adc MOSCPTS,x                    ; 7091 7dd873  
            bcc _M_12                        ; 7094 9002
            lda #$ff                         ; 7096 a9ff    
_M_12:      dex                              ; 7098 ca
            bpl _M_11                        ; 7099 10f0
            ldx HANDCP                       ; 709b ae8f06  was handicap option used?
            bne _M_13                        ; 709e d001    no
            lsr                              ; 70a0 4a      yes, halve score
_M_13:      ldy #$05                         ; 70a1 a005
            jsr DNUMBR                       ; 70a3 20b27b  
            lda #$00                         ; 70a6 a900    
            sta TXTWDW,y                     ; 70a8 995064  
            lda TURN                         ; 70ab a5c9    
            cmp #$28                         ; 70ad c928    game ends after scoring on turn 40
            bne _FINI_1                      ; 70af d008    
            lda #$01                         ; 70b1 a901    end of game
            jsr TXTMSG                       ; 70b3 20e473  . Display TXTTBL msg X
FINI:       jmp FINI                         ; 70b6 4cb670  GAME OVER!

_FINI_1:    lda #$00                         ; 70b9 a900    
            sta BUTMSK                       ; 70bb 8d0f06  . 0 allows trigger, 1 prevents
            sta CORPS                        ; 70be 85b4    . Number of unit under window
            jsr TXTMSG                       ; 70c0 20e473  . Display TXTTBL msg X
            jsr THINK                        ; 70c3 200047  . Initialize AI.  NB call with A=0; X indexes TOTGS/TOTRS
            lda #$01                         ; 70c6 a901    
            sta BUTMSK                       ; 70c8 8d0f06  . 0 allows trigger, 1 prevents
            lda #$02                         ; 70cb a902    
            jsr TXTMSG                       ; 70cd 20e473  . Display TXTTBL msg X
            lda #$00                         ; 70d0 a900    movement execution phase
            sta TICK                         ; 70d2 8d2e06  
            ldx #$9e                         ; 70d5 a29e    
_FINI_2:    stx ARMY                         ; 70d7 86c2    
            jsr CALCEXC                      ; 70d9 20d172  . init calc EXEC,x for next order (was DINGO)
            dex                              ; 70dc ca      
            bne _FINI_2                      ; 70dd d0f8    
__N__:      ldx #$9e                         ; 70df a29e
MOVELP:     stx ARMY                         ; 70e1 86c2
            lda MSTRNG,x                     ; 70e3 bd3e55  . muster strengths
            sec                              ; 70e6 38      
            sbc CSTRNG,x                     ; 70e7 fddd55  . combat strengths
            cmp #$02                         ; 70ea c902    
            bcc _MOVELP_1                    ; 70ec 900b    if CSTRNG <= MSTRNG - 2, recover 1 + coin-flip
            inc CSTRNG,x                     ; 70ee fedd55  . combat strengths
            cmp SKREST / RANDOM              ; 70f1 cd0ad2  . W: Reset serial port status register / R: Random byte
            bcc _MOVELP_1                    ; 70f4 9003
            inc CSTRNG,x                     ; 70f6 fedd55  . combat strengths
_MOVELP_1:  lda EXEC,x                       ; 70f9 bd616d  . unit execution times
            bmi _TRJAM_1                     ; 70fc 3045    
            cmp TICK                         ; 70fe cd2e06  
            bne _TRJAM_1                     ; 7101 d040    
            lda WHORDS,x                     ; 7103 bd145e  . what unit orders are (2 bits per order)
            and #$03                         ; 7106 2903    
            tay                              ; 7108 a8      
            lda CORPSX,x                     ; 7109 bd0054  . longitude of all units
            clc                              ; 710c 18      
            adc XINC,y                       ; 710d 79f27b  
            sta LON                          ; 7110 85cb    
            sta ACCLO                        ; 7112 85c7    
            lda CORPSY,x                     ; 7114 bd9f54  . latitude of all units
            clc                              ; 7117 18      
            adc YINC,y                       ; 7118 79f17b  . note YINC/XINC overlap
            sta LAT                          ; 711b 85ca    
            sta ACCHI                        ; 711d 85c8    
            jsr TERR                         ; 711f 204072  . TRNCOD <- terrain chr @ LAT/LON, maybe under unit
            lda UNITNO                       ; 7122 a5c3    
            beq _DOMOVE_1                    ; 7124 f02a    
            cmp #$37                         ; 7126 c937    
            bcc _MOVELP_2                    ; 7128 9008
            lda ARMY                         ; 712a a5c2    
            cmp #$37                         ; 712c c937    
            bcs TRJAM                        ; 712e b008    
            bcc DOCOMBAT                     ; 7130 9014    
_MOVELP_2:  lda ARMY                         ; 7132 a5c2
            cmp #$37                         ; 7134 c937    
            bcs DOCOMBAT                     ; 7136 b00e    
TRJAM:      ldx ARMY                         ; 7138 a6c2    
            lda TICK                         ; 713a ad2e06  
            clc                              ; 713d 18      
            adc #$02                         ; 713e 6902    
            sta EXEC,x                       ; 7140 9d616d  . unit execution times
_TRJAM_1:   jmp MOVENXT                      ; 7143 4cd271  

DOCOMBAT:   jsr COMBAT                       ; 7146 20d84e  
            lda VICTRY                       ; 7149 ad9706  
            beq _TRJAM_1                     ; 714c f0f5    
DOMOVE:     bne _DOMOVE_2                    ; 714e d02e    
_DOMOVE_1:  ldx ARMY                         ; 7150 a6c2    
            stx CORPS                        ; 7152 86b4    . Number of unit under window
            lda CORPSY,x                     ; 7154 bd9f54  . latitude of all units
            sta CHUNKY                       ; 7157 85bf    
            sta LAT                          ; 7159 85ca    
            lda CORPSX,x                     ; 715b bd0054  . longitude of all units
            sta CHUNKX                       ; 715e 85be    . Cursor coords (pixel frame)
            sta LON                          ; 7160 85cb    
            jsr CHKZOC                       ; 7162 204051  
            lda ACCHI                        ; 7165 a5c8    
            sta LAT                          ; 7167 85ca    
            lda ACCLO                        ; 7169 a5c7    
            sta LON                          ; 716b 85cb    
            lda ZOC                          ; 716d ad9406  
            cmp #$02                         ; 7170 c902    
            bcc _DOMOVE_2                    ; 7172 900a    
            jsr CHKZOC                       ; 7174 204051  
            lda ZOC                          ; 7177 ad9406  
            cmp #$02                         ; 717a c902    
            bcs TRJAM                        ; 717c b0ba    delay +2 ticks if trying to move between ZOC
_DOMOVE_2:  jsr SWITCH                       ; 717e 20ef79  . Swap map CHUNKX/Y with SWAP,x; x = CORPS, y = map offset
            ldx CORPS                        ; 7181 a6b4    . Number of unit under window
            lda LAT                          ; 7183 a5ca    
            sta CHUNKY                       ; 7185 85bf    
            sta CORPSY,x                     ; 7187 9d9f54  . latitude of all units
            lda LON                          ; 718a a5cb    
            sta CHUNKX                       ; 718c 85be    . Cursor coords (pixel frame)
            sta CORPSX,x                     ; 718e 9d0054  . longitude of all units
            jsr SWITCH                       ; 7191 20ef79  . Swap map CHUNKX/Y with SWAP,x; x = CORPS, y = map offset
            ldx ARMY                         ; 7194 a6c2    
            lda #$ff                         ; 7196 a9ff    
            sta EXEC,x                       ; 7198 9d616d  . unit execution times
            dec HMORDS,x                     ; 719b de755d  . how many orders queued for each unit
            beq MOVENXT                      ; 719e f032    
            lsr WHORDH,x                     ; 71a0 5eb35e  . unit orders (high bits?)
            ror WHORDS,x                     ; 71a3 7e145e  . what unit orders are (2 bits per order)
            lsr WHORDH,x                     ; 71a6 5eb35e  . unit orders (high bits?)
            ror WHORDS,x                     ; 71a9 7e145e  . what unit orders are (2 bits per order)
            ldy #$03                         ; 71ac a003    
_DOMOVE_3:  lda CORPSX,x                     ; 71ae bd0054  . longitude of all units
            cmp MOSCX,y                      ; 71b1 d9dc73  
            bne _DOMOVE_5                    ; 71b4 d013    
            lda CORPSY,x                     ; 71b6 bd9f54  . latitude of all units
            cmp MOSCY,y                      ; 71b9 d9e073  
            bne _DOMOVE_5                    ; 71bc d00b    
            lda #$ff                         ; 71be a9ff    
            cpx #$37                         ; 71c0 e037    
            bcc _DOMOVE_4                    ; 71c2 9002    
            lda #$00                         ; 71c4 a900    
_DOMOVE_4:  sta MOSCOW,y                     ; 71c6 99ea71  
_DOMOVE_5:  dey                              ; 71c9 88      
            bpl _DOMOVE_3                    ; 71ca 10e2    
            jsr CALCEXC                      ; 71cc 20d172  . init calc EXEC,x for next order (was DINGO)
            jsr STALL                        ; 71cf 200072  
MOVENXT:    ldx ARMY                         ; 71d2 a6c2    
            dex                              ; 71d4 ca      
            beq _MOVENXT_1                   ; 71d5 f003    
            jmp MOVELP                       ; 71d7 4ce170

_MOVENXT_1: inc TICK                         ; 71da ee2e06  
            lda TICK                         ; 71dd ad2e06  
            cmp #$20                         ; 71e0 c920    
            beq _MOVENXT_2                   ; 71e2 f003    
            jmp __N__                        ; 71e4 4cdf70

_MOVENXT_2: jmp NEWTRN                       ; 71e7 4c9a6e  end of movement phase

MOSCOW:
    !byte $00,$00,$00,$00,$22,$50,$a6,$c2,$ca,$f0,$03,$4c,$ff,$70,$ee,$2e   ; 71ea ...."P&BJp.L.pn.
    !byte $06,$ad,$2e,$06,$c9,$20                                           ; 71fa .-..I 

STALL:      lda #$00                         ; 7200 a900    
_STALL_1:   pha                              ; 7202 48      
            pla                              ; 7203 68      
            pha                              ; 7204 48      
            pla                              ; 7205 68      
            pha                              ; 7206 48      
            pla                              ; 7207 68      
            adc #$01                         ; 7208 6901    
            bne _STALL_1                     ; 720a d0f6    
            rts                              ; 720c 60      

    !byte $4c,$9a,$6e                                                       ; 720d L.n

DEBUG:      lda #$00                         ; 7210 a900    debugging routine, can't be reached by any route any longer
            sta GRACTL                       ; 7212 8d1dd0  . Used with DMACTLto latch all stick and paddle triggers
            sta GRAFP0 / P1PL                ; 7215 8d0dd0  . W: gfx shape for P0 / R: player 1 to plyr collisions
            sta GRAFP1 / P2PL                ; 7218 8d0ed0  . W: gfx shape for P1 / R: player 2 to plyr collisions
            sta GRAFP2 / P3PL                ; 721b 8d0fd0  . W: gfx shape for P2 / R: player 3 to plyr collisions
            lda #$22                         ; 721e a922    
            sta SDMCTL                       ; 7220 8d2f02  . Direct Memory Access (DMA) enable
            lda #$20                         ; 7223 a920    
            sta SDLSTLL                      ; 7225 8d3002  . Starting address of the display list
            lda #$bc                         ; 7228 a9bc    
            sta SDLSTLH                      ; 722a 8d3102  . Starting address of the display list
            lda #$40                         ; 722d a940    
            sta NMIEN                        ; 722f 8d0ed4  . Non-maskable interrupt (NMI) enable
            lda #$0a                         ; 7232 a90a    
            sta COLOR1                       ; 7234 8dc502  . Color register 1, color of playfield 1, shadows $D017
            lda #$00                         ; 7237 a900    
            sta DBGFLG                       ; 7239 8dff5f  . output by debug routine
            sta COLOR4                       ; 723c 8dc802  . Background and border color, shadows $D01A
            brk                              ; 723f 00      
TERR:       jsr TERRB                        ; 7240 204672  TRNCOD <- terrain chr @ LAT/LON, maybe under unit
            beq LOOKUP                       ; 7243 f046    
            rts                              ; 7245 60      

TERRB:      lda #$00                         ; 7246 a900    TRNCOD <- chr @ LAT/LON, zero set if it's a unit
            sta MAPPTRH                      ; 7248 85c1    
            sta UNITNO                       ; 724a 85c3    
            lda #$27                         ; 724c a927    
            sec                              ; 724e 38      
            sbc LAT                          ; 724f e5ca    
            asl                              ; 7251 0a      
            rol MAPPTRH                      ; 7252 26c1    
            asl                              ; 7254 0a      
            rol MAPPTRH                      ; 7255 26c1    
            asl                              ; 7257 0a      
            rol MAPPTRH                      ; 7258 26c1    
            asl                              ; 725a 0a      
            rol MAPPTRH                      ; 725b 26c1    
            sta TLO                          ; 725d 8d2c06  
            ldy MAPPTRH                      ; 7260 a4c1    
            sty THI                          ; 7262 8c2d06  
            asl                              ; 7265 0a      
            rol MAPPTRH                      ; 7266 26c1    
            clc                              ; 7268 18      
            adc TLO                          ; 7269 6d2c06  
            sta MAPPTRL                      ; 726c 85c0    
            lda MAPPTRH                      ; 726e a5c1    
            adc THI                          ; 7270 6d2d06  
            adc #$65                         ; 7273 6965    
            sta MAPPTRH                      ; 7275 85c1    
            lda #$2e                         ; 7277 a92e    
            sec                              ; 7279 38      
            sbc LON                          ; 727a e5cb    
            tay                              ; 727c a8      
            lda (MAPPTRL),y                  ; 727d b1c0    
            sta TRNCOD                       ; 727f 8d2b06  
            and #$3f                         ; 7282 293f    
            cmp #$3d                         ; 7284 c93d    
            beq _TERRB_1                     ; 7286 f002    
            cmp #$3e                         ; 7288 c93e    
_TERRB_1:   rts                              ; 728a 60      

LOOKUP:     lda TRNCOD                       ; 728b ad2b06  X, UNITNO <- unit @ LAT/LON, TRNCOD <- terrain under it
            sta UNTCOD                       ; 728e 8d2f06  
            and #$c0                         ; 7291 29c0    
            ldx #$9e                         ; 7293 a29e    
            cmp #$40                         ; 7295 c940    
            bne _LOOKUP_1                    ; 7297 d002    
            ldx #$37                         ; 7299 a237    
_LOOKUP_1:  lda LAT                          ; 729b a5ca    
_LOOKUP_2:  cmp CORPSY,x                     ; 729d dd9f54  . latitude of all units
            beq MIGHTB                       ; 72a0 f00a    
__O__:      dex                              ; 72a2 ca
            bne _LOOKUP_2                    ; 72a3 d0f8    
            lda #$ff                         ; 72a5 a9ff    
            sta TXTWDW+128                   ; 72a7 8dd064  
            bmi MATCH                        ; 72aa 301c    
MIGHTB:     lda LON                          ; 72ac a5cb    
            cmp CORPSX,x                     ; 72ae dd0054  . longitude of all units
            bne _MIGHTB_1                    ; 72b1 d010    
            lda CSTRNG,x                     ; 72b3 bddd55  . combat strengths
            beq _MIGHTB_1                    ; 72b6 f00b    
            lda ARRIVE,x                     ; 72b8 bd1b57  . arrival turns
            bmi _MIGHTB_1                    ; 72bb 3006    
            cmp TURN                         ; 72bd c5c9    
            bcc MATCH                        ; 72bf 9007    
            beq MATCH                        ; 72c1 f005    
_MIGHTB_1:  lda LAT                          ; 72c3 a5ca    
            jmp __O__                        ; 72c5 4ca272

MATCH:      stx UNITNO                       ; 72c8 86c3    
            lda SWAP,x                       ; 72ca bd7c56  . terrain code underneath unit
            sta TRNCOD                       ; 72cd 8d2b06  
            rts                              ; 72d0 60      

CALCEXC:    ldx ARMY                         ; 72d1 a6c2    init calc EXEC,x for next order (was DINGO)
            lda HMORDS,x                     ; 72d3 bd755d  . how many orders queued for each unit
            bne CALCNXT                      ; 72d6 d006    
            lda #$ff                         ; 72d8 a9ff    
            sta EXEC,x                       ; 72da 9d616d  . unit execution times
            rts                              ; 72dd 60      

CALCNXT:    lda CORPSX,x                     ; 72de bd0054  . longitude of all units
            sta LON                          ; 72e1 85cb    
            lda CORPSY,x                     ; 72e3 bd9f54  . latitude of all units
            sta LAT                          ; 72e6 85ca    
            jsr TERR                         ; 72e8 204072  . TRNCOD <- terrain chr @ LAT/LON, maybe under unit
            lda UNTCOD                       ; 72eb ad2f06  
            sta UNTCD1                       ; 72ee 8d3006  
            ldx ARMY                         ; 72f1 a6c2    
            lda WHORDS,x                     ; 72f3 bd145e  . what unit orders are (2 bits per order)
            eor #$02                         ; 72f6 4902    
            and #$03                         ; 72f8 2903    
            tay                              ; 72fa a8      
            lda CORPSX,x                     ; 72fb bd0054  . longitude of all units
            clc                              ; 72fe 18      
            adc XADD,y                       ; 72ff 79e25f  . offsets for moving arrow
            sta LON                          ; 7302 85cb    
            lda CORPSY,x                     ; 7304 bd9f54  . latitude of all units
            clc                              ; 7307 18      
            adc YADD,y                       ; 7308 79e65f  
            sta LAT                          ; 730b 85ca    
            jsr TERR                         ; 730d 204072  . TRNCOD <- terrain chr @ LAT/LON, maybe under unit
            jsr TERRTY                       ; 7310 206973  . convert map chr in TRNCOD -> TRNTYP, also y reg
            lda UNTCD1                       ; 7313 ad3006  
            and #$3f                         ; 7316 293f    
            ldx #$00                         ; 7318 a200    
            cmp #$3d                         ; 731a c93d    
            beq _CALCNXT_1                   ; 731c f002    
            ldx #$0a                         ; 731e a20a    
_CALCNXT_1: txa                              ; 7320 8a      
            ldx MONTH                        ; 7321 ae0c06  
            clc                              ; 7324 18      
            adc SSNCOD,x                     ; 7325 7dc06c  add season index
            adc TRNTYP                       ; 7328 65cd    add terrain index
            tax                              ; 732a aa      
            lda TRNTAB,x                     ; 732b bdcd6c  get net delay
            clc                              ; 732e 18      
            adc TICK                         ; 732f 6d2e06  
            ldx ARMY                         ; 7332 a6c2    
            sta EXEC,x                       ; 7334 9d616d  . unit execution times
            lda TRNTYP                       ; 7337 a5cd    
            cmp #$07                         ; 7339 c907    
            bcc _CALCNXT_4                   ; 733b 902b    
            ldy #$15                         ; 733d a015    
_CALCNXT_2: lda LAT                          ; 733f a5ca    
            cmp BHY1,y                       ; 7341 d91f6d  
            bne _CALCNXT_3                   ; 7344 d01f    
            lda LON                          ; 7346 a5cb    
            cmp BHX1,y                       ; 7348 d9096d  . intraversible square-pair coords
            bne _CALCNXT_3                   ; 734b d018    
            ldx ARMY                         ; 734d a6c2    
            lda CORPSX,x                     ; 734f bd0054  . longitude of all units
            cmp BHX2,y                       ; 7352 d9356d  
            bne _CALCNXT_3                   ; 7355 d00e    
            lda CORPSY,x                     ; 7357 bd9f54  . latitude of all units
            cmp BHY2,y                       ; 735a d94b6d  
            bne _CALCNXT_3                   ; 735d d006    
            lda #$ff                         ; 735f a9ff    
            sta EXEC,x                       ; 7361 9d616d  . unit execution times
            rts                              ; 7364 60      

_CALCNXT_3: dey                              ; 7365 88      
            bpl _CALCNXT_2                   ; 7366 10d7    
_CALCNXT_4: rts                              ; 7368 60      

TERRTY:     ldy #$00                         ; 7369 a000    convert map chr in TRNCOD -> TRNTYP, also y reg
            lda TRNCOD                       ; 736b ad2b06  
            beq DONE                         ; 736e f043
            cmp #$7f                         ; 7370 c97f    border
            bne _TERRTY_1                    ; 7372 d004    
            ldy #$09                         ; 7374 a009    
            bne DONE                         ; 7376 d03b
_TERRTY_1:  iny                              ; 7378 c8      
            cmp #$07                         ; 7379 c907    mountain
            bcc DONE                         ; 737b 9036
            iny                              ; 737d c8      
            cmp #$4b                         ; 737e c94b    city (mask two hi bits to read font table index)
            bcc DONE                         ; 7380 9031
            iny                              ; 7382 c8      
            cmp #$4f                         ; 7383 c94f    frozen swamp
            bcc DONE                         ; 7385 902c
            iny                              ; 7387 c8      
            cmp #$69                         ; 7388 c969    frozen river
            bcc DONE                         ; 738a 9027
            iny                              ; 738c c8      
            cmp #$8f                         ; 738d c98f    swamp
            bcc DONE                         ; 738f 9022
            iny                              ; 7391 c8      
            cmp #$a4                         ; 7392 c9a4    river
            bcc DONE                         ; 7394 901d
            ldx LAT                          ; 7396 a6ca    
            cpx #$0e                         ; 7398 e00e    
            bcc _TERRTY_2                    ; 739a 9004    
            cmp #$a9                         ; 739c c9a9    
            bcc DONE                         ; 739e 9013
_TERRTY_2:  iny                              ; 73a0 c8      
            cmp #$ba                         ; 73a1 c9ba    coastline
            bcc DONE                         ; 73a3 900e
            cpx #$0e                         ; 73a5 e00e    
            bcc _TERRTY_3                    ; 73a7 9004    
            cmp #$bb                         ; 73a9 c9bb    
            bcc DONE                         ; 73ab 9006
_TERRTY_3:  iny                              ; 73ad c8      
            cmp #$bd                         ; 73ae c9bd    estuary
            bcc DONE                         ; 73b0 9001
            iny                              ; 73b2 c8      
DONE:       sty TRNTYP                       ; 73b3 84cd
            rts                              ; 73b5 60      

ZPVAL:  ; init for DLSTPT/2, MAP/2, CORPS, CURS{X|Y}/2
    !byte $00,$64,$00,$00,$00,$22,$01,$30,$02                               ; 73b6 .d...".0.
PSXVAL:
    !byte $e0,$00,$00,$33,$78,$d6,$10,$27,$40,$00,$01,$0f,$06,$29,$00,$01   ; 73bf `..3xV.'@....)..
COLTAB:                                      ; sets PCOLR0-3, COLOR0-3
    !byte $58,$dc,$2f,$00,$6a,$0c,$94,$46,$b0                               ; 73cf X\/.j..F0
MOSCPTS:
    !byte $14,$0a,$0a,$0a                                                   ; 73d8 ....
MOSCX:
    !byte $14,$21,$14,$06                                                   ; 73dc .!..
MOSCY:
    !byte $1c,$24,$00,$0f                                                   ; 73e0 .$..

TXTMSG:     asl                              ; 73e4 0a      Display TXTTBL msg X
            asl                              ; 73e5 0a      
            asl                              ; 73e6 0a      
            asl                              ; 73e7 0a      
            asl                              ; 73e8 0a      
            tax                              ; 73e9 aa      
            ldy #$69                         ; 73ea a069    
_TXTMSG_1:  lda TXTTBL,x                     ; 73ec bd085d  . more text
            sec                              ; 73ef 38      
            sbc #$20                         ; 73f0 e920    
            sta TXTWDW,y                     ; 73f2 995064  
            iny                              ; 73f5 c8      
            inx                              ; 73f6 e8      
            txa                              ; 73f7 8a      
            and #$1f                         ; 73f8 291f    
            bne _TXTMSG_1                    ; 73fa d0f0    
            rts                              ; 73fc 60      

    !byte $00,$00,$00                                                       ; 73fd ...

VBISRV:     lda #$ff                         ; 7400 a9ff    vertical blank interrupt service. It reads the joystick and scrolls the screen
            nop                              ; 7402 ea      For debugging first three bytes were AD11D0: LDA TRIG1 to check for brk
            bne _VBISRV_1                    ; 7403 d00f    
            ldy #$3e                         ; 7405 a03e    Unreachable in production version
            ldx #$e9                         ; 7407 a2e9    
            lda #$07                         ; 7409 a907    
            jsr SETVBV                       ; 740b 205ce4  . Set system timers during the VBLANK routine
            pla                              ; 740e 68      reset stack
            pla                              ; 740f 68      
            pla                              ; 7410 68      
            jmp DEBUG                        ; 7411 4c1072  

_VBISRV_1:  lda HANDCP                       ; 7414 ad8f06  
            beq _VBISRV_4                    ; 7417 f02d    
            lda GRAFP3 / TRIG0               ; 7419 ad10d0  . W: gfx shape for P3 / R: joystick 0 trigger (0=press)
            beq _VBISRV_4                    ; 741c f028    
            lda #$08                         ; 741e a908    
            sta CONSOL                       ; 7420 8d1fd0  . Check for OPTION/SELECT/START press (not RESET)
            lda CONSOL                       ; 7423 ad1fd0  . Check for OPTION/SELECT/START press (not RESET)
            and #$04                         ; 7426 2904    
            bne _VBISRV_4                    ; 7428 d01c    
            sta HANDCP                       ; 742a 8d8f06  
            lda #$30                         ; 742d a930    
            sta TRDMRK                       ; 742f 8d7a7b  . 'My tradmark' ??
            ldx #$36                         ; 7432 a236    
_VBISRV_2:  lda MSTRNG,x                     ; 7434 bd3e55  . muster strengths
            sta TEMP1                        ; 7437 85bb    . all purpose temp
            lsr                              ; 7439 4a      
            adc TEMP1                        ; 743a 65bb    . all purpose temp
            bcc _VBISRV_3                    ; 743c 9002    
            lda #$ff                         ; 743e a9ff    
_VBISRV_3:  sta MSTRNG,x                     ; 7440 9d3e55  . muster strengths
            dex                              ; 7443 ca      
            bne _VBISRV_2                    ; 7444 d0ee    
_VBISRV_4:  lda GRAFP3 / TRIG0               ; 7446 ad10d0  . W: gfx shape for P3 / R: joystick 0 trigger (0=press)
            ora BUTMSK                       ; 7449 0d0f06  . 0 allows trigger, 1 prevents
            beq _VBISRV_7                    ; 744c f03b    
            lda BUTFLG                       ; 744e ad0e06  no button now; previous status
            bne _VBISRV_5                    ; 7451 d003    
            jmp NOBUT                        ; 7453 4ccf77  

_VBISRV_5:  lda #$58                         ; 7456 a958    button just released
            sta PCOLR0                       ; 7458 8dc002  . Color of player 0 and missile 0, shadows $D012
            lda #$00                         ; 745b a900    
            sta BUTFLG                       ; 745d 8d0e06  
            sta KRZFLG                       ; 7460 8d2506  
            sta AUDC1 / POT1                 ; 7463 8d01d2  . W: Audio ch1 ctrl / R: paddle 1
            ldx #$52                         ; 7466 a252    
_VBISRV_6:  sta TXTWDW+8,x                   ; 7468 9d5864  clear text window
            dex                              ; 746b ca      
            bpl _VBISRV_6                    ; 746c 10fa    
            lda #$08                         ; 746e a908    
            sta DELAY                        ; 7470 8d1206  . accel delay on scrolling
            clc                              ; 7473 18      
            adc RTCLOK2                      ; 7474 6514    . One tick per VBI (60/sec)
            sta TIMSCL                       ; 7476 8d1306  . frame to scroll in
            jsr SWITCH                       ; 7479 20ef79  . Swap map CHUNKX/Y with SWAP,x; x = CORPS, y = map offset
            lda #$00                         ; 747c a900    
            sta CORPS                        ; 747e 85b4    . Number of unit under window
            jsr CLRP1                        ; 7480 20357a  
            jsr CLRP2                        ; 7483 204a7a  
            jmp ENDISR                       ; 7486 4c6f79  

_VBISRV_7:  sta ATRACT                       ; 7489 854d    button is pressed
            lda STICK0                       ; 748b ad7802  . The value of joystick 0
            and #$0f                         ; 748e 290f    
            eor #$0f                         ; 7490 490f    
            beq _VBISRV_8                    ; 7492 f003    joystick active?
            jmp ORDERS                       ; 7494 4cda76  yes

_VBISRV_8:  sta DBTIMR                       ; 7497 8d2206  no, set debounce
            sta AUDC1 / POT1                 ; 749a 8d01d2  . W: Audio ch1 ctrl / R: paddle 1
            sta STKFLG                       ; 749d 8d2606  . STICK0 & 0xf ^ 0xf
            lda BUTFLG                       ; 74a0 ad0e06  
            bne BUTHLD                       ; 74a3 d003    is this the first button pass
            jmp FBUTPS                       ; 74a5 4caa75  yes

BUTHLD:     jsr ERRCLR                       ; 74a8 205e7a  no, clear errors
            lda HITFLG                       ; 74ab ad2706  
            beq _VBISRV_10                   ; 74ae f003    anybody in the window?
            jmp ENDISR                       ; 74b0 4c6f79  no

_VBISRV_10: lda CH                           ; 74b3 adfc02  . Internal hardware value for the last key pressed
            cmp #$21                         ; 74b6 c921    
            bne _VBISRV_11                   ; 74b8 d02b    space bar pressed?
            ldx CORPS                        ; 74ba a6b4    yes, check for Russian
            cpx #$37                         ; 74bc e037    
            bcs _VBISRV_11                   ; 74be b025    
            lda #$00                         ; 74c0 a900    clear out orders
            sta CH                           ; 74c2 8dfc02  . Internal hardware value for the last key pressed
            sta HMORDS,x                     ; 74c5 9d755d  . how many orders queued for each unit
            sta HOWMNY                       ; 74c8 8d1f06  . how many orders for unit under cursor
            sta STPCNT                       ; 74cb 8d1a06  . which intermediate step arrow is on
            lda #$01                         ; 74ce a901    
            sta ORDCNT                       ; 74d0 8d1b06  . which order arrow is showing
            jsr CLRP1                        ; 74d3 20357a  
            jsr CLRP2                        ; 74d6 204a7a  
            lda BASEX                        ; 74d9 ad1606  . start pos of arrow (player frame)
            sta STEPX                        ; 74dc 8d1806  . intermediate pos of arrow
            lda BASEY                        ; 74df ad1706  
            sta STEPY                        ; 74e2 8d1906  
_VBISRV_11: lda RTCLOK2                      ; 74e5 a514    . One tick per VBI (60/sec)
            and #$03                         ; 74e7 2903    
            beq _VBISRV_12                   ; 74e9 f003    time to move arrow?
            jmp ENDISR                       ; 74eb 4c6f79  no

_VBISRV_12: ldy HOWMNY                       ; 74ee ac1f06  yes
            bne _VBISRV_13                   ; 74f1 d003    any orders to show?
            jmp PCURSE                       ; 74f3 4c6f75  no, go ahead to maltakreuze

_VBISRV_13: jsr CLRP1                        ; 74f6 20357a  yes, clear old arrow
            lda ORDCNT                       ; 74f9 ad1b06  . which order arrow is showing
            ldx #$00                         ; 74fc a200    assume first byte
            cmp #$05                         ; 74fe c905    
            bcc _VBISRV_14                   ; 7500 9001    second byte or first?
            inx                              ; 7502 e8      second byte
_VBISRV_14: and #$03                         ; 7503 2903    isolate bit pair index
            tay                              ; 7505 a8      
            lda BITTAB,y                     ; 7506 b9747a  get mask
            and ORD1,x                       ; 7509 3d1c06  get orders
            dey                              ; 750c 88      right justify orders
            bpl _VBISRV_15                   ; 750d 1002    
            ldy #$03                         ; 750f a003    
_VBISRV_15: beq _VBISRV_17                   ; 7511 f005    
_VBISRV_16: lsr                              ; 7513 4a      
            lsr                              ; 7514 4a      
            dey                              ; 7515 88      
            bne _VBISRV_16                   ; 7516 d0fb    
_VBISRV_17: sta ARRNDX                       ; 7518 8d1e06  . arrow index
            asl                              ; 751b 0a      
            asl                              ; 751c 0a      
            asl                              ; 751d 0a      
            tax                              ; 751e aa      get arrow image and store it to player RAM
            ldy STEPY                        ; 751f ac1906  
_VBISRV_18: lda ARRTAB,x                     ; 7522 bd3164  . arrow shapes; last byte overlaps
            cpy #$80                         ; 7525 c080    
            bcs _VBISRV_19                   ; 7527 b003    
            sta PLYR1,y                      ; 7529 998052  . Player 1 sprite data
_VBISRV_19: inx                              ; 752c e8      
            iny                              ; 752d c8      
            txa                              ; 752e 8a      
            and #$07                         ; 752f 2907    
            bne _VBISRV_18                   ; 7531 d0ef    
            lda STEPX                        ; 7533 ad1806  position arrow
            sta HPOSP1 / M1PF                ; 7536 8d01d0  . W: h.pos of P1 / R: missile 1 to pf collision
            ldx ARRNDX                       ; 7539 ae1e06  now step arrow
            lda STEPX                        ; 753c ad1806  . intermediate pos of arrow
            clc                              ; 753f 18      
            adc XADD,x                       ; 7540 7de25f  . offsets for moving arrow
            sta STEPX                        ; 7543 8d1806  . intermediate pos of arrow
            lda STEPY                        ; 7546 ad1906  
            clc                              ; 7549 18      
            adc YADD,x                       ; 754a 7de65f  
            sta STEPY                        ; 754d 8d1906  
            inc STPCNT                       ; 7550 ee1a06  next step
            lda STPCNT                       ; 7553 ad1a06  . which intermediate step arrow is on
            and #$07                         ; 7556 2907    
            bne _PCURSE_3                    ; 7558 d04d    if not done end ISR
            sta STPCNT                       ; 755a 8d1a06  end of steps
            inc ORDCNT                       ; 755d ee1b06  next order
            lda ORDCNT                       ; 7560 ad1b06  . which order arrow is showing
            cmp HOWMNY                       ; 7563 cd1f06  last order?
            bcc _PCURSE_3                    ; 7566 903f    no, out
            beq _PCURSE_3                    ; 7568 f03d    no, out
            lda #$01                         ; 756a a901    
            sta ORDCNT                       ; 756c 8d1b06  yes, reset to start of arrow's path
PCURSE:     ldy STEPY                        ; 756f ac1906  display maltese cross ('maltakreuze' or KRZ)
            sty KRZY                         ; 7572 8c2106  
            lda #$ff                         ; 7575 a9ff    
            sta KRZFLG                       ; 7577 8d2506  
            ldx #$00                         ; 757a a200    
_PCURSE_1:  lda MLTKRZ,x                     ; 757c bdf75f  . maltakreuze shape
            cpy #$80                         ; 757f c080    
            bcs _PCURSE_2                    ; 7581 b003    
            sta PLYR2,y                      ; 7583 990053  . Player 2 sprite data
_PCURSE_2:  iny                              ; 7586 c8      
            inx                              ; 7587 e8      
            cpx #$08                         ; 7588 e008    
            bne _PCURSE_1                    ; 758a d0f0    
            lda STEPX                        ; 758c ad1806  . intermediate pos of arrow
            sec                              ; 758f 38      
            sbc #$01                         ; 7590 e901    
            sta KRZX                         ; 7592 8d2006  . maltakreuze coords (player frame)
            sta HPOSP2 / M2PF                ; 7595 8d02d0  . W: h.pos of P2 / R: missile 2 to pf collision
            jsr CLRP1                        ; 7598 20357a  clear arrow
            lda BASEX                        ; 759b ad1606  reset arrow's coords
            sta STEPX                        ; 759e 8d1806  . intermediate pos of arrow
            lda BASEY                        ; 75a1 ad1706  
            sta STEPY                        ; 75a4 8d1906  
_PCURSE_3:  jmp ENDISR                       ; 75a7 4c6f79  

FBUTPS:     lda #$ff                         ; 75aa a9ff    FIRST BUTTON PASS - looks for a unit inside cursor. if there is one, puts unit info into text window
            sta BUTFLG                       ; 75ac 8d0e06  
            lda CURSXL                       ; 75af a5b5    first get coords of center of cursor (map frame)
            clc                              ; 75b1 18      
            adc #$06                         ; 75b2 6906    
            sta TXL                          ; 75b4 8d2806  . temp values -- slightly shifted
            lda CURSXH                       ; 75b7 a5b6    
            adc #$00                         ; 75b9 6900    
            sta TXH                          ; 75bb 8d2906  
            lda CURSYL                       ; 75be a5b7    . Cursor coords on screen (map frame)
            clc                              ; 75c0 18      
            adc #$09                         ; 75c1 6909    
            sta TYL                          ; 75c3 8d1006  
            lda CURSYH                       ; 75c6 a5b8    
            adc #$00                         ; 75c8 6900    
            sta TYH                          ; 75ca 8d1106  
            lda TXH                          ; 75cd ad2906  
            lsr                              ; 75d0 4a      
            lda TXL                          ; 75d1 ad2806  . temp values -- slightly shifted
            ror                              ; 75d4 6a      
            lsr                              ; 75d5 4a      
            lsr                              ; 75d6 4a      
            sta CHUNKX                       ; 75d7 85be    coords of cursor (pixel frame)
            lda TYH                          ; 75d9 ad1106  
            lsr                              ; 75dc 4a      
            tax                              ; 75dd aa      
            lda TYL                          ; 75de ad1006  
            ror                              ; 75e1 6a      
            tay                              ; 75e2 a8      
            txa                              ; 75e3 8a      
            lsr                              ; 75e4 4a      
            tya                              ; 75e5 98      
            ror                              ; 75e6 6a      
            lsr                              ; 75e7 4a      
            lsr                              ; 75e8 4a      
            sta CHUNKY                       ; 75e9 85bf    
            ldx #$9e                         ; 75eb a29e    now look for a match with unit coordinates
_FBUTPS_1:  cmp CORPSY,x                     ; 75ed dd9f54  . latitude of all units
            beq MAYBE                        ; 75f0 f00c
__P__:      dex                              ; 75f2 ca
            bne _FBUTPS_1                    ; 75f3 d0f8    
            stx CORPS                        ; 75f5 86b4    no match obtained
            dex                              ; 75f7 ca      
            stx HITFLG                       ; 75f8 8e2706  
            jmp ENDISR                       ; 75fb 4c6f79  

MAYBE:      lda CHUNKX                       ; 75fe a5be    . Cursor coords (pixel frame)
            cmp CORPSX,x                     ; 7600 dd0054  . longitude of all units
            bne _P_2                         ; 7603 d00b
            lda ARRIVE,x                     ; 7605 bd1b57  . arrival turns
            bmi _P_2                         ; 7608 3006
            cmp TURN                         ; 760a c5c9    
            bcc FOUND                        ; 760c 9007
            beq FOUND                        ; 760e f005
_P_2:       lda CHUNKY                       ; 7610 a5bf
            jmp __P__                        ; 7612 4cf275

FOUND:      lda #$00                         ; 7615 a900    match obtained
            sta HITFLG                       ; 7617 8d2706  note match
            sta CH                           ; 761a 8dfc02  . Internal hardware value for the last key pressed
            lda #$5c                         ; 761d a95c    
            sta PCOLR0                       ; 761f 8dc002  light up cursor
            stx CORPS                        ; 7622 86b4    display unit specs
            ldy #$0d                         ; 7624 a00d    
            lda CORPNO,x                     ; 7626 bd6959  . unit ID numbers
            jsr DNUMBR                       ; 7629 20b27b  
            iny                              ; 762c c8      
            ldx CORPS                        ; 762d a6b4    . Number of unit under window
            lda CORPT,x                      ; 762f bdca58  first name
            sta TEMP1                        ; 7632 85bb    . all purpose temp
            and #$f0                         ; 7634 29f0    
            lsr                              ; 7636 4a      
            jsr DWORDSB                      ; 7637 20da79  
            lda TEMP1                        ; 763a a5bb    . all purpose temp
            and #$0f                         ; 763c 290f    second name
            clc                              ; 763e 18      
            adc #$08                         ; 763f 6908    
            jsr DWORDS                       ; 7641 20c079  
            lda #$1e                         ; 7644 a91e    
            ldx CORPS                        ; 7646 a6b4    . Number of unit under window
            cpx #$37                         ; 7648 e037    
            bcs _P_4                         ; 764a b002
            lda #$1d                         ; 764c a91d    
_P_4:       jsr DWORDS                       ; 764e 20c079  display unit size (corps or army)
            ldy #$38                         ; 7651 a038    
            lda #$1f                         ; 7653 a91f    "MUSTER"
            jsr DWORDS                       ; 7655 20c079  
            dey                              ; 7658 88      
            lda #$1a                         ; 7659 a91a    ":"
            sta TXTWDW,y                     ; 765b 995064  
            iny                              ; 765e c8      
            iny                              ; 765f c8      
            ldx CORPS                        ; 7660 a6b4    . Number of unit under window
            lda MSTRNG,x                     ; 7662 bd3e55  . muster strengths
            jsr DNUMBR                       ; 7665 20b27b  
            iny                              ; 7668 c8      
            iny                              ; 7669 c8      
            lda #$20                         ; 766a a920    "COMBAT"
            jsr DWORDS                       ; 766c 20c079  
            lda #$21                         ; 766f a921    "STRENGTH"
            jsr DWORDS                       ; 7671 20c079  
            dey                              ; 7674 88      
            lda #$1a                         ; 7675 a91a    ":"
            sta TXTWDW,y                     ; 7677 995064  
            iny                              ; 767a c8      
            iny                              ; 767b c8      
            ldx CORPS                        ; 767c a6b4    . Number of unit under window
            lda CSTRNG,x                     ; 767e bddd55  . combat strengths
            jsr DNUMBR                       ; 7681 20b27b  
            jsr SWITCH                       ; 7684 20ef79  . Swap map CHUNKX/Y with SWAP,x; x = CORPS, y = map offset
            lda CORPS                        ; 7687 a5b4    . Number of unit under window
            cmp #$37                         ; 7689 c937    
            bcc _P_5                         ; 768b 9007    Russian?
            lda #$ff                         ; 768d a9ff    yes, mask orders and exit
            sta HITFLG                       ; 768f 8d2706  
            bmi JMPEISR                      ; 7692 3043    
_P_5:       lda #$01                         ; 7694 a901    German unit.  set up orders display, first calculate starting coords (BASEX, BASEY)
            sta ORDCNT                       ; 7696 8d1b06  . which order arrow is showing
            lda #$00                         ; 7699 a900    
            sta STPCNT                       ; 769b 8d1a06  . which intermediate step arrow is on
            lda TXL                          ; 769e ad2806  . temp values -- slightly shifted
            and #$07                         ; 76a1 2907    
            clc                              ; 76a3 18      
            adc #$01                         ; 76a4 6901    
            clc                              ; 76a6 18      
            adc SHPOS0                       ; 76a7 6d0406  . shadows player 0 position
            sta BASEX                        ; 76aa 8d1606  . start pos of arrow (player frame)
            sta STEPX                        ; 76ad 8d1806  . intermediate pos of arrow
            lda TYL                          ; 76b0 ad1006  
            and #$0f                         ; 76b3 290f    
            lsr                              ; 76b5 4a      
            sec                              ; 76b6 38      
            sbc #$01                         ; 76b7 e901    
            clc                              ; 76b9 18      
            adc SCY                          ; 76ba 6d0306  . vert pos of cursor (player frame)
            sta BASEY                        ; 76bd 8d1706  
            sta STEPY                        ; 76c0 8d1906  
            ldx CORPS                        ; 76c3 a6b4    set up page 6 values
            lda HMORDS,x                     ; 76c5 bd755d  . how many orders queued for each unit
            sta HOWMNY                       ; 76c8 8d1f06  . how many orders for unit under cursor
            lda WHORDS,x                     ; 76cb bd145e  . what unit orders are (2 bits per order)
            sta ORD1                         ; 76ce 8d1c06  . orders record
            lda WHORDH,x                     ; 76d1 bdb35e  . unit orders (high bits?)
            sta ORD2                         ; 76d4 8d1d06  
JMPEISR:    jmp ENDISR                       ; 76d7 4c6f79  

ORDERS:     lda STKFLG                       ; 76da ad2606  ORDERS INPUT ROUTINE
            bne JMPEISR                      ; 76dd d0f8    
            ldx CORPS                        ; 76df a6b4    . Number of unit under window
            cpx #$37                         ; 76e1 e037    
            bcc _ORDERS_1                    ; 76e3 9005    Russian?
            ldx #$00                         ; 76e5 a200    yes, error
            jmp SQUAWK                       ; 76e7 4cac77  

_ORDERS_1:  lda HMORDS,x                     ; 76ea bd755d  . how many orders queued for each unit
            cmp #$08                         ; 76ed c908    
            bcc _ORDERS_2                    ; 76ef 9005    only 8 orders allowed
            ldx #$20                         ; 76f1 a220    
            jmp SQUAWK                       ; 76f3 4cac77  

_ORDERS_2:  lda KRZFLG                       ; 76f6 ad2506  
            bne _ORDERS_3                    ; 76f9 d005    must wait for maltakreuze
            ldx #$40                         ; 76fb a240    
            jmp SQUAWK                       ; 76fd 4cac77  

_ORDERS_3:  inc DBTIMR                       ; 7700 ee2206  . joystick debounce timer
            lda DBTIMR                       ; 7703 ad2206  . joystick debounce timer
            cmp #$10                         ; 7706 c910    wait for debounce time
            bcs _ORDERS_4                    ; 7708 b002    
            bcc JMPEISR                      ; 770a 90cb    
_ORDERS_4:  lda #$00                         ; 770c a900    
            sta DBTIMR                       ; 770e 8d2206  reset debounce timer
            ldx STICK0                       ; 7711 ae7802  . The value of joystick 0
            lda STKTAB,x                     ; 7714 bdb16c  . joystick decoding table
            bpl _ORDERS_5                    ; 7717 1005    
            ldx #$60                         ; 7719 a260    no diagonal orders allowed
            jmp SQUAWK                       ; 771b 4cac77  

_ORDERS_5:  tay                              ; 771e a8      OK, this is a good order
            sta STICK1                       ; 771f 8d2306  . coded value of stick direction (0-3)
            lda BEEPTB,y                     ; 7722 b9525f  . table of beep tones
            sta AUDF1 / POT0                 ; 7725 8d00d2  "BEEP!"
            lda #$a8                         ; 7728 a9a8    
            sta AUDC1 / POT1                 ; 772a 8d01d2  . W: Audio ch1 ctrl / R: paddle 1
            lda #$ff                         ; 772d a9ff    
            sta STKFLG                       ; 772f 8d2606  . STICK0 & 0xf ^ 0xf
            ldx CORPS                        ; 7732 a6b4    . Number of unit under window
            inc HMORDS,x                     ; 7734 fe755d  . how many orders queued for each unit
            lda HMORDS,x                     ; 7737 bd755d  . how many orders queued for each unit
            sta HOWMNY                       ; 773a 8d1f06  . how many orders for unit under cursor
            sec                              ; 773d 38      
            sbc #$01                         ; 773e e901    
            and #$03                         ; 7740 2903    
            tay                              ; 7742 a8      
            sty TEMP1                        ; 7743 84bb    . all purpose temp
            lda HMORDS,x                     ; 7745 bd755d  . how many orders queued for each unit
            sec                              ; 7748 38      
            sbc #$01                         ; 7749 e901    
            lsr                              ; 774b 4a      
            lsr                              ; 774c 4a      
            tax                              ; 774d aa      
            lda STICK1                       ; 774e ad2306  . coded value of stick direction (0-3)
__Q__:      dey                              ; 7751 88      isolate order
            bmi _Q_1                         ; 7752 3005
            asl                              ; 7754 0a      
            asl                              ; 7755 0a      
            jmp __Q__                        ; 7756 4c5177

_Q_1:       ldy TEMP1                        ; 7759 a4bb    . all purpose temp
            eor ORD1,x                       ; 775b 5d1c06  fold in new order (sneaky code)
            and MASKO,y                      ; 775e 39de5f  . mask values for decoding orders
            eor ORD1,x                       ; 7761 5d1c06  . orders record
            sta ORD1,x                       ; 7764 9d1c06  . orders record
            lda ORD1                         ; 7767 ad1c06  . orders record
            ldx CORPS                        ; 776a a6b4    . Number of unit under window
            sta WHORDS,x                     ; 776c 9d145e  . what unit orders are (2 bits per order)
            lda ORD2                         ; 776f ad1d06  
            sta WHORDH,x                     ; 7772 9db35e  . unit orders (high bits?)
            jsr CLRP2                        ; 7775 204a7a  move maltakreuze
            ldx STICK1                       ; 7778 ae2306  . coded value of stick direction (0-3)
            lda KRZX                         ; 777b ad2006  . maltakreuze coords (player frame)
            clc                              ; 777e 18      
            adc XOFF,x                       ; 777f 7dd65f  . offsets for moving maltakreuze
            sta KRZX                         ; 7782 8d2006  . maltakreuze coords (player frame)
            lda KRZY                         ; 7785 ad2106  
            clc                              ; 7788 18      
            adc YOFF,x                       ; 7789 7dda5f  
            sta KRZY                         ; 778c 8d2106  
            lda KRZX                         ; 778f ad2006  display it
            sta HPOSP2 / M2PF                ; 7792 8d02d0  . W: h.pos of P2 / R: missile 2 to pf collision
            ldy KRZY                         ; 7795 ac2106  
            ldx #$00                         ; 7798 a200    
_Q_2:       lda MLTKRZ,x                     ; 779a bdf75f  . maltakreuze shape
            cpy #$80                         ; 779d c080    
            bcs _Q_3                         ; 779f b003
            sta PLYR2,y                      ; 77a1 990053  . Player 2 sprite data
_Q_3:       iny                              ; 77a4 c8
            inx                              ; 77a5 e8      
            cpx #$08                         ; 77a6 e008    
            bne _Q_2                         ; 77a8 d0f0
            beq EXITI                        ; 77aa f043
SQUAWK:     ldy #$69                         ; 77ac a069    ERROR on inputs routine. squawks speaker and outputs msg X
_SQUAWK_1:  lda ERRMSG,x                     ; 77ae bd565f  . table of error messages
            sec                              ; 77b1 38      
            sbc #$20                         ; 77b2 e920    
            sta TXTWDW,y                     ; 77b4 995064  
            iny                              ; 77b7 c8      
            inx                              ; 77b8 e8      
            txa                              ; 77b9 8a      
            and #$1f                         ; 77ba 291f    
            bne _SQUAWK_1                    ; 77bc d0f0    
            lda #$68                         ; 77be a968    
            sta AUDC1 / POT1                 ; 77c0 8d01d2  . W: Audio ch1 ctrl / R: paddle 1
            lda #$50                         ; 77c3 a950    
            sta AUDF1 / POT0                 ; 77c5 8d00d2  "HONK!"
            lda #$ff                         ; 77c8 a9ff    
            sta ERRFLG                       ; 77ca 8d2406  
            bmi EXITI                        ; 77cd 3020
NOBUT:      sta DBTIMR                       ; 77cf 8d2206  NO BUTTON PRESSED ROUTINE
            lda STICK0                       ; 77d2 ad7802  . The value of joystick 0
            and #$0f                         ; 77d5 290f    
            eor #$0f                         ; 77d7 490f    
            bne SCROLL                       ; 77d9 d017
            sta AUDC1 / POT1                 ; 77db 8d01d2  . W: Audio ch1 ctrl / R: paddle 1
            sta STKFLG                       ; 77de 8d2606  . STICK0 & 0xf ^ 0xf
            lda #$08                         ; 77e1 a908    
            sta DELAY                        ; 77e3 8d1206  . accel delay on scrolling
            clc                              ; 77e6 18      
            adc RTCLOK2                      ; 77e7 6514    . One tick per VBI (60/sec)
            sta TIMSCL                       ; 77e9 8d1306  . frame to scroll in
            jsr ERRCLR                       ; 77ec 205e7a  
EXITI:      jmp ENDISR                       ; 77ef 4c6f79

SCROLL:     lda #$00                         ; 77f2 a900
            sta ATRACT                       ; 77f4 854d    . Attract mode timer and flag
            lda TIMSCL                       ; 77f6 ad1306  acceleration feature of cursor
            cmp RTCLOK2                      ; 77f9 c514    . One tick per VBI (60/sec)
            bne EXITI                        ; 77fb d0f2
            lda DELAY                        ; 77fd ad1206  . accel delay on scrolling
            cmp #$01                         ; 7800 c901    
            beq _NOBUT_3                     ; 7802 f006    
            sec                              ; 7804 38      
            sbc #$01                         ; 7805 e901    
            sta DELAY                        ; 7807 8d1206  . accel delay on scrolling
_NOBUT_3:   clc                              ; 780a 18      
            adc RTCLOK2                      ; 780b 6514    . One tick per VBI (60/sec)
            sta TIMSCL                       ; 780d 8d1306  . frame to scroll in
            lda #$00                         ; 7810 a900    
            sta OFFLO                        ; 7812 85b9    . How far to offset new LMS value
            sta OFFHI                        ; 7814 85ba    zero the offset
            lda STICK0                       ; 7816 ad7802  get joystick reading
            pha                              ; 7819 48      save it on stack for other bit checks
            and #$08                         ; 781a 2908    joystick left?
            bne CHKRT                        ; 781c d03a    no, move on
            lda CURSXL                       ; 781e a5b5    
            bne _NOBUT_4                     ; 7820 d004    
            ldx CURSXH                       ; 7822 a6b6    
            beq CHKUP                        ; 7824 f071
_NOBUT_4:   sec                              ; 7826 38      
            sbc #$01                         ; 7827 e901    
            sta CURSXL                       ; 7829 85b5    
            bcs _NOBUT_5                     ; 782b b002    
            dec CURSXH                       ; 782d c6b6    
_NOBUT_5:   lda SHPOS0                       ; 782f ad0406  . shadows player 0 position
            cmp #$ba                         ; 7832 c9ba    
            beq _NOBUT_6                     ; 7834 f00b    
            clc                              ; 7836 18      
            adc #$01                         ; 7837 6901    
            sta SHPOS0                       ; 7839 8d0406  . shadows player 0 position
            sta HPOSP0 / M0PF                ; 783c 8d00d0  . W: h.pos of P0 / R: missile 0 to pf collision
            bne CHKUP                        ; 783f d056
_NOBUT_6:   lda XPOSL                        ; 7841 ad0006  . Horiz pos of upper left of screen window
            sec                              ; 7844 38      decrement x-coordinate
            sbc #$01                         ; 7845 e901    
            sta XPOSL                        ; 7847 8d0006  . Horiz pos of upper left of screen window
            and #$07                         ; 784a 2907    
            sta HSCROL                       ; 784c 8d04d4  fine scroll
            cmp #$07                         ; 784f c907    scroll overflow?
            bne CHKUP                        ; 7851 d044    no, move on
            inc OFFLO                        ; 7853 e6b9    yes, mark it for offset
            clv                              ; 7855 b8      
            bvc CHKUP                        ; 7856 503f    no point in checking for joystick right
CHKRT:      pla                              ; 7858 68      get back joystick byte
            pha                              ; 7859 48      save it again
            and #$04                         ; 785a 2904    joystick right?
            bne CHKUP                        ; 785c d039    no, move on
            lda CURSXL                       ; 785e a5b5    
            cmp #$64                         ; 7860 c964    
            bne _NOBUT_8                     ; 7862 d004    
            ldx CURSXH                       ; 7864 a6b6    
            bne CHKUP                        ; 7866 d02f
_NOBUT_8:   clc                              ; 7868 18      
            adc #$01                         ; 7869 6901    
            sta CURSXL                       ; 786b 85b5    
            bcc _NOBUT_9                     ; 786d 9002    
            inc CURSXH                       ; 786f e6b6    
_NOBUT_9:   lda SHPOS0                       ; 7871 ad0406  . shadows player 0 position
            cmp #$36                         ; 7874 c936    
            beq _NOBUT_10                    ; 7876 f00b    
            sec                              ; 7878 38      
            sbc #$01                         ; 7879 e901    
            sta SHPOS0                       ; 787b 8d0406  . shadows player 0 position
            sta HPOSP0 / M0PF                ; 787e 8d00d0  . W: h.pos of P0 / R: missile 0 to pf collision
            bne CHKUP                        ; 7881 d014
_NOBUT_10:  lda XPOSL                        ; 7883 ad0006  . Horiz pos of upper left of screen window
            clc                              ; 7886 18      no, increment x-coordinate
            adc #$01                         ; 7887 6901    
            sta XPOSL                        ; 7889 8d0006  . Horiz pos of upper left of screen window
            and #$07                         ; 788c 2907    
            sta HSCROL                       ; 788e 8d04d4  fine scroll
            bne CHKUP                        ; 7891 d004    scroll overflow? if not, move on
            dec OFFLO                        ; 7893 c6b9    yes, set up offset for character scroll
            dec OFFHI                        ; 7895 c6ba    
CHKUP:      pla                              ; 7897 68      joystick up?
            lsr                              ; 7898 4a      
            pha                              ; 7899 48      
            bcs CHKDN                        ; 789a b05a    no, ramble on
            lda CURSYL                       ; 789c a5b7    . Cursor coords on screen (map frame)
            cmp #$5e                         ; 789e c95e    
            bne _NOBUT_12                    ; 78a0 d006    
            ldx CURSYH                       ; 78a2 a6b8    
            cpx #$02                         ; 78a4 e002    
            beq CHKDN                        ; 78a6 f04e
_NOBUT_12:  inc CURSYL                       ; 78a8 e6b7    . Cursor coords on screen (map frame)
            bne _NOBUT_13                    ; 78aa d002    
            inc CURSYH                       ; 78ac e6b8    
_NOBUT_13:  ldx SCY                          ; 78ae ae0306  . vert pos of cursor (player frame)
            cpx #$1b                         ; 78b1 e01b    
            beq _NOBUT_16                    ; 78b3 f01d    
            inc CURSYL                       ; 78b5 e6b7    . Cursor coords on screen (map frame)
            bne _NOBUT_14                    ; 78b7 d002    
            inc CURSYH                       ; 78b9 e6b8    
_NOBUT_14:  dex                              ; 78bb ca      
            stx SCY                          ; 78bc 8e0306  . vert pos of cursor (player frame)
            txa                              ; 78bf 8a      
            clc                              ; 78c0 18      
            adc #$12                         ; 78c1 6912    
            sta TEMP1                        ; 78c3 85bb    . all purpose temp
_NOBUT_15:  lda PLYR0,x                      ; 78c5 bd0052  . Player 0 sprite data
            sta PLYR0-1,x                    ; 78c8 9dff51  
            inx                              ; 78cb e8      
            cpx TEMP1                        ; 78cc e4bb    . all purpose temp
            bne _NOBUT_15                    ; 78ce d0f5    
            beq CHKDN                        ; 78d0 f024
_NOBUT_16:  lda YPOSL                        ; 78d2 ad0106  . Vert pos of upper left of screen window
            sec                              ; 78d5 38      
            sbc #$01                         ; 78d6 e901    
            bcs _NOBUT_17                    ; 78d8 b003    
            dec YPOSH                        ; 78da ce0206  
_NOBUT_17:  sta YPOSL                        ; 78dd 8d0106  . Vert pos of upper left of screen window
            and #$0f                         ; 78e0 290f    
            sta VSCROL                       ; 78e2 8d05d4  fine scroll
            cmp #$0f                         ; 78e5 c90f    
            bne CHKDN                        ; 78e7 d00d    scroll overflow? If not, amble on
            lda OFFLO                        ; 78e9 a5b9    yes, set up offset for character scroll
            sec                              ; 78eb 38      
            sbc #$30                         ; 78ec e930    
            sta OFFLO                        ; 78ee 85b9    . How far to offset new LMS value
            lda OFFHI                        ; 78f0 a5ba    
            sbc #$00                         ; 78f2 e900    
            sta OFFHI                        ; 78f4 85ba    
CHKDN:      pla                              ; 78f6 68      joystick down?
            lsr                              ; 78f7 4a      
            bcs CHGDL                        ; 78f8 b05f    no, trudge on
            lda CURSYL                       ; 78fa a5b7    . Cursor coords on screen (map frame)
            cmp #$02                         ; 78fc c902    
            bne _NOBUT_19                    ; 78fe d004    
            ldx CURSYH                       ; 7900 a6b8    
            beq CHGDL                        ; 7902 f055
_NOBUT_19:  sec                              ; 7904 38      
            sbc #$01                         ; 7905 e901    
            sta CURSYL                       ; 7907 85b7    . Cursor coords on screen (map frame)
            bcs _NOBUT_20                    ; 7909 b002    
            dec CURSYH                       ; 790b c6b8    
_NOBUT_20:  ldx SCY                          ; 790d ae0306  . vert pos of cursor (player frame)
            cpx #$4e                         ; 7910 e04e    
            beq _NOBUT_23                    ; 7912 f023    
            sec                              ; 7914 38      
            sbc #$01                         ; 7915 e901    
            sta CURSYL                       ; 7917 85b7    . Cursor coords on screen (map frame)
            bcs _NOBUT_21                    ; 7919 b002    
            dec CURSYH                       ; 791b c6b8    
_NOBUT_21:  inx                              ; 791d e8      
            stx SCY                          ; 791e 8e0306  . vert pos of cursor (player frame)
            txa                              ; 7921 8a      
            clc                              ; 7922 18      
            adc #$12                         ; 7923 6912    
            dex                              ; 7925 ca      
            dex                              ; 7926 ca      
            stx TEMP1                        ; 7927 86bb    . all purpose temp
            tax                              ; 7929 aa      
_NOBUT_22:  lda PLYR0-1,x                    ; 792a bdff51  
            sta PLYR0,x                      ; 792d 9d0052  . Player 0 sprite data
            dex                              ; 7930 ca      
            cpx TEMP1                        ; 7931 e4bb    . all purpose temp
            bne _NOBUT_22                    ; 7933 d0f5    
            beq CHGDL                        ; 7935 f022
_NOBUT_23:  lda YPOSL                        ; 7937 ad0106  . Vert pos of upper left of screen window
            clc                              ; 793a 18      no, decrement y-coordinate
            adc #$01                         ; 793b 6901    
            sta YPOSL                        ; 793d 8d0106  . Vert pos of upper left of screen window
            bcc _NOBUT_24                    ; 7940 9003    
            inc YPOSH                        ; 7942 ee0206  
_NOBUT_24:  and #$0f                         ; 7945 290f    
            sta VSCROL                       ; 7947 8d05d4  fine scroll
            bne CHGDL                        ; 794a d00d    no, move on
            lda OFFLO                        ; 794c a5b9    yes, mark offset
            clc                              ; 794e 18      
            adc #$30                         ; 794f 6930    
            sta OFFLO                        ; 7951 85b9    . How far to offset new LMS value
            lda OFFHI                        ; 7953 a5ba    
            adc #$00                         ; 7955 6900    
            sta OFFHI                        ; 7957 85ba    
CHGDL:      ldy #$09                         ; 7959 a009    In this loop we add the offset values to the existing LMS addresses of all display lines.
_NOBUT_26:  lda (DLSTPTL),y                  ; 795b b1b0    This scrolls the characters.
            clc                              ; 795d 18      
            adc OFFLO                        ; 795e 65b9    . How far to offset new LMS value
            sta (DLSTPTL),y                  ; 7960 91b0    . Zero page pointer to display list
            iny                              ; 7962 c8      
            lda (DLSTPTL),y                  ; 7963 b1b0    . Zero page pointer to display list
            adc OFFHI                        ; 7965 65ba    
            sta (DLSTPTL),y                  ; 7967 91b0    . Zero page pointer to display list
            iny                              ; 7969 c8      
            iny                              ; 796a c8      
            cpy #$27                         ; 796b c027    
            bne _NOBUT_26                    ; 796d d0ec    
ENDISR:     lda YPOSH                        ; 796f ad0206  
            lsr                              ; 7972 4a      
            lda YPOSL                        ; 7973 ad0106  . Vert pos of upper left of screen window
            ror                              ; 7976 6a      
            lsr                              ; 7977 4a      
            lsr                              ; 7978 4a      
            lsr                              ; 7979 4a      
            cmp #$11                         ; 797a c911    
            bcs _ENDISR_1                    ; 797c b004    
            lda #$ff                         ; 797e a9ff    
            bmi _ENDISR_3                    ; 7980 3010    
_ENDISR_1:  cmp #$1a                         ; 7982 c91a    
            bcc _ENDISR_2                    ; 7984 9004    
            lda #$02                         ; 7986 a902    
            bpl _ENDISR_3                    ; 7988 1008    
_ENDISR_2:  sta TEMP1                        ; 798a 85bb    . all purpose temp
            inx                              ; 798c e8      
            lda #$1d                         ; 798d a91d    
            sec                              ; 798f 38      
            sbc TEMP1                        ; 7990 e5bb    . all purpose temp
_ENDISR_3:  sta CNT1                         ; 7992 85bc    . DLI counter
            lda #$00                         ; 7994 a900    
            sta CNT2                         ; 7996 85bd    . DLI counter for moveable map DLI
            jmp XITVBV                       ; 7998 4c62e4  . Exit from the VBLANK routine

    !byte $e4                                                               ; 799b d
JSTP:  ; Dirs to spiral around 5x5 square (incl 3x3 steps)
    !byte $00,$00,$00,$00,$03,$03,$03,$03,$02,$02,$02,$02,$01,$01,$01,$00   ; 799c ................
JSTP+16:  ; Dirs to spiral from loc around 3x3 (reverse order)
    !byte $00,$00,$03,$03,$02,$02,$01,$00                                   ; 79ac ........
DEFNC:  ; Defensive combat modifiers; 1 -> half, 2 -> no effect, 3 -> double
    !byte $02,$03,$03,$02,$02,$02,$01,$01,$02,$00,$00,$00                   ; 79b4 ............

DWORDS:     asl                              ; 79c0 0a      displays a single word from a long table of words
            asl                              ; 79c1 0a      
            asl                              ; 79c2 0a      
            bcc DWORDSB                      ; 79c3 9015    
            tax                              ; 79c5 aa      
_DWORDS_1:  lda WORDS+256,x                  ; 79c6 bdba58  
            sec                              ; 79c9 38      
            sbc #$20                         ; 79ca e920    
            beq _DWORDS_2                    ; 79cc f00a    
            sta TXTWDW,y                     ; 79ce 995064  
            iny                              ; 79d1 c8      
            inx                              ; 79d2 e8      
            txa                              ; 79d3 8a      
            and #$07                         ; 79d4 2907    
            bne _DWORDS_1                    ; 79d6 d0ee    
_DWORDS_2:  iny                              ; 79d8 c8      
            rts                              ; 79d9 60      

DWORDSB:    tax                              ; 79da aa      this is another entry point
_DWORDSB_1: lda WORDS,x                      ; 79db bdba57  . various words for messages
            sec                              ; 79de 38      
            sbc #$20                         ; 79df e920    
            beq _DWORDSB_2                   ; 79e1 f00a    
            sta TXTWDW,y                     ; 79e3 995064  
            iny                              ; 79e6 c8      
            inx                              ; 79e7 e8      
            txa                              ; 79e8 8a      
            and #$07                         ; 79e9 2907    
            bne _DWORDSB_1                   ; 79eb d0ee    
_DWORDSB_2: iny                              ; 79ed c8      
            rts                              ; 79ee 60      

SWITCH:     lda #$00                         ; 79ef a900    Swap map CHUNKX/Y with SWAP,x; x = CORPS, y = map offset
            sta MAPHI                        ; 79f1 85b3    
            lda #$27                         ; 79f3 a927    calc map offset $6500 + (#$27-CHUNKY)*48 + (#$2e-CHUNKX)
            sec                              ; 79f5 38      
            sbc CHUNKY                       ; 79f6 e5bf    
            asl                              ; 79f8 0a      
            rol MAPHI                        ; 79f9 26b3    
            asl                              ; 79fb 0a      
            rol MAPHI                        ; 79fc 26b3    
            asl                              ; 79fe 0a      
            rol MAPHI                        ; 79ff 26b3    
            asl                              ; 7a01 0a      
            rol MAPHI                        ; 7a02 26b3    
            sta TEMPLO                       ; 7a04 8d1406  . temp word
            ldx MAPHI                        ; 7a07 a6b3    
            stx TEMPHI                       ; 7a09 8e1506  
            asl                              ; 7a0c 0a      
            rol MAPHI                        ; 7a0d 26b3    
            clc                              ; 7a0f 18      
            adc TEMPLO                       ; 7a10 6d1406  . temp word
            sta MAPLO                        ; 7a13 85b2    
            lda MAPHI                        ; 7a15 a5b3    
            adc TEMPHI                       ; 7a17 6d1506  
            adc #$65                         ; 7a1a 6965    
            sta MAPHI                        ; 7a1c 85b3    
            lda #$2e                         ; 7a1e a92e    
            sec                              ; 7a20 38      
            sbc CHUNKX                       ; 7a21 e5be    . Cursor coords (pixel frame)
            tay                              ; 7a23 a8      
            lda (MAPLO),y                    ; 7a24 b1b2    
            ldx CORPS                        ; 7a26 a6b4    . Number of unit under window
            beq _SWITCH_1                    ; 7a28 f00a    
            pha                              ; 7a2a 48      
            lda SWAP,x                       ; 7a2b bd7c56  . terrain code underneath unit
            sta (MAPLO),y                    ; 7a2e 91b2    
            pla                              ; 7a30 68      
            sta SWAP,x                       ; 7a31 9d7c56  . terrain code underneath unit
_SWITCH_1:  rts                              ; 7a34 60      

CLRP1:      lda #$00                         ; 7a35 a900    clears the arrow player
            ldy STEPY                        ; 7a37 ac1906  
            dey                              ; 7a3a 88      
            tax                              ; 7a3b aa      
_CLRP1_1:   cpy #$80                         ; 7a3c c080    
            bcs _CLRP1_2                     ; 7a3e b003    
            sta PLYR1,y                      ; 7a40 998052  . Player 1 sprite data
_CLRP1_2:   iny                              ; 7a43 c8      
            inx                              ; 7a44 e8      
            cpx #$0b                         ; 7a45 e00b    
            bne _CLRP1_1                     ; 7a47 d0f3    
            rts                              ; 7a49 60      

CLRP2:      lda #$00                         ; 7a4a a900    clears the maltakreuze
            ldy KRZY                         ; 7a4c ac2106  
            tax                              ; 7a4f aa      
_CLRP2_1:   cpy #$80                         ; 7a50 c080    
            bcs _CLRP2_2                     ; 7a52 b003    
            sta PLYR2,y                      ; 7a54 990053  . Player 2 sprite data
_CLRP2_2:   iny                              ; 7a57 c8      
            inx                              ; 7a58 e8      
            cpx #$0a                         ; 7a59 e00a    
OBJX-55 = $7a5a  ; self-modifying code?
            bne _CLRP2_1                     ; 7a5b d0f3    
            rts                              ; 7a5d 60      

ERRCLR:     lda ERRFLG                       ; 7a5e ad2406  clears sound and the text window
            bpl _ERRCLR_2                    ; 7a61 1010    
            lda #$00                         ; 7a63 a900    
            sta ERRFLG                       ; 7a65 8d2406  
            ldy #$86                         ; 7a68 a086    
            ldx #$1f                         ; 7a6a a21f    
_ERRCLR_1:  sta TXTWDW,y                     ; 7a6c 995064  
            dey                              ; 7a6f 88      
            dex                              ; 7a70 ca      
            bpl _ERRCLR_1                    ; 7a71 10f9    
_ERRCLR_2:  rts                              ; 7a73 60      

BITTAB:
    !byte $c0,$03,$0c,$30                                                   ; 7a74 @..0
ROTARR:
    !byte $04,$09,$0e,$13,$18,$03,$08,$0d,$12,$17,$02,$07,$0c,$11,$16,$01   ; 7a78 ................
    !byte $06,$0b,$10,$15,$00,$05,$0a,$0f,$14                               ; 7a88 .........
OBJX:
    !byte $03,$08,$0d,$12,$17,$02,$07,$0c,$11,$16,$01,$06,$0b,$10,$15,$00   ; 7a91 ................
    !byte $05,$0a,$0f,$14,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 7aa1 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 7ab1 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 7ac1 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 7ad1 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 7ae1 ................
    !byte $00,$00,$00,$00,$00,$00,$00,$00                                   ; 7af1 ........
    !byte $00,$00,$00,$00,$00,$00,$00                                       ; 7af9 .......

DLISRV:     pha                              ; 7b00 48      DLI handler
            txa                              ; 7b01 8a      
            pha                              ; 7b02 48      
            inc CNT2                         ; 7b03 e6bd    . DLI counter for moveable map DLI
            lda CNT2                         ; 7b05 a5bd    . DLI counter for moveable map DLI
            cmp CNT1                         ; 7b07 c5bc    . DLI counter
            bne _DLISRV_1                    ; 7b09 d014    
            ldx #$62                         ; 7b0b a262    map DLI
            lda #$28                         ; 7b0d a928    
            eor COLRSH                       ; 7b0f 454f    . Color shift mask
            and DRKMSK                       ; 7b11 254e    . Dark attract mask
            sta WSYNC                        ; 7b13 8d0ad4  . Wait for horizontal synchronization
            stx CHBASE                       ; 7b16 8e09d4  . Character base address
            sta COLPF0                       ; 7b19 8d16d0  . Color and luminance of playfield 0
            jmp DLIOUT                       ; 7b1c 4cae7b

_DLISRV_1:  cmp #$0f                         ; 7b1f c90f    
            bne _DLISRV_2                    ; 7b21 d019    
            lda #$3a                         ; 7b23 a93a    
            eor COLRSH                       ; 7b25 454f    . Color shift mask
            and DRKMSK                       ; 7b27 254e    . Dark attract mask
            tax                              ; 7b29 aa      
            lda #$00                         ; 7b2a a900    
            eor COLRSH                       ; 7b2c 454f    . Color shift mask
            and DRKMSK                       ; 7b2e 254e    . Dark attract mask
            sta WSYNC                        ; 7b30 8d0ad4  . Wait for horizontal synchronization
            stx COLPF2                       ; 7b33 8e18d0  . Color and luminance of playfield 2
            sta COLPF1                       ; 7b36 8d17d0  . Color and luminance of playfield 1
            jmp DLIOUT                       ; 7b39 4cae7b

_DLISRV_2:  cmp #$01                         ; 7b3c c901    
            bne _DLISRV_3                    ; 7b3e d01f    
            lda TRCOLR                       ; 7b40 ad0506  green tree color
            eor COLRSH                       ; 7b43 454f    . Color shift mask
            and DRKMSK                       ; 7b45 254e    . Dark attract mask
            tax                              ; 7b47 aa      
            lda #$1a                         ; 7b48 a91a    yellow band at top of map
            eor COLRSH                       ; 7b4a 454f    . Color shift mask
            and DRKMSK                       ; 7b4c 254e    . Dark attract mask
            sta WSYNC                        ; 7b4e 8d0ad4  . Wait for horizontal synchronization
            sta COLBK                        ; 7b51 8d1ad0  . Color and luminance of the background
            stx COLPF0                       ; 7b54 8e16d0  . Color and luminance of playfield 0
            lda #$60                         ; 7b57 a960    
            sta CHBASE                       ; 7b59 8d09d4  . Character base address
            jmp DLIOUT                       ; 7b5c 4cae7b

_DLISRV_3:  cmp #$03                         ; 7b5f c903    
            bne _DLISRV_4                    ; 7b61 d010    
            lda EARTH                        ; 7b63 ad0606  top of map
            eor COLRSH                       ; 7b66 454f    . Color shift mask
            and DRKMSK                       ; 7b68 254e    . Dark attract mask
            sta WSYNC                        ; 7b6a 8d0ad4  . Wait for horizontal synchronization
            sta COLBK                        ; 7b6d 8d1ad0  . Color and luminance of the background
            jmp DLIOUT                       ; 7b70 4cae7b

_DLISRV_4:  cmp #$0d                         ; 7b73 c90d    
            bne _TRDMRK_1                    ; 7b75 d014
            ldx #$e0                         ; 7b77 a2e0    bottom of map
            lda #$22                         ; 7b79 a922    
TRDMRK = $7b7a  ; self-modifying code?
            eor COLRSH                       ; 7b7b 454f    . Color shift mask
            and DRKMSK                       ; 7b7d 254e    . Dark attract mask
            sta WSYNC                        ; 7b7f 8d0ad4  . Wait for horizontal synchronization
            sta COLPF2                       ; 7b82 8d18d0  . Color and luminance of playfield 2
            stx CHBASE                       ; 7b85 8e09d4  . Character base address
            jmp DLIOUT                       ; 7b88 4cae7b

_TRDMRK_1:  cmp #$0e                         ; 7b8b c90e
            bne _TRDMRK_2                    ; 7b8d d00f
            lda #$8a                         ; 7b8f a98a    bright blue strip
            eor COLRSH                       ; 7b91 454f    . Color shift mask
            and DRKMSK                       ; 7b93 254e    . Dark attract mask
            sta WSYNC                        ; 7b95 8d0ad4  . Wait for horizontal synchronization
            sta COLBK                        ; 7b98 8d1ad0  . Color and luminance of the background
            jmp DLIOUT                       ; 7b9b 4cae7b

_TRDMRK_2:  cmp #$10                         ; 7b9e c910
            bne DLIOUT                       ; 7ba0 d00c
            lda #$d4                         ; 7ba2 a9d4    green bottom
            eor COLRSH                       ; 7ba4 454f    . Color shift mask
            and DRKMSK                       ; 7ba6 254e    . Dark attract mask
            pha                              ; 7ba8 48      
            pla                              ; 7ba9 68      
            nop                              ; 7baa ea      
            sta COLBK                        ; 7bab 8d1ad0  . Color and luminance of the background
DLIOUT:     pla                              ; 7bae 68
            tax                              ; 7baf aa      
            pla                              ; 7bb0 68      
            rti                              ; 7bb1 40      

DNUMBR:     tax                              ; 7bb2 aa      displays a number with leading zero suppress
            clc                              ; 7bb3 18      
            lda HDIGIT,x                     ; 7bb4 bd085a  . hundreds digits for number display
            beq _DNUMBR_1                    ; 7bb7 f007    
            adc #$10                         ; 7bb9 6910    
            sta TXTWDW,y                     ; 7bbb 995064  
            iny                              ; 7bbe c8      
            sec                              ; 7bbf 38      
_DNUMBR_1:  lda TDIGIT,x                     ; 7bc0 bd085b  . tens digits tables
            bcs _DNUMBR_2                    ; 7bc3 b002    
            beq _DNUMBR_3                    ; 7bc5 f007    
_DNUMBR_2:  clc                              ; 7bc7 18      
            adc #$10                         ; 7bc8 6910    
            sta TXTWDW,y                     ; 7bca 995064  
            iny                              ; 7bcd c8      
_DNUMBR_3:  lda ODIGIT,x                     ; 7bce bd085c  . ones digits tables
            clc                              ; 7bd1 18      
            adc #$10                         ; 7bd2 6910    
            sta TXTWDW,y                     ; 7bd4 995064  
            iny                              ; 7bd7 c8      
            rts                              ; 7bd8 60      

NDX:
    !byte $00,$01,$02,$03,$04,$09,$0e,$13,$18,$17,$16,$15,$14,$0f,$0a,$05   ; 7bd9 ................
    !byte $06,$07,$08,$0d,$12,$11,$10,$0b                                   ; 7be9 ........
YINC:  ; note YINC/XINC overlap
    !byte $01                                                               ; 7bf1 .
XINC:
    !byte $00,$ff,$00,$01                                                   ; 7bf2 ....
OFFNC:  ; Offence combat modifiers, 1 -> half, 2 -> no effect
    !byte $01,$01,$01,$01,$01,$01,$02,$02,$01,$00                           ; 7bf6 ..........
    !byte $00,$e0,$02,$e1,$02,$00,$6e                                       ; 7c00 .`.a..n
