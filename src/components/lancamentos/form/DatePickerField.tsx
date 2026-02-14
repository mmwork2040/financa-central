
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface DatePickerFieldProps {
  label: string;
  value: string | null;
  onChange: (date: Date | null) => void;
}

export const DatePickerField = ({ label, value, onChange }: DatePickerFieldProps) => {
  const formatDate = (date?: Date | null) => {
    return date ? format(date, 'dd/MM/yyyy') : '';
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={label.toLowerCase().replace(/\s/g, '_')} className="text-right">{label}</Label>
      <div className="col-span-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? formatDate(new Date(value)) : `Selecione a data`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={onChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
