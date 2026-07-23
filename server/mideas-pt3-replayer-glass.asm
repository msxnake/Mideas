; Canonical include entry point for the Mideas PT3 replayer.
; Keep this wrapper name unique: Glass resolves a same-directory include before
; -I paths, and old build folders may contain stale PT3-ROM copies.
    include "PT3-ROM-alltables-glass.asm"
