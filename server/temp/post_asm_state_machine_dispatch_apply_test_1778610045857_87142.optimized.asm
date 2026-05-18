; [[[MIDEAS_ARTIFACT:project_usage.json:BEGIN]]]
; {
;   "stateMachineRuntime": {
;     "usedActionIds": [3],
;     "usedConditionIds": []
;   }
; }
; [[[MIDEAS_ARTIFACT:project_usage.json:END]]]

SM_ActionTable:
    DW Action_SetVelocity ; 3

SM_ConditionTable:
    DW 0 ; 4 unused Condition_KeyPressed

Action_SetVelocity:
    ret

