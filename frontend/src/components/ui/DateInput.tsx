import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  required?: boolean;
  className?: string;
}

export function DateInput({ value, onChange, required, className }: DateInputProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", className)}
          aria-required={required}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP', { locale: fr }) : 'Sélectionner une date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function StyledDateInput({ value, onChange, required, className }: DateInputProps) {
  return (
    <DateInput
      value={value}
      onChange={onChange}
      required={required}
      className={cn(
        "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
        "rounded-md shadow-sm",
        className
      )}
    />
  );
}