import React, { useState, useEffect } from 'react';

const DatePicker = ({ value, onChange, placeholder = "dd/mm/yyyy", className, required = false, name, onKeyDown, label }) => {
  const formatToDisplay = (internalDateStr) => {
    if (!internalDateStr) return '';
    const parts = internalDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return '';
  };

  const parseDisplayDate = (displayStr) => {
    if (!displayStr) return null;
    const match = displayStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, day, month, year] = match;
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
    
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    
    return `${year}-${month}-${day}`;
  };

  const [displayValue, setDisplayValue] = useState(formatToDisplay(value));
  const [error, setError] = useState('');

  useEffect(() => {
    const expectedDisplay = formatToDisplay(value);
    const currentParsed = parseDisplayDate(displayValue) || '';
    const newVal = value || '';
    
    if (currentParsed !== newVal) {
      setDisplayValue(expectedDisplay);
      if (!newVal) {
        setError('');
      }
    }
  }, [value, displayValue]);

  const handleInput = (e) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (digits.length > 8) digits = digits.slice(0, 8);
    
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += '/' + digits.slice(2, 4);
    if (digits.length > 4) formatted += '/' + digits.slice(4, 8);
    
    setDisplayValue(formatted);
    
    const triggerChange = (val) => {
      if (onChange) {
        // Create a synthetic event-like object for compatibility with (e) => handle(e.target.value)
        onChange({ target: { name, value: val } });
      }
    };

    if (formatted.length === 10) {
      const internal = parseDisplayDate(formatted);
      if (internal) {
        setError('');
        triggerChange(internal);
      } else {
        setError('Invalid date');
        triggerChange('');
      }
    } else if (formatted.length === 0) {
      setError('');
      triggerChange('');
    } else {
      setError('');
      triggerChange('');
    }
  };

  // Determine classes
  // If className is passed, use it. Otherwise, provide a default minimal styled input.
  const inputClasses = className || `w-full bg-slate-900/80 border rounded-lg px-3 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 text-white placeholder-gray-500 transition-all duration-200 ${
    error 
      ? 'border-red-500/60 focus:ring-red-500/30' 
      : 'border-white/15 focus:ring-blue-500/30 focus:border-blue-500/50'
  }`;

  return (
    <div className="relative w-full">
      <input
        type="text"
        name={name}
        value={displayValue}
        onChange={handleInput}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        maxLength={10}
        required={required}
        className={inputClasses}
        autoComplete="off"
      />
      {error && (
        <span className="absolute -bottom-5 left-0 text-[11px] text-red-400 font-medium whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
};

export default DatePicker;
