import * as React from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({ value, onChange, placeholder, className }: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return isValid(d) ? d : undefined;
  });

  const [hours, setHours] = React.useState<string>(() => {
    if (!value) return "12";
    const d = new Date(value);
    return isValid(d) ? d.getHours().toString().padStart(2, '0') : "12";
  });

  const [minutes, setMinutes] = React.useState<string>(() => {
    if (!value) return "00";
    const d = new Date(value);
    return isValid(d) ? d.getMinutes().toString().padStart(2, '0') : "00";
  });

  // Sync internal state when external value changes
  React.useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (isValid(d)) {
        setDate(d);
        setHours(d.getHours().toString().padStart(2, '0'));
        setMinutes(d.getMinutes().toString().padStart(2, '0'));
      }
    } else {
      setDate(undefined);
    }
  }, [value]);

  const handleSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined);
      if (onChange) onChange("");
      return;
    }

    const updatedDate = new Date(newDate);
    updatedDate.setHours(parseInt(hours));
    updatedDate.setMinutes(parseInt(minutes));
    
    setDate(updatedDate);
    if (onChange) {
      // Format to YYYY-MM-DDTHH:mm for compatibility with datetime-local
      onChange(format(updatedDate, "yyyy-MM-dd'T'HH:mm"));
    }
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: string) => {
    if (type === 'hours') setHours(val);
    else setMinutes(val);

    if (date) {
      const updatedDate = new Date(date);
      if (type === 'hours') updatedDate.setHours(parseInt(val));
      else updatedDate.setMinutes(parseInt(val));
      
      setDate(updatedDate);
      if (onChange) {
        onChange(format(updatedDate, "yyyy-MM-dd'T'HH:mm"));
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 py-2 text-[13px]",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP p") : <span>{placeholder || "Pick a date and time"}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border border-border bg-card shadow-xl" align="start">
        <div className="flex flex-col sm:flex-row sm:h-[350px]">
          <div className="p-1">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
              className="rounded-md"
            />
          </div>
          <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-border p-3 sm:w-[120px] bg-muted/20">
            <div className="flex items-center gap-2 mb-3 text-primary font-medium">
              <Clock className="h-4 w-4" />
              <span className="text-[12px]">Time</span>
            </div>
            <div className="flex sm:flex-col gap-2">
              <div className="flex-1 space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold px-1">Hours</span>
                <Select value={hours} onValueChange={(v) => handleTimeChange('hours', v)}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold px-1">Minutes</span>
                <Select value={minutes} onValueChange={(v) => handleTimeChange('minutes', v)}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i * 5} value={(i * 5).toString().padStart(2, '0')}>
                        {(i * 5).toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-auto pt-4 hidden sm:block">
              <p className="text-[10px] text-muted-foreground leading-tight">
                Select a date and adjust the time as needed.
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
