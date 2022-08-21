; converted with pydisass6502 by awsm of mayday!

* = $4700

think       ldx #$01                        ; 4700 a201
            sta $c5                         ; 4702 85c5
            sta $0691                       ; 4704 8d9106
            sta $0690                       ; 4707 8d9006
            ldy #$9e                        ; 470a a09e
_think1     lda s_AL,y                      ; 470c b91b57
            cmp $c9                         ; 470f c5c9
            bcs _think2                     ; 4711 b00d
            lda $c5                         ; 4713 a5c5
            clc                             ; 4715 18
            adc s_AJ,y                      ; 4716 79dd55
            sta $c5                         ; 4719 85c5
            bcc _think2                     ; 471b 9003
            inc $0690,x                     ; 471d fe9006
_think2     dey                             ; 4720 88
            cpy #$37                        ; 4721 c037
            bcs _think1                     ; 4723 b0e7
            ldx #$00                        ; 4725 a200
            cpy #$00                        ; 4727 c000
            bne _think1                     ; 4729 d0e1
            lda $0691                       ; 472b ad9106
            sta $c5                         ; 472e 85c5
            lda $0690                       ; 4730 ad9006
            ldx #$04                        ; 4733 a204
_think3     asl                             ; 4735 0a
            bcc _think5                     ; 4736 9008
            ror                             ; 4738 6a
_think4     lsr $c5                         ; 4739 46c5
            dex                             ; 473b ca
            bne _think4                     ; 473c d0fb
            beq _think6                     ; 473e f003
_think5     dex                             ; 4740 ca
            bne _think3                     ; 4741 d0f2
_think6     ldy #$ff                        ; 4743 a0ff
            ldx $c5                         ; 4745 a6c5
            beq _think8                     ; 4747 f006
            sec                             ; 4749 38
_think7     iny                             ; 474a c8
            sbc $c5                         ; 474b e5c5
            bcs _think7                     ; 474d b0fb
_think8     sty $0692                       ; 474f 8c9206
            ldx #$9e                        ; 4752 a29e
_think9     stx $c2                         ; 4754 86c2
            lda s_AL,x                      ; 4756 bd1b57
            cmp $c9                         ; 4759 c5c9
            bcs _think10                    ; 475b b00f
            jsr s_K                         ; 475d 20234c
            lda units,x                     ; 4760 bd0054
            sta s_DG,x                      ; 4763 9d5a7a
            lda s_AH,x                      ; 4766 bd9f54
            sta s_AG,x                      ; 4769 9d6153
_think10    dex                             ; 476c ca
            cpx #$37                        ; 476d e037
            bcs _think9                     ; 476f b0e3
s_A         ldx #$9e                        ; 4771 a29e
s_B         stx $c2                         ; 4773 86c2
            lda s_AL,x                      ; 4775 bd1b57
            cmp $c9                         ; 4778 c5c9
            bcc _B2                         ; 477a 9003
_B1         jmp s_F                         ; 477c 4c114b
_B2         lda s_AO,x                      ; 477f bdca58
            cmp #$04                        ; 4782 c904
            beq _B1                         ; 4784 f0f6
            lda $0692                       ; 4786 ad9206
            lsr                             ; 4789 4a
            cmp $0661,x                     ; 478a dd6106
            bne _B5                         ; 478d d056
            sta $0631                       ; 478f 8d3106
            ldy #$9e                        ; 4792 a09e
_B3         lda s_AL,y                      ; 4794 b91b57
            cmp $c9                         ; 4797 c5c9
            bcs _B4                         ; 4799 b033
            lda units,y                     ; 479b b90054
            sec                             ; 479e 38
            sbc units,x                     ; 479f fd0054
            jsr s_O                         ; 47a2 20304d
            sta $c5                         ; 47a5 85c5
            lda s_AH,y                      ; 47a7 b99f54
            sec                             ; 47aa 38
            sbc s_AH,x                      ; 47ab fd9f54
            jsr s_O                         ; 47ae 20304d
            clc                             ; 47b1 18
            adc $c5                         ; 47b2 65c5
            lsr                             ; 47b4 4a
            lsr                             ; 47b5 4a
            lsr                             ; 47b6 4a
            bcs _B4                         ; 47b7 b015
            sta $c5                         ; 47b9 85c5
            lda $0661,y                     ; 47bb b96106
            sec                             ; 47be 38
            sbc $c5                         ; 47bf e5c5
            bcc _B4                         ; 47c1 900b
            cmp $0631                       ; 47c3 cd3106
            bcc _B4                         ; 47c6 9006
            sta $0631                       ; 47c8 8d3106
            sty $0632                       ; 47cb 8c3206
_B4         dey                             ; 47ce 88
            cpy #$37                        ; 47cf c037
            bcs _B3                         ; 47d1 b0c1
            ldy $0632                       ; 47d3 ac3206
            lda units,y                     ; 47d6 b90054
            sta s_DG,x                      ; 47d9 9d5a7a
            lda s_AH,y                      ; 47dc b99f54
            sta s_AG,x                      ; 47df 9d6153
            jmp s_F                         ; 47e2 4c114b
_B5         lda #$ff                        ; 47e5 a9ff
            sta $0633                       ; 47e7 8d3306
            sta $0632                       ; 47ea 8d3206
            lda #$00                        ; 47ed a900
            sta $0631                       ; 47ef 8d3106
            lda s_Q,x                       ; 47f2 bd694d
            cmp #$10                        ; 47f5 c910
            bcs _B6                         ; 47f7 b009
            lda s_AI,x                      ; 47f9 bd3e55
            lsr                             ; 47fc 4a
            cmp s_AJ,x                      ; 47fd dddd55
            bcc _B8                         ; 4800 9010
_B6         lda units,x                     ; 4802 bd0054
            sec                             ; 4805 38
            sbc #$05                        ; 4806 e905
            bcs _B7                         ; 4808 b002
            lda #$00                        ; 480a a900
_B7         sta s_DG,x                      ; 480c 9d5a7a
            jmp s_F                         ; 480f 4c114b
_B8         lda s_DG,x                      ; 4812 bd5a7a
            ldy $0633                       ; 4815 ac3306
            bmi _B9                         ; 4818 3004
            clc                             ; 481a 18
            adc s_DO,y                      ; 481b 79f27b
_B9         sta $0634                       ; 481e 8d3406
            lda s_AG,x                      ; 4821 bd6153
            ldy $0633                       ; 4824 ac3306
            bmi _B10                        ; 4827 3004
            clc                             ; 4829 18
            adc s_DN,y                      ; 482a 79f17b
_B10        sta $0635                       ; 482d 8d3506
            lda #$00                        ; 4830 a900
            sta $ce                         ; 4832 85ce
            lda $0633                       ; 4834 ad3306
            bmi _B11                        ; 4837 3010
            sta s_AW,x                      ; 4839 9d145e
            jsr _CI1                        ; 483c 20de72
            ldy $c2                         ; 483f a4c2
            lda s_BU,y                      ; 4841 b9616d
            bpl _B11                        ; 4844 1003
            jmp s_E                         ; 4846 4cd64a
_B11        lda #$00                        ; 4849 a900
            sta $0639                       ; 484b 8d3906
            lda $0634                       ; 484e ad3406
            sta $0636                       ; 4851 8d3606
            lda $0635                       ; 4854 ad3506
            sta $0637                       ; 4857 8d3706
            ldy #$17                        ; 485a a017
_B12        sty $0638                       ; 485c 8c3806
            lda s_CZ,y                      ; 485f b99c79
            tay                             ; 4862 a8
            lda $0636                       ; 4863 ad3606
            clc                             ; 4866 18
            adc s_DO,y                      ; 4867 79f27b
            sta $0636                       ; 486a 8d3606
            lda $0637                       ; 486d ad3706
            clc                             ; 4870 18
            adc s_DN,y                      ; 4871 79f17b
            sta $0637                       ; 4874 8d3706
            ldx #$9e                        ; 4877 a29e
_B13        lda s_AL,x                      ; 4879 bd1b57
            cmp $c9                         ; 487c c5c9
            beq _B14                        ; 487e f002
            bcs _B15                        ; 4880 b019
_B14        lda s_DG,x                      ; 4882 bd5a7a
            cmp $0636                       ; 4885 cd3606
            bne _B15                        ; 4888 d011
            lda s_AG,x                      ; 488a bd6153
            cmp $0637                       ; 488d cd3706
            bne _B15                        ; 4890 d009
            cpx $c2                         ; 4892 e4c2
            beq _B16                        ; 4894 f00a
            lda s_AI,x                      ; 4896 bd3e55
            bne _B17                        ; 4899 d007
_B15        dex                             ; 489b ca
            cpx #$37                        ; 489c e037
            bcs _B13                        ; 489e b0d9
_B16        lda #$00                        ; 48a0 a900
_B17        ldy $0638                       ; 48a2 ac3806
            ldx s_DM,x                      ; 48a5 bed97b
            sta $0663,x                     ; 48a8 9d6306
            dey                             ; 48ab 88
            bpl _B12                        ; 48ac 10ae
            ldx $c2                         ; 48ae a6c2
            lda s_AI,x                      ; 48b0 bd3e55
            sta $066f                       ; 48b3 8d6f06
            lda #$00                        ; 48b6 a900
            sta $c7                         ; 48b8 85c7
            sta $c8                         ; 48ba 85c8
            sta $0648                       ; 48bc 8d4806
s_C         ldx #$00                        ; 48bf a200
            stx $0649                       ; 48c1 8e4906
_C1         ldy #$00                        ; 48c4 a000
_C2         lda $0663,x                     ; 48c6 bd6306
            bne _C3                         ; 48c9 d006
            inx                             ; 48cb e8
            iny                             ; 48cc c8
            cpy #$05                        ; 48cd c005
            bne _C2                         ; 48cf d0f5
_C3         ldx $0649                       ; 48d1 ae4906
            tya                             ; 48d4 98
            sta $0684,x                     ; 48d5 9d8406
            inx                             ; 48d8 e8
            stx $0649                       ; 48d9 8e4906
            cpx #$01                        ; 48dc e001
            bne _C4                         ; 48de d004
            ldx #$05                        ; 48e0 a205
            bne _C1                         ; 48e2 d0e0
_C4         cpx #$02                        ; 48e4 e002
            bne _C5                         ; 48e6 d004
            ldx #$0a                        ; 48e8 a20a
            bne _C1                         ; 48ea d0d8
_C5         cpx #$03                        ; 48ec e003
            bne _C6                         ; 48ee d004
            ldx #$0f                        ; 48f0 a20f
            bne _C1                         ; 48f2 d0d0
_C6         cpx #$04                        ; 48f4 e004
            bne _C7                         ; 48f6 d004
            ldx #$14                        ; 48f8 a214
            bne _C1                         ; 48fa d0c8
_C7         lda #$00                        ; 48fc a900
            ldy #$04                        ; 48fe a004
_C8         ldx $0684,x                     ; 4900 be8406
            cpx #$05                        ; 4903 e005
            beq _C9                         ; 4905 f003
            clc                             ; 4907 18
            adc #$28                        ; 4908 6928
_C9         dey                             ; 490a 88
            bpl _C8                         ; 490b 10f3
            ldy $066d                       ; 490d ac6d06
            bne _C10                        ; 4910 d012
            ldy $066e                       ; 4912 ac6e06
            bne _C10                        ; 4915 d00d
            ldy $0670                       ; 4917 ac7006
            bne _C10                        ; 491a d008
            ldy $0671                       ; 491c ac7106
            bne _C10                        ; 491f d003
            clc                             ; 4921 18
            adc #$30                        ; 4922 6930
_C10        sta $0689                       ; 4924 8d8906
            ldx #$00                        ; 4927 a200
_C11        lda $0684,x                     ; 4929 bd8406
            cmp #$04                        ; 492c c904
            bcs _C13                        ; 492e b01f
            sta $c5                         ; 4930 85c5
            stx $c6                         ; 4932 86c6
            txa                             ; 4934 8a
            asl                             ; 4935 0a
            asl                             ; 4936 0a
            adc $c6                         ; 4937 65c6
            adc $c5                         ; 4939 65c5
            tay                             ; 493b a8
            iny                             ; 493c c8
            lda $0663,y                     ; 493d b96306
            beq _C13                        ; 4940 f00d
            lda $0689                       ; 4942 ad8906
            sec                             ; 4945 38
            sbc #$20                        ; 4946 e920
            bcs _C12                        ; 4948 b002
            lda #$00                        ; 494a a900
_C12        sta $0689                       ; 494c 8d8906
_C13        inx                             ; 494f e8
            cpx #$05                        ; 4950 e005
            bne _C11                        ; 4952 d0d5
            ldy #$00                        ; 4954 a000
_C14        sty $068b                       ; 4956 8c8b06
            ldx #$00                        ; 4959 a200
_C15        stx $068a                       ; 495b 8e8a06
            cpx $068b                       ; 495e ec8b06
            beq _C18                        ; 4961 f021
            lda $0684,x                     ; 4963 bd8406
            sec                             ; 4966 38
            sbc $0684,y                     ; 4967 f98406
            beq _C18                        ; 496a f018
            bmi _C18                        ; 496c 3016
            tax                             ; 496e aa
            lda #$01                        ; 496f a901
_C16        asl                             ; 4971 0a
            dex                             ; 4972 ca
            bne _C16                        ; 4973 d0fc
            sta $c5                         ; 4975 85c5
            lda $0689                       ; 4977 ad8906
            sec                             ; 497a 38
            sbc $c5                         ; 497b e5c5
            bcs _C17                        ; 497d b002
            lda #$00                        ; 497f a900
_C17        sta $0689                       ; 4981 8d8906
_C18        ldx $068a                       ; 4984 ae8a06
            inx                             ; 4987 e8
            cpx #$05                        ; 4988 e005
            bne _C15                        ; 498a d0cf
            iny                             ; 498c c8
            cpy #$05                        ; 498d c005
            bne _C14                        ; 498f d0c5
            ldx $c2                         ; 4991 a6c2
            ldy $0648                       ; 4993 ac4806
            bne _C19                        ; 4996 d006
            lda s_N,x                       ; 4998 bd014d
            jmp s_D                         ; 499b 4cb549
_C19        cpy #$01                        ; 499e c001
            bne _C20                        ; 49a0 d006
            lda s_Q,x                       ; 49a2 bd694d
            jmp s_D                         ; 49a5 4cb549
_C20        cpy #$02                        ; 49a8 c002
            bne _C21                        ; 49aa d006
            lda s_R,x                       ; 49ac bdd14d
            jmp s_D                         ; 49af 4cb549
_C21        lda s_S,x                       ; 49b2 bd394e
s_D         sta $c5                         ; 49b5 85c5
            ldx $0689                       ; 49b7 ae8906
            beq _D3                         ; 49ba f013
            lda $c7                         ; 49bc a5c7
            clc                             ; 49be 18
_D1         adc $c5                         ; 49bf 65c5
            bcc _D2                         ; 49c1 9009
            inc $c8                         ; 49c3 e6c8
            clc                             ; 49c5 18
            bne _D2                         ; 49c6 d004
            lda #$ff                        ; 49c8 a9ff
            sta $c8                         ; 49ca 85c8
_D2         dex                             ; 49cc ca
            bne _D1                         ; 49cd d0f0
_D3         iny                             ; 49cf c8
            cpy #$04                        ; 49d0 c004
            beq _D6                         ; 49d2 f01f
            sty $0648                       ; 49d4 8c4806
            ldx #$18                        ; 49d7 a218
_D4         lda $0663,x                     ; 49d9 bd6306
            sta $064a,x                     ; 49dc 9d4a06
            dex                             ; 49df ca
            bpl _D4                         ; 49e0 10f7
            ldx #$18                        ; 49e2 a218
_D5         ldy s_DJ,x                      ; 49e4 bc787a
            lda $064a,x                     ; 49e7 bd4a06
            sta $0663,y                     ; 49ea 996306
            dex                             ; 49ed ca
            bpl _D5                         ; 49ee 10f4
            jmp s_C                         ; 49f0 4cbf48
_D6         lda $c8                         ; 49f3 a5c8
            sta $ce                         ; 49f5 85ce
            ldy #$36                        ; 49f7 a036
            lda #$ff                        ; 49f9 a9ff
            sta $063a                       ; 49fb 8d3a06
_D7         lda s_AL,y                      ; 49fe b91b57
            cmp $c9                         ; 4a01 c5c9
            beq _D8                         ; 4a03 f002
            bcs _D9                         ; 4a05 b021
_D8         lda units,y                     ; 4a07 b90054
            sec                             ; 4a0a 38
            sbc $0634                       ; 4a0b ed3406
            jsr s_O                         ; 4a0e 20304d
            sta $c5                         ; 4a11 85c5
            lda s_AH,y                      ; 4a13 b99f54
            sec                             ; 4a16 38
            sbc $0635                       ; 4a17 ed3506
            jsr s_O                         ; 4a1a 20304d
            clc                             ; 4a1d 18
            adc $c5                         ; 4a1e 65c5
            cmp $063a                       ; 4a20 cd3a06
            bcs _D9                         ; 4a23 b003
            sta $063a                       ; 4a25 8d3a06
_D9         dey                             ; 4a28 88
            bpl _D7                         ; 4a29 10d3
            ldx $c2                         ; 4a2b a6c2
            lda $0661,x                     ; 4a2d bd6106
            sta $c5                         ; 4a30 85c5
            lda #$0f                        ; 4a32 a90f
            sec                             ; 4a34 38
            sbc $c5                         ; 4a35 e5c5
            bcc _D10                        ; 4a37 900c
            asl                             ; 4a39 0a
            sta $c5                         ; 4a3a 85c5
            lda #$09                        ; 4a3c a909
            sec                             ; 4a3e 38
            sbc $063a                       ; 4a3f ed3a06
            sta $063a                       ; 4a42 8d3a06
_D10        ldy $063a                       ; 4a45 ac3a06
            bne _D11                        ; 4a48 d005
            sty $ce                         ; 4a4a 84ce
            jmp s_E                         ; 4a4c 4cd64a
_D11        ldy $cd                         ; 4a4f a4cd
            lda s_DB,y                      ; 4a51 b9b479
            clc                             ; 4a54 18
            adc $063a                       ; 4a55 6d3a06
            tay                             ; 4a58 a8
            lda #$00                        ; 4a59 a900
            clc                             ; 4a5b 18
_D12        adc $c5                         ; 4a5c 65c5
            bcc _D13                        ; 4a5e 9004
            lda #$ff                        ; 4a60 a9ff
            bmi _D14                        ; 4a62 3003
_D13        dey                             ; 4a64 88
            bne _D12                        ; 4a65 d0f5
_D14        clc                             ; 4a67 18
            adc $ce                         ; 4a68 65ce
            bcc _D15                        ; 4a6a 9002
            lda #$ff                        ; 4a6c a9ff
_D15        sta $ce                         ; 4a6e 85ce
            ldy #$9e                        ; 4a70 a09e
_D16        lda s_DG,y                      ; 4a72 b95a7a
            cmp $0634                       ; 4a75 cd3406
            bne _D18                        ; 4a78 d01e
            lda s_AG,y                      ; 4a7a b96153
            cmp $0635                       ; 4a7d cd3506
            bne _D18                        ; 4a80 d016
            cpy $c2                         ; 4a82 c4c2
            beq _D18                        ; 4a84 f012
            lda s_AL,y                      ; 4a86 b91b57
            cmp $c9                         ; 4a89 c5c9
            beq _D17                        ; 4a8b f002
            bcs _D18                        ; 4a8d b009
_D17        lda $ce                         ; 4a8f a5ce
            sbc #$20                        ; 4a91 e920
            sta $ce                         ; 4a93 85ce
            jmp s_E                         ; 4a95 4cd64a
_D18        dey                             ; 4a98 88
            cpy #$37                        ; 4a99 c037
            bcs _D16                        ; 4a9b b0d5
            lda units,x                     ; 4a9d bd0054
            sec                             ; 4aa0 38
            sbc $0634                       ; 4aa1 ed3406
            jsr s_O                         ; 4aa4 20304d
            sta $c5                         ; 4aa7 85c5
            lda s_AH,x                      ; 4aa9 bd9f54
            sec                             ; 4aac 38
            sbc $0635                       ; 4aad ed3506
            jsr s_O                         ; 4ab0 20304d
            clc                             ; 4ab3 18
            adc $c5                         ; 4ab4 65c5
            cmp #$07                        ; 4ab6 c907
            bcc _D19                        ; 4ab8 9006
            lda #$00                        ; 4aba a900
            sta $ce                         ; 4abc 85ce
            beq s_E                         ; 4abe f016
_D19        tax                             ; 4ac0 aa
            lda #$01                        ; 4ac1 a901
_D20        asl                             ; 4ac3 0a
            dex                             ; 4ac4 ca
            bpl _D20                        ; 4ac5 10fc
            sta $c5                         ; 4ac7 85c5
            lda $ce                         ; 4ac9 a5ce
            sec                             ; 4acb 38
            sbc $c5                         ; 4acc e5c5
            sta $ce                         ; 4ace 85ce
            bcs s_E                         ; 4ad0 b004
            lda #$00                        ; 4ad2 a900
            sta $ce                         ; 4ad4 85ce
s_E         ldy $0633                       ; 4ad6 ac3306
            ldx $c2                         ; 4ad9 a6c2
            lda $ce                         ; 4adb a5ce
            cmp $0631                       ; 4add cd3106
            bcc _E1                         ; 4ae0 9006
            sta $0631                       ; 4ae2 8d3106
            sty $0632                       ; 4ae5 8c3206
_E1         iny                             ; 4ae8 c8
            cpy #$04                        ; 4ae9 c004
            beq _E2                         ; 4aeb f006
            sty $0633                       ; 4aed 8c3306
            jmp _B8                         ; 4af0 4c1248
_E2         lda s_DG,x                      ; 4af3 bd5a7a
            ldy $0632                       ; 4af6 ac3206
            bmi _E3                         ; 4af9 3004
            clc                             ; 4afb 18
            adc s_DO,y                      ; 4afc 79f27b
_E3         sta s_DG,x                      ; 4aff 9d5a7a
            lda s_AG,x                      ; 4b02 bd6153
            ldy $0632                       ; 4b05 ac3206
            bmi _E4                         ; 4b08 3004
            clc                             ; 4b0a 18
            adc s_DN,y                      ; 4b0b 79f17b
_E4         sta s_AG,x                      ; 4b0e 9d6153
s_F         lda $d010                       ; 4b11 ad10d0
            beq _F1                         ; 4b14 f00c
            lda #$08                        ; 4b16 a908
            sta $d01f                       ; 4b18 8d1fd0
            lda $d01f                       ; 4b1b ad1fd0
            and #$01                        ; 4b1e 2901
            beq _F3                         ; 4b20 f00b
_F1         dex                             ; 4b22 ca
            cpx #$37                        ; 4b23 e037
            bcc _F2                         ; 4b25 9003
            jmp s_B                         ; 4b27 4c7347
_F2         jmp s_A                         ; 4b2a 4c7147
_F3         ldx #$9e                        ; 4b2d a29e
s_G         stx $c2                         ; 4b2f 86c2
            lda s_AL,x                      ; 4b31 bd1b57
            cmp $c9                         ; 4b34 c5c9
            bcc _G1                         ; 4b36 9003
            jmp s_J                         ; 4b38 4c1a4c
_G1         lda s_DG,x                      ; 4b3b bd5a7a
            ldy #$03                        ; 4b3e a003
            sec                             ; 4b40 38
            sbc units,x                     ; 4b41 fd0054
            bpl _G2                         ; 4b44 1005
            ldy #$01                        ; 4b46 a001
            jsr s_P                         ; 4b48 20324d
_G2         sty $063d                       ; 4b4b 8c3d06
            sta $0641                       ; 4b4e 8d4106
            ldy #$00                        ; 4b51 a000
            lda s_AG,x                      ; 4b53 bd6153
            sec                             ; 4b56 38
            sbc s_AH,x                      ; 4b57 fd9f54
            bpl _G3                         ; 4b5a 1005
            ldy #$02                        ; 4b5c a002
            jsr s_P                         ; 4b5e 20324d
_G3         sty $063e                       ; 4b61 8c3e06
            sta $0642                       ; 4b64 8d4206
            cmp $0641                       ; 4b67 cd4106
            bcc _G4                         ; 4b6a 9015
            sta $0643                       ; 4b6c 8d4306
            lda $0641                       ; 4b6f ad4106
            sta $0644                       ; 4b72 8d4406
            lda $063d                       ; 4b75 ad3d06
            sta $0640                       ; 4b78 8d4006
            sty $063f                       ; 4b7b 8c3f06
            jmp s_H                         ; 4b7e 4c934b
_G4         sta $0644                       ; 4b81 8d4406
            sty $0640                       ; 4b84 8c4006
            lda $0641                       ; 4b87 ad4106
            sta $0643                       ; 4b8a 8d4306
            ldy $063d                       ; 4b8d ac3d06
            sty $063f                       ; 4b90 8c3f06
s_H         lda #$00                        ; 4b93 a900
            sta $0647                       ; 4b95 8d4706
            sta $063b                       ; 4b98 8d3b06
            sta $063c                       ; 4b9b 8d3c06
            lda $0643                       ; 4b9e ad4306
            clc                             ; 4ba1 18
            adc $0644                       ; 4ba2 6d4406
            sta $0646                       ; 4ba5 8d4606
            beq _I2                         ; 4ba8 f05c
            lda $0643                       ; 4baa ad4306
            lsr                             ; 4bad 4a
            sta $0645                       ; 4bae 8d4506
_H1         lda $0645                       ; 4bb1 ad4506
            clc                             ; 4bb4 18
            adc $0644                       ; 4bb5 6d4406
            sta $0645                       ; 4bb8 8d4506
            sec                             ; 4bbb 38
            sbc $0646                       ; 4bbc ed4606
            bcs _H2                         ; 4bbf b005
            lda $063f                       ; 4bc1 ad3f06
            bcc _H3                         ; 4bc4 9006
_H2         sta $0645                       ; 4bc6 8d4506
            lda $0640                       ; 4bc9 ad4006
_H3         sta $0633                       ; 4bcc 8d3306
            lda $0647                       ; 4bcf ad4706
            and #$03                        ; 4bd2 2903
            tay                             ; 4bd4 a8
            sta $c5                         ; 4bd5 85c5
            lda $0647                       ; 4bd7 ad4706
            lsr                             ; 4bda 4a
            lsr                             ; 4bdb 4a
            tax                             ; 4bdc aa
            lda $0633                       ; 4bdd ad3306
s_I         dey                             ; 4be0 88
            bmi _I1                         ; 4be1 3005
            asl                             ; 4be3 0a
            asl                             ; 4be4 0a
            jmp s_I                         ; 4be5 4ce04b
_I1         ldy $c5                         ; 4be8 a4c5
            eor $063b,x                     ; 4bea 5d3b06
            and s_BC,y                      ; 4bed 39de5f
            eor $063b,x                     ; 4bf0 5d3b06
            sta $063b,x                     ; 4bf3 9d3b06
            ldx $0647                       ; 4bf6 ae4706
            inx                             ; 4bf9 e8
            stx $0647                       ; 4bfa 8e4706
            cpx #$08                        ; 4bfd e008
            bcs _I2                         ; 4bff b005
            cpx $0646                       ; 4c01 ec4606
            bcc _H1                         ; 4c04 90ab
_I2         ldx $c2                         ; 4c06 a6c2
            lda $063b                       ; 4c08 ad3b06
            sta s_AW,x                      ; 4c0b 9d145e
            lda $063c                       ; 4c0e ad3c06
            sta s_AX,x                      ; 4c11 9db35e
            lda $0647                       ; 4c14 ad4706
            sta s_AV,x                      ; 4c17 9d755d
s_J         dex                             ; 4c1a ca
            cpx #$37                        ; 4c1b e037
            bcc _J1                         ; 4c1d 9003
            jmp s_G                         ; 4c1f 4c2f4b
_J1         rts                             ; 4c22 60
s_K         ldy #$00                        ; 4c23 a000
            sty $067c                       ; 4c25 8c7c06
            sty $067d                       ; 4c28 8c7d06
            sty $067e                       ; 4c2b 8c7e06
            sty $067f                       ; 4c2e 8c7f06
            sty $068c                       ; 4c31 8c8c06
            iny                             ; 4c34 c8
            sty $cc                         ; 4c35 84cc
            lda units,x                     ; 4c37 bd0054
            sta $0680                       ; 4c3a 8d8006
            lda s_AH,x                      ; 4c3d bd9f54
            sta $0681                       ; 4c40 8d8106
            ldy #$9e                        ; 4c43 a09e
s_L         lda s_AL,y                      ; 4c45 b91b57
            cmp $c9                         ; 4c48 c5c9
            bcs _L1                         ; 4c4a b021
            lda s_AH,y                      ; 4c4c b99f54
            sec                             ; 4c4f 38
            sbc $0681                       ; 4c50 ed8106
            sta $0683                       ; 4c53 8d8306
            jsr s_O                         ; 4c56 20304d
            sta $c5                         ; 4c59 85c5
            lda units,y                     ; 4c5b b90054
            sec                             ; 4c5e 38
            sbc $0680                       ; 4c5f ed8006
            sta $0682                       ; 4c62 8d8206
            jsr s_O                         ; 4c65 20304d
            clc                             ; 4c68 18
            adc $c5                         ; 4c69 65c5
            cmp #$09                        ; 4c6b c909
_L1         bcs _L9                         ; 4c6d b067
            lsr                             ; 4c6f 4a
            sta $c5                         ; 4c70 85c5
            lda $0682                       ; 4c72 ad8206
            bpl _L2                         ; 4c75 1010
            lda $0683                       ; 4c77 ad8306
            bpl _L4                         ; 4c7a 1029
            ldx #$02                        ; 4c7c a202
            cmp $0682                       ; 4c7e cd8206
            bcs _L5                         ; 4c81 b031
            ldx #$01                        ; 4c83 a201
            bcc _L5                         ; 4c85 902d
_L2         lda $0683                       ; 4c87 ad8306
            bpl _L3                         ; 4c8a 100e
            jsr s_P                         ; 4c8c 20324d
            ldx #$02                        ; 4c8f a202
            cmp $0682                       ; 4c91 cd8206
            bcs _L5                         ; 4c94 b01e
            ldx #$03                        ; 4c96 a203
            bcc _L5                         ; 4c98 901a
_L3         ldx #$00                        ; 4c9a a200
            cmp $0682                       ; 4c9c cd8206
            bcs _L5                         ; 4c9f b013
            ldx #$03                        ; 4ca1 a203
            bcc _L5                         ; 4ca3 900f
_L4         lda $0682                       ; 4ca5 ad8206
            jsr s_P                         ; 4ca8 20324d
            ldx #$01                        ; 4cab a201
            cmp $0683                       ; 4cad cd8306
            bcs _L5                         ; 4cb0 b002
            ldx #$00                        ; 4cb2 a200
_L5         lda s_AJ,y                      ; 4cb4 b9dd55
            lsr                             ; 4cb7 4a
            lsr                             ; 4cb8 4a
            lsr                             ; 4cb9 4a
            lsr                             ; 4cba 4a
            cpy #$37                        ; 4cbb c037
            bcc _L7                         ; 4cbd 900c
            clc                             ; 4cbf 18
            adc $cc                         ; 4cc0 65cc
            bcc _L6                         ; 4cc2 9002
            lda #$ff                        ; 4cc4 a9ff
_L6         sta $cc                         ; 4cc6 85cc
            jmp _L9                         ; 4cc8 4cd64c
_L7         clc                             ; 4ccb 18
            adc $067c,x                     ; 4ccc 7d7c06
            bcc _L8                         ; 4ccf 9002
            lda #$ff                        ; 4cd1 a9ff
_L8         sta $067c,x                     ; 4cd3 9d7c06
_L9         dey                             ; 4cd6 88
            beq _L10                        ; 4cd7 f003
            jmp s_L                         ; 4cd9 4c454c
_L10        ldx #$03                        ; 4cdc a203
            lda #$00                        ; 4cde a900
_L11        clc                             ; 4ce0 18
            adc $067c,x                     ; 4ce1 7d7c06
            bcc _L12                        ; 4ce4 9002
            lda #$ff                        ; 4ce6 a9ff
_L12        dex                             ; 4ce8 ca
            bpl _L11                        ; 4ce9 10f5
            asl                             ; 4ceb 0a
            rol $068c                       ; 4cec 2e8c06
            asl                             ; 4cef 0a
            rol $068c                       ; 4cf0 2e8c06
            asl                             ; 4cf3 0a
            rol $068c                       ; 4cf4 2e8c06
            asl                             ; 4cf7 0a
            rol $068c                       ; 4cf8 2e8c06
            ldx #$00                        ; 4cfb a200
            sec                             ; 4cfd 38
s_M         sbc $cc                         ; 4cfe e5cc
            bcs _N1                         ; 4d00 b006
            dec $068c                       ; 4d02 ce8c06
            sec                             ; 4d05 38
            bmi _N2                         ; 4d06 3004
_N1         inx                             ; 4d08 e8
            jmp s_M                         ; 4d09 4cfe4c
_N2         txa                             ; 4d0c 8a
            ldx $c2                         ; 4d0d a6c2
            clc                             ; 4d0f 18
            adc $0692                       ; 4d10 6d9206
            ror                             ; 4d13 6a
            sta $0661,x                     ; 4d14 9d6106
            lda $067c                       ; 4d17 ad7c06
            sta s_N,x                       ; 4d1a 9d014d
            lda $067d                       ; 4d1d ad7d06
            sta s_Q,x                       ; 4d20 9d694d
            lda $067e                       ; 4d23 ad7e06
            sta s_R,x                       ; 4d26 9dd14d
            lda $067f                       ; 4d29 ad7f06
            sta s_S,x                       ; 4d2c 9d394e
            rts                             ; 4d2f 60
s_O         bpl _P1                         ; 4d30 1005
s_P         eor #$ff                        ; 4d32 49ff
            clc                             ; 4d34 18
            adc #$01                        ; 4d35 6901
_P1         rts                             ; 4d37 60
            !byte $01,$60,$4e,$60,$10,$05,$49,$ff,$18,$69,$01,$60,$06,$9d,$6e,$4d   ; 4d38 .`N`..I..i.`..nM
            !byte $ad,$7e,$06,$9d,$b9,$00,$ad,$7f,$06,$9d,$11,$01,$60,$10,$05,$49   ; 4d48 .~..........`..I
            !byte $ff,$18,$69,$01,$60,$7e,$06,$9d,$da,$4d,$ad,$7f,$06,$9d,$32,$4e   ; 4d58 ..i.`~...M....2N
            !byte $60                                                               ; 4d68 `
s_Q         !byte $10,$05,$49,$ff,$18,$69,$01,$60,$69,$01,$60,$9d,$b3,$5e,$ad,$4d   ; 4d69 ..I..i.`i.`..^.M
            !byte $06,$9d,$75,$5d,$ca,$e0,$47,$90,$03,$4c,$8d,$4c,$60,$a9,$00,$8d   ; 4d79 ..u]..G..L.L`...
            !byte $82,$06,$8d,$83,$06,$8d,$84,$06,$8d,$85,$06,$8d,$92,$06,$8d,$93   ; 4d89 ................
            !byte $06,$bd,$00,$54,$8d,$86,$06,$bd,$9f,$54,$8d,$87,$06,$a0,$9e,$b9   ; 4d99 ...T.....T......
            !byte $1b,$57,$cd,$23,$06,$90,$03,$4c,$4b,$4e,$b9,$9f,$54,$38,$ed,$87   ; 4da9 .W.#...LKN..T8..
            !byte $06,$8d,$89,$06,$10,$05,$49,$ff,$18,$69,$01,$85,$c5,$b9,$00,$54   ; 4db9 ......I..i.....T
            !byte $38,$ed,$86,$06,$8d,$88,$06,$10                                   ; 4dc9 8.......
s_R         !byte $05,$49,$ff,$18,$69,$01,$18,$65,$c5,$c9,$09,$b0,$6d,$4a,$85,$c5   ; 4dd1 .I..i..e....mJ..
            !byte $ad,$88,$06,$10,$10,$ad,$89,$06,$10,$2b,$a2,$02,$cd,$88,$06,$b0   ; 4de1 .........+......
            !byte $35,$a2,$01,$90,$31,$ad,$89,$06,$10,$10,$49,$ff,$18,$69,$01,$a2   ; 4df1 5...1.....I..i..
            !byte $02,$cd,$88,$06,$b0,$20,$a2,$03,$90,$1c,$a2,$00,$cd,$88,$06,$b0   ; 4e01 ..... ..........
            !byte $15,$a2,$03,$90,$11,$ad,$88,$06,$49,$ff,$18,$69,$01,$a2,$01,$cd   ; 4e11 ........I..i....
            !byte $89,$06,$b0,$02,$a2,$00,$b9,$dd,$55,$4a,$4a,$4a,$4a,$c0,$47,$90   ; 4e21 ........UJJJJ.G.
            !byte $0e,$18,$6d,$92,$06,$90,$02,$a9                                   ; 4e31 ..m.....
s_S         !byte $ff,$8d,$92,$06,$4c,$4b,$4e,$18,$7d,$82,$06,$90,$02,$a9,$ff,$9d   ; 4e39 ....LKN.}.......
            !byte $82,$06,$88,$f0,$03,$4c,$a8,$4d,$a2,$03,$a9,$00,$18,$7d,$82,$06   ; 4e49 .....L.M.....}..
            !byte $90,$02,$a9,$ff,$ca,$10,$f5,$0a,$2e,$93,$06,$0a,$2e,$93,$06,$0a   ; 4e59 ................
            !byte $2e,$93,$06,$0a,$2e,$93,$06,$a2,$00,$38,$ed,$92,$06,$b0,$06,$ce   ; 4e69 .........8......
            !byte $93,$06,$38,$30,$04,$e8,$4c,$73,$4e,$8a,$a6,$c2,$18,$6d,$99,$06   ; 4e79 ..80..LsN....m..
            !byte $6a,$9d,$e0,$3d,$ad,$82,$06,$9d,$5f,$4e,$ad,$83,$06,$9d,$b7,$4e   ; 4e89 j..=...._N.....N
            !byte $ad,$84,$06,$9d,$0f,$4f,$ad,$85,$06,$9d,$67,$4f,$60,$a6,$c2,$18   ; 4e99 .....O....gO`...
            !byte $6d,$99,$06,$6a,$9d,$e0,$3d,$ad,$82,$06,$9d,$82,$4e,$ad,$83,$06   ; 4ea9 m..j..=.....N...
            !byte $9d,$da,$4e,$ad,$84,$06,$9d,$32,$4f,$ad,$85,$06,$9d,$8a,$4f,$60   ; 4eb9 ..N....2O.....O`
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00       ; 4ec9 ...............
s_T         lda #$00                        ; 4ed8 a900
            sta $0697                       ; 4eda 8d9706
            ldx $c2                         ; 4edd a6c2
            cpx #$2a                        ; 4edf e02a
            beq _T1                         ; 4ee1 f004
            cpx #$2b                        ; 4ee3 e02b
            bne _T2                         ; 4ee5 d001
_T1         rts                             ; 4ee7 60
_T2         ldy $c3                         ; 4ee8 a4c3
            sty $c4                         ; 4eea 84c4
            ldx $c4                         ; 4eec a6c4
            lda s_AK,x                      ; 4eee bd7c56
            pha                             ; 4ef1 48
            lda #$ff                        ; 4ef2 a9ff
            cpx #$37                        ; 4ef4 e037
            bcs _T3                         ; 4ef6 b002
            lda #$7f                        ; 4ef8 a97f
_T3         sta s_AK,x                      ; 4efa 9d7c56
            stx $b4                         ; 4efd 86b4
            lda units,x                     ; 4eff bd0054
            sta $be                         ; 4f02 85be
            lda s_AH,x                      ; 4f04 bd9f54
            sta $bf                         ; 4f07 85bf
            jsr s_DD                        ; 4f09 20ef79
            ldy #$08                        ; 4f0c a008
            ldx #$8f                        ; 4f0e a28f
_T4         stx $d201                       ; 4f10 8e01d2
            sty $d200                       ; 4f13 8c00d2
            jsr s_CD                        ; 4f16 200072
            tya                             ; 4f19 98
            clc                             ; 4f1a 18
            adc #$08                        ; 4f1b 6908
            tay                             ; 4f1d a8
            dex                             ; 4f1e ca
            cpx #$7f                        ; 4f1f e07f
            bne _T4                         ; 4f21 d0ed
            jsr s_DD                        ; 4f23 20ef79
            ldx $c4                         ; 4f26 a6c4
            pla                             ; 4f28 68
            sta s_AK,x                      ; 4f29 9d7c56
            jsr s_CJ                        ; 4f2c 206973
            ldx s_DB,x                      ; 4f2f beb479
            lda s_AJ,y                      ; 4f32 b9dd55
            lsr                             ; 4f35 4a
_T5         dex                             ; 4f36 ca
            beq _T6                         ; 4f37 f005
            rol                             ; 4f39 2a
            bcc _T5                         ; 4f3a 90fa
            lda #$ff                        ; 4f3c a9ff
_T6         ldx s_AV,x                      ; 4f3e be755d
            beq _T7                         ; 4f41 f001
            lsr                             ; 4f43 4a
_T7         cmp $d20a                       ; 4f44 cd0ad2
            bcc _T10                        ; 4f47 9017
            ldx $c2                         ; 4f49 a6c2
            dec s_AI,x                      ; 4f4b de3e55
            lda s_AJ,x                      ; 4f4e bddd55
            sbc #$05                        ; 4f51 e905
            sta s_AJ,x                      ; 4f53 9ddd55
            beq _T8                         ; 4f56 f002
            bcs _T9                         ; 4f58 b003
_T8         jmp s_Z                         ; 4f5a 4cab51
_T9         jsr s_AA                        ; 4f5d 20ce51
_T10        ldx $c2                         ; 4f60 a6c2
            lda units,x                     ; 4f62 bd0054
            sta $cb                         ; 4f65 85cb
            lda s_AH,x                      ; 4f67 bd9f54
            sta $ca                         ; 4f6a 85ca
            jsr s_CF                        ; 4f6c 204072
            jsr s_CJ                        ; 4f6f 206973
            lda s_DP,y                      ; 4f72 b9f67b
            tay                             ; 4f75 a8
            ldx $c2                         ; 4f76 a6c2
            lda s_AJ,x                      ; 4f78 bddd55
            dey                             ; 4f7b 88
            beq _T11                        ; 4f7c f001
            lsr                             ; 4f7e 4a
_T11        cmp $d20a                       ; 4f7f cd0ad2
            bcc _T13                        ; 4f82 9014
            ldx $c4                         ; 4f84 a6c4
            dec s_AI,x                      ; 4f86 de3e55
            lda s_AJ,x                      ; 4f89 bddd55
            sbc #$05                        ; 4f8c e905
            sta s_AJ,x                      ; 4f8e 9ddd55
            beq _T12                        ; 4f91 f002
            bcs _T14                        ; 4f93 b006
_T12        jsr s_Z                         ; 4f95 20ab51
_T13        jmp s_U                         ; 4f98 4c1c50
_T14        jsr s_AA                        ; 4f9b 20ce51
            bcc _T13                        ; 4f9e 90f8
            ldy $c2                         ; 4fa0 a4c2
            lda s_AW,y                      ; 4fa2 b9145e
            and #$03                        ; 4fa5 2903
            tay                             ; 4fa7 a8
            jsr s_V                         ; 4fa8 202250
            bcc _T18                        ; 4fab 9054
            beq _T17                        ; 4fad f030
            ldy #$01                        ; 4faf a001
            cpx #$37                        ; 4fb1 e037
            bcs _T15                        ; 4fb3 b002
            ldy #$03                        ; 4fb5 a003
_T15        jsr s_V                         ; 4fb7 202250
            bcc _T18                        ; 4fba 9045
            beq _T17                        ; 4fbc f021
            ldy #$02                        ; 4fbe a002
            jsr s_V                         ; 4fc0 202250
            bcc _T18                        ; 4fc3 903c
            beq _T17                        ; 4fc5 f018
            ldy #$00                        ; 4fc7 a000
            jsr s_V                         ; 4fc9 202250
            bcc _T18                        ; 4fcc 9033
            beq _T17                        ; 4fce f00f
            ldy #$03                        ; 4fd0 a003
            cpx #$37                        ; 4fd2 e037
            bcs _T16                        ; 4fd4 b002
            ldy #$01                        ; 4fd6 a001
_T16        jsr s_V                         ; 4fd8 202250
            bcc _T18                        ; 4fdb 9024
            bne s_U                         ; 4fdd d03d
_T17        stx $b4                         ; 4fdf 86b4
            lda units,x                     ; 4fe1 bd0054
            sta $be                         ; 4fe4 85be
            lda s_AH,x                      ; 4fe6 bd9f54
            sta $bf                         ; 4fe9 85bf
            jsr s_DD                        ; 4feb 20ef79
            ldx $b4                         ; 4fee a6b4
            lda $ca                         ; 4ff0 a5ca
            sta s_AH,x                      ; 4ff2 9d9f54
            sta $bf                         ; 4ff5 85bf
            lda $cb                         ; 4ff7 a5cb
            sta units,x                     ; 4ff9 9d0054
            sta $be                         ; 4ffc 85be
            jsr s_DD                        ; 4ffe 20ef79
_T18        ldx $c2                         ; 5001 a6c2
            stx $b4                         ; 5003 86b4
            lda units,x                     ; 5005 bd0054
            sta $be                         ; 5008 85be
            lda s_AH,x                      ; 500a bd9f54
            sta $bf                         ; 500d 85bf
            lda $c7                         ; 500f a5c7
            sta $cb                         ; 5011 85cb
            lda $c8                         ; 5013 a5c8
            sta $ca                         ; 5015 85ca
            lda #$ff                        ; 5017 a9ff
            sta $0697                       ; 5019 8d9706
s_U         ldx $c2                         ; 501c a6c2
            inc s_BU,x                      ; 501e fe616d
            rts                             ; 5021 60
s_V         lda units,x                     ; 5022 bd0054
            clc                             ; 5025 18
            adc s_DO,y                      ; 5026 79f27b
            sta $cb                         ; 5029 85cb
            lda s_AH,x                      ; 502b bd9f54
            clc                             ; 502e 18
            adc s_DN,y                      ; 502f 79f17b
            sta $ca                         ; 5032 85ca
            jsr s_CF                        ; 5034 204072
            jsr s_CJ                        ; 5037 206973
            ldx $c4                         ; 503a a6c4
            lda $c3                         ; 503c a5c3
            bne _V4                         ; 503e d03d
            lda $cd                         ; 5040 a5cd
            cmp #$07                        ; 5042 c907
            bcc _V3                         ; 5044 9027
            cmp #$09                        ; 5046 c909
            beq _V4                         ; 5048 f033
            ldy #$15                        ; 504a a015
_V1         lda $ca                         ; 504c a5ca
            cmp s_BR,y                      ; 504e d91f6d
            bne _V2                         ; 5051 d017
            lda $cb                         ; 5053 a5cb
            cmp s_BQ,y                      ; 5055 d9096d
            bne _V2                         ; 5058 d010
            lda units,x                     ; 505a bd0054
            cmp s_BS,y                      ; 505d d9356d
            bne _V2                         ; 5060 d008
            lda s_AH,x                      ; 5062 bd9f54
            cmp s_BT,y                      ; 5065 d94b6d
            beq _V4                         ; 5068 f013
_V2         dey                             ; 506a 88
            bpl _V1                         ; 506b 10df
_V3         jsr s_Y                         ; 506d 204051
            ldx $c4                         ; 5070 a6c4
            lda $0694                       ; 5072 ad9406
            cmp #$02                        ; 5075 c902
            bcs _V4                         ; 5077 b004
            lda #$00                        ; 5079 a900
            sec                             ; 507b 38
            rts                             ; 507c 60
_V4         lda s_AJ,x                      ; 507d bddd55
            sec                             ; 5080 38
            sbc #$05                        ; 5081 e905
            sta s_AJ,x                      ; 5083 9ddd55
            beq _V5                         ; 5086 f002
            bcs _V6                         ; 5088 b004
_V5         jsr s_Z                         ; 508a 20ab51
            clc                             ; 508d 18
_V6         lda #$ff                        ; 508e a9ff
            rts                             ; 5090 60
s_W         lda s_AL,x                      ; 5091 bd1b57
            cmp $c9                         ; 5094 c5c9
            beq _W1                         ; 5096 f003
            bcc _W1                         ; 5098 9001
            rts                             ; 509a 60
_W1         lda #$18                        ; 509b a918
            cpx #$37                        ; 509d e037
            bcs _W2                         ; 509f b01b
            lda #$18                        ; 50a1 a918
            ldy $0606                       ; 50a3 ac0606
            cpy #$02                        ; 50a6 c002
            beq _X3                         ; 50a8 f06b
            cpy #$0a                        ; 50aa c00a
            bne _W2                         ; 50ac d00e
            lda units,x                     ; 50ae bd0054
            asl                             ; 50b1 0a
            asl                             ; 50b2 0a
            adc #$4a                        ; 50b3 694a
            cmp $d20a                       ; 50b5 cd0ad2
            bcc _X3                         ; 50b8 905b
            lda #$10                        ; 50ba a910
_W2         sta $c7                         ; 50bc 85c7
            ldy #$01                        ; 50be a001
            cpx #$37                        ; 50c0 e037
            bcs _W3                         ; 50c2 b002
            ldy #$03                        ; 50c4 a003
_W3         sty $0693                       ; 50c6 8c9306
            lda units,x                     ; 50c9 bd0054
            sta $cb                         ; 50cc 85cb
            lda s_AH,x                      ; 50ce bd9f54
            sta $ca                         ; 50d1 85ca
            lda #$00                        ; 50d3 a900
            sta $cc                         ; 50d5 85cc
_W4         lda $cb                         ; 50d7 a5cb
            sta $0636                       ; 50d9 8d3606
            lda $ca                         ; 50dc a5ca
            sta $0637                       ; 50de 8d3706
s_X         lda $0636                       ; 50e1 ad3606
            clc                             ; 50e4 18
            adc s_DO,y                      ; 50e5 79f27b
            sta $cb                         ; 50e8 85cb
            lda $0637                       ; 50ea ad3706
            clc                             ; 50ed 18
            adc s_DN,y                      ; 50ee 79f17b
            sta $ca                         ; 50f1 85ca
            jsr s_Y                         ; 50f3 204051
            cpx #$37                        ; 50f6 e037
            bcc _X1                         ; 50f8 900a
            jsr s_CG                        ; 50fa 204672
            lda $062b                       ; 50fd ad2b06
            cmp #$bf                        ; 5100 c9bf
            beq _X2                         ; 5102 f009
_X1         lda $0694                       ; 5104 ad9406
            cmp #$02                        ; 5107 c902
            bcc _X6                         ; 5109 901c
            inc $cc                         ; 510b e6cc
_X2         inc $cc                         ; 510d e6cc
            lda $cc                         ; 510f a5cc
            cmp $c7                         ; 5111 c5c7
            bcc _X5                         ; 5113 9009
_X3         lsr s_AJ,x                      ; 5115 5edd55
            bne _X4                         ; 5118 d003
            jmp s_Z                         ; 511a 4cab51
_X4         rts                             ; 511d 60
_X5         lda $d20a                       ; 511e ad0ad2
            and #$02                        ; 5121 2902
            tay                             ; 5123 a8
            jmp s_X                         ; 5124 4ce150
_X6         ldy $0693                       ; 5127 ac9306
            lda $cb                         ; 512a a5cb
            cpy #$01                        ; 512c c001
            bne _X7                         ; 512e d00b
            cmp #$ff                        ; 5130 c9ff
            bne _W4                         ; 5132 d0a3
            inc s_AI,x                      ; 5134 fe3e55
            inc s_AI,x                      ; 5137 fe3e55
            rts                             ; 513a 60
_X7         cmp #$2e                        ; 513b c92e
            bne _W4                         ; 513d d098
            rts                             ; 513f 60
s_Y         lda #$00                        ; 5140 a900
            sta $0694                       ; 5142 8d9406
            lda #$40                        ; 5145 a940
            cpx #$37                        ; 5147 e037
            bcs _Y1                         ; 5149 b002
            lda #$c0                        ; 514b a9c0
_Y1         sta $c5                         ; 514d 85c5
            jsr s_CG                        ; 514f 204672
            bne _Y4                         ; 5152 d01e
            lda $062b                       ; 5154 ad2b06
            and #$c0                        ; 5157 29c0
            cmp $c5                         ; 5159 c5c5
            beq _Y3                         ; 515b f00f
            lda units,x                     ; 515d bd0054
            cmp $cb                         ; 5160 c5cb
            bne _Y2                         ; 5162 d007
            lda s_AH,x                      ; 5164 bd9f54
            cmp $ca                         ; 5167 c5ca
            beq _Y4                         ; 5169 f007
_Y2         rts                             ; 516b 60
_Y3         lda #$02                        ; 516c a902
            sta $0694                       ; 516e 8d9406
            rts                             ; 5171 60
_Y4         ldx #$07                        ; 5172 a207
_Y5         ldy s_DA,x                      ; 5174 bcac79
            lda $cb                         ; 5177 a5cb
            clc                             ; 5179 18
            adc s_DO,y                      ; 517a 79f27b
            sta $cb                         ; 517d 85cb
            lda $ca                         ; 517f a5ca
            clc                             ; 5181 18
            adc s_DN,y                      ; 5182 79f17b
            sta $ca                         ; 5185 85ca
            jsr s_CG                        ; 5187 204672
            bne _Y6                         ; 518a d015
            lda $062b                       ; 518c ad2b06
            and #$c0                        ; 518f 29c0
            cmp $c5                         ; 5191 c5c5
            bne _Y6                         ; 5193 d00c
            txa                             ; 5195 8a
            and #$01                        ; 5196 2901
            clc                             ; 5198 18
            adc #$01                        ; 5199 6901
            adc $0694                       ; 519b 6d9406
            sta $0694                       ; 519e 8d9406
_Y6         dex                             ; 51a1 ca
            bpl _Y5                         ; 51a2 10d0
            dec $ca                         ; 51a4 c6ca
            dec $cb                         ; 51a6 c6cb
            ldx $c2                         ; 51a8 a6c2
            rts                             ; 51aa 60
s_Z         lda #$00                        ; 51ab a900
            sta s_AI,x                      ; 51ad 9d3e55
            sta s_AJ,x                      ; 51b0 9ddd55
            sta s_AV,x                      ; 51b3 9d755d
            lda #$ff                        ; 51b6 a9ff
            sta s_BU,x                      ; 51b8 9d616d
            sta s_AL,x                      ; 51bb 9d1b57
            stx $b4                         ; 51be 86b4
            lda units,x                     ; 51c0 bd0054
            sta $be                         ; 51c3 85be
            lda s_AH,x                      ; 51c5 bd9f54
            sta $bf                         ; 51c8 85bf
            jsr s_DD                        ; 51ca 20ef79
            rts                             ; 51cd 60
s_AA        cpx #$37                        ; 51ce e037
            bcs _AA1                        ; 51d0 b00e
            lda s_AO,x                      ; 51d2 bdca58
            and #$f0                        ; 51d5 29f0
            bne _AA1                        ; 51d7 d007
            lda s_AI,x                      ; 51d9 bd3e55
            lsr                             ; 51dc 4a
            jmp s_AB                        ; 51dd 4cee51
_AA1        lda s_AI,x                      ; 51e0 bd3e55
            lsr                             ; 51e3 4a
            lsr                             ; 51e4 4a
            lsr                             ; 51e5 4a
            sta $c5                         ; 51e6 85c5
            lda s_AI,x                      ; 51e8 bd3e55
            sec                             ; 51eb 38
            sbc $c5                         ; 51ec e5c5
s_AB        cmp s_AJ,x                      ; 51ee dddd55
            bcc _AB1                        ; 51f1 900a
            lda #$ff                        ; 51f3 a9ff
            sta s_BU,x                      ; 51f5 9d616d
            lda #$00                        ; 51f8 a900
            sta s_AV,x                      ; 51fa 9d755d
_AB1        rts                             ; 51fd 60
            !byte $0a                                                               ; 51fe .
s_AC        !byte $a9                                                               ; 51ff .
s_AD        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5200 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5210 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5220 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5230 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5240 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5250 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5260 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5270 ................
s_AE        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5280 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5290 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52a0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52b0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52c0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52d0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52e0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 52f0 ................
s_AF        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5300 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5310 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5320 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5330 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5340 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5350 ................
            !byte $00                                                               ; 5360 .
s_AG        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5361 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$e0   ; 5371 ................
            !byte $47,$b0,$0e,$bd,$ca,$58,$29,$f0,$d0,$07,$bd,$3e,$55,$4a,$4c,$a0   ; 5381 G....X)....>UJL.
            !byte $53,$bd,$3e,$55,$4a,$4a,$4a,$85,$c5,$bd,$3e,$55,$38,$e5,$c5,$dd   ; 5391 S.>UJJJ...>U8...
            !byte $dd,$55,$b0,$0a,$a9,$ff,$9d,$61,$6d,$a9,$00,$9d,$75,$5d,$60,$00   ; 53a1 .U.....am...u]`.
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 53b1 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 53c1 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$e0,$47,$b0,$0e,$bd,$ca,$58,$29   ; 53d1 .........G....X)
            !byte $f0,$d0,$07,$bd,$3e,$55,$4a,$4c,$f9,$53,$bd,$3e,$55,$4a,$4a,$4a   ; 53e1 ....>UJL.S.>UJJJ
            !byte $85,$c5,$bd,$3e,$55,$38,$e5,$c5,$dd,$dd,$55,$60,$00,$00,$00       ; 53f1 ...>U8....U`...
units       !byte $00,$28,$28,$28,$28,$28,$29,$28,$29,$29,$29,$2a,$2a,$2a,$2a,$2b   ; 5400 .((((()()))****+
            !byte $2b,$2b,$29,$28,$28,$29,$29,$2a,$2a,$2a,$28,$29,$2a,$29,$2a,$2a   ; 5410 ++)(())***()*)**
            !byte $2b,$29,$2a,$2b,$1e,$1e,$1f,$21,$23,$25,$23,$24,$24,$2d,$2d,$26   ; 5420 +)*+...!#%#$$--&
            !byte $2d,$1f,$2d,$2d,$20,$2d,$2d,$1d,$1b,$18,$17,$14,$0f,$00,$00,$00   ; 5430 -.-- --.........
            !byte $00,$00,$00,$00,$00,$00,$00,$15,$15,$1e,$1e,$27,$26,$17,$13,$22   ; 5440 ...........'&.."
            !byte $22,$1f,$1b,$21,$29,$28,$27,$2a,$27,$27,$27,$27,$27,$25,$27,$27   ; 5450 "..!)('*'''''%''
            !byte $27,$28,$29,$29,$27,$24,$22,$20,$23,$1e,$1c,$19,$1d,$20,$21,$1a   ; 5460 '())'$" #.... !.
            !byte $15,$1d,$00,$1c,$15,$15,$15,$14,$14,$0c,$00,$00,$00,$00,$00,$00   ; 5470 ................
            !byte $00,$15,$19,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5480 ................
            !byte $00,$00,$00,$00,$00,$26,$15,$0c,$14,$15,$14,$0f,$15,$14,$13       ; 5490 .....&.........
s_AH        !byte $00,$14,$13,$12,$11,$10,$14,$13,$12,$11,$10,$14,$13,$12,$11,$13   ; 549f ................
            !byte $12,$11,$17,$16,$15,$15,$16,$16,$17,$18,$0f,$0e,$0d,$0f,$0e,$0c   ; 54af ................
            !byte $0d,$0f,$10,$10,$02,$03,$04,$06,$07,$08,$26,$25,$26,$14,$0f,$08   ; 54bf ..........&%&...
            !byte $10,$01,$14,$13,$01,$11,$12,$20,$1f,$26,$26,$26,$26,$14,$08,$12   ; 54cf ....... .&&&&...
            !byte $0a,$0e,$21,$0b,$0f,$14,$0a,$1c,$1b,$0e,$0d,$1c,$1c,$1f,$18,$16   ; 54df ..!.............
            !byte $15,$22,$06,$25,$18,$17,$17,$19,$14,$16,$12,$11,$15,$14,$13,$10   ; 54ef .".%............
            !byte $0f,$0e,$0d,$0c,$0b,$09,$08,$06,$09,$04,$02,$06,$0e,$16,$24,$17   ; 54ff ..............$.
            !byte $08,$21,$1c,$1e,$14,$1c,$21,$1b,$1e,$08,$0a,$20,$0b,$19,$0c,$17   ; 550f .!....!.... ....
            !byte $0d,$1d,$1e,$1f,$0f,$1b,$11,$19,$0b,$17,$13,$15,$21,$1c,$0d,$1a   ; 551f ............!...
            !byte $0a,$1d,$23,$1b,$0f,$1e,$16,$08,$0d,$0e,$1c,$03,$03,$03,$02       ; 552f ..#............
s_AI        !byte $00,$cb,$cd,$c0,$c7,$b8,$88,$7f,$96,$81,$88,$6d,$48,$46,$51,$83   ; 553e ...........mHFQ.
            !byte $66,$35,$c6,$c2,$81,$7b,$65,$68,$70,$78,$ca,$c3,$bf,$48,$8c,$8e   ; 554e f5...{ehpx...H..
            !byte $77,$6f,$7a,$4d,$61,$60,$5c,$7d,$83,$6a,$70,$68,$65,$d2,$61,$62   ; 555e wozMa`\}.jphe.ab
            !byte $5f,$34,$62,$60,$37,$68,$65,$64,$67,$6e,$65,$5c,$67,$69,$6b,$6f   ; 556e _4b`7hedgne\giko
            !byte $58,$75,$54,$6d,$59,$69,$5d,$3e,$68,$65,$43,$68,$54,$7f,$70,$6f   ; 557e XuTmYi]>heChT.po
            !byte $5b,$4f,$45,$6c,$76,$89,$46,$55,$82,$5b,$83,$47,$56,$4b,$5a,$7b   ; 558e [OElv.FU.[.GVKZ{
            !byte $7c,$97,$80,$58,$4d,$4f,$50,$7e,$4f,$5b,$54,$48,$56,$4c,$63,$43   ; 559e |..XMOP~O[THVLcC
            !byte $4e,$79,$72,$69,$7a,$7f,$81,$69,$6f,$70,$7f,$77,$59,$6c,$71,$69   ; 55ae Nyriz..iop.wYlqi
            !byte $5e,$67,$61,$6c,$6e,$6f,$60,$6d,$70,$5f,$5d,$72,$67,$6b,$69,$5c   ; 55be ^galno`mp_]rgki\
            !byte $6d,$65,$6a,$5f,$63,$65,$76,$6a,$70,$68,$b9,$6c,$5e,$66,$62       ; 55ce mej_cevjph.l^fb
s_AJ        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 55dd ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 55ed ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 55fd ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 560d ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 561d ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 562d ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 563d ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 564d ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 565d ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00       ; 566d ...............
s_AK        !byte $00,$7e,$7e,$7e,$7e,$7e,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d   ; 567c .~~~~~}}}}}}}}}}
            !byte $7d,$7d,$7e,$7e,$7d,$7d,$7d,$7d,$7d,$7d,$7e,$7e,$7e,$7e,$7d,$7d   ; 568c }}~~}}}}}}~~~~}}
            !byte $7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7d,$7e,$7d,$7e   ; 569c }}}}}}}}}}}}}~}~
            !byte $7d,$7d,$7d,$7d,$7d,$7d,$7e,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd   ; 56ac }}}}}}~.........
            !byte $fd,$fe,$fe,$fe,$fe,$fe,$fe,$fe,$fd,$fd,$fe,$fd,$fe,$fd,$fd,$fd   ; 56bc ................
            !byte $fe,$fd,$fd,$fd,$fd,$fd,$fe,$fe,$fd,$fd,$fd,$fe,$fe,$fe,$fe,$fd   ; 56cc ................
            !byte $fd,$fd,$fd,$fe,$fe,$fe,$fe,$fd,$fe,$fe,$fe,$fd,$fd,$fd,$fd,$fd   ; 56dc ................
            !byte $fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd   ; 56ec ................
            !byte $fd,$fe,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fe,$fe,$fe,$fd,$fe   ; 56fc ................
            !byte $fd,$fe,$fe,$fd,$fe,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd,$fd       ; 570c ...............
s_AL        !byte $ff,$00,$ff,$00,$00,$00,$00,$00,$00,$00,$00,$ff,$ff,$ff,$ff,$ff   ; 571b ................
            !byte $ff,$ff,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$ff,$00,$00   ; 572b ................
            !byte $00,$00,$ff,$ff,$00,$00,$00,$00,$00,$00,$00,$00,$ff,$02,$ff,$02   ; 573b ................
            !byte $05,$06,$09,$0a,$0b,$14,$18,$04,$05,$07,$09,$0b,$0d,$07,$0c,$08   ; 574b ................
            !byte $0a,$0a,$0e,$0f,$10,$12,$07,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 575b ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 576b ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$01,$01,$01,$01,$01   ; 577b ................
            !byte $02,$02,$02,$03,$03,$04,$04,$05,$05,$06,$06,$07,$08,$08,$08,$09   ; 578b ................
            !byte $09,$05,$05,$02,$09,$0a,$0a,$06,$0b,$05,$11,$02,$0b,$14,$15,$16   ; 579b ................
            !byte $17,$18,$1a,$1c,$1e,$02,$03,$03,$03,$03,$06,$06,$04,$04,$04       ; 57ab ...............
s_AM        !byte $20,$20,$20,$20,$20,$20,$20,$20,$53,$53,$20,$20,$20,$20,$20,$20   ; 57ba         SS
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
s_AN        !byte $43,$4f,$4d,$42,$41,$54,$20,$20,$53,$54,$52,$45,$4e,$47,$54,$48   ; 58ba COMBAT  STRENGTH
s_AO        !byte $00,$03,$03,$03,$03,$03,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 58ca ................
            !byte $00,$40,$03,$03,$00,$00,$00,$00,$00,$00,$03,$03,$03,$03,$00,$00   ; 58da .@..............
            !byte $00,$00,$00,$00,$30,$30,$30,$00,$00,$00,$20,$20,$20,$03,$00,$53   ; 58ea ....000...   ..S
            !byte $00,$30,$00,$00,$40,$00,$07,$04,$04,$00,$00,$00,$00,$00,$00,$00   ; 58fa .0..@...........
            !byte $00,$01,$01,$01,$01,$01,$02,$01,$00,$00,$02,$00,$01,$00,$00,$00   ; 590a ................
            !byte $01,$04,$00,$04,$00,$00,$01,$01,$00,$00,$00,$01,$01,$02,$02,$00   ; 591a ................
            !byte $00,$00,$00,$01,$01,$01,$02,$00,$01,$02,$02,$00,$04,$00,$04,$00   ; 592a ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 593a ................
            !byte $00,$72,$00,$70,$70,$70,$70,$00,$00,$00,$00,$72,$01,$71,$70,$01   ; 594a .r.pppp....r.qp.
            !byte $70,$01,$01,$00,$00,$00,$00,$00,$00,$00,$04,$04,$04,$04,$04       ; 595a p..............
s_AP        !byte $00,$18,$27,$2e,$2f,$39,$05,$06,$07,$08,$09,$0c,$0d,$14,$2a,$2b   ; 5969 ..'./9........*+
            !byte $35,$03,$29,$38,$01,$02,$0a,$1a,$1c,$26,$03,$0e,$30,$34,$31,$04   ; 5979 5.)8.....&..041.
            !byte $11,$1d,$2c,$37,$01,$02,$04,$0b,$1e,$36,$02,$04,$06,$28,$1b,$01   ; 5989 ..,7.....6...(..
            !byte $17,$05,$22,$23,$04,$33,$32,$07,$0b,$29,$2a,$2b,$2c,$2d,$2e,$2f   ; 5999 .."#.32..)*+,-./
            !byte $30,$09,$0d,$0e,$0f,$10,$07,$02,$13,$12,$01,$1b,$0a,$16,$15,$0d   ; 59a9 0...............
            !byte $06,$09,$02,$01,$08,$0b,$01,$07,$03,$04,$0a,$05,$08,$03,$06,$05   ; 59b9 ................
            !byte $06,$0c,$1a,$03,$04,$0b,$05,$09,$0c,$04,$02,$07,$02,$0e,$04,$0f   ; 59c9 ................
            !byte $10,$14,$06,$18,$28,$1d,$1e,$1f,$20,$21,$25,$2b,$31,$32,$34,$36   ; 59d9 ....(... !%+1246
            !byte $37,$01,$22,$01,$02,$03,$04,$27,$3b,$3c,$3d,$02,$01,$01,$05,$02   ; 59e9 7."....';<=.....
            !byte $06,$03,$04,$26,$24,$23,$1c,$19,$17,$11,$08,$0a,$03,$05,$06       ; 59f9 ...&$#.........
s_AQ        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5a08 ................
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
s_AR        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$01,$01,$01,$01,$01,$01   ; 5b08 ................
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
s_AS        !byte $00,$01,$02,$03,$04,$05,$06,$07,$08,$09,$00,$01,$02,$03,$04,$05   ; 5c08 ................
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
s_AT        !byte $50,$4c,$45,$41,$53,$45,$20,$45,$4e,$54,$45,$52,$20,$59,$4f,$55   ; 5d08 PLEASE ENTER YOU
            !byte $52,$20,$4f,$52,$44,$45,$52,$53,$20,$4e,$4f,$57,$20,$20,$20,$20   ; 5d18 R ORDERS NOW
            !byte $20,$20,$20,$20,$20,$20,$20,$20,$20,$20,$47,$41,$4d,$45,$20,$4f   ; 5d28           GAME O
            !byte $56,$45,$52,$20,$20,$20,$20,$20,$20,$20,$20,$20,$20,$20,$20,$20   ; 5d38 VER
            !byte $46,$49,$47,$55,$52,$49,$4e,$47,$20,$4d,$4f,$56,$45,$3b,$20,$4e   ; 5d48 FIGURING MOVE; N
            !byte $4f,$20,$4f,$52,$44,$45,$52,$53,$20,$41,$4c,$4c,$4f,$57,$45,$44   ; 5d58 O ORDERS ALLOWED
s_AU        !byte $00,$1f,$1c,$1f,$1e,$1f,$1e,$1f,$1f,$1e,$1f,$1e,$1f               ; 5d68 .............
s_AV        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5d75 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5d85 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5d95 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5da5 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5db5 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5dc5 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5dd5 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5de5 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5df5 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00       ; 5e05 ...............
s_AW        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e14 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e24 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e34 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e44 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e54 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e64 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e74 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e84 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5e94 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00       ; 5ea4 ...............
s_AX        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5eb3 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5ec3 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5ed3 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5ee3 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5ef3 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5f03 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5f13 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5f23 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 5f33 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00       ; 5f43 ...............
s_AY        !byte $1e,$28,$32,$3c                                                   ; 5f52 .(2<
s_AZ        !byte $20,$20,$20,$20,$54,$48,$41,$54,$20,$49,$53,$20,$41,$20,$52,$55   ; 5f56     THAT IS A RU
            !byte $53,$53,$49,$41,$4e,$20,$55,$4e,$49,$54,$21,$20,$20,$20,$20,$20   ; 5f66 SSIAN UNIT!
            !byte $20,$20,$20,$4f,$4e,$4c,$59,$20,$38,$20,$4f,$52,$44,$45,$52,$53   ; 5f76    ONLY 8 ORDERS
            !byte $20,$41,$52,$45,$20,$41,$4c,$4c,$4f,$57,$45,$44,$21,$20,$20,$20   ; 5f86  ARE ALLOWED!
            !byte $20,$20,$50,$4c,$45,$41,$53,$45,$20,$57,$41,$49,$54,$20,$46,$4f   ; 5f96   PLEASE WAIT FO
            !byte $52,$20,$4d,$41,$4c,$54,$41,$4b,$52,$45,$55,$5a,$45,$21,$20,$20   ; 5fa6 R MALTAKREUZE!
            !byte $20,$20,$20,$4e,$4f,$20,$44,$49,$41,$47,$4f,$4e,$41,$4c,$20,$4d   ; 5fb6    NO DIAGONAL M
            !byte $4f,$56,$45,$53,$20,$41,$4c,$4c,$4f,$57,$45,$44,$21,$20,$20,$20   ; 5fc6 OVES ALLOWED!
s_BA        !byte $00,$08,$00,$f8                                                   ; 5fd6 ....
s_BB        !byte $f8,$00,$08,$00                                                   ; 5fda ....
s_BC        !byte $03,$0c,$30,$c0                                                   ; 5fde ..0.
s_BD        !byte $00,$01,$00,$ff                                                   ; 5fe2 ....
s_BE        !byte $ff,$00,$01,$00                                                   ; 5fe6 ....
s_BF        !byte $00,$12,$12,$12,$d2,$d8,$d6,$c4,$d4,$c2,$12,$12,$12               ; 5fea .............
s_BG        !byte $24,$24,$e7,$00,$00,$e7,$24,$24                                   ; 5ff7 $$....$$
s_BH        !byte $00                                                               ; 5fff .
fonts       !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$08,$1c,$3e,$08,$00,$00,$00   ; 6000 ...........>....
            !byte $00,$00,$00,$08,$1c,$3e,$08,$00,$00,$00,$10,$38,$7c,$10,$00,$00   ; 6010 .....>.....8|...
            !byte $00,$10,$38,$7c,$10,$00,$00,$00,$00,$00,$00,$08,$1c,$3e,$7f,$08   ; 6020 ..8|.........>..
            !byte $00,$08,$1c,$3e,$7f,$08,$00,$00,$02,$5a,$00,$19,$d8,$00,$da,$50   ; 6030 ...>.....Z.....P
            !byte $1a,$1a,$00,$5b,$5a,$00,$5b,$00,$5a,$5b,$00,$4b,$4a,$00,$58,$18   ; 6040 ...[Z.[.Z[.KJ.X.
            !byte $40,$5b,$00,$db,$d2,$00,$59,$40,$00,$22,$14,$08,$00,$11,$0a,$04   ; 6050 @[....Y@."......
            !byte $00,$44,$28,$10,$00,$11,$0a,$04,$00,$22,$14,$08,$00,$44,$28,$10   ; 6060 .D(......"...D(.
            !byte $00,$44,$28,$10,$00,$22,$14,$08,$10,$08,$08,$10,$0b,$04,$00,$00   ; 6070 .D(.."..........
            !byte $08,$08,$10,$21,$42,$4c,$70,$00,$10,$0c,$02,$01,$00,$00,$00,$00   ; 6080 ...!BLp.........
            !byte $10,$10,$0c,$02,$01,$00,$00,$00,$08,$10,$20,$20,$10,$08,$04,$08   ; 6090 ..........  ....
            !byte $10,$08,$08,$04,$04,$0c,$10,$10,$10,$10,$20,$20,$10,$10,$08,$08   ; 60a0 ..........  ....
            !byte $08,$04,$04,$04,$08,$08,$04,$08,$08,$08,$04,$06,$02,$04,$08,$10   ; 60b0 ................
            !byte $10,$20,$20,$20,$40,$40,$20,$10,$08,$08,$30,$c0,$00,$00,$00,$00   ; 60c0 .   @@ ...0.....
            !byte $10,$08,$08,$84,$48,$30,$00,$00,$10,$08,$04,$c2,$22,$24,$18,$00   ; 60d0 ....H0......"$..
            !byte $00,$00,$00,$03,$06,$08,$08,$10,$00,$18,$26,$41,$20,$20,$10,$10   ; 60e0 ..........&A  ..
            !byte $00,$00,$00,$06,$09,$10,$10,$10,$00,$00,$00,$c0,$23,$2c,$30,$00   ; 60f0 ............#,0.
            !byte $00,$18,$16,$61,$80,$00,$00,$00,$00,$00,$00,$00,$c7,$2c,$10,$00   ; 6100 ...a.........,..
            !byte $00,$30,$48,$8c,$03,$00,$00,$00,$00,$00,$00,$c1,$32,$0a,$04,$00   ; 6110 .0H.........2...
            !byte $00,$00,$00,$00,$c0,$20,$18,$08,$00,$38,$44,$82,$02,$04,$08,$10   ; 6120 ..... ...8D.....
            !byte $00,$00,$00,$80,$40,$60,$10,$10,$00,$00,$00,$c0,$20,$10,$08,$08   ; 6130 ....@`...... ...
            !byte $08,$08,$10,$10,$e0,$10,$08,$08,$e0,$e0,$f0,$f8,$f8,$f8,$f0,$f0   ; 6140 ................
            !byte $f8,$f8,$f0,$e0,$e0,$f0,$f0,$e0,$f0,$e0,$e0,$f0,$fc,$f8,$f0,$f0   ; 6150 ................
            !byte $ff,$ff,$ff,$f3,$60,$00,$00,$00,$ff,$ff,$ff,$ff,$3f,$18,$10,$00   ; 6160 ....`.......?...
            !byte $ff,$ff,$cf,$cf,$03,$00,$00,$00,$e0,$e0,$f0,$fc,$fc,$ff,$ff,$ff   ; 6170 ................
            !byte $f8,$f8,$f0,$f0,$c0,$00,$00,$00,$ff,$ff,$ff,$fc,$fc,$f8,$e0,$e0   ; 6180 ................
            !byte $00,$00,$00,$00,$38,$f8,$fc,$fc,$07,$0f,$1f,$1f,$1e,$06,$00,$00   ; 6190 ....8...........
            !byte $01,$03,$03,$01,$00,$01,$03,$00,$00,$00,$00,$00,$00,$01,$07,$3f   ; 61a0 ...............?
            !byte $00,$00,$00,$00,$01,$27,$ff,$ff,$00,$00,$00,$0a,$cf,$ff,$ff,$ff   ; 61b0 .....'..........
            !byte $00,$00,$00,$20,$e3,$ff,$ff,$ff,$00,$03,$0f,$7f,$ff,$ff,$ff,$ff   ; 61c0 ... ............
            !byte $08,$0c,$1c,$1e,$1f,$0f,$0f,$0f,$ff,$ff,$ff,$7c,$18,$10,$10,$08   ; 61d0 ...........|....
            !byte $f8,$f0,$f0,$f0,$f9,$1e,$00,$00,$00,$7f,$63,$55,$49,$55,$63,$7f   ; 61e0 ..........cUIUc.
            !byte $00,$7f,$41,$5d,$55,$5d,$41,$7f,$ff,$ff,$ff,$ff,$ff,$ff,$ff,$ff   ; 61f0 ..A]U]A.........
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$10,$38,$7c,$00,$04,$0e,$1f   ; 6200 ..........8|....
            !byte $00,$08,$1c,$3e,$00,$04,$0e,$1f,$00,$04,$0e,$1f,$00,$08,$1c,$3e   ; 6210 ...>...........>
            !byte $00,$10,$38,$7c,$00,$08,$1c,$3e,$00,$08,$1c,$3e,$7f,$00,$00,$00   ; 6220 ..8|...>...>....
            !byte $00,$00,$00,$08,$1c,$3e,$7f,$00,$42,$5a,$00,$11,$58,$00,$da,$18   ; 6230 .....>..BZ..X...
            !byte $02,$da,$00,$5b,$5b,$00,$5a,$00,$18,$5b,$00,$4b,$5a,$00,$5b,$08   ; 6240 ...[[.Z..[.KZ.[.
            !byte $10,$5b,$00,$da,$d2,$00,$59,$58,$00,$11,$0a,$04,$00,$11,$0a,$04   ; 6250 .[....YX........
            !byte $00,$44,$28,$10,$00,$11,$0a,$04,$00,$22,$14,$08,$00,$44,$28,$10   ; 6260 .D(......"...D(.
            !byte $00,$44,$28,$10,$00,$22,$14,$08,$10,$10,$10,$08,$0f,$00,$00,$00   ; 6270 .D(.."..........
            !byte $08,$08,$10,$21,$42,$24,$38,$00,$10,$08,$06,$01,$00,$00,$00,$00   ; 6280 ...!B$8.........
            !byte $10,$10,$0c,$04,$07,$00,$00,$00,$10,$10,$20,$20,$20,$18,$04,$08   ; 6290 ..........   ...
            !byte $10,$10,$18,$04,$04,$0c,$08,$10,$08,$08,$04,$04,$02,$02,$0c,$08   ; 62a0 ................
            !byte $08,$04,$04,$c4,$38,$00,$00,$00,$08,$08,$04,$06,$e2,$1c,$00,$00   ; 62b0 ....8...........
            !byte $00,$00,$1c,$23,$40,$40,$20,$10,$00,$00,$00,$07,$04,$08,$08,$08   ; 62c0 ...#@@ .........
            !byte $00,$00,$02,$85,$48,$30,$00,$00,$00,$00,$00,$c3,$22,$24,$18,$00   ; 62d0 ....H0......"$..
            !byte $00,$00,$00,$83,$46,$38,$00,$00,$00,$18,$26,$c1,$00,$00,$00,$00   ; 62e0 ....F8....&.....
            !byte $00,$00,$30,$c8,$08,$10,$10,$10,$00,$00,$00,$c0,$20,$20,$30,$08   ; 62f0 ..0.........  0.
            !byte $00,$00,$18,$64,$82,$06,$08,$08,$00,$00,$00,$00,$c0,$20,$10,$10   ; 6300 ...d......... ..
            !byte $08,$10,$60,$93,$0c,$00,$00,$00,$ff,$fe,$78,$18,$1f,$3f,$ff,$ff   ; 6310 ..`.......x..?..
            !byte $0f,$0f,$1f,$0f,$07,$0f,$1f,$0f,$00,$00,$00,$80,$e1,$f7,$ff,$ff   ; 6320 ................
            !byte $00,$00,$00,$05,$cf,$ff,$ff,$ff,$00,$00,$00,$c1,$e7,$f7,$ff,$ff   ; 6330 ................
            !byte $e0,$f0,$f0,$fc,$fe,$ff,$ff,$ff,$e0,$e0,$f0,$f8,$f8,$f9,$ff,$ff   ; 6340 ................
            !byte $07,$07,$0f,$1f,$df,$ff,$ff,$ff,$0f,$1f,$1f,$0f,$87,$ff,$ff,$ff   ; 6350 ................
            !byte $07,$0f,$1f,$1f,$ff,$ff,$ff,$ff,$f8,$f8,$f0,$f0,$60,$00,$00,$00   ; 6360 ............`...
            !byte $fc,$fc,$fc,$f8,$30,$00,$00,$00,$00,$00,$00,$00,$0c,$1f,$1f,$0f   ; 6370 ....0...........
            !byte $00,$00,$00,$00,$01,$03,$03,$0f,$00,$00,$00,$00,$01,$0f,$0f,$1f   ; 6380 ................
            !byte $ff,$ff,$ff,$fc,$fc,$f8,$e0,$e0,$ff,$ff,$ff,$ff,$fc,$f8,$e0,$e0   ; 6390 ................
            !byte $00,$00,$20,$e0,$e0,$f0,$f8,$f8,$00,$00,$00,$00,$80,$c0,$e0,$f0   ; 63a0 .. .............
            !byte $00,$00,$00,$1c,$7f,$ff,$1f,$07,$07,$03,$03,$00,$00,$00,$00,$00   ; 63b0 ................
            !byte $ff,$ff,$ff,$f5,$30,$00,$00,$00,$ff,$ff,$ff,$d8,$00,$00,$03,$0f   ; 63c0 ....0...........
            !byte $00,$00,$00,$e0,$3d,$0f,$07,$07,$08,$0c,$1c,$1e,$1f,$ff,$ff,$ff   ; 63d0 ....=...........
            !byte $08,$08,$10,$10,$70,$f0,$f8,$f8,$00,$7f,$63,$55,$49,$55,$63,$7f   ; 63e0 ....p.....cUIUc.
            !byte $00,$7f,$41,$5d,$55,$5d,$41,$7f,$ff,$ff,$ff,$ff,$ff,$ff,$ff,$ff   ; 63f0 ..A]U]A.........
            !byte $70,$70,$70,$c6,$e0,$64,$90,$90,$f7,$fe,$64,$f7,$2e,$65,$f7,$5e   ; 6400 ppp..d....d..e.^
            !byte $65,$f7,$8e,$65,$f7,$be,$65,$f7,$ee,$65,$f7,$1e,$66,$f7,$4e,$66   ; 6410 e..e..e..e..f.Nf
            !byte $f7,$7e,$66,$57,$ae,$66,$90,$c2,$50,$64,$02,$90,$02,$90,$41,$00   ; 6420 .~fW.f..Pd....A.
            !byte $64                                                               ; 6430 d
s_BI        !byte $10,$38,$54,$92,$10,$10,$10,$10,$08,$04,$02,$ff,$02,$04,$08,$00   ; 6431 .8T.............
            !byte $10,$10,$10,$10,$92,$54,$38,$10,$10,$20,$40,$ff,$40,$20,$10       ; 6441 .....T8.. @.@ .
s_BJ        !byte $00,$00,$00,$00,$00,$00,$00,$00                                   ; 6450 ........
s_BK        !byte $00,$00,$00,$00,$00,$00,$00,$00,$25,$21,$33,$34,$25,$32,$2e,$00   ; 6458 ........%!34%2..
            !byte $26,$32,$2f,$2e,$34,$00,$11,$19,$14,$11,$00,$00                   ; 6468 &2/.4.......
s_BL        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6474 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$23,$2f,$30,$39,$32,$29,$27,$28,$34   ; 6484 .......#/092)'(4
            !byte $00,$11,$19,$18,$11,$00,$23,$28,$32,$29,$33,$00,$23,$32,$21,$37   ; 6494 ......#(2)3.#2!7
            !byte $26,$2f,$32,$24,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 64a4 &/2$............
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 64b4 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00                   ; 64c4 ............
s_BM        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 64d0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 64e0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 64f0 ................
map         !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6500 ................
            !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6510 ................
            !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6520 ................
            !byte $7f,$bf,$bf,$bf,$a9,$00,$00,$00,$00,$00,$00,$00,$00,$b4,$bf,$bf   ; 6530 ................
            !byte $aa,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6540 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6550 ................
            !byte $7f,$bf,$bf,$bf,$af,$b2,$00,$00,$00,$b5,$b6,$b8,$b7,$b6,$b3,$bb   ; 6560 ................
            !byte $b0,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6570 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6580 ................
            !byte $7f,$bf,$bf,$bf,$bf,$af,$b8,$b7,$b9,$bf,$bf,$b1,$b0,$47,$9d,$9b   ; 6590 .............G..
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 65a0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 65b0 ................
            !byte $7f,$bf,$bf,$bf,$bf,$bf,$b1,$ac,$ad,$ae,$bb,$bc,$a4,$8d,$94,$8c   ; 65c0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$9d,$a5,$00,$9c,$a0,$a2,$a6,$00   ; 65d0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 65e0 ................
            !byte $7f,$bf,$bf,$bf,$bf,$bf,$ab,$00,$00,$00,$ba,$b2,$98,$8e,$95,$01   ; 65f0 ................
            !byte $05,$00,$00,$00,$00,$00,$00,$00,$94,$91,$a1,$9a,$00,$00,$92,$9f   ; 6600 ................
            !byte $a5,$00,$00,$00,$00,$9c,$a4,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6610 ................
            !byte $7f,$bf,$bf,$bf,$bf,$bf,$aa,$00,$00,$00,$b4,$aa,$93,$8c,$96,$02   ; 6620 ................
            !byte $06,$00,$00,$00,$00,$00,$00,$00,$97,$00,$00,$00,$00,$00,$00,$9c   ; 6630 ................
            !byte $a8,$48,$00,$9d,$a1,$99,$91,$a0,$a5,$00,$00,$00,$00,$00,$00,$7f   ; 6640 .H..............
            !byte $7f,$bf,$bf,$bf,$bf,$bf,$af,$b2,$00,$00,$00,$b0,$95,$8b,$97,$03   ; 6650 ................
            !byte $01,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$95   ; 6660 ................
            !byte $91,$a0,$9f,$9b,$00,$00,$00,$49,$92,$a6,$00,$00,$00,$00,$00,$7f   ; 6670 .......I........
            !byte $7f,$bf,$bf,$bf,$bf,$bf,$bf,$a9,$00,$00,$00,$00,$00,$00,$98,$04   ; 6680 ................
            !byte $03,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$9d,$9a   ; 6690 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$95,$00,$00,$00,$00,$00,$7f   ; 66a0 ................
            !byte $7f,$bf,$bf,$b1,$ac,$bf,$bf,$aa,$48,$00,$00,$00,$00,$00,$94,$00   ; 66b0 ........H.......
            !byte $02,$00,$00,$00,$00,$00,$00,$00,$02,$00,$00,$00,$00,$00,$96,$00   ; 66c0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$90,$a2,$9f,$a7,$00,$00,$7f   ; 66d0 ................
            !byte $7f,$bf,$bf,$aa,$00,$b3,$ad,$bc,$9f,$a0,$a5,$00,$00,$00,$00,$00   ; 66e0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$01,$00,$00,$00,$00,$00,$97,$00   ; 66f0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$9c,$99,$00,$00,$7f   ; 6700 ................
            !byte $7f,$bf,$bf,$a9,$00,$00,$00,$00,$00,$00,$8f,$a4,$00,$00,$00,$00   ; 6710 ................
            !byte $00,$9d,$9b,$00,$00,$00,$49,$00,$00,$00,$4a,$00,$00,$9c,$99,$00   ; 6720 ......I...J.....
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$95,$00,$00,$00,$7f   ; 6730 ................
            !byte $7f,$bf,$bf,$ab,$00,$00,$00,$00,$00,$00,$00,$90,$a1,$a6,$00,$00   ; 6740 ................
            !byte $9c,$9a,$00,$00,$00,$00,$00,$03,$06,$00,$00,$00,$00,$98,$00,$00   ; 6750 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$93,$00,$00,$00,$7f   ; 6760 ................
            !byte $7f,$bf,$bf,$af,$b2,$00,$00,$00,$00,$00,$00,$00,$00,$91,$a2,$a3   ; 6770 ................
            !byte $99,$00,$00,$00,$02,$97,$04,$01,$02,$9e,$a3,$a1,$9f,$9b,$00,$00   ; 6780 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$96,$00,$00,$00,$7f   ; 6790 ................
            !byte $7f,$bf,$bf,$bf,$aa,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 67a0 ................
            !byte $00,$00,$00,$9c,$a2,$99,$00,$03,$04,$94,$00,$00,$00,$00,$00,$00   ; 67b0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$9c,$9a,$00,$00,$00,$7f   ; 67c0 ................
            !byte $7f,$bf,$bf,$b1,$bc,$a0,$9f,$a1,$a4,$00,$00,$00,$02,$06,$05,$00   ; 67d0 ................
            !byte $00,$9d,$a3,$9a,$47,$00,$01,$06,$00,$93,$00,$00,$98,$00,$00,$00   ; 67e0 ....G...........
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$97,$4a,$00,$00,$00,$7f   ; 67f0 ...........J....
            !byte $7f,$bf,$b1,$b0,$00,$00,$00,$00,$91,$a2,$00,$01,$04,$03,$01,$00   ; 6800 ................
            !byte $9e,$9b,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$97,$00,$00,$00   ; 6810 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$94,$00,$00,$00,$00,$7f   ; 6820 ................
            !byte $7f,$ad,$b0,$00,$00,$00,$00,$00,$00,$00,$00,$02,$06,$4a,$00,$8c   ; 6830 .............J..
            !byte $96,$8b,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$8f,$a2,$a7,$00   ; 6840 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$9e,$9b,$00,$00,$00,$00,$7f   ; 6850 ................
            !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$01,$03,$05,$00,$00,$00,$8e   ; 6860 ................
            !byte $90,$a5,$8d,$00,$00,$00,$00,$00,$00,$47,$00,$00,$00,$00,$96,$49   ; 6870 .........G.....I
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$98,$00,$00,$00,$00,$00,$7f   ; 6880 ................
            !byte $7f,$00,$00,$00,$00,$00,$00,$00,$02,$06,$00,$00,$00,$00,$8d,$8b   ; 6890 ................
            !byte $8e,$92,$a7,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$91,$a5   ; 68a0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$96,$00,$00,$00,$00,$00,$7f   ; 68b0 ................
            !byte $7f,$a6,$49,$00,$00,$00,$00,$00,$05,$04,$00,$00,$8b,$8c,$8e,$8d   ; 68c0 ..I.............
            !byte $8c,$00,$98,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$95   ; 68d0 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$95,$00,$00,$00,$00,$00,$7f   ; 68e0 ................
            !byte $7f,$92,$a5,$00,$00,$00,$00,$00,$03,$01,$00,$00,$8d,$9f,$a3,$a5   ; 68f0 ................
            !byte $8e,$8b,$94,$00,$00,$00,$00,$00,$00,$00,$96,$00,$00,$00,$00,$90   ; 6900 ................
            !byte $a1,$a4,$00,$00,$00,$00,$00,$00,$00,$97,$00,$00,$00,$00,$00,$7f   ; 6910 ................
            !byte $7f,$00,$8f,$a7,$00,$00,$00,$03,$04,$06,$00,$8b,$8c,$8e,$8d,$91   ; 6920 ................
            !byte $a0,$a6,$97,$00,$00,$00,$00,$00,$00,$00,$91,$a6,$00,$00,$00,$00   ; 6930 ................
            !byte $00,$92,$a6,$00,$00,$00,$00,$00,$00,$94,$00,$00,$00,$00,$00,$7f   ; 6940 ................
            !byte $7f,$00,$00,$95,$00,$00,$00,$02,$05,$8b,$8e,$8d,$8b,$8c,$8b,$8e   ; 6950 ................
            !byte $8c,$92,$a8,$00,$00,$00,$00,$00,$00,$00,$00,$97,$00,$00,$00,$00   ; 6960 ................
            !byte $00,$00,$8f,$a3,$9f,$a1,$a0,$a6,$00,$98,$00,$00,$00,$00,$00,$7f   ; 6970 ................
            !byte $7f,$00,$9c,$9a,$00,$00,$00,$00,$00,$8c,$8b,$8d,$8e,$8c,$00,$00   ; 6980 ................
            !byte $00,$8b,$94,$00,$00,$00,$00,$00,$00,$00,$4a,$94,$00,$00,$00,$00   ; 6990 ..........J.....
            !byte $00,$00,$00,$00,$00,$00,$00,$93,$47,$8f,$9f,$a0,$a2,$a5,$00,$7f   ; 69a0 ........G.......
            !byte $7f,$99,$97,$00,$00,$00,$00,$00,$00,$00,$8e,$00,$00,$00,$00,$00   ; 69b0 ................
            !byte $00,$47,$95,$00,$00,$00,$00,$00,$00,$00,$00,$90,$a5,$00,$00,$00   ; 69c0 .G..............
            !byte $00,$00,$00,$00,$00,$00,$00,$95,$00,$00,$00,$00,$00,$90,$a6,$7f   ; 69d0 ................
            !byte $7f,$01,$06,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 69e0 ................
            !byte $00,$00,$8f,$9c,$a1,$00,$00,$00,$00,$00,$00,$00,$92,$9c,$9b,$9d   ; 69f0 ................
            !byte $9a,$9c,$a0,$00,$00,$00,$00,$94,$00,$00,$00,$00,$00,$00,$92,$7f   ; 6a00 ................
            !byte $7f,$02,$05,$03,$04,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6a10 ................
            !byte $00,$00,$00,$00,$91,$9b,$9e,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6a20 ................
            !byte $00,$00,$91,$9d,$9e,$00,$98,$96,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6a30 ................
            !byte $7f,$00,$00,$01,$05,$06,$03,$00,$00,$9c,$a1,$00,$00,$00,$9c,$9f   ; 6a40 ................
            !byte $00,$00,$00,$00,$00,$00,$90,$9a,$a0,$00,$00,$00,$00,$00,$00,$00   ; 6a50 ................
            !byte $00,$00,$00,$99,$a2,$9b,$97,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6a60 ................
            !byte $7f,$00,$00,$00,$00,$04,$03,$01,$05,$00,$91,$9f,$00,$00,$00,$92   ; 6a70 ................
            !byte $9d,$9e,$00,$00,$00,$00,$00,$00,$92,$9d,$9f,$00,$00,$00,$00,$00   ; 6a80 ................
            !byte $00,$00,$98,$97,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6a90 ................
            !byte $7f,$00,$00,$00,$00,$00,$02,$04,$06,$00,$00,$8f,$9b,$9c,$9a,$a0   ; 6aa0 ................
            !byte $00,$8f,$9a,$a1,$00,$00,$00,$00,$00,$00,$8f,$9e,$00,$00,$00,$00   ; 6ab0 ................
            !byte $00,$99,$96,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6ac0 ................
            !byte $7f,$00,$00,$00,$00,$00,$00,$01,$03,$05,$00,$00,$00,$00,$00,$90   ; 6ad0 ................
            !byte $9e,$00,$00,$91,$a0,$00,$00,$00,$00,$00,$48,$93,$00,$00,$00,$b0   ; 6ae0 ..........H.....
            !byte $a5,$bc,$49,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6af0 ..I.............
            !byte $7f,$00,$00,$00,$00,$00,$00,$00,$02,$06,$04,$00,$00,$00,$00,$00   ; 6b00 ................
            !byte $92,$a1,$00,$00,$90,$9f,$00,$00,$00,$00,$99,$96,$00,$b1,$a6,$aa   ; 6b10 ................
            !byte $b2,$ae,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6b20 ................
            !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$05,$01,$06,$00,$a0,$00,$00   ; 6b30 ................
            !byte $00,$8f,$9f,$00,$00,$92,$9e,$00,$00,$00,$95,$00,$af,$ab,$bf,$b3   ; 6b40 ................
            !byte $ad,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6b50 ................
            !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$01,$02,$04,$03,$90,$a1,$00   ; 6b60 ................
            !byte $00,$00,$91,$a0,$49,$00,$93,$00,$00,$98,$97,$00,$a4,$bf,$bf,$a8   ; 6b70 ....I...........
            !byte $b4,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6b80 ................
            !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$05,$03,$06,$02,$01,$8f,$9f   ; 6b90 ................
            !byte $00,$00,$00,$92,$ba,$a5,$bb,$a6,$a7,$bc,$b6,$ac,$bf,$bf,$bf,$b2   ; 6ba0 ................
            !byte $ae,$00,$4a,$98,$9a,$9d,$9c,$9f,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6bb0 ..J.............
            !byte $7f,$00,$00,$04,$05,$01,$05,$02,$03,$06,$01,$04,$05,$06,$02,$91   ; 6bc0 ................
            !byte $9e,$00,$00,$b0,$aa,$bf,$bf,$bf,$b2,$ad,$b7,$b8,$b8,$b9,$a3,$b5   ; 6bd0 ................
            !byte $99,$9d,$9b,$96,$00,$00,$00,$94,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6be0 ................
            !byte $7f,$00,$00,$05,$03,$06,$04,$01,$04,$02,$00,$03,$04,$01,$06,$00   ; 6bf0 ................
            !byte $92,$ba,$a7,$ab,$bf,$bf,$bf,$bf,$a8,$b4,$00,$00,$b0,$aa,$bf,$a9   ; 6c00 ................
            !byte $bb,$a6,$a7,$b4,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$7f   ; 6c10 ................
            !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6c20 ................
            !byte $b1,$ac,$bf,$bf,$bf,$bf,$bf,$bf,$bf,$a9,$b5,$af,$ab,$bf,$bf,$bf   ; 6c30 ................
            !byte $bf,$bf,$bf,$a9,$a5,$b5,$05,$04,$02,$03,$06,$01,$06,$02,$01,$7f   ; 6c40 ................
            !byte $7f,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6c50 ................
            !byte $a4,$bf,$bf,$bf,$bf,$bf,$bf,$bf,$bf,$bf,$a8,$ac,$bf,$bf,$bf,$bf   ; 6c60 ................
            !byte $bf,$bf,$bf,$bf,$bf,$a8,$a6,$a7,$b5,$01,$02,$03,$04,$03,$03,$7f   ; 6c70 ................
            !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6c80 ................
            !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6c90 ................
            !byte $7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f,$7f   ; 6ca0 ................
            !byte $7f                                                               ; 6cb0 .
s_BN        !byte $ff,$ff,$ff,$ff,$ff,$ff,$ff,$01,$ff,$ff,$ff,$03,$ff,$02,$00       ; 6cb1 ...............
s_BO        !byte $ff,$28,$28,$28,$14,$00,$00,$00,$00,$00,$14,$28,$28               ; 6cc0 .(((.......((
s_BP        !byte $06,$0c,$08,$00,$00,$12,$0e,$08,$14,$80,$04,$08,$06,$00,$00,$12   ; 6ccd ................
            !byte $0d,$06,$10,$80,$18,$1e,$18,$00,$00,$1e,$1e,$1a,$1c,$80,$1e,$1e   ; 6cdd ................
            !byte $1e,$00,$00,$1e,$1e,$1e,$1e,$80,$0a,$10,$0a,$0c,$0c,$18,$1c,$0c   ; 6ced ................
            !byte $18,$80,$06,$0a,$08,$08,$08,$18,$1c,$08,$14,$80                   ; 6cfd ............
s_BQ        !byte $28,$27,$26,$24,$23,$22,$16,$0f,$0f,$0e,$28,$27,$26,$23,$23,$22   ; 6d09 ('&$#"....('&##"
            !byte $16,$0f,$0e,$0e,$13,$13                                           ; 6d19 ......
s_BR        !byte $23,$23,$23,$21,$24,$24,$04,$07,$07,$08,$24,$24,$24,$21,$25,$25   ; 6d1f ###!$$....$$$!%%
            !byte $03,$06,$07,$07,$04,$03                                           ; 6d2f ......
s_BS        !byte $28,$27,$26,$23,$23,$22,$16,$0f,$0e,$0e,$28,$27,$26,$24,$23,$22   ; 6d35 ('&##"....('&$#"
            !byte $16,$0f,$0f,$0e,$13,$13                                           ; 6d45 ......
s_BT        !byte $24,$24,$24,$21,$25,$25,$03,$06,$07,$07,$23,$23,$23,$21,$24,$24   ; 6d4b $$$!%%....###!$$
            !byte $04,$07,$07,$08,$03,$04                                           ; 6d5b ......
s_BU        !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6d61 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6d71 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6d81 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6d91 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6da1 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6db1 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6dc1 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6dd1 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 6de1 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00       ; 6df1 ...............
init        ldx #$08                        ; 6e00 a208
_init1      lda s_CK,x                      ; 6e02 bdb673
            sta $b0,x                       ; 6e05 95b0
            lda s_CM,x                      ; 6e07 bdcf73
            sta $02c0,x                     ; 6e0a 9dc002
            dex                             ; 6e0d ca
            bpl _init1                      ; 6e0e 10f2
            ldx #$0f                        ; 6e10 a20f
_init2      lda s_CL,x                      ; 6e12 bdbf73
            sta $0600,x                     ; 6e15 9d0006
            dex                             ; 6e18 ca
            bpl _init2                      ; 6e19 10f7
            lda #$00                        ; 6e1b a900
            sta $0230                       ; 6e1d 8d3002
            sta $d404                       ; 6e20 8d04d4
            sta $d405                       ; 6e23 8d05d4
            lda $b1                         ; 6e26 a5b1
            sta $0231                       ; 6e28 8d3102
            ldx #$00                        ; 6e2b a200
_init3      lda s_AI,x                      ; 6e2d bd3e55
            sta s_AJ,x                      ; 6e30 9ddd55
            lda #$00                        ; 6e33 a900
            sta s_AV,x                      ; 6e35 9d755d
            lda #$ff                        ; 6e38 a9ff
            sta s_BU,x                      ; 6e3a 9d616d
            inx                             ; 6e3d e8
            cpx #$a0                        ; 6e3e e0a0
            bne _init3                      ; 6e40 d0eb
            lda #$50                        ; 6e42 a950
            sta $d407                       ; 6e44 8d07d4
            lda #$2f                        ; 6e47 a92f
            sta $022f                       ; 6e49 8d2f02
            lda #$03                        ; 6e4c a903
            sta $d01d                       ; 6e4e 8d1dd0
            lda #$78                        ; 6e51 a978
            sta $d000                       ; 6e53 8d00d0
            lda #$01                        ; 6e56 a901
            sta $068f                       ; 6e58 8d8f06
            sta $026f                       ; 6e5b 8d6f02
            sta $d008                       ; 6e5e 8d08d0
            ldx #$33                        ; 6e61 a233
            lda #$ff                        ; 6e63 a9ff
            sta s_AD,x                      ; 6e65 9d0052
            inx                             ; 6e68 e8
            sta s_AD,x                      ; 6e69 9d0052
            inx                             ; 6e6c e8
            lda #$81                        ; 6e6d a981
_init4      sta s_AD,x                      ; 6e6f 9d0052
            inx                             ; 6e72 e8
            cpx #$3f                        ; 6e73 e03f
            bne _init4                      ; 6e75 d0f8
            lda #$ff                        ; 6e77 a9ff
            sta s_AD,x                      ; 6e79 9d0052
            sta $c9                         ; 6e7c 85c9
            inx                             ; 6e7e e8
            sta s_AD,x                      ; 6e7f 9d0052
            ldy #$00                        ; 6e82 a000
            ldx #$74                        ; 6e84 a274
            lda #$07                        ; 6e86 a907
            jsr $e45c                       ; 6e88 205ce4
            lda #$00                        ; 6e8b a900
            sta $0200                       ; 6e8d 8d0002
            lda #$7b                        ; 6e90 a97b
            sta $0201                       ; 6e92 8d0102
            lda #$c0                        ; 6e95 a9c0
            sta $d40e                       ; 6e97 8d0ed4
s_BV        inc $c9                         ; 6e9a e6c9
            lda $060b                       ; 6e9c ad0b06
            clc                             ; 6e9f 18
            adc #$07                        ; 6ea0 6907
            ldx $060c                       ; 6ea2 ae0c06
            cmp s_AU,x                      ; 6ea5 dd685d
            beq _BV3                        ; 6ea8 f027
            bcc _BV3                        ; 6eaa 9025
            cpx #$02                        ; 6eac e002
            bne _BV1                        ; 6eae d00a
            ldy $060d                       ; 6eb0 ac0d06
            cpy #$2c                        ; 6eb3 c02c
            bne _BV1                        ; 6eb5 d003
            sec                             ; 6eb7 38
            sbc #$01                        ; 6eb8 e901
_BV1        sec                             ; 6eba 38
            sbc s_AU,x                      ; 6ebb fd685d
            inx                             ; 6ebe e8
            cpx #$0d                        ; 6ebf e00d
            bne _BV2                        ; 6ec1 d005
            inc $060d                       ; 6ec3 ee0d06
            ldx #$01                        ; 6ec6 a201
_BV2        stx $060c                       ; 6ec8 8e0c06
            ldy s_BF,x                      ; 6ecb bcea5f
            sty $0605                       ; 6ece 8c0506
_BV3        sta $060b                       ; 6ed1 8d0b06
            ldy #$93                        ; 6ed4 a093
            lda #$00                        ; 6ed6 a900
_BV4        sta s_BJ,y                      ; 6ed8 995064
            iny                             ; 6edb c8
            cpy #$a7                        ; 6edc c0a7
            bne _BV4                        ; 6ede d0f8
            ldy #$93                        ; 6ee0 a093
            txa                             ; 6ee2 8a
            clc                             ; 6ee3 18
            adc #$10                        ; 6ee4 6910
            jsr s_DC                        ; 6ee6 20c079
            lda $060b                       ; 6ee9 ad0b06
            jsr s_DL                        ; 6eec 20b27b
            lda #$0c                        ; 6eef a90c
            sta s_BJ,y                      ; 6ef1 995064
            iny                             ; 6ef4 c8
            iny                             ; 6ef5 c8
            lda #$11                        ; 6ef6 a911
            sta s_BJ,y                      ; 6ef8 995064
            iny                             ; 6efb c8
            lda #$19                        ; 6efc a919
            sta s_BJ,y                      ; 6efe 995064
            iny                             ; 6f01 c8
            ldx $060d                       ; 6f02 ae0d06
            lda #$14                        ; 6f05 a914
            sta s_BJ,y                      ; 6f07 995064
            iny                             ; 6f0a c8
            lda s_AS,x                      ; 6f0b bd085c
            clc                             ; 6f0e 18
            adc #$10                        ; 6f0f 6910
            sta s_BJ,y                      ; 6f11 995064
            lda $060c                       ; 6f14 ad0c06
            cmp #$04                        ; 6f17 c904
            bne _BV5                        ; 6f19 d017
            lda #$02                        ; 6f1b a902
            sta $0606                       ; 6f1d 8d0606
            lda #$40                        ; 6f20 a940
            sta $0608                       ; 6f22 8d0806
            lda #$01                        ; 6f25 a901
            sta $060a                       ; 6f27 8d0a06
            lda #$00                        ; 6f2a a900
            sta $0609                       ; 6f2c 8d0906
            jmp s_BX                        ; 6f2f 4ceb6f
_BV5        cmp #$0a                        ; 6f32 c90a
            bne _BV6                        ; 6f34 d008
            lda #$02                        ; 6f36 a902
            sta $0606                       ; 6f38 8d0606
            jmp s_BX                        ; 6f3b 4ceb6f
_BV6        cmp #$05                        ; 6f3e c905
            bne _BV7                        ; 6f40 d008
            lda #$10                        ; 6f42 a910
            sta $0606                       ; 6f44 8d0606
            jmp s_BX                        ; 6f47 4ceb6f
_BV7        cmp #$0b                        ; 6f4a c90b
            bne _BV8                        ; 6f4c d008
            lda #$0a                        ; 6f4e a90a
            sta $0606                       ; 6f50 8d0606
            jmp s_BW                        ; 6f53 4c716f
_BV8        cmp #$01                        ; 6f56 c901
            bne _BV9                        ; 6f58 d010
            lda #$80                        ; 6f5a a980
            sta $0608                       ; 6f5c 8d0806
            lda #$ff                        ; 6f5f a9ff
            sta $0609                       ; 6f61 8d0906
            sta $060a                       ; 6f64 8d0a06
            jmp s_BX                        ; 6f67 4ceb6f
_BV9        cmp #$03                        ; 6f6a c903
            beq s_BW                        ; 6f6c f003
            jmp s_BX                        ; 6f6e 4ceb6f
s_BW        lda $d20a                       ; 6f71 ad0ad2
            and #$07                        ; 6f74 2907
            clc                             ; 6f76 18
            adc #$07                        ; 6f77 6907
            eor $0609                       ; 6f79 4d0906
            sta $c5                         ; 6f7c 85c5
            lda $0607                       ; 6f7e ad0706
            sta $062a                       ; 6f81 8d2a06
            sec                             ; 6f84 38
            sbc $c5                         ; 6f85 e5c5
            beq _BW1                        ; 6f87 f002
            bpl _BW2                        ; 6f89 1002
_BW1        lda #$01                        ; 6f8b a901
_BW2        cmp #$27                        ; 6f8d c927
            bcc _BW3                        ; 6f8f 9002
            lda #$27                        ; 6f91 a927
_BW3        sta $0607                       ; 6f93 8d0706
            lda #$01                        ; 6f96 a901
            sta $be                         ; 6f98 85be
            sta $cb                         ; 6f9a 85cb
            lda $062a                       ; 6f9c ad2a06
            sta $bf                         ; 6f9f 85bf
            sta $ca                         ; 6fa1 85ca
_BW4        jsr s_CF                        ; 6fa3 204072
            and #$3f                        ; 6fa6 293f
            cmp #$0b                        ; 6fa8 c90b
            bcc _BW7                        ; 6faa 901d
            cmp #$29                        ; 6fac c929
            bcs _BW7                        ; 6fae b019
            ldx $bf                         ; 6fb0 a6bf
            cpx #$0e                        ; 6fb2 e00e
            bcs _BW5                        ; 6fb4 b004
            cmp #$23                        ; 6fb6 c923
            bcs _BW7                        ; 6fb8 b00f
_BW5        ora $0608                       ; 6fba 0d0806
            ldx $c3                         ; 6fbd a6c3
            beq _BW6                        ; 6fbf f006
            sta s_AK,x                      ; 6fc1 9d7c56
            jmp _BW7                        ; 6fc4 4cc96f
_BW6        sta ($c0),y                     ; 6fc7 91c0
_BW7        inc $be                         ; 6fc9 e6be
            lda $be                         ; 6fcb a5be
            sta $cb                         ; 6fcd 85cb
            cmp #$2e                        ; 6fcf c92e
            bne _BW4                        ; 6fd1 d0d0
            lda #$00                        ; 6fd3 a900
            sta $be                         ; 6fd5 85be
            sta $cb                         ; 6fd7 85cb
            lda $bf                         ; 6fd9 a5bf
            cmp $0607                       ; 6fdb cd0706
            beq s_BX                        ; 6fde f00b
            sec                             ; 6fe0 38
            sbc $060a                       ; 6fe1 ed0a06
            sta $bf                         ; 6fe4 85bf
            sta $ca                         ; 6fe6 85ca
            jmp _BW4                        ; 6fe8 4ca36f
s_BX        ldx #$9e                        ; 6feb a29e
_BX1        lda s_AL,x                      ; 6fed bd1b57
            cmp $c9                         ; 6ff0 c5c9
            bne _BX4                        ; 6ff2 d02c
            lda units,x                     ; 6ff4 bd0054
            sta $be                         ; 6ff7 85be
            sta $cb                         ; 6ff9 85cb
            lda s_AH,x                      ; 6ffb bd9f54
            sta $bf                         ; 6ffe 85bf
            sta $ca                         ; 7000 85ca
            stx $b4                         ; 7002 86b4
            jsr s_CG                        ; 7004 204672
            beq _BX3                        ; 7007 f00f
            cpx #$37                        ; 7009 e037
            bcs _BX2                        ; 700b b005
            lda #$0a                        ; 700d a90a
            sta s_BL                        ; 700f 8d7464
_BX2        jsr s_DD                        ; 7012 20ef79
            jmp _BX4                        ; 7015 4c2070
_BX3        lda $c9                         ; 7018 a5c9
            clc                             ; 701a 18
            adc #$01                        ; 701b 6901
            sta s_AL,x                      ; 701d 9d1b57
_BX4        dex                             ; 7020 ca
            bne _BX1                        ; 7021 d0ca
            ldx #$9e                        ; 7023 a29e
_BX5        stx $c2                         ; 7025 86c2
            jsr s_W                         ; 7027 209150
            ldx $c2                         ; 702a a6c2
            dex                             ; 702c ca
            bne _BX5                        ; 702d d0f6
            lda #$00                        ; 702f a900
            sta $c7                         ; 7031 85c7
            sta $c8                         ; 7033 85c8
            ldx #$01                        ; 7035 a201
_BX6        lda #$30                        ; 7037 a930
            sec                             ; 7039 38
            sbc units,x                     ; 703a fd0054
            sta $c5                         ; 703d 85c5
            lda s_AI,x                      ; 703f bd3e55
            lsr                             ; 7042 4a
            beq _BX9                        ; 7043 f012
            tay                             ; 7045 a8
            lda #$00                        ; 7046 a900
            clc                             ; 7048 18
_BX7        adc $c5                         ; 7049 65c5
            bcc _BX8                        ; 704b 9007
            inc $c8                         ; 704d e6c8
            clc                             ; 704f 18
            bne _BX8                        ; 7050 d002
            dec $c8                         ; 7052 c6c8
_BX8        dey                             ; 7054 88
            bne _BX7                        ; 7055 d0f2
_BX9        inx                             ; 7057 e8
            cpx #$37                        ; 7058 e037
            bne _BX6                        ; 705a d0db
_BX10       lda units,x                     ; 705c bd0054
            sta $c5                         ; 705f 85c5
            lda s_AJ,x                      ; 7061 bddd55
            lsr                             ; 7064 4a
            lsr                             ; 7065 4a
            lsr                             ; 7066 4a
            beq _BX13                       ; 7067 f012
            tay                             ; 7069 a8
            lda #$00                        ; 706a a900
            clc                             ; 706c 18
_BX11       adc $c5                         ; 706d 65c5
            bcc _BX12                       ; 706f 9007
            inc $c7                         ; 7071 e6c7
            clc                             ; 7073 18
            bne _BX12                       ; 7074 d002
            dec $c7                         ; 7076 c6c7
_BX12       dey                             ; 7078 88
            bne _BX11                       ; 7079 d0f2
_BX13       inx                             ; 707b e8
            cpx #$9e                        ; 707c e09e
            bne _BX10                       ; 707e d0dc
            lda $c8                         ; 7080 a5c8
            sec                             ; 7082 38
            sbc $c7                         ; 7083 e5c7
            bcs _BX14                       ; 7085 b002
            lda #$00                        ; 7087 a900
_BX14       ldx #$03                        ; 7089 a203
_BX15       ldy s_CC,x                      ; 708b bcea71
            beq _BX16                       ; 708e f008
            clc                             ; 7090 18
            adc s_CN,x                      ; 7091 7dd873
            bcc _BX16                       ; 7094 9002
            lda #$ff                        ; 7096 a9ff
_BX16       dex                             ; 7098 ca
            bpl _BX15                       ; 7099 10f0
            ldx $068f                       ; 709b ae8f06
            bne _BX17                       ; 709e d001
            lsr                             ; 70a0 4a
_BX17       ldy #$05                        ; 70a1 a005
            jsr s_DL                        ; 70a3 20b27b
            lda #$00                        ; 70a6 a900
            sta s_BJ,y                      ; 70a8 995064
            lda $c9                         ; 70ab a5c9
            cmp #$28                        ; 70ad c928
            bne _BY1                        ; 70af d008
            lda #$01                        ; 70b1 a901
            jsr s_CQ                        ; 70b3 20e473
s_BY        jmp s_BY                        ; 70b6 4cb670
_BY1        lda #$00                        ; 70b9 a900
            sta $060f                       ; 70bb 8d0f06
            sta $b4                         ; 70be 85b4
            jsr s_CQ                        ; 70c0 20e473
            jsr think                       ; 70c3 200047
            lda #$01                        ; 70c6 a901
            sta $060f                       ; 70c8 8d0f06
            lda #$02                        ; 70cb a902
            jsr s_CQ                        ; 70cd 20e473
            lda #$00                        ; 70d0 a900
            sta $062e                       ; 70d2 8d2e06
            ldx #$9e                        ; 70d5 a29e
_BY2        stx $c2                         ; 70d7 86c2
            jsr s_CI                        ; 70d9 20d172
            dex                             ; 70dc ca
            bne _BY2                        ; 70dd d0f8
s_BZ        ldx #$9e                        ; 70df a29e
s_CA        stx $c2                         ; 70e1 86c2
            lda s_AI,x                      ; 70e3 bd3e55
            sec                             ; 70e6 38
            sbc s_AJ,x                      ; 70e7 fddd55
            cmp #$02                        ; 70ea c902
            bcc _CA1                        ; 70ec 900b
            inc s_AJ,x                      ; 70ee fedd55
            cmp $d20a                       ; 70f1 cd0ad2
            bcc _CA1                        ; 70f4 9003
            inc s_AJ,x                      ; 70f6 fedd55
_CA1        lda s_BU,x                      ; 70f9 bd616d
            bmi _CA4                        ; 70fc 3045
            cmp $062e                       ; 70fe cd2e06
            bne _CA4                        ; 7101 d040
            lda s_AW,x                      ; 7103 bd145e
            and #$03                        ; 7106 2903
            tay                             ; 7108 a8
            lda units,x                     ; 7109 bd0054
            clc                             ; 710c 18
            adc s_DO,y                      ; 710d 79f27b
            sta $cb                         ; 7110 85cb
            sta $c7                         ; 7112 85c7
            lda s_AH,x                      ; 7114 bd9f54
            clc                             ; 7117 18
            adc s_DN,y                      ; 7118 79f17b
            sta $ca                         ; 711b 85ca
            sta $c8                         ; 711d 85c8
            jsr s_CF                        ; 711f 204072
            lda $c3                         ; 7122 a5c3
            beq _CA6                        ; 7124 f02a
            cmp #$37                        ; 7126 c937
            bcc _CA2                        ; 7128 9008
            lda $c2                         ; 712a a5c2
            cmp #$37                        ; 712c c937
            bcs _CA3                        ; 712e b008
            bcc _CA5                        ; 7130 9014
_CA2        lda $c2                         ; 7132 a5c2
            cmp #$37                        ; 7134 c937
            bcs _CA5                        ; 7136 b00e
_CA3        ldx $c2                         ; 7138 a6c2
            lda $062e                       ; 713a ad2e06
            clc                             ; 713d 18
            adc #$02                        ; 713e 6902
            sta s_BU,x                      ; 7140 9d616d
_CA4        jmp s_CB                        ; 7143 4cd271
_CA5        jsr s_T                         ; 7146 20d84e
            lda $0697                       ; 7149 ad9706
            beq _CA4                        ; 714c f0f5
            bne _CA7                        ; 714e d02e
_CA6        ldx $c2                         ; 7150 a6c2
            stx $b4                         ; 7152 86b4
            lda s_AH,x                      ; 7154 bd9f54
            sta $bf                         ; 7157 85bf
            sta $ca                         ; 7159 85ca
            lda units,x                     ; 715b bd0054
            sta $be                         ; 715e 85be
            sta $cb                         ; 7160 85cb
            jsr s_Y                         ; 7162 204051
            lda $c8                         ; 7165 a5c8
            sta $ca                         ; 7167 85ca
            lda $c7                         ; 7169 a5c7
            sta $cb                         ; 716b 85cb
            lda $0694                       ; 716d ad9406
            cmp #$02                        ; 7170 c902
            bcc _CA7                        ; 7172 900a
            jsr s_Y                         ; 7174 204051
            lda $0694                       ; 7177 ad9406
            cmp #$02                        ; 717a c902
            bcs _CA3                        ; 717c b0ba
_CA7        jsr s_DD                        ; 717e 20ef79
            ldx $b4                         ; 7181 a6b4
            lda $ca                         ; 7183 a5ca
            sta $bf                         ; 7185 85bf
            sta s_AH,x                      ; 7187 9d9f54
            lda $cb                         ; 718a a5cb
            sta $be                         ; 718c 85be
            sta units,x                     ; 718e 9d0054
            jsr s_DD                        ; 7191 20ef79
            ldx $c2                         ; 7194 a6c2
            lda #$ff                        ; 7196 a9ff
            sta s_BU,x                      ; 7198 9d616d
            dec s_AV,x                      ; 719b de755d
            beq s_CB                        ; 719e f032
            lsr s_AX,x                      ; 71a0 5eb35e
            ror s_AW,x                      ; 71a3 7e145e
            lsr s_AX,x                      ; 71a6 5eb35e
            ror s_AW,x                      ; 71a9 7e145e
            ldy #$03                        ; 71ac a003
_CA8        lda units,x                     ; 71ae bd0054
            cmp s_CO,y                      ; 71b1 d9dc73
            bne _CA10                       ; 71b4 d013
            lda s_AH,x                      ; 71b6 bd9f54
            cmp s_CP,y                      ; 71b9 d9e073
            bne _CA10                       ; 71bc d00b
            lda #$ff                        ; 71be a9ff
            cpx #$37                        ; 71c0 e037
            bcc _CA9                        ; 71c2 9002
            lda #$00                        ; 71c4 a900
_CA9        sta s_CC,y                      ; 71c6 99ea71
_CA10       dey                             ; 71c9 88
            bpl _CA8                        ; 71ca 10e2
            jsr s_CI                        ; 71cc 20d172
            jsr s_CD                        ; 71cf 200072
s_CB        ldx $c2                         ; 71d2 a6c2
            dex                             ; 71d4 ca
            beq _CB1                        ; 71d5 f003
            jmp s_CA                        ; 71d7 4ce170
_CB1        inc $062e                       ; 71da ee2e06
            lda $062e                       ; 71dd ad2e06
            cmp #$20                        ; 71e0 c920
            beq _CB2                        ; 71e2 f003
            jmp s_BZ                        ; 71e4 4cdf70
_CB2        jmp s_BV                        ; 71e7 4c9a6e
s_CC        !byte $00,$00,$00,$00,$22,$50,$a6,$c2,$ca,$f0,$03,$4c,$ff,$70,$ee,$2e   ; 71ea ...."P.....L.p..
            !byte $06,$ad,$2e,$06,$c9,$20                                           ; 71fa .....
s_CD        lda #$00                        ; 7200 a900
_CD1        pha                             ; 7202 48
            pla                             ; 7203 68
            pha                             ; 7204 48
            pla                             ; 7205 68
            pha                             ; 7206 48
            pla                             ; 7207 68
            adc #$01                        ; 7208 6901
            bne _CD1                        ; 720a d0f6
            rts                             ; 720c 60
            !byte $4c,$9a,$6e                                                       ; 720d L.n
s_CE        lda #$00                        ; 7210 a900
            sta $d01d                       ; 7212 8d1dd0
            sta $d00d                       ; 7215 8d0dd0
            sta $d00e                       ; 7218 8d0ed0
            sta $d00f                       ; 721b 8d0fd0
            lda #$22                        ; 721e a922
            sta $022f                       ; 7220 8d2f02
            lda #$20                        ; 7223 a920
            sta $0230                       ; 7225 8d3002
            lda #$bc                        ; 7228 a9bc
            sta $0231                       ; 722a 8d3102
            lda #$40                        ; 722d a940
            sta $d40e                       ; 722f 8d0ed4
            lda #$0a                        ; 7232 a90a
            sta $02c5                       ; 7234 8dc502
            lda #$00                        ; 7237 a900
            sta s_BH                        ; 7239 8dff5f
            sta $02c8                       ; 723c 8dc802
            brk                             ; 723f 00
s_CF        jsr s_CG                        ; 7240 204672
            beq _CG2                        ; 7243 f046
            rts                             ; 7245 60
s_CG        lda #$00                        ; 7246 a900
            sta $c1                         ; 7248 85c1
            sta $c3                         ; 724a 85c3
            lda #$27                        ; 724c a927
            sec                             ; 724e 38
            sbc $ca                         ; 724f e5ca
            asl                             ; 7251 0a
            rol $c1                         ; 7252 26c1
            asl                             ; 7254 0a
            rol $c1                         ; 7255 26c1
            asl                             ; 7257 0a
            rol $c1                         ; 7258 26c1
            asl                             ; 725a 0a
            rol $c1                         ; 725b 26c1
            sta $062c                       ; 725d 8d2c06
            ldy $c1                         ; 7260 a4c1
            sty $062d                       ; 7262 8c2d06
            asl                             ; 7265 0a
            rol $c1                         ; 7266 26c1
            clc                             ; 7268 18
            adc $062c                       ; 7269 6d2c06
            sta $c0                         ; 726c 85c0
            lda $c1                         ; 726e a5c1
            adc $062d                       ; 7270 6d2d06
            adc #$65                        ; 7273 6965
            sta $c1                         ; 7275 85c1
            lda #$2e                        ; 7277 a92e
            sec                             ; 7279 38
            sbc $cb                         ; 727a e5cb
            tay                             ; 727c a8
            lda ($c0),y                     ; 727d b1c0
            sta $062b                       ; 727f 8d2b06
            and #$3f                        ; 7282 293f
            cmp #$3d                        ; 7284 c93d
            beq _CG1                        ; 7286 f002
            cmp #$3e                        ; 7288 c93e
_CG1        rts                             ; 728a 60
_CG2        lda $062b                       ; 728b ad2b06
            sta $062f                       ; 728e 8d2f06
            and #$c0                        ; 7291 29c0
            ldx #$9e                        ; 7293 a29e
            cmp #$40                        ; 7295 c940
            bne _CG3                        ; 7297 d002
            ldx #$37                        ; 7299 a237
_CG3        lda $ca                         ; 729b a5ca
_CG4        cmp s_AH,x                      ; 729d dd9f54
            beq _CH1                        ; 72a0 f00a
s_CH        dex                             ; 72a2 ca
            bne _CG4                        ; 72a3 d0f8
            lda #$ff                        ; 72a5 a9ff
            sta s_BM                        ; 72a7 8dd064
            bmi _CH3                        ; 72aa 301c
_CH1        lda $cb                         ; 72ac a5cb
            cmp units,x                     ; 72ae dd0054
            bne _CH2                        ; 72b1 d010
            lda s_AJ,x                      ; 72b3 bddd55
            beq _CH2                        ; 72b6 f00b
            lda s_AL,x                      ; 72b8 bd1b57
            bmi _CH2                        ; 72bb 3006
            cmp $c9                         ; 72bd c5c9
            bcc _CH3                        ; 72bf 9007
            beq _CH3                        ; 72c1 f005
_CH2        lda $ca                         ; 72c3 a5ca
            jmp s_CH                        ; 72c5 4ca272
_CH3        stx $c3                         ; 72c8 86c3
            lda s_AK,x                      ; 72ca bd7c56
            sta $062b                       ; 72cd 8d2b06
            rts                             ; 72d0 60
s_CI        ldx $c2                         ; 72d1 a6c2
            lda s_AV,x                      ; 72d3 bd755d
            bne _CI1                        ; 72d6 d006
            lda #$ff                        ; 72d8 a9ff
            sta s_BU,x                      ; 72da 9d616d
            rts                             ; 72dd 60
_CI1        lda units,x                     ; 72de bd0054
            sta $cb                         ; 72e1 85cb
            lda s_AH,x                      ; 72e3 bd9f54
            sta $ca                         ; 72e6 85ca
            jsr s_CF                        ; 72e8 204072
            lda $062f                       ; 72eb ad2f06
            sta $0630                       ; 72ee 8d3006
            ldx $c2                         ; 72f1 a6c2
            lda s_AW,x                      ; 72f3 bd145e
            eor #$02                        ; 72f6 4902
            and #$03                        ; 72f8 2903
            tay                             ; 72fa a8
            lda units,x                     ; 72fb bd0054
            clc                             ; 72fe 18
            adc s_BD,y                      ; 72ff 79e25f
            sta $cb                         ; 7302 85cb
            lda s_AH,x                      ; 7304 bd9f54
            clc                             ; 7307 18
            adc s_BE,y                      ; 7308 79e65f
            sta $ca                         ; 730b 85ca
            jsr s_CF                        ; 730d 204072
            jsr s_CJ                        ; 7310 206973
            lda $0630                       ; 7313 ad3006
            and #$3f                        ; 7316 293f
            ldx #$00                        ; 7318 a200
            cmp #$3d                        ; 731a c93d
            beq _CI2                        ; 731c f002
            ldx #$0a                        ; 731e a20a
_CI2        txa                             ; 7320 8a
            ldx $060c                       ; 7321 ae0c06
            clc                             ; 7324 18
            adc s_BO,x                      ; 7325 7dc06c
            adc $cd                         ; 7328 65cd
            tax                             ; 732a aa
            lda s_BP,x                      ; 732b bdcd6c
            clc                             ; 732e 18
            adc $062e                       ; 732f 6d2e06
            ldx $c2                         ; 7332 a6c2
            sta s_BU,x                      ; 7334 9d616d
            lda $cd                         ; 7337 a5cd
            cmp #$07                        ; 7339 c907
            bcc _CI5                        ; 733b 902b
            ldy #$15                        ; 733d a015
_CI3        lda $ca                         ; 733f a5ca
            cmp s_BR,y                      ; 7341 d91f6d
            bne _CI4                        ; 7344 d01f
            lda $cb                         ; 7346 a5cb
            cmp s_BQ,y                      ; 7348 d9096d
            bne _CI4                        ; 734b d018
            ldx $c2                         ; 734d a6c2
            lda units,x                     ; 734f bd0054
            cmp s_BS,y                      ; 7352 d9356d
            bne _CI4                        ; 7355 d00e
            lda s_AH,x                      ; 7357 bd9f54
            cmp s_BT,y                      ; 735a d94b6d
            bne _CI4                        ; 735d d006
            lda #$ff                        ; 735f a9ff
            sta s_BU,x                      ; 7361 9d616d
            rts                             ; 7364 60
_CI4        dey                             ; 7365 88
            bpl _CI3                        ; 7366 10d7
_CI5        rts                             ; 7368 60
s_CJ        ldy #$00                        ; 7369 a000
            lda $062b                       ; 736b ad2b06
            beq _CJ4                        ; 736e f043
            cmp #$7f                        ; 7370 c97f
            bne _CJ1                        ; 7372 d004
            ldy #$09                        ; 7374 a009
            bne _CJ4                        ; 7376 d03b
_CJ1        iny                             ; 7378 c8
            cmp #$07                        ; 7379 c907
            bcc _CJ4                        ; 737b 9036
            iny                             ; 737d c8
            cmp #$4b                        ; 737e c94b
            bcc _CJ4                        ; 7380 9031
            iny                             ; 7382 c8
            cmp #$4f                        ; 7383 c94f
            bcc _CJ4                        ; 7385 902c
            iny                             ; 7387 c8
            cmp #$69                        ; 7388 c969
            bcc _CJ4                        ; 738a 9027
            iny                             ; 738c c8
            cmp #$8f                        ; 738d c98f
            bcc _CJ4                        ; 738f 9022
            iny                             ; 7391 c8
            cmp #$a4                        ; 7392 c9a4
            bcc _CJ4                        ; 7394 901d
            ldx $ca                         ; 7396 a6ca
            cpx #$0e                        ; 7398 e00e
            bcc _CJ2                        ; 739a 9004
            cmp #$a9                        ; 739c c9a9
            bcc _CJ4                        ; 739e 9013
_CJ2        iny                             ; 73a0 c8
            cmp #$ba                        ; 73a1 c9ba
            bcc _CJ4                        ; 73a3 900e
            cpx #$0e                        ; 73a5 e00e
            bcc _CJ3                        ; 73a7 9004
            cmp #$bb                        ; 73a9 c9bb
            bcc _CJ4                        ; 73ab 9006
_CJ3        iny                             ; 73ad c8
            cmp #$bd                        ; 73ae c9bd
            bcc _CJ4                        ; 73b0 9001
            iny                             ; 73b2 c8
_CJ4        sty $cd                         ; 73b3 84cd
            rts                             ; 73b5 60
s_CK        !byte $00,$64,$00,$00,$00,$22,$01,$30,$02                               ; 73b6 .d...".0.
s_CL        !byte $e0,$00,$00,$33,$78,$d6,$10,$27,$40,$00,$01,$0f,$06,$29,$00,$01   ; 73bf ...3x..'@....)..
s_CM        !byte $58,$dc,$2f,$00,$6a,$0c,$94,$46,$b0                               ; 73cf X./.j..F.
s_CN        !byte $14,$0a,$0a,$0a                                                   ; 73d8 ....
s_CO        !byte $14,$21,$14,$06                                                   ; 73dc .!..
s_CP        !byte $1c,$24,$00,$0f                                                   ; 73e0 .$..
s_CQ        asl                             ; 73e4 0a
            asl                             ; 73e5 0a
            asl                             ; 73e6 0a
            asl                             ; 73e7 0a
            asl                             ; 73e8 0a
            tax                             ; 73e9 aa
            ldy #$69                        ; 73ea a069
_CQ1        lda s_AT,x                      ; 73ec bd085d
            sec                             ; 73ef 38
            sbc #$20                        ; 73f0 e920
            sta s_BJ,y                      ; 73f2 995064
            iny                             ; 73f5 c8
            inx                             ; 73f6 e8
            txa                             ; 73f7 8a
            and #$1f                        ; 73f8 291f
            bne _CQ1                        ; 73fa d0f0
            rts                             ; 73fc 60
            !byte $00,$00,$00                                                       ; 73fd ...
vbi         lda #$ff                        ; 7400 a9ff
            nop                             ; 7402 ea
            bne _vbi1                       ; 7403 d00f
            ldy #$3e                        ; 7405 a03e
            ldx #$e9                        ; 7407 a2e9
            lda #$07                        ; 7409 a907
            jsr $e45c                       ; 740b 205ce4
            pla                             ; 740e 68
            pla                             ; 740f 68
            pla                             ; 7410 68
            jmp s_CE                        ; 7411 4c1072
_vbi1       lda $068f                       ; 7414 ad8f06
            beq _vbi4                       ; 7417 f02d
            lda $d010                       ; 7419 ad10d0
            beq _vbi4                       ; 741c f028
            lda #$08                        ; 741e a908
            sta $d01f                       ; 7420 8d1fd0
            lda $d01f                       ; 7423 ad1fd0
            and #$04                        ; 7426 2904
            bne _vbi4                       ; 7428 d01c
            sta $068f                       ; 742a 8d8f06
            lda #$30                        ; 742d a930
            sta s_DK                        ; 742f 8d7a7b
            ldx #$36                        ; 7432 a236
_vbi2       lda s_AI,x                      ; 7434 bd3e55
            sta $bb                         ; 7437 85bb
            lsr                             ; 7439 4a
            adc $bb                         ; 743a 65bb
            bcc _vbi3                       ; 743c 9002
            lda #$ff                        ; 743e a9ff
_vbi3       sta s_AI,x                      ; 7440 9d3e55
            dex                             ; 7443 ca
            bne _vbi2                       ; 7444 d0ee
_vbi4       lda $d010                       ; 7446 ad10d0
            ora $060f                       ; 7449 0d0f06
            beq _vbi7                       ; 744c f03b
            lda $060e                       ; 744e ad0e06
            bne _vbi5                       ; 7451 d003
            jmp s_CX                        ; 7453 4ccf77
_vbi5       lda #$58                        ; 7456 a958
            sta $02c0                       ; 7458 8dc002
            lda #$00                        ; 745b a900
            sta $060e                       ; 745d 8d0e06
            sta $0625                       ; 7460 8d2506
            sta $d201                       ; 7463 8d01d2
            ldx #$52                        ; 7466 a252
_vbi6       sta s_BK,x                      ; 7468 9d5864
            dex                             ; 746b ca
            bpl _vbi6                       ; 746c 10fa
            lda #$08                        ; 746e a908
            sta $0612                       ; 7470 8d1206
            clc                             ; 7473 18
            adc $14                         ; 7474 6514
            sta $0613                       ; 7476 8d1306
            jsr s_DD                        ; 7479 20ef79
            lda #$00                        ; 747c a900
            sta $b4                         ; 747e 85b4
            jsr s_DE                        ; 7480 20357a
            jsr s_DF                        ; 7483 204a7a
            jmp s_CY                        ; 7486 4c6f79
_vbi7       sta $4d                         ; 7489 854d
            lda $0278                       ; 748b ad7802
            and #$0f                        ; 748e 290f
            eor #$0f                        ; 7490 490f
            beq _vbi8                       ; 7492 f003
            jmp s_CU                        ; 7494 4cda76
_vbi8       sta $0622                       ; 7497 8d2206
            sta $d201                       ; 749a 8d01d2
            sta $0626                       ; 749d 8d2606
            lda $060e                       ; 74a0 ad0e06
            bne _vbi9                       ; 74a3 d003
            jmp s_CS                        ; 74a5 4caa75
_vbi9       jsr s_DH                        ; 74a8 205e7a
            lda $0627                       ; 74ab ad2706
            beq _vbi10                      ; 74ae f003
            jmp s_CY                        ; 74b0 4c6f79
_vbi10      lda $02fc                       ; 74b3 adfc02
            cmp #$21                        ; 74b6 c921
            bne _vbi11                      ; 74b8 d02b
            ldx $b4                         ; 74ba a6b4
            cpx #$37                        ; 74bc e037
            bcs _vbi11                      ; 74be b025
            lda #$00                        ; 74c0 a900
            sta $02fc                       ; 74c2 8dfc02
            sta s_AV,x                      ; 74c5 9d755d
            sta $061f                       ; 74c8 8d1f06
            sta $061a                       ; 74cb 8d1a06
            lda #$01                        ; 74ce a901
            sta $061b                       ; 74d0 8d1b06
            jsr s_DE                        ; 74d3 20357a
            jsr s_DF                        ; 74d6 204a7a
            lda $0616                       ; 74d9 ad1606
            sta $0618                       ; 74dc 8d1806
            lda $0617                       ; 74df ad1706
            sta $0619                       ; 74e2 8d1906
_vbi11      lda $14                         ; 74e5 a514
            and #$03                        ; 74e7 2903
            beq _vbi12                      ; 74e9 f003
            jmp s_CY                        ; 74eb 4c6f79
_vbi12      ldy $061f                       ; 74ee ac1f06
            bne _vbi13                      ; 74f1 d003
            jmp s_CR                        ; 74f3 4c6f75
_vbi13      jsr s_DE                        ; 74f6 20357a
            lda $061b                       ; 74f9 ad1b06
            ldx #$00                        ; 74fc a200
            cmp #$05                        ; 74fe c905
            bcc _vbi14                      ; 7500 9001
            inx                             ; 7502 e8
_vbi14      and #$03                        ; 7503 2903
            tay                             ; 7505 a8
            lda s_DI,y                      ; 7506 b9747a
            and $061c,x                     ; 7509 3d1c06
            dey                             ; 750c 88
            bpl _vbi15                      ; 750d 1002
            ldy #$03                        ; 750f a003
_vbi15      beq _vbi17                      ; 7511 f005
_vbi16      lsr                             ; 7513 4a
            lsr                             ; 7514 4a
            dey                             ; 7515 88
            bne _vbi16                      ; 7516 d0fb
_vbi17      sta $061e                       ; 7518 8d1e06
            asl                             ; 751b 0a
            asl                             ; 751c 0a
            asl                             ; 751d 0a
            tax                             ; 751e aa
            ldy $0619                       ; 751f ac1906
_vbi18      lda s_BI,x                      ; 7522 bd3164
            cpy #$80                        ; 7525 c080
            bcs _vbi19                      ; 7527 b003
            sta s_AE,y                      ; 7529 998052
_vbi19      inx                             ; 752c e8
            iny                             ; 752d c8
            txa                             ; 752e 8a
            and #$07                        ; 752f 2907
            bne _vbi18                      ; 7531 d0ef
            lda $0618                       ; 7533 ad1806
            sta $d001                       ; 7536 8d01d0
            ldx $061e                       ; 7539 ae1e06
            lda $0618                       ; 753c ad1806
            clc                             ; 753f 18
            adc s_BD,x                      ; 7540 7de25f
            sta $0618                       ; 7543 8d1806
            lda $0619                       ; 7546 ad1906
            clc                             ; 7549 18
            adc s_BE,x                      ; 754a 7de65f
            sta $0619                       ; 754d 8d1906
            inc $061a                       ; 7550 ee1a06
            lda $061a                       ; 7553 ad1a06
            and #$07                        ; 7556 2907
            bne _CR3                        ; 7558 d04d
            sta $061a                       ; 755a 8d1a06
            inc $061b                       ; 755d ee1b06
            lda $061b                       ; 7560 ad1b06
            cmp $061f                       ; 7563 cd1f06
            bcc _CR3                        ; 7566 903f
            beq _CR3                        ; 7568 f03d
            lda #$01                        ; 756a a901
            sta $061b                       ; 756c 8d1b06
s_CR        ldy $0619                       ; 756f ac1906
            sty $0621                       ; 7572 8c2106
            lda #$ff                        ; 7575 a9ff
            sta $0625                       ; 7577 8d2506
            ldx #$00                        ; 757a a200
_CR1        lda s_BG,x                      ; 757c bdf75f
            cpy #$80                        ; 757f c080
            bcs _CR2                        ; 7581 b003
            sta s_AF,y                      ; 7583 990053
_CR2        iny                             ; 7586 c8
            inx                             ; 7587 e8
            cpx #$08                        ; 7588 e008
            bne _CR1                        ; 758a d0f0
            lda $0618                       ; 758c ad1806
            sec                             ; 758f 38
            sbc #$01                        ; 7590 e901
            sta $0620                       ; 7592 8d2006
            sta $d002                       ; 7595 8d02d0
            jsr s_DE                        ; 7598 20357a
            lda $0616                       ; 759b ad1606
            sta $0618                       ; 759e 8d1806
            lda $0617                       ; 75a1 ad1706
            sta $0619                       ; 75a4 8d1906
_CR3        jmp s_CY                        ; 75a7 4c6f79
s_CS        lda #$ff                        ; 75aa a9ff
            sta $060e                       ; 75ac 8d0e06
            lda $b5                         ; 75af a5b5
            clc                             ; 75b1 18
            adc #$06                        ; 75b2 6906
            sta $0628                       ; 75b4 8d2806
            lda $b6                         ; 75b7 a5b6
            adc #$00                        ; 75b9 6900
            sta $0629                       ; 75bb 8d2906
            lda $b7                         ; 75be a5b7
            clc                             ; 75c0 18
            adc #$09                        ; 75c1 6909
            sta $0610                       ; 75c3 8d1006
            lda $b8                         ; 75c6 a5b8
            adc #$00                        ; 75c8 6900
            sta $0611                       ; 75ca 8d1106
            lda $0629                       ; 75cd ad2906
            lsr                             ; 75d0 4a
            lda $0628                       ; 75d1 ad2806
            ror                             ; 75d4 6a
            lsr                             ; 75d5 4a
            lsr                             ; 75d6 4a
            sta $be                         ; 75d7 85be
            lda $0611                       ; 75d9 ad1106
            lsr                             ; 75dc 4a
            tax                             ; 75dd aa
            lda $0610                       ; 75de ad1006
            ror                             ; 75e1 6a
            tay                             ; 75e2 a8
            txa                             ; 75e3 8a
            lsr                             ; 75e4 4a
            tya                             ; 75e5 98
            ror                             ; 75e6 6a
            lsr                             ; 75e7 4a
            lsr                             ; 75e8 4a
            sta $bf                         ; 75e9 85bf
            ldx #$9e                        ; 75eb a29e
_CS1        cmp s_AH,x                      ; 75ed dd9f54
            beq _CT1                        ; 75f0 f00c
s_CT        dex                             ; 75f2 ca
            bne _CS1                        ; 75f3 d0f8
            stx $b4                         ; 75f5 86b4
            dex                             ; 75f7 ca
            stx $0627                       ; 75f8 8e2706
            jmp s_CY                        ; 75fb 4c6f79
_CT1        lda $be                         ; 75fe a5be
            cmp units,x                     ; 7600 dd0054
            bne _CT2                        ; 7603 d00b
            lda s_AL,x                      ; 7605 bd1b57
            bmi _CT2                        ; 7608 3006
            cmp $c9                         ; 760a c5c9
            bcc _CT3                        ; 760c 9007
            beq _CT3                        ; 760e f005
_CT2        lda $bf                         ; 7610 a5bf
            jmp s_CT                        ; 7612 4cf275
_CT3        lda #$00                        ; 7615 a900
            sta $0627                       ; 7617 8d2706
            sta $02fc                       ; 761a 8dfc02
            lda #$5c                        ; 761d a95c
            sta $02c0                       ; 761f 8dc002
            stx $b4                         ; 7622 86b4
            ldy #$0d                        ; 7624 a00d
            lda s_AP,x                      ; 7626 bd6959
            jsr s_DL                        ; 7629 20b27b
            iny                             ; 762c c8
            ldx $b4                         ; 762d a6b4
            lda s_AO,x                      ; 762f bdca58
            sta $bb                         ; 7632 85bb
            and #$f0                        ; 7634 29f0
            lsr                             ; 7636 4a
            jsr _DC3                        ; 7637 20da79
            lda $bb                         ; 763a a5bb
            and #$0f                        ; 763c 290f
            clc                             ; 763e 18
            adc #$08                        ; 763f 6908
            jsr s_DC                        ; 7641 20c079
            lda #$1e                        ; 7644 a91e
            ldx $b4                         ; 7646 a6b4
            cpx #$37                        ; 7648 e037
            bcs _CT4                        ; 764a b002
            lda #$1d                        ; 764c a91d
_CT4        jsr s_DC                        ; 764e 20c079
            ldy #$38                        ; 7651 a038
            lda #$1f                        ; 7653 a91f
            jsr s_DC                        ; 7655 20c079
            dey                             ; 7658 88
            lda #$1a                        ; 7659 a91a
            sta s_BJ,y                      ; 765b 995064
            iny                             ; 765e c8
            iny                             ; 765f c8
            ldx $b4                         ; 7660 a6b4
            lda s_AI,x                      ; 7662 bd3e55
            jsr s_DL                        ; 7665 20b27b
            iny                             ; 7668 c8
            iny                             ; 7669 c8
            lda #$20                        ; 766a a920
            jsr s_DC                        ; 766c 20c079
            lda #$21                        ; 766f a921
            jsr s_DC                        ; 7671 20c079
            dey                             ; 7674 88
            lda #$1a                        ; 7675 a91a
            sta s_BJ,y                      ; 7677 995064
            iny                             ; 767a c8
            iny                             ; 767b c8
            ldx $b4                         ; 767c a6b4
            lda s_AJ,x                      ; 767e bddd55
            jsr s_DL                        ; 7681 20b27b
            jsr s_DD                        ; 7684 20ef79
            lda $b4                         ; 7687 a5b4
            cmp #$37                        ; 7689 c937
            bcc _CT5                        ; 768b 9007
            lda #$ff                        ; 768d a9ff
            sta $0627                       ; 768f 8d2706
            bmi _CT6                        ; 7692 3043
_CT5        lda #$01                        ; 7694 a901
            sta $061b                       ; 7696 8d1b06
            lda #$00                        ; 7699 a900
            sta $061a                       ; 769b 8d1a06
            lda $0628                       ; 769e ad2806
            and #$07                        ; 76a1 2907
            clc                             ; 76a3 18
            adc #$01                        ; 76a4 6901
            clc                             ; 76a6 18
            adc $0604                       ; 76a7 6d0406
            sta $0616                       ; 76aa 8d1606
            sta $0618                       ; 76ad 8d1806
            lda $0610                       ; 76b0 ad1006
            and #$0f                        ; 76b3 290f
            lsr                             ; 76b5 4a
            sec                             ; 76b6 38
            sbc #$01                        ; 76b7 e901
            clc                             ; 76b9 18
            adc $0603                       ; 76ba 6d0306
            sta $0617                       ; 76bd 8d1706
            sta $0619                       ; 76c0 8d1906
            ldx $b4                         ; 76c3 a6b4
            lda s_AV,x                      ; 76c5 bd755d
            sta $061f                       ; 76c8 8d1f06
            lda s_AW,x                      ; 76cb bd145e
            sta $061c                       ; 76ce 8d1c06
            lda s_AX,x                      ; 76d1 bdb35e
            sta $061d                       ; 76d4 8d1d06
_CT6        jmp s_CY                        ; 76d7 4c6f79
s_CU        lda $0626                       ; 76da ad2606
            bne _CT6                        ; 76dd d0f8
            ldx $b4                         ; 76df a6b4
            cpx #$37                        ; 76e1 e037
            bcc _CU1                        ; 76e3 9005
            ldx #$00                        ; 76e5 a200
            jmp s_CW                        ; 76e7 4cac77
_CU1        lda s_AV,x                      ; 76ea bd755d
            cmp #$08                        ; 76ed c908
            bcc _CU2                        ; 76ef 9005
            ldx #$20                        ; 76f1 a220
            jmp s_CW                        ; 76f3 4cac77
_CU2        lda $0625                       ; 76f6 ad2506
            bne _CU3                        ; 76f9 d005
            ldx #$40                        ; 76fb a240
            jmp s_CW                        ; 76fd 4cac77
_CU3        inc $0622                       ; 7700 ee2206
            lda $0622                       ; 7703 ad2206
            cmp #$10                        ; 7706 c910
            bcs _CU4                        ; 7708 b002
            bcc _CT6                        ; 770a 90cb
_CU4        lda #$00                        ; 770c a900
            sta $0622                       ; 770e 8d2206
            ldx $0278                       ; 7711 ae7802
            lda s_BN,x                      ; 7714 bdb16c
            bpl _CU5                        ; 7717 1005
            ldx #$60                        ; 7719 a260
            jmp s_CW                        ; 771b 4cac77
_CU5        tay                             ; 771e a8
            sta $0623                       ; 771f 8d2306
            lda s_AY,y                      ; 7722 b9525f
            sta $d200                       ; 7725 8d00d2
            lda #$a8                        ; 7728 a9a8
            sta $d201                       ; 772a 8d01d2
            lda #$ff                        ; 772d a9ff
            sta $0626                       ; 772f 8d2606
            ldx $b4                         ; 7732 a6b4
            inc s_AV,x                      ; 7734 fe755d
            lda s_AV,x                      ; 7737 bd755d
            sta $061f                       ; 773a 8d1f06
            sec                             ; 773d 38
            sbc #$01                        ; 773e e901
            and #$03                        ; 7740 2903
            tay                             ; 7742 a8
            sty $bb                         ; 7743 84bb
            lda s_AV,x                      ; 7745 bd755d
            sec                             ; 7748 38
            sbc #$01                        ; 7749 e901
            lsr                             ; 774b 4a
            lsr                             ; 774c 4a
            tax                             ; 774d aa
            lda $0623                       ; 774e ad2306
s_CV        dey                             ; 7751 88
            bmi _CV1                        ; 7752 3005
            asl                             ; 7754 0a
            asl                             ; 7755 0a
            jmp s_CV                        ; 7756 4c5177
_CV1        ldy $bb                         ; 7759 a4bb
            eor $061c,x                     ; 775b 5d1c06
            and s_BC,y                      ; 775e 39de5f
            eor $061c,x                     ; 7761 5d1c06
            sta $061c,x                     ; 7764 9d1c06
            lda $061c                       ; 7767 ad1c06
            ldx $b4                         ; 776a a6b4
            sta s_AW,x                      ; 776c 9d145e
            lda $061d                       ; 776f ad1d06
            sta s_AX,x                      ; 7772 9db35e
            jsr s_DF                        ; 7775 204a7a
            ldx $0623                       ; 7778 ae2306
            lda $0620                       ; 777b ad2006
            clc                             ; 777e 18
            adc s_BA,x                      ; 777f 7dd65f
            sta $0620                       ; 7782 8d2006
            lda $0621                       ; 7785 ad2106
            clc                             ; 7788 18
            adc s_BB,x                      ; 7789 7dda5f
            sta $0621                       ; 778c 8d2106
            lda $0620                       ; 778f ad2006
            sta $d002                       ; 7792 8d02d0
            ldy $0621                       ; 7795 ac2106
            ldx #$00                        ; 7798 a200
_CV2        lda s_BG,x                      ; 779a bdf75f
            cpy #$80                        ; 779d c080
            bcs _CV3                        ; 779f b003
            sta s_AF,y                      ; 77a1 990053
_CV3        iny                             ; 77a4 c8
            inx                             ; 77a5 e8
            cpx #$08                        ; 77a6 e008
            bne _CV2                        ; 77a8 d0f0
            beq _CX1                        ; 77aa f043
s_CW        ldy #$69                        ; 77ac a069
_CW1        lda s_AZ,x                      ; 77ae bd565f
            sec                             ; 77b1 38
            sbc #$20                        ; 77b2 e920
            sta s_BJ,y                      ; 77b4 995064
            iny                             ; 77b7 c8
            inx                             ; 77b8 e8
            txa                             ; 77b9 8a
            and #$1f                        ; 77ba 291f
            bne _CW1                        ; 77bc d0f0
            lda #$68                        ; 77be a968
            sta $d201                       ; 77c0 8d01d2
            lda #$50                        ; 77c3 a950
            sta $d200                       ; 77c5 8d00d2
            lda #$ff                        ; 77c8 a9ff
            sta $0624                       ; 77ca 8d2406
            bmi _CX1                        ; 77cd 3020
s_CX        sta $0622                       ; 77cf 8d2206
            lda $0278                       ; 77d2 ad7802
            and #$0f                        ; 77d5 290f
            eor #$0f                        ; 77d7 490f
            bne _CX2                        ; 77d9 d017
            sta $d201                       ; 77db 8d01d2
            sta $0626                       ; 77de 8d2606
            lda #$08                        ; 77e1 a908
            sta $0612                       ; 77e3 8d1206
            clc                             ; 77e6 18
            adc $14                         ; 77e7 6514
            sta $0613                       ; 77e9 8d1306
            jsr s_DH                        ; 77ec 205e7a
_CX1        jmp s_CY                        ; 77ef 4c6f79
_CX2        lda #$00                        ; 77f2 a900
            sta $4d                         ; 77f4 854d
            lda $0613                       ; 77f6 ad1306
            cmp $14                         ; 77f9 c514
            bne _CX1                        ; 77fb d0f2
            lda $0612                       ; 77fd ad1206
            cmp #$01                        ; 7800 c901
            beq _CX3                        ; 7802 f006
            sec                             ; 7804 38
            sbc #$01                        ; 7805 e901
            sta $0612                       ; 7807 8d1206
_CX3        clc                             ; 780a 18
            adc $14                         ; 780b 6514
            sta $0613                       ; 780d 8d1306
            lda #$00                        ; 7810 a900
            sta $b9                         ; 7812 85b9
            sta $ba                         ; 7814 85ba
            lda $0278                       ; 7816 ad7802
            pha                             ; 7819 48
            and #$08                        ; 781a 2908
            bne _CX7                        ; 781c d03a
            lda $b5                         ; 781e a5b5
            bne _CX4                        ; 7820 d004
            ldx $b6                         ; 7822 a6b6
            beq _CX11                       ; 7824 f071
_CX4        sec                             ; 7826 38
            sbc #$01                        ; 7827 e901
            sta $b5                         ; 7829 85b5
            bcs _CX5                        ; 782b b002
            dec $b6                         ; 782d c6b6
_CX5        lda $0604                       ; 782f ad0406
            cmp #$ba                        ; 7832 c9ba
            beq _CX6                        ; 7834 f00b
            clc                             ; 7836 18
            adc #$01                        ; 7837 6901
            sta $0604                       ; 7839 8d0406
            sta $d000                       ; 783c 8d00d0
            bne _CX11                       ; 783f d056
_CX6        lda $0600                       ; 7841 ad0006
            sec                             ; 7844 38
            sbc #$01                        ; 7845 e901
            sta $0600                       ; 7847 8d0006
            and #$07                        ; 784a 2907
            sta $d404                       ; 784c 8d04d4
            cmp #$07                        ; 784f c907
            bne _CX11                       ; 7851 d044
            inc $b9                         ; 7853 e6b9
            clv                             ; 7855 b8
            bvc _CX11                       ; 7856 503f
_CX7        pla                             ; 7858 68
            pha                             ; 7859 48
            and #$04                        ; 785a 2904
            bne _CX11                       ; 785c d039
            lda $b5                         ; 785e a5b5
            cmp #$64                        ; 7860 c964
            bne _CX8                        ; 7862 d004
            ldx $b6                         ; 7864 a6b6
            bne _CX11                       ; 7866 d02f
_CX8        clc                             ; 7868 18
            adc #$01                        ; 7869 6901
            sta $b5                         ; 786b 85b5
            bcc _CX9                        ; 786d 9002
            inc $b6                         ; 786f e6b6
_CX9        lda $0604                       ; 7871 ad0406
            cmp #$36                        ; 7874 c936
            beq _CX10                       ; 7876 f00b
            sec                             ; 7878 38
            sbc #$01                        ; 7879 e901
            sta $0604                       ; 787b 8d0406
            sta $d000                       ; 787e 8d00d0
            bne _CX11                       ; 7881 d014
_CX10       lda $0600                       ; 7883 ad0006
            clc                             ; 7886 18
            adc #$01                        ; 7887 6901
            sta $0600                       ; 7889 8d0006
            and #$07                        ; 788c 2907
            sta $d404                       ; 788e 8d04d4
            bne _CX11                       ; 7891 d004
            dec $b9                         ; 7893 c6b9
            dec $ba                         ; 7895 c6ba
_CX11       pla                             ; 7897 68
            lsr                             ; 7898 4a
            pha                             ; 7899 48
            bcs _CX18                       ; 789a b05a
            lda $b7                         ; 789c a5b7
            cmp #$5e                        ; 789e c95e
            bne _CX12                       ; 78a0 d006
            ldx $b8                         ; 78a2 a6b8
            cpx #$02                        ; 78a4 e002
            beq _CX18                       ; 78a6 f04e
_CX12       inc $b7                         ; 78a8 e6b7
            bne _CX13                       ; 78aa d002
            inc $b8                         ; 78ac e6b8
_CX13       ldx $0603                       ; 78ae ae0306
            cpx #$1b                        ; 78b1 e01b
            beq _CX16                       ; 78b3 f01d
            inc $b7                         ; 78b5 e6b7
            bne _CX14                       ; 78b7 d002
            inc $b8                         ; 78b9 e6b8
_CX14       dex                             ; 78bb ca
            stx $0603                       ; 78bc 8e0306
            txa                             ; 78bf 8a
            clc                             ; 78c0 18
            adc #$12                        ; 78c1 6912
            sta $bb                         ; 78c3 85bb
_CX15       lda s_AD,x                      ; 78c5 bd0052
            sta s_AC,x                      ; 78c8 9dff51
            inx                             ; 78cb e8
            cpx $bb                         ; 78cc e4bb
            bne _CX15                       ; 78ce d0f5
            beq _CX18                       ; 78d0 f024
_CX16       lda $0601                       ; 78d2 ad0106
            sec                             ; 78d5 38
            sbc #$01                        ; 78d6 e901
            bcs _CX17                       ; 78d8 b003
            dec $0602                       ; 78da ce0206
_CX17       sta $0601                       ; 78dd 8d0106
            and #$0f                        ; 78e0 290f
            sta $d405                       ; 78e2 8d05d4
            cmp #$0f                        ; 78e5 c90f
            bne _CX18                       ; 78e7 d00d
            lda $b9                         ; 78e9 a5b9
            sec                             ; 78eb 38
            sbc #$30                        ; 78ec e930
            sta $b9                         ; 78ee 85b9
            lda $ba                         ; 78f0 a5ba
            sbc #$00                        ; 78f2 e900
            sta $ba                         ; 78f4 85ba
_CX18       pla                             ; 78f6 68
            lsr                             ; 78f7 4a
            bcs _CX25                       ; 78f8 b05f
            lda $b7                         ; 78fa a5b7
            cmp #$02                        ; 78fc c902
            bne _CX19                       ; 78fe d004
            ldx $b8                         ; 7900 a6b8
            beq _CX25                       ; 7902 f055
_CX19       sec                             ; 7904 38
            sbc #$01                        ; 7905 e901
            sta $b7                         ; 7907 85b7
            bcs _CX20                       ; 7909 b002
            dec $b8                         ; 790b c6b8
_CX20       ldx $0603                       ; 790d ae0306
            cpx #$4e                        ; 7910 e04e
            beq _CX23                       ; 7912 f023
            sec                             ; 7914 38
            sbc #$01                        ; 7915 e901
            sta $b7                         ; 7917 85b7
            bcs _CX21                       ; 7919 b002
            dec $b8                         ; 791b c6b8
_CX21       inx                             ; 791d e8
            stx $0603                       ; 791e 8e0306
            txa                             ; 7921 8a
            clc                             ; 7922 18
            adc #$12                        ; 7923 6912
            dex                             ; 7925 ca
            dex                             ; 7926 ca
            stx $bb                         ; 7927 86bb
            tax                             ; 7929 aa
_CX22       lda s_AC,x                      ; 792a bdff51
            sta s_AD,x                      ; 792d 9d0052
            dex                             ; 7930 ca
            cpx $bb                         ; 7931 e4bb
            bne _CX22                       ; 7933 d0f5
            beq _CX25                       ; 7935 f022
_CX23       lda $0601                       ; 7937 ad0106
            clc                             ; 793a 18
            adc #$01                        ; 793b 6901
            sta $0601                       ; 793d 8d0106
            bcc _CX24                       ; 7940 9003
            inc $0602                       ; 7942 ee0206
_CX24       and #$0f                        ; 7945 290f
            sta $d405                       ; 7947 8d05d4
            bne _CX25                       ; 794a d00d
            lda $b9                         ; 794c a5b9
            clc                             ; 794e 18
            adc #$30                        ; 794f 6930
            sta $b9                         ; 7951 85b9
            lda $ba                         ; 7953 a5ba
            adc #$00                        ; 7955 6900
            sta $ba                         ; 7957 85ba
_CX25       ldy #$09                        ; 7959 a009
_CX26       lda ($b0),y                     ; 795b b1b0
            clc                             ; 795d 18
            adc $b9                         ; 795e 65b9
            sta ($b0),y                     ; 7960 91b0
            iny                             ; 7962 c8
            lda ($b0),y                     ; 7963 b1b0
            adc $ba                         ; 7965 65ba
            sta ($b0),y                     ; 7967 91b0
            iny                             ; 7969 c8
            iny                             ; 796a c8
            cpy #$27                        ; 796b c027
            bne _CX26                       ; 796d d0ec
s_CY        lda $0602                       ; 796f ad0206
            lsr                             ; 7972 4a
            lda $0601                       ; 7973 ad0106
            ror                             ; 7976 6a
            lsr                             ; 7977 4a
            lsr                             ; 7978 4a
            lsr                             ; 7979 4a
            cmp #$11                        ; 797a c911
            bcs _CY1                        ; 797c b004
            lda #$ff                        ; 797e a9ff
            bmi _CY3                        ; 7980 3010
_CY1        cmp #$1a                        ; 7982 c91a
            bcc _CY2                        ; 7984 9004
            lda #$02                        ; 7986 a902
            bpl _CY3                        ; 7988 1008
_CY2        sta $bb                         ; 798a 85bb
            inx                             ; 798c e8
            lda #$1d                        ; 798d a91d
            sec                             ; 798f 38
            sbc $bb                         ; 7990 e5bb
_CY3        sta $bc                         ; 7992 85bc
            lda #$00                        ; 7994 a900
            sta $bd                         ; 7996 85bd
            jmp $e462                       ; 7998 4c62e4
            !byte $e4                                                               ; 799b .
s_CZ        !byte $00,$00,$00,$00,$03,$03,$03,$03,$02,$02,$02,$02,$01,$01,$01,$00   ; 799c ................
s_DA        !byte $00,$00,$03,$03,$02,$02,$01,$00                                   ; 79ac ........
s_DB        !byte $02,$03,$03,$02,$02,$02,$01,$01,$02,$00,$00,$00                   ; 79b4 ............
s_DC        asl                             ; 79c0 0a
            asl                             ; 79c1 0a
            asl                             ; 79c2 0a
            bcc _DC3                        ; 79c3 9015
            tax                             ; 79c5 aa
_DC1        lda s_AN,x                      ; 79c6 bdba58
            sec                             ; 79c9 38
            sbc #$20                        ; 79ca e920
            beq _DC2                        ; 79cc f00a
            sta s_BJ,y                      ; 79ce 995064
            iny                             ; 79d1 c8
            inx                             ; 79d2 e8
            txa                             ; 79d3 8a
            and #$07                        ; 79d4 2907
            bne _DC1                        ; 79d6 d0ee
_DC2        iny                             ; 79d8 c8
            rts                             ; 79d9 60
_DC3        tax                             ; 79da aa
_DC4        lda s_AM,x                      ; 79db bdba57
            sec                             ; 79de 38
            sbc #$20                        ; 79df e920
            beq _DC5                        ; 79e1 f00a
            sta s_BJ,y                      ; 79e3 995064
            iny                             ; 79e6 c8
            inx                             ; 79e7 e8
            txa                             ; 79e8 8a
            and #$07                        ; 79e9 2907
            bne _DC4                        ; 79eb d0ee
_DC5        iny                             ; 79ed c8
            rts                             ; 79ee 60
s_DD        lda #$00                        ; 79ef a900
            sta $b3                         ; 79f1 85b3
            lda #$27                        ; 79f3 a927
            sec                             ; 79f5 38
            sbc $bf                         ; 79f6 e5bf
            asl                             ; 79f8 0a
            rol $b3                         ; 79f9 26b3
            asl                             ; 79fb 0a
            rol $b3                         ; 79fc 26b3
            asl                             ; 79fe 0a
            rol $b3                         ; 79ff 26b3
            asl                             ; 7a01 0a
            rol $b3                         ; 7a02 26b3
            sta $0614                       ; 7a04 8d1406
            ldx $b3                         ; 7a07 a6b3
            stx $0615                       ; 7a09 8e1506
            asl                             ; 7a0c 0a
            rol $b3                         ; 7a0d 26b3
            clc                             ; 7a0f 18
            adc $0614                       ; 7a10 6d1406
            sta $b2                         ; 7a13 85b2
            lda $b3                         ; 7a15 a5b3
            adc $0615                       ; 7a17 6d1506
            adc #$65                        ; 7a1a 6965
            sta $b3                         ; 7a1c 85b3
            lda #$2e                        ; 7a1e a92e
            sec                             ; 7a20 38
            sbc $be                         ; 7a21 e5be
            tay                             ; 7a23 a8
            lda ($b2),y                     ; 7a24 b1b2
            ldx $b4                         ; 7a26 a6b4
            beq _DD1                        ; 7a28 f00a
            pha                             ; 7a2a 48
            lda s_AK,x                      ; 7a2b bd7c56
            sta ($b2),y                     ; 7a2e 91b2
            pla                             ; 7a30 68
            sta s_AK,x                      ; 7a31 9d7c56
_DD1        rts                             ; 7a34 60
s_DE        lda #$00                        ; 7a35 a900
            ldy $0619                       ; 7a37 ac1906
            dey                             ; 7a3a 88
            tax                             ; 7a3b aa
_DE1        cpy #$80                        ; 7a3c c080
            bcs _DE2                        ; 7a3e b003
            sta s_AE,y                      ; 7a40 998052
_DE2        iny                             ; 7a43 c8
            inx                             ; 7a44 e8
            cpx #$0b                        ; 7a45 e00b
            bne _DE1                        ; 7a47 d0f3
            rts                             ; 7a49 60
s_DF        lda #$00                        ; 7a4a a900
            ldy $0621                       ; 7a4c ac2106
            tax                             ; 7a4f aa
_DF1        cpy #$80                        ; 7a50 c080
            bcs _DF2                        ; 7a52 b003
            sta s_AF,y                      ; 7a54 990053
_DF2        iny                             ; 7a57 c8
            inx                             ; 7a58 e8
            cpx #$0a                        ; 7a59 e00a
            bne _DF1                        ; 7a5b d0f3
            rts                             ; 7a5d 60
s_DH        lda $0624                       ; 7a5e ad2406
            bpl _DH2                        ; 7a61 1010
            lda #$00                        ; 7a63 a900
            sta $0624                       ; 7a65 8d2406
            ldy #$86                        ; 7a68 a086
            ldx #$1f                        ; 7a6a a21f
_DH1        sta s_BJ,y                      ; 7a6c 995064
            dey                             ; 7a6f 88
            dex                             ; 7a70 ca
            bpl _DH1                        ; 7a71 10f9
_DH2        rts                             ; 7a73 60
s_DI        !byte $c0,$03,$0c,$30                                                   ; 7a74 ...0
s_DJ        !byte $04,$09,$0e,$13,$18,$03,$08,$0d,$12,$17,$02,$07,$0c,$11,$16,$01   ; 7a78 ................
            !byte $06,$0b,$10,$15,$00,$05,$0a,$0f,$14,$03,$08,$0d,$12,$17,$02,$07   ; 7a88 ................
            !byte $0c,$11,$16,$01,$06,$0b,$10,$15,$00,$05,$0a,$0f,$14,$00,$00,$00   ; 7a98 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 7aa8 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 7ab8 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 7ac8 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 7ad8 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00   ; 7ae8 ................
            !byte $00,$00,$00,$00,$00,$00,$00,$00,$48,$8a,$48,$e6,$bd,$a5,$bd,$c5   ; 7af8 ........H.H.....
            !byte $bc,$d0,$14,$a2,$62,$a9,$28,$45,$4f,$25,$4e,$8d,$0a,$d4,$8e,$09   ; 7b08 ....b.(EO%N.....
            !byte $d4,$8d,$16,$d0,$4c,$ae,$7b,$c9,$0f,$d0,$19,$a9,$3a,$45,$4f,$25   ; 7b18 ....L.{.....:EO%
            !byte $4e,$aa,$a9,$00,$45,$4f,$25,$4e,$8d,$0a,$d4,$8e,$18,$d0,$8d,$17   ; 7b28 N...EO%N........
            !byte $d0,$4c,$ae,$7b,$c9,$01,$d0,$1f,$ad,$05,$06,$45,$4f,$25,$4e,$aa   ; 7b38 .L.{.......EO%N.
            !byte $a9,$1a,$45,$4f,$25,$4e,$8d,$0a,$d4,$8d,$1a,$d0,$8e,$16,$d0,$a9   ; 7b48 ..EO%N..........
            !byte $60,$8d,$09,$d4,$4c,$ae,$7b,$c9,$03,$d0,$10,$ad,$06,$06,$45,$4f   ; 7b58 `...L.{.......EO
            !byte $25,$4e,$8d,$0a,$d4,$8d,$1a,$d0,$4c,$ae,$7b,$c9,$0d,$d0,$14,$a2   ; 7b68 %N......L.{.....
            !byte $e0,$a9                                                           ; 7b78 ..
s_DK        !byte $22,$45,$4f,$25,$4e,$8d,$0a,$d4,$8d,$18,$d0,$8e,$09,$d4,$4c,$ae   ; 7b7a "EO%N.........L.
            !byte $7b,$c9,$0e,$d0,$0f,$a9,$8a,$45,$4f,$25,$4e,$8d,$0a,$d4,$8d,$1a   ; 7b8a {......EO%N.....
            !byte $d0,$4c,$ae,$7b,$c9,$10,$d0,$0c,$a9,$d4,$45,$4f,$25,$4e,$48,$68   ; 7b9a .L.{......EO%NHh
            !byte $ea,$8d,$1a,$d0,$68,$aa,$68,$40                                   ; 7baa ....h.h@
s_DL        tax                             ; 7bb2 aa
            clc                             ; 7bb3 18
            lda s_AQ,x                      ; 7bb4 bd085a
            beq _DL1                        ; 7bb7 f007
            adc #$10                        ; 7bb9 6910
            sta s_BJ,y                      ; 7bbb 995064
            iny                             ; 7bbe c8
            sec                             ; 7bbf 38
_DL1        lda s_AR,x                      ; 7bc0 bd085b
            bcs _DL2                        ; 7bc3 b002
            beq _DL3                        ; 7bc5 f007
_DL2        clc                             ; 7bc7 18
            adc #$10                        ; 7bc8 6910
            sta s_BJ,y                      ; 7bca 995064
            iny                             ; 7bcd c8
_DL3        lda s_AS,x                      ; 7bce bd085c
            clc                             ; 7bd1 18
            adc #$10                        ; 7bd2 6910
            sta s_BJ,y                      ; 7bd4 995064
            iny                             ; 7bd7 c8
            rts                             ; 7bd8 60
s_DM        !byte $00,$01,$02,$03,$04,$09,$0e,$13,$18,$17,$16,$15,$14,$0f,$0a,$05   ; 7bd9 ................
            !byte $06,$07,$08,$0d,$12,$11,$10,$0b                                   ; 7be9 ........
s_DN        !byte $01                                                               ; 7bf1 .
s_DO        !byte $00,$ff,$00,$01                                                   ; 7bf2 ....
s_DP        !byte $01,$01,$01,$01,$01,$01,$02,$02,$01,$00,$00,$e0,$02,$e1,$02,$00   ; 7bf6 ................
            !byte $6e                                                               ; 7c06 n
