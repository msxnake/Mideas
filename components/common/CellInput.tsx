
import React, { useState, useEffect, useRef } from 'react';
import { PT3_PIANO_KEY_LAYOUT } from '../../constants';

export interface CellInputProps {
    id: string;
    value: string; 
    placeholder: string; 
    maxLength: number;
    transformInput?: (input: string) => string;
    allowedCharsPattern?: RegExp; 
    onChange: (newValue: string | null) => void; 
    onFocus?: () => void;
    onBlur?: () => void; 
    className?: string;
    ariaLabel: string;
    isNoteField?: boolean; 
}

export const CellInput: React.FC<CellInputProps> = React.memo(({ 
    id, value, placeholder, maxLength, transformInput, allowedCharsPattern,
    onChange, onFocus, onBlur, className, ariaLabel, isNoteField
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
        />
    );
});
CellInput.displayName = 'CellInput';