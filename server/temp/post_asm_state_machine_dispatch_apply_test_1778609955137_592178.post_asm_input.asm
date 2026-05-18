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
    DW Condition_KeyPressed ; 4

Action_SetVelocity:
    ret

Condition_KeyPressed:
    ret