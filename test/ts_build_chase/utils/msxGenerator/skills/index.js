"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.powerStomp = exports.carryAndThrow = exports.teleportAB = exports.carryObject = exports.pushDoor = exports.pushWall = exports.collectorItems = exports.collectorGems = exports.highJump = exports.climb = exports.crouch = exports.parry = exports.spinAttack = exports.glide = exports.chargeAttack = exports.airDash = exports.wallJump = exports.dash = exports.grab = exports.wallBreak = exports.shoot = exports.swim = exports.reverse = exports.magicBall = exports.pickUp = exports.teleport = exports.block = exports.hitAttack = exports.pushBox = exports.slash = exports.doubleJump = exports.itemCollection = exports.airResistance = exports.gravity = exports.jump = exports.getTotalCycles = exports.buildStateMachine = exports.clearRegistry = exports.hasSkill = exports.getOptionalSkills = exports.getCoreSkills = exports.getAllSkills = exports.getSkill = exports.registerSkill = void 0;
const registry_1 = require("./registry");
const index_1 = require("./handlers/index");
for (const skill of [
    index_1.jump, index_1.gravity, index_1.airResistance, index_1.itemCollection,
    index_1.doubleJump, index_1.slash, index_1.pushBox, index_1.hitAttack, index_1.block, index_1.teleport, index_1.pickUp,
    index_1.magicBall, index_1.reverse, index_1.swim, index_1.shoot, index_1.wallBreak, index_1.grab, index_1.dash,
    index_1.wallJump, index_1.airDash, index_1.chargeAttack, index_1.glide, index_1.spinAttack,
    index_1.parry, index_1.crouch, index_1.climb, index_1.highJump, index_1.collectorGems, index_1.collectorItems,
    index_1.pushWall, index_1.pushDoor, index_1.carryObject, index_1.teleportAB, index_1.carryAndThrow,
    index_1.powerStomp,
]) {
    (0, registry_1.registerSkill)(skill);
}
var registry_2 = require("./registry");
Object.defineProperty(exports, "registerSkill", { enumerable: true, get: function () { return registry_2.registerSkill; } });
Object.defineProperty(exports, "getSkill", { enumerable: true, get: function () { return registry_2.getSkill; } });
Object.defineProperty(exports, "getAllSkills", { enumerable: true, get: function () { return registry_2.getAllSkills; } });
Object.defineProperty(exports, "getCoreSkills", { enumerable: true, get: function () { return registry_2.getCoreSkills; } });
Object.defineProperty(exports, "getOptionalSkills", { enumerable: true, get: function () { return registry_2.getOptionalSkills; } });
Object.defineProperty(exports, "hasSkill", { enumerable: true, get: function () { return registry_2.hasSkill; } });
Object.defineProperty(exports, "clearRegistry", { enumerable: true, get: function () { return registry_2.clearRegistry; } });
Object.defineProperty(exports, "buildStateMachine", { enumerable: true, get: function () { return registry_2.buildStateMachine; } });
Object.defineProperty(exports, "getTotalCycles", { enumerable: true, get: function () { return registry_2.getTotalCycles; } });
var index_2 = require("./handlers/index");
Object.defineProperty(exports, "jump", { enumerable: true, get: function () { return index_2.jump; } });
Object.defineProperty(exports, "gravity", { enumerable: true, get: function () { return index_2.gravity; } });
Object.defineProperty(exports, "airResistance", { enumerable: true, get: function () { return index_2.airResistance; } });
Object.defineProperty(exports, "itemCollection", { enumerable: true, get: function () { return index_2.itemCollection; } });
Object.defineProperty(exports, "doubleJump", { enumerable: true, get: function () { return index_2.doubleJump; } });
Object.defineProperty(exports, "slash", { enumerable: true, get: function () { return index_2.slash; } });
Object.defineProperty(exports, "pushBox", { enumerable: true, get: function () { return index_2.pushBox; } });
Object.defineProperty(exports, "hitAttack", { enumerable: true, get: function () { return index_2.hitAttack; } });
Object.defineProperty(exports, "block", { enumerable: true, get: function () { return index_2.block; } });
Object.defineProperty(exports, "teleport", { enumerable: true, get: function () { return index_2.teleport; } });
Object.defineProperty(exports, "pickUp", { enumerable: true, get: function () { return index_2.pickUp; } });
Object.defineProperty(exports, "magicBall", { enumerable: true, get: function () { return index_2.magicBall; } });
Object.defineProperty(exports, "reverse", { enumerable: true, get: function () { return index_2.reverse; } });
Object.defineProperty(exports, "swim", { enumerable: true, get: function () { return index_2.swim; } });
Object.defineProperty(exports, "shoot", { enumerable: true, get: function () { return index_2.shoot; } });
Object.defineProperty(exports, "wallBreak", { enumerable: true, get: function () { return index_2.wallBreak; } });
Object.defineProperty(exports, "grab", { enumerable: true, get: function () { return index_2.grab; } });
Object.defineProperty(exports, "dash", { enumerable: true, get: function () { return index_2.dash; } });
Object.defineProperty(exports, "wallJump", { enumerable: true, get: function () { return index_2.wallJump; } });
Object.defineProperty(exports, "airDash", { enumerable: true, get: function () { return index_2.airDash; } });
Object.defineProperty(exports, "chargeAttack", { enumerable: true, get: function () { return index_2.chargeAttack; } });
Object.defineProperty(exports, "glide", { enumerable: true, get: function () { return index_2.glide; } });
Object.defineProperty(exports, "spinAttack", { enumerable: true, get: function () { return index_2.spinAttack; } });
Object.defineProperty(exports, "parry", { enumerable: true, get: function () { return index_2.parry; } });
Object.defineProperty(exports, "crouch", { enumerable: true, get: function () { return index_2.crouch; } });
Object.defineProperty(exports, "climb", { enumerable: true, get: function () { return index_2.climb; } });
Object.defineProperty(exports, "highJump", { enumerable: true, get: function () { return index_2.highJump; } });
Object.defineProperty(exports, "collectorGems", { enumerable: true, get: function () { return index_2.collectorGems; } });
Object.defineProperty(exports, "collectorItems", { enumerable: true, get: function () { return index_2.collectorItems; } });
Object.defineProperty(exports, "pushWall", { enumerable: true, get: function () { return index_2.pushWall; } });
Object.defineProperty(exports, "pushDoor", { enumerable: true, get: function () { return index_2.pushDoor; } });
Object.defineProperty(exports, "carryObject", { enumerable: true, get: function () { return index_2.carryObject; } });
Object.defineProperty(exports, "teleportAB", { enumerable: true, get: function () { return index_2.teleportAB; } });
Object.defineProperty(exports, "carryAndThrow", { enumerable: true, get: function () { return index_2.carryAndThrow; } });
Object.defineProperty(exports, "powerStomp", { enumerable: true, get: function () { return index_2.powerStomp; } });
