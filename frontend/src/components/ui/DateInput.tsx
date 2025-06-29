import { Label } from './label';
import { Input } from './input';
import React, { useCallback } from 'react';

// Custom styles for date inputs
const dateInputStyles = `
  input[type="date"]::-webkit-calendar-picker-indicator {
    background: transparent;
    bottom: 0;
    color: transparent;
    cursor: pointer;
    height: auto;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    width: auto;
  }
  input[type="date"]::-webkit-datetime-edit {
    padding: 0;
  }
  input[type="date"]::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
  }
  input[type="date"]::-webkit-datetime-edit-text {
    padding: 0 2px;
  }
  input[type="date"]::-webkit-datetime-edit-month-field,
  input[type="date"]::-webkit-datetime-edit-day-field,
  input[type="date"]::-webkit-datetime-edit-year-field {
    padding: 0 2px;
  }
`;

// Inject styles only once
if (typeof document !== 'undefined' && !document.getElementById('date-input-styles')) {
  const style = document.createElement('style');
  style.id = 'date-input-styles';
  style.textContent = dateInputStyles;
  document.head.appendChild(style);
}

interface StyledDateInputProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const StyledDateInput: React.FC<StyledDateInputProps> = React.memo(({ 
  value, 
  onChange, 
  label, 
  placeholder, 
  required = false,
  className = "w-full"
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      try {
        const newDate = new Date(dateValue);
        if (!isNaN(newDate.getTime())) {
          onChange(newDate);
        } else {
          onChange(undefined);
        }
      } catch (error) {
        onChange(undefined);
      }
    } else {
      onChange(undefined);
    }
  }, [onChange]);

  const formatDateForInput = useCallback((date: Date | undefined): string => {
    if (!date) return '';
    try {
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }, []);

  const inputId = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={inputId}
        type="date"
        value={formatDateForInput(value)}
        onChange={handleChange}
        required={required}
        className={className}
        placeholder={placeholder}
      />
    </div>
  );
});

StyledDateInput.displayName = 'StyledDateInput'; 