import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toolsAPI } from "@/pages/services/api";

interface Tool {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface ToolSelectorProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ToolSelector({ 
  value, 
  onValueChange, 
  placeholder = "Select tools...",
  disabled = false 
}: ToolSelectorProps) {
  const [open, setOpen] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadTools = async () => {
      try {
        setIsLoading(true);
        const response = await toolsAPI.getTools();
        // Handle different response formats
        let toolsData = [];
        if (Array.isArray(response)) {
          toolsData = response;
        } else if (response.tools && Array.isArray(response.tools)) {
          toolsData = response.tools;
        } else {
          console.warn('Unexpected tools API response format:', response);
          toolsData = [];
        }
        setTools(toolsData);
      } catch (error) {
        console.error('Error loading tools:', error);
        setTools([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTools();
  }, []);

  const selectedTools = tools.filter(tool => value.includes(tool.id));

  const handleSelect = (toolId: string) => {
    const newValue = value.includes(toolId)
      ? value.filter(id => id !== toolId)
      : [...value, toolId];
    onValueChange(newValue);
  };

  const removeTool = (toolId: string) => {
    onValueChange(value.filter(id => id !== toolId));
  };

  return (
    <div className="space-y-2">
      <Label>Tools</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              "Loading tools..."
            ) : value.length === 0 ? (
              placeholder
            ) : (
              `${value.length} tool${value.length === 1 ? '' : 's'} selected`
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tools..." />
            <CommandList>
              <CommandEmpty>No tools found.</CommandEmpty>
              <CommandGroup>
                {tools.map((tool) => (
                  <CommandItem
                    key={tool.id}
                    value={tool.name}
                    onSelect={() => handleSelect(tool.id)}
                    disabled={!tool.is_active}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(tool.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className={cn(!tool.is_active && "text-muted-foreground")}>
                        {tool.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tool.description}
                      </span>
                    </div>
                    {!tool.is_active && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Inactive
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Tools Display */}
      {selectedTools.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Selected Tools:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedTools.map((tool) => (
              <Badge
                key={tool.id}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tool.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeTool(tool.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
