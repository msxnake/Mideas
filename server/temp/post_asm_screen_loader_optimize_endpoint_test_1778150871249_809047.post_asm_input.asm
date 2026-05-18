; [[[MIDEAS_ARTIFACT:project_usage.json:BEGIN]]]
; {
;   "scenes": [{"id": "screenmap_1234567890123", "name": "Dead Screen", "index": 0, "resourceCount": 1}],
;   "gameFlowReachability": {"scenes": [{"id": "screenmap_1234567890123", "reachable": false, "reason": "not reached from GameFlow start graph"}]}
; }
; [[[MIDEAS_ARTIFACT:project_usage.json:END]]]

boot_entry:
    ret

load_screen_dead_screen_234567890123_far:
    call load_screen_dead_screen_234567890123
    ret

; @mideas:block id=runtime.screens.load_screen_dead_screen_234567890123.loader kind=routine owner=screens roots=load_screen_dead_screen_234567890123
load_screen_dead_screen_234567890123:
    ret
; @mideas:endblock id=runtime.screens.load_screen_dead_screen_234567890123.loader