import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { Label } from './label';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-calendar/dist/Calendar.css';

interface StyledDateInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function StyledDateInput({ 
  value, 
  onChange, 
  label, 
  placeholder, 
  required = false,
  className 
}: StyledDateInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCalendarChange = (newValue: any) => {
    console.log('Calendar change:', newValue);
    
    // Handle single date selection
    if (newValue instanceof Date) {
      console.log('Selected date:', newValue);
      onChange(newValue);
      setIsOpen(false);
    }
    // Handle date range (take first date)
    else if (Array.isArray(newValue) && newValue[0] instanceof Date) {
      console.log('Selected date from range:', newValue[0]);
      onChange(newValue[0]);
      setIsOpen(false);
    }
    // Handle null/undefined
    else if (newValue === null || newValue === undefined) {
      console.log('Cleared date');
      onChange(undefined);
      setIsOpen(false);
    }
  };

  const formatDisplayValue = (date?: Date) => {
    if (!date) return '';
    try {
      return format(date, 'dd/MM/yyyy', { locale: fr });
    } catch (error) {
      console.error('Error formatting date:', error);
      return date.toLocaleDateString('fr-FR');
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10 px-3 py-2",
              "border border-gray-300 bg-white hover:bg-gray-50",
              "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "transition-colors duration-200",
              !value && "text-gray-500",
              value && "text-gray-900"
            )}
            onClick={() => setIsOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
            {value ? formatDisplayValue(value) : placeholder || "Sélectionner une date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 shadow-lg border border-gray-200" align="start">
          <div className="p-3 bg-white rounded-lg">
            <Calendar
              onChange={handleCalendarChange}
              value={value || null}
              className="rounded-lg border-0"
              tileClassName={({ date, view }) => 
                cn(
                  "hover:bg-blue-100 cursor-pointer transition-colors duration-150",
                  "text-sm font-medium",
                  view === 'month' && "h-8 w-8 rounded-md flex items-center justify-center",
                  value && date.getTime() === value.getTime() && "bg-blue-600 text-white hover:bg-blue-700"
                )
              }
              tileDisabled={({ date }) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              maxDetail="month"
              minDetail="month"
              navigationLabel={({ date }) => format(date, 'MMMM yyyy', { locale: fr })}
              formatShortWeekday={(locale, date) => format(date, 'EEE', { locale: fr })}
              formatDay={(locale, date) => format(date, 'd')}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DateInput() {
  const [value, onChange] = useState<any>(new Date());

  return (
    <div>
      <Calendar onChange={onChange} value={value} />
    </div>
  );
}