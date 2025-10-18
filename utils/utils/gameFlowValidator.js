"use strict";
/**
 * GameFlow Validator and Log Generator
 * Validates GameFlow structure and generates control logs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGameFlow = validateGameFlow;
exports.generateGameFlowLog = generateGameFlowLog;
exports.saveGameFlowLog = saveGameFlowLog;
exports.loadGameFlowLog = loadGameFlowLog;
exports.isGameFlowLogUpToDate = isGameFlowLogUpToDate;
exports.validateAndGenerateLog = validateAndGenerateLog;
var crypto = require("crypto");
var fs = require("fs");
var path = require("path");
/**
 * Calculate hash of GameFlow structure to detect changes
 */
function calculateGameFlowHash(gameFlow) {
    var hashData = {
        name: gameFlow.name,
        nodes: gameFlow.nodes.map(function (n) { return ({
            id: n.id,
            type: n.type,
            worldAssetId: n.worldAssetId,
            title: n.title
        }); }),
        connections: gameFlow.connections.map(function (c) { return ({
            from: c.from,
            to: c.to
        }); }),
        startNodeId: gameFlow.startNodeId
    };
    return crypto.createHash('md5')
        .update(JSON.stringify(hashData))
        .digest('hex');
}
/**
 * Validate GameFlow structure
 */
function validateGameFlow(gameFlow, allAssets) {
    var issues = [];
    var timestamp = new Date().toISOString();
    // Step 1: Check for Start node
    var startNodes = gameFlow.nodes.filter(function (n) { return n.type === 'Start'; });
    if (startNodes.length === 0) {
        issues.push({
            type: 'ERROR',
            message: 'No Start node found in GameFlow'
        });
    }
    else if (startNodes.length > 1) {
        issues.push({
            type: 'WARNING',
            message: "Multiple Start nodes found (".concat(startNodes.length, "). Only one should exist.")
        });
    }
    var startNode = startNodes[0];
    // Step 2: Check Start node has outgoing connections
    if (startNode) {
        var startConnections = gameFlow.connections.filter(function (c) { var _a; return ((_a = c.from) === null || _a === void 0 ? void 0 : _a.nodeId) === startNode.id; });
        if (startConnections.length === 0) {
            issues.push({
                type: 'ERROR',
                message: 'Start node has no outgoing connections',
                nodeId: startNode.id
            });
        }
    }
    // Step 3: Check for invalid connections (pointing to non-existent nodes)
    var nodeIds = new Set(gameFlow.nodes.map(function (n) { return n.id; }));
    gameFlow.connections.forEach(function (conn) {
        var _a, _b;
        var fromId = (_a = conn.from) === null || _a === void 0 ? void 0 : _a.nodeId;
        var toId = (_b = conn.to) === null || _b === void 0 ? void 0 : _b.nodeId;
        if (fromId && !nodeIds.has(fromId)) {
            issues.push({
                type: 'ERROR',
                message: "Connection references non-existent source node: ".concat(fromId),
                nodeId: fromId
            });
        }
        if (toId && !nodeIds.has(toId)) {
            issues.push({
                type: 'ERROR',
                message: "Connection references non-existent destination node: ".concat(toId),
                nodeId: toId
            });
        }
        // Check for connections with missing to/from
        if (!fromId) {
            issues.push({
                type: 'ERROR',
                message: "Open Connections! Connection has no source node defined"
            });
        }
        if (!toId) {
            issues.push({
                type: 'ERROR',
                message: "Open Connections! Incomplete connection from node ".concat(fromId || 'unknown', " - no destination defined")
            });
        }
    });
    // Step 3b: Check for orphaned nodes (no incoming or outgoing connections)
    var connectedNodeIds = new Set();
    gameFlow.connections.forEach(function (conn) {
        var _a, _b;
        var fromId = (_a = conn.from) === null || _a === void 0 ? void 0 : _a.nodeId;
        var toId = (_b = conn.to) === null || _b === void 0 ? void 0 : _b.nodeId;
        if (fromId)
            connectedNodeIds.add(fromId);
        if (toId)
            connectedNodeIds.add(toId);
    });
    var orphanedNodes = gameFlow.nodes.filter(function (n) { return !connectedNodeIds.has(n.id) && n.type !== 'Start'; });
    if (orphanedNodes.length > 0) {
        orphanedNodes.forEach(function (node) {
            issues.push({
                type: 'WARNING',
                message: "Orphaned node (no connections): ".concat(node.type),
                nodeId: node.id
            });
        });
    }
    // Step 3b: Check for nodes with unconnected outputs (excluding End/Restart nodes)
    var terminalNodeTypes = ['End', 'Restart'];
    gameFlow.nodes.forEach(function (node) {
        // Skip terminal nodes - they shouldn't have outgoing connections
        if (terminalNodeTypes.includes(node.type)) {
            return;
        }
        // Check if node has outgoing connections
        var hasOutgoingConnections = gameFlow.connections.some(function (c) { var _a; return ((_a = c.from) === null || _a === void 0 ? void 0 : _a.nodeId) === node.id; });
        // For SubMenu nodes, check if all options have connections
        if (node.type === 'SubMenu') {
            var options = node.options || [];
            options.forEach(function (option) {
                var hasOptionConnection = gameFlow.connections.some(function (c) { var _a, _b; return ((_a = c.from) === null || _a === void 0 ? void 0 : _a.nodeId) === node.id && ((_b = c.from) === null || _b === void 0 ? void 0 : _b.sourceId) === option.id; });
                if (!hasOptionConnection) {
                    issues.push({
                        type: 'ERROR',
                        message: "Open Connections! SubMenu option \"".concat(option.text, "\" has no outgoing connection"),
                        nodeId: node.id
                    });
                }
            });
        }
        else if (node.type === 'IfThenElse') {
            // For IfThenElse nodes, check for THEN and ELSE connections
            var hasThenConnection = gameFlow.connections.some(function (c) { var _a, _b, _c; return ((_a = c.from) === null || _a === void 0 ? void 0 : _a.nodeId) === node.id && (((_b = c.from) === null || _b === void 0 ? void 0 : _b.sourceId) === 'then' || !((_c = c.from) === null || _c === void 0 ? void 0 : _c.sourceId)); });
            var hasElseConnection = gameFlow.connections.some(function (c) { var _a, _b; return ((_a = c.from) === null || _a === void 0 ? void 0 : _a.nodeId) === node.id && ((_b = c.from) === null || _b === void 0 ? void 0 : _b.sourceId) === 'else'; });
            if (!hasThenConnection) {
                issues.push({
                    type: 'ERROR',
                    message: 'Open Connections! IfThenElse node has no THEN connection',
                    nodeId: node.id
                });
            }
            if (!hasElseConnection) {
                issues.push({
                    type: 'ERROR',
                    message: 'Open Connections! IfThenElse node has no ELSE connection',
                    nodeId: node.id
                });
            }
        }
        else {
            // For other non-terminal nodes, check for at least one outgoing connection
            if (!hasOutgoingConnections) {
                issues.push({
                    type: 'ERROR',
                    message: "Open Connections! ".concat(node.type, " node has no outgoing connection"),
                    nodeId: node.id
                });
            }
        }
    });
    // Step 4: Validate asset references
    gameFlow.nodes.forEach(function (node) {
        if (node.type === 'WorldLink') {
            var worldAssetId_1 = node.worldAssetId;
            if (worldAssetId_1) {
                var worldExists = allAssets.some(function (a) { return a.id === worldAssetId_1; });
                if (!worldExists) {
                    issues.push({
                        type: 'ERROR',
                        message: "WorldLink references missing asset: ".concat(worldAssetId_1),
                        nodeId: node.id,
                        assetId: worldAssetId_1
                    });
                }
            }
            else {
                issues.push({
                    type: 'ERROR',
                    message: 'WorldLink node has no worldAssetId defined',
                    nodeId: node.id
                });
            }
        }
        if (node.type === 'SubMenu') {
            var options = node.options;
            if (!options || options.length === 0) {
                issues.push({
                    type: 'WARNING',
                    message: 'SubMenu has no options',
                    nodeId: node.id
                });
            }
        }
        if (node.type === 'Text') {
            var title = node.title;
            var message = node.message;
            if ((!title || title.trim() === '') && (!message || message.trim() === '')) {
                issues.push({
                    type: 'WARNING',
                    message: 'Text node has no content',
                    nodeId: node.id
                });
            }
        }
    });
    // Step 5: Check End/Restart nodes have incoming connections
    var endNodes = gameFlow.nodes.filter(function (n) { return n.type === 'End' || n.type === 'Restart'; });
    endNodes.forEach(function (node) {
        var hasIncoming = gameFlow.connections.some(function (c) { var _a; return ((_a = c.to) === null || _a === void 0 ? void 0 : _a.nodeId) === node.id; });
        if (!hasIncoming) {
            issues.push({
                type: 'WARNING',
                message: "".concat(node.type, " node has no incoming connections"),
                nodeId: node.id
            });
        }
    });
    // Determine status
    var hasErrors = issues.some(function (i) { return i.type === 'ERROR'; });
    var hasWarnings = issues.some(function (i) { return i.type === 'WARNING'; });
    var status = hasErrors ? 'FAILED' : hasWarnings ? 'WARNING' : 'PASSED';
    var hash = calculateGameFlowHash(gameFlow);
    return {
        status: status,
        issues: issues,
        hash: hash,
        timestamp: timestamp
    };
}
/**
 * Generate GameFlow log content
 */
function generateGameFlowLog(gameFlow, allAssets, projectName) {
    var validation = validateGameFlow(gameFlow, allAssets);
    var timestamp = new Date().toLocaleString();
    var log = "GameFlow Validation Log\nProject: ".concat(projectName, "\nGenerated: ").concat(timestamp, "\nVersion: 1.0\n================================================================================\n\n");
    // Step 1: Check for Main
    log += "Step 1: Checking for Main GameFlow\n";
    if (gameFlow.name === 'Main' || gameFlow.name === 'main') {
        log += "Found \"Main\"\n\n";
    }
    else {
        log += "[WARNING] GameFlow name is \"".concat(gameFlow.name, "\", expected \"Main\"\n\n");
    }
    // Step 2: Validate structure
    log += "Step 2: Validating Main GameFlow Structure\n";
    var startNode = gameFlow.nodes.find(function (n) { return n.type === 'Start'; });
    log += "  - Start Node: ".concat(startNode ? startNode.id : 'NOT FOUND', " ").concat(startNode ? '[OK]' : '[ERROR]', "\n");
    log += "  - Total Nodes: ".concat(gameFlow.nodes.length, "\n");
    log += "  - Total Connections: ".concat(gameFlow.connections.length, "\n");
    var orphanedCount = validation.issues.filter(function (i) { return i.message.includes('Orphaned node (no connections)'); }).length;
    var unconnectedOutputCount = validation.issues.filter(function (i) { return i.message.includes('no outgoing connection'); }).length;
    var invalidConnectionCount = validation.issues.filter(function (i) {
        return i.message.includes('non-existent') || i.message.includes('no destination node defined');
    }).length;
    log += "  - Orphaned Nodes: ".concat(orphanedCount, " ").concat(orphanedCount > 0 ? '[WARNING]' : '[OK]', "\n");
    log += "  - Nodes with Unconnected Outputs: ".concat(unconnectedOutputCount, " ").concat(unconnectedOutputCount > 0 ? '[WARNING]' : '[OK]', "\n");
    log += "  - Invalid/Incomplete Connections: ".concat(invalidConnectionCount, " ").concat(invalidConnectionCount > 0 ? '[ERROR]' : '[OK]', "\n\n");
    // Step 3: Analyze graph
    log += "Step 3: Analyzing GameFlow Graph\n";
    gameFlow.nodes.forEach(function (node, i) {
        var nodeInfo = "  - Node ".concat(i + 1, ": ").concat(node.type, " (").concat(node.id, ")");
        if (node.type === 'WorldLink') {
            var worldAssetId = node.worldAssetId;
            nodeInfo += " -> World: ".concat(worldAssetId || 'UNDEFINED');
        }
        else if (node.type === 'SubMenu') {
            var title = node.title;
            nodeInfo += " -> Title: ".concat(title || 'Untitled');
        }
        else if (node.type === 'Text') {
            var title = node.title;
            nodeInfo += " -> Title: ".concat(title || 'Untitled');
        }
        log += nodeInfo + '\n';
    });
    log += '\n';
    // Step 4: Validate connections
    log += "Step 4: Validating Connections\n";
    gameFlow.connections.forEach(function (conn, i) {
        var _a, _b;
        var fromNodeId = (_a = conn.from) === null || _a === void 0 ? void 0 : _a.nodeId;
        var toNodeId = (_b = conn.to) === null || _b === void 0 ? void 0 : _b.nodeId;
        var fromNode = gameFlow.nodes.find(function (n) { return n.id === fromNodeId; });
        var toNode = gameFlow.nodes.find(function (n) { return n.id === toNodeId; });
        var fromType = (fromNode === null || fromNode === void 0 ? void 0 : fromNode.type) || 'UNKNOWN';
        var toType = (toNode === null || toNode === void 0 ? void 0 : toNode.type) || 'UNKNOWN';
        log += "  - Connection ".concat(i + 1, ": ").concat(fromType, " \u2192 ").concat(toType, " [OK]\n");
    });
    log += '\n';
    // Step 5: Check referenced assets
    log += "Step 5: Checking Referenced Assets\n";
    var worldLinks = gameFlow.nodes.filter(function (n) { return n.type === 'WorldLink'; });
    if (worldLinks.length === 0) {
        log += "  - No WorldLink nodes found\n";
    }
    else {
        worldLinks.forEach(function (node) {
            var worldAssetId = node.worldAssetId;
            if (worldAssetId) {
                var worldExists = allAssets.some(function (a) { return a.id === worldAssetId; });
                var worldAsset = allAssets.find(function (a) { return a.id === worldAssetId; });
                log += "  - WorldMap ".concat(worldAssetId, " (").concat((worldAsset === null || worldAsset === void 0 ? void 0 : worldAsset.name) || 'Unknown', "): ").concat(worldExists ? '[FOUND]' : '[MISSING]', "\n");
            }
        });
    }
    log += '\n';
    // Step 6: Detect issues
    log += "Step 6: Detecting Issues\n";
    if (validation.issues.length === 0) {
        log += "  [OK] No issues detected\n";
    }
    else {
        var errors = validation.issues.filter(function (i) { return i.type === 'ERROR'; });
        var warnings = validation.issues.filter(function (i) { return i.type === 'WARNING'; });
        if (warnings.length > 0) {
            log += "  [WARNING] Found ".concat(warnings.length, " warning(s):\n");
            warnings.forEach(function (issue) {
                log += "    - ".concat(issue.message, "\n");
            });
        }
        if (errors.length > 0) {
            log += "  [ERROR] Found ".concat(errors.length, " error(s):\n");
            errors.forEach(function (issue) {
                log += "    - ".concat(issue.message, "\n");
            });
        }
    }
    log += "\n================================================================================\n";
    log += "Validation Result: [".concat(validation.status, "]\n");
    log += "Hash: ".concat(validation.hash, "\n");
    log += "================================================================================\n";
    return log;
}
/**
 * Save GameFlow log to file
 */
function saveGameFlowLog(logContent, projectName) {
    var logsDir = path.join(process.cwd(), 'logs');
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    var logFilePath = path.join(logsDir, "".concat(projectName, "_gameflow.log"));
    fs.writeFileSync(logFilePath, logContent, 'utf-8');
    console.log("\u2705 GameFlow log saved: ".concat(logFilePath));
}
/**
 * Load GameFlow log from file
 */
function loadGameFlowLog(projectName) {
    var logsDir = path.join(process.cwd(), 'logs');
    var logFilePath = path.join(logsDir, "".concat(projectName, "_gameflow.log"));
    if (!fs.existsSync(logFilePath)) {
        return null;
    }
    try {
        var logContent = fs.readFileSync(logFilePath, 'utf-8');
        // Parse log to extract metadata
        var hashMatch = logContent.match(/Hash: ([a-f0-9]+)/);
        var statusMatch = logContent.match(/Validation Result: \[(\w+)\]/);
        var timestampMatch = logContent.match(/Generated: (.+)/);
        if (!hashMatch || !statusMatch) {
            console.warn('⚠️  Log file exists but could not parse metadata');
            return null;
        }
        return {
            projectName: projectName,
            timestamp: timestampMatch ? timestampMatch[1] : 'Unknown',
            hash: hashMatch[1],
            status: statusMatch[1],
            logContent: logContent
        };
    }
    catch (error) {
        console.error('❌ Error reading log file:', error);
        return null;
    }
}
/**
 * Check if GameFlow log is up to date
 */
function isGameFlowLogUpToDate(gameFlow, projectName) {
    var existingLog = loadGameFlowLog(projectName);
    if (!existingLog) {
        return false; // No log exists
    }
    var currentHash = calculateGameFlowHash(gameFlow);
    return existingLog.hash === currentHash;
}
/**
 * Validate and generate log if needed
 * Returns true if validation passed, false otherwise
 */
function validateAndGenerateLog(gameFlow, allAssets, projectName, forceRegenerate) {
    if (forceRegenerate === void 0) { forceRegenerate = false; }
    // Check if log is up to date
    if (!forceRegenerate && isGameFlowLogUpToDate(gameFlow, projectName)) {
        console.log('✅ GameFlow log is up to date');
        var existingLog = loadGameFlowLog(projectName);
        // Return cached result
        return {
            status: existingLog.status,
            issues: [], // We don't store issues in log file, but status is enough
            hash: existingLog.hash,
            timestamp: existingLog.timestamp
        };
    }
    // Generate new log
    console.log('🔄 Generating new GameFlow log...');
    var logContent = generateGameFlowLog(gameFlow, allAssets, projectName);
    saveGameFlowLog(logContent, projectName);
    return validateGameFlow(gameFlow, allAssets);
}
