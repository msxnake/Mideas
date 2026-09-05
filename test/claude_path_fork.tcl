# How does a branching node actually SPLIT on hardware?
#
# The straight route branches once per boot, and one branch is one sample. A
# coin that comes up heads once is not a coin. This runs a CIRCUIT that returns
# to the fork every lap and tallies the decisions.
#
# HOW IT COUNTS, and why it does not just watch the node byte:
#   .pth_store is where every fired node writes its chosen exit, so the pool's
#   node byte AT THAT MOMENT is still the node that fired. A hit with that byte
#   equal to the fork's index is one fork DECISION.
#   .pth_take_alt is reached only when a policy chose the second exit, and this
#   route has exactly one branching node, so hits there are that node's "b".
#   "a" is then decisions - alt, which never has to trust a register read.
#
# Addresses come from the .sym of THIS build; the caller passes them in so the
# script cannot drift from the ROM it is measuring.
#
#   MIDEAS_FORK_STORE   .pth_store
#   MIDEAS_FORK_ALT     .pth_take_alt
#   MIDEAS_FORK_INDEX   index of the branching node in the baked route
#   MIDEAS_FORK_SEED    bitmap_enemy_script_seed
#   MIDEAS_FORK_OUT     where to write the report

set OUT   $::env(MIDEAS_FORK_OUT)
set STORE [expr {$::env(MIDEAS_FORK_STORE)}]
set ALT   [expr {$::env(MIDEAS_FORK_ALT)}]
set FORK  [expr {$::env(MIDEAS_FORK_INDEX)}]
set SEED  [expr {$::env(MIDEAS_FORK_SEED)}]

set POOL   0xD0D4
set NODEOFF 30

set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set decisions 0
set alt 0
set stores 0
set seeds {}
set pendingAlt 0

# .pth_take_alt runs BEFORE .pth_store on the same decision, so flag it here and
# let the store below attribute it to the node that actually fired.
debug set_bp $ALT {} {
    set ::pendingAlt 1
}

debug set_bp $STORE {} {
    incr ::stores
    set node [debug read memory [expr {$::POOL + $::NODEOFF}]]
    if {$node == $::FORK} {
        incr ::decisions
        if {$::pendingAlt} { incr ::alt }
        # The seed byte at the moment of the decision: the report should show the
        # sequence the policy actually saw, not the one the model predicts.
        if {[llength $::seeds] < 24} {
            lappend ::seeds [format "%02X:%d" [debug read memory $::SEED] $::pendingAlt]
        }
    }
    set ::pendingAlt 0
}

proc report {tag} {
    set a [expr {$::decisions - $::alt}]
    say "result=$tag"
    say "decisiones=$::decisions  salidaA=$a  salidaB=$::alt  (stores totales=$::stores)"
    if {$::decisions > 0} {
        say [format "reparto A/B = %.0f%% / %.0f%%" \
            [expr {100.0 * $a / $::decisions}] [expr {100.0 * $::alt / $::decisions}]]
    }
    say "semilla:eligioB en las primeras decisiones = $::seeds"
}

# A report written only at the end is a report you lose when the runner's wall
# clock fires first: the first attempt at this left a 0-byte file and no data.
# openMSX counts `after time` in EMULATED seconds, which run behind the wall
# clock once breakpoints are firing, so the two clocks WILL disagree. Reporting
# as it goes means a killed run still answers the question, with a smaller n.
set elapsed 0
proc heartbeat {} {
    incr ::elapsed 10
    seek $::LOG 0 start
    chan truncate $::LOG 0
    report "PARCIAL-${::elapsed}s"
    after time 10.0 heartbeat
}
after time 10.0 heartbeat
after time [expr {[info exists ::env(MIDEAS_FORK_SECONDS)] ? $::env(MIDEAS_FORK_SECONDS) : 55.0}] {
    seek $::LOG 0 start
    chan truncate $::LOG 0
    report COMPLETE
    close $::LOG
    exit
}
