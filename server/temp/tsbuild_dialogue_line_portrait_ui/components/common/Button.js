"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
/**
 * A customizable button component with different variants, sizes, and an optional icon.
 */
exports.Button = react_1.default.forwardRef(({ children, variant = 'primary', size = 'md', icon, className, justify = 'center', ...props }, ref) => {
    const baseStyle = "font-sans rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-msx-panelbg transition-all duration-150 ease-in-out flex items-center disabled:opacity-50 disabled:cursor-not-allowed";
    let variantStyle = "";
    switch (variant) {
        case 'primary': // Uses new msx.accent (blue)
            variantStyle = "bg-msx-accent text-white hover:bg-opacity-85 focus:ring-msx-accent";
            break;
        case 'secondary': // Uses new msx.highlight (green)
            variantStyle = "bg-msx-highlight text-msx-bgcolor hover:bg-opacity-85 focus:ring-msx-highlight";
            break;
        case 'danger': // Uses new msx.danger
            variantStyle = "bg-msx-danger text-white hover:bg-opacity-85 focus:ring-msx-danger";
            break;
        case 'ghost': // Uses new msx.textsecondary and msx.border
            variantStyle = "bg-transparent text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary focus:ring-msx-accent";
            break;
    }
    let sizeStyle = "";
    switch (size) {
        case 'sm':
            sizeStyle = "px-2.5 py-1 text-xs"; // Slightly adjusted padding
            break;
        case 'md':
            sizeStyle = "px-3.5 py-1.5 text-sm"; // Slightly adjusted padding
            break;
        case 'lg':
            sizeStyle = "px-4.5 py-2 text-base"; // Slightly adjusted padding
            break;
    }
    let justifyStyle = "";
    switch (justify) {
        case 'start':
            justifyStyle = "justify-start";
            break;
        case 'center':
            justifyStyle = "justify-center";
            break;
        case 'end':
            justifyStyle = "justify-end";
            break;
    }
    return ((0, jsx_runtime_1.jsxs)("button", { ref: ref, className: `${baseStyle} ${variantStyle} ${sizeStyle} ${justifyStyle} ${className || ''}`, ...props, children: [icon && (0, jsx_runtime_1.jsx)("span", { className: "mr-1.5", children: icon }), children] }));
});
exports.Button.displayName = 'Button';
