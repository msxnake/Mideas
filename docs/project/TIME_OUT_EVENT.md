# TIME_OUT Event - StateMachine Condition

## 📋 Overview

The **TIME_OUT** event is a StateMachine condition that triggers when the game time reaches 0 (GameTime < 1).

---

## 🎯 Purpose

Use TIME_OUT to handle game time expiration scenarios:
- ⏱️ Level time limits
- ⌛ Countdown timers
- 🎮 Timed challenges
- 🏁 Race countdowns

---

## 📝 Usage in StateMachine

### **Adding TIME_OUT Condition:**

1. Create a transition in StateMachine Editor
2. Select **TIME_OUT** from Condition dropdown
3. No parameters needed - automatically checks GameTime variable

### **Example Transition:**
```
FROM: Playing
TO: GameOver
CONDITION: TIME_OUT
GUARD: (optional) Additional condition
ACTIONS: (optional) Show "Time's Up!" message
```

---

## 🔧 Implementation Details

### **Automatic Behavior:**
- Checks: `GameTime < 1`
- No manual parameters required
- Works with GlobalVariables system

### **Required Variable:**
You must have a **GameTime** variable in your GlobalVariables:

```typescript
{
  name: "GameTime",
  type: "8bit" or "16bit",
  category: "time",
  description: "Remaining game time in seconds"
}
```

---

## 💡 Example Use Cases

### **1. Level Timer (60 seconds)**
```
State: LevelPlay
  Transition to: GameOver
    Condition: TIME_OUT
    Guard: Lives > 0
    Actions:
      - SET_VARIABLE: Result = "TimeOut"
      - PLAY_SOUND: "timeout_alarm"
```

### **2. Bonus Round (30 seconds)**
```
State: BonusRound
  Transition to: MainGame
    Condition: TIME_OUT
    Actions:
      - SET_VARIABLE: BonusScore = CurrentScore
      - PLAY_ANIMATION: "bonus_end"
```

### **3. Countdown to Start (3 seconds)**
```
State: Countdown
  Transition to: Racing
    Condition: TIME_OUT
    Actions:
      - SET_VARIABLE: GameState = "Active"
      - PLAY_SOUND: "race_start"
```

---

## 🎨 UI Display

When TIME_OUT is selected, the editor shows:

```
┌─────────────────────────────────────────┐
│ Condition: TIME_OUT                     │
├─────────────────────────────────────────┤
│ Triggers when game time reaches 0       │
│ (GameTime < 1)                          │
│                                         │
│ ℹ️ Requires GameTime variable to be    │
│    tracked in your game logic           │
└─────────────────────────────────────────┘
```

---

## 🔗 Integration with GlobalVariables

TIME_OUT automatically works with the **GlobalVariables** system:

### **Step 1: Create GameTime Variable**
```typescript
// In GlobalVariables Editor
{
  name: "GameTime",
  asmName: "global_var_game_time",
  type: "8bit",  // 0-255 seconds
  category: "time",
  description: "Remaining game time in seconds",
  values: []  // Free numeric value
}
```

### **Step 2: Initialize GameTime**
```
// In game initialization
SET_VARIABLE: GameTime = 60  // 60 seconds
```

### **Step 3: Decrement GameTime**
```
// In game loop (every second)
DECREMENT_VARIABLE: GameTime -= 1
```

### **Step 4: Handle TIME_OUT**
```
// StateMachine transition
Condition: TIME_OUT
→ Transition to GameOver state
```

---

## 🚀 ASM Generation (Future)

When ASM generation is implemented for StateMachine transitions, TIME_OUT will generate:

```asm
; TIME_OUT check
transition_timeout_check:
    ld a, (global_var_game_time)
    cp 1
    jp c, transition_target_state  ; Jump if GameTime < 1
    ret
```

---

## ⚠️ Important Notes

1. **GameTime Variable Required**: TIME_OUT won't work without a GameTime variable
2. **Manual Decrement**: You must decrement GameTime in your game loop
3. **Frame vs Second**: Consider if GameTime is frames or seconds
4. **Precision**: For 8-bit (0-255), max 255 seconds (~4 minutes)

---

## 🔍 Related Features

- [GlobalVariables System](./GLOBALVARIABLES_ASM_INTEGRATION.md)
- [StateMachine Guards](../components/editors/TransitionGuardEditor.tsx)
- [StateMachine Actions](../components/editors/statemachine/ActionParamsEditor.tsx)

---

## 📊 Comparison with Guards

| Feature | TIME_OUT (Condition) | Guard (GameTime < 1) |
|---------|---------------------|----------------------|
| **Purpose** | Primary trigger | Additional filter |
| **Required** | Yes | Optional |
| **Syntax** | Simple select | Variable + Operator + Value |
| **Use Case** | "When time runs out" | "If time is low AND health > 0" |

**Recommendation**: Use TIME_OUT for clarity when time is the primary trigger.

---

## ✅ Conclusion

TIME_OUT provides a clean, semantic way to handle time expiration in your MSX games. It automatically integrates with GlobalVariables and provides clear intent in your StateMachine logic.
