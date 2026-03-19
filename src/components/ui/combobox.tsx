'use client';

import * as React from 'react';
import Image from 'next/image';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getImgBBThumbnail } from '@/lib/imgbb';

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  className,
}: {
  options: { value: string; label: string; imageUrl?: string | null }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}>
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 glass-panel border-border/40 bg-background/60 backdrop-blur-xl">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => {
              const thumbnailUrl = option.imageUrl
                ? getImgBBThumbnail(option.imageUrl)
                : null;
              return (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(option.value === value ? '' : option.value);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3">
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {thumbnailUrl && (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-background/40">
                      <Image
                        src={thumbnailUrl}
                        alt={option.label}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  )}
                  <span className="flex-1 truncate">{option.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
