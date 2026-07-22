
import React, { useState, useEffect, useRef } from 'react';
import { PT3_PIANO_KEY_LAYOUT } from '../../constants';

/**
 * Props for the CellInput component.
 */
export interface CellInputProps {
    /** A unique identifier for the input field. */
    id: string;
    /** The current value of the input field. */
    value: string; 
    /** The placeholder text to display when the input is empty. */
    placeholder: string; 
    /** The maximum number of characters allowed in the input. */
    maxLength: number;
    /** An optional function to transform the input value (e.g., to uppercase). */
    transformInput?: (input: string) => string;
    /** An optional regex pattern for allowed characters. */
    allowedCharsPattern?: RegExp; 
    /** Callback function triggered when the input value changes and the field loses focus. */
    onChange: (newValue: string | null) => void; 
    /** Optional callback for when the input gains focus. */
    onFocus?: () => void;
    /** Optional callback for when the input loses focus. */
    onBlur?: () => void; 
    /** Optional additional CSS classes to apply to the input element. */
    className?: string;
    /** The ARIA label for accessibility. */
    ariaLabel: string;
    /** A flag to indicate if this is a note field, to handle piano key input differently. */
    isNoteField?: boolean; 
    /** Prevent editing while still allowing the value to be selected/copied. */
    readOnly?: boolean;
}

/**
 * A specialized input component for cells within a tracker or grid-based editor.
 * It handles local state, input validation, transformation, and synchronization with parent state.
 */
export const CellInput: React.FC<CellInputProps> = React.memo(({ 
    id, value, placeholder, maxLength, transformInput, allowedCharsPattern,
    onChange, onFocus, onBlur, className, ariaLabel, isNoteField, readOnly = false
}) => {
    const [inputValue, setInputValue] = useState(value);
    const previousDisplayValueRef = useRef(value); 

    useEffect(() => {
        // This effect synchronizes the internal inputValue with the prop `value`
        // when the `value` prop changes (e.g., due to model update from elsewhere).
        setInputValue(value); 
        previousDisplayValueRef.current = value;
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let currentVal = e.target.value;
        if (allowedCharsPattern) {
            currentVal = currentVal.split('').filter(char => allowedCharsPattern.test(char)).join('');
        }
        if (transformInput) {
            currentVal = transformInput(currentVal);
        }
        if (currentVal.length > maxLength) {
            currentVal = currentVal.substring(0, maxLength);
        }
        setInputValue(currentVal);
    };

    const handleBlurInternal = () => {
        // Only call onChange if the user's input *actually differs* from the current prop value.
        // This prevents onBlur (e.g., from programmatic focus shift) from overwriting
        // a model update that happened externally (like from handleGridKeyDown).
        if (inputValue !== value) { 
            onChange(inputValue.trim() === "" ? null : inputValue); 
        }
        if (onBlur) onBlur();
    };
    
    const handleFocusInternal = () => {
        if (onFocus) onFocus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;
        if (isNoteField && e.key.length === 1 && PT3_PIANO_KEY_LAYOUT[e.key.toLowerCase()]) {
            // Allow piano key input to bubble up to grid handler
            return; 
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const atStart = target.selectionStart === 0 && target.selectionEnd === 0;
            const atEnd = target.selectionStart === inputValue.length && target.selectionEnd === inputValue.length;
            if ((e.key === 'ArrowLeft' && atStart) || (e.key === 'ArrowRight' && atEnd)) {
                // Allow bubbling for navigation
            } else {
                e.stopPropagation(); 
                return;
            }
        }
        if (e.key === "Escape") {
            setInputValue(previousDisplayValueRef.current); 
            target.blur(); 
            e.stopPropagation();
        }
    };

    return (
        <input
            id={id}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlurInternal}
            onFocus={handleFocusInternal}
            onKeyDown={handleKeyDown}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className={`bg-transparent focus:bg-msx-highlight focus:text-msx-bgcolor outline-none ${className}`}
            spellCheck="false"
            autoComplete="off"
            readOnly={readOnly}
        />
    );
});
CellInput.displayName = 'CellInput';
