# Smoke test: bitmap-room enemy patrol runtime (test45.json, MegaROM konami).
# RAM: bitmap_enemy_count=#C114, pool stride 12.
# slot0 = #C115 (x,y,dx,dy,minX,maxX,minY,maxY,tick,frame,frames,delay)
# slot1 = #C121
# SAT pattern bytes: slot0 base 68 (+4 left, +8 frame1), slot1 base 84.
set fh [open "test/msx2-enemy-patrol/enemy_smoke.log" w]

proc dump_state {tag} {
    global fh
    set count [debug read memory 0xC114]
    set e0x [debug read memory 0xC115]
    set e0dx [debug read memory 0xC117]
    set e0frame [debug read memory 0xC11E]
    set e1x [debug read memory 0xC121]
    set e1dx [debug read memory 0xC123]
    set e1frame [debug read memory 0xC12A]
    set sat0p [debug read VRAM 0xF612]
    set sat1p [debug read VRAM 0xF616]
    set term [debug read VRAM 0xF618]
    puts $fh "$tag count=$count e0=(x=$e0x dx=$e0dx f=$e0frame satp=$sat0p) e1=(x=$e1x dx=$e1dx f=$e1frame satp=$sat1p) term=$term"
    flush $fh
}

after time 6 {
    keymatrixdown 8 1
    after time 0.6 {
        keymatrixup 8 1
        after time 4 {
            dump_state "t0"
            catch { screenshot -doublesize anim_a.png }
            after time 0.25 {
                dump_state "t1"
                after time 0.25 {
                    dump_state "t2"
                    catch { screenshot -doublesize anim_b.png }
                    after time 0.25 {
                        dump_state "t3"
                        after time 2 {
                            dump_state "t4"
                            catch { screenshot -doublesize anim_c.png }
                            close $fh
                            exit
                        }
                    }
                }
            }
        }
    }
}
