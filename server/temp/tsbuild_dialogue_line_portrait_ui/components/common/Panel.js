"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Panel = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
/**
 * A general-purpose panel component with a header and content area.
 */
const Panel = ({ title, children, className = '', titleClassName = '', icon, headerButtons, bodyClassName, collapsible = false, defaultCollapsed = false }) => {
    const [isCollapsed, setIsCollapsed] = react_1.default.useState(defaultCollapsed);
    const resolvedBodyClass = bodyClassName ?? 'p-2 flex-grow overflow-auto';
    return ((0, jsx_runtime_1.jsxs)("div", { className: `bg-msx-panelbg border border-msx-border rounded-md shadow-lg flex flex-col ${className}`, children: [(0, jsx_runtime_1.jsxs)("h3", { className: `font-sans text-sm text-msx-textprimary p-2 border-b border-msx-border flex items-center ${titleClassName}`, children: [" ", icon && (0, jsx_runtime_1.jsx)("span", { className: "mr-2", children: icon }), (0, jsx_runtime_1.jsx)("span", { className: "flex-grow", children: title }), collapsible && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setIsCollapsed(value => !value), className: "mr-1 w-6 h-6 flex items-center justify-center rounded border border-msx-border bg-msx-bgcolor text-msx-textsecondary hover:text-msx-highlight hover:border-msx-highlight", title: isCollapsed ? 'Expand panel' : 'Collapse panel', "aria-expanded": !isCollapsed, "aria-label": isCollapsed ? `Expand ${title}` : `Collapse ${title}`, children: isCollapsed ? '+' : '-' })), headerButtons && (0, jsx_runtime_1.jsx)("div", { className: "flex items-center space-x-1", children: headerButtons })] }), !isCollapsed && ((0, jsx_runtime_1.jsx)("div", { className: resolvedBodyClass, children: children }))] }));
};
exports.Panel = Panel;
