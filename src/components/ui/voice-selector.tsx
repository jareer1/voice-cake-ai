import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mic, Search, Filter } from "lucide-react";
import { VoiceOption, getVoicesByProvider, getCategoriesByProvider, searchVoices } from "@/lib/voiceConfig";

interface VoiceSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  provider: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function VoiceSelector({ 
  value, 
  onValueChange, 
  provider, 
  placeholder = "Select a voice",
  disabled = false,
  className = ""
}: VoiceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get all voices for the provider
  const allProviderVoices = useMemo(() => getVoicesByProvider(provider), [provider]);
  
  // Get categories for the provider
  const categories = useMemo(() => getCategoriesByProvider(provider), [provider]);
  
  // Filter voices based on search and category
  const filteredVoices = useMemo(() => {
    let voices = allProviderVoices;
    
    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      voices = voices.filter(voice => voice.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      voices = searchVoices(provider, searchTerm).filter(voice => 
        selectedCategory === "all" || voice.category === selectedCategory
      );
    }
    
    return voices;
  }, [allProviderVoices, selectedCategory, searchTerm, provider]);

  // Group voices by category for display
  const groupedVoices = useMemo(() => {
    const grouped: Record<string, VoiceOption[]> = {};
    
    filteredVoices.forEach(voice => {
      const category = voice.category || "Uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(voice);
    });
    
    return grouped;
  }, [filteredVoices]);

  // Get the selected voice for display
  const selectedVoice = useMemo(() => {
    return allProviderVoices.find(voice => voice.id === value);
  }, [allProviderVoices, value]);

  return (
    <div className={`space-y-3 ${className}`}>
      <Label>Voice</Label>
      
      {/* Search and Filter Controls */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search voices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={disabled}
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Voice Selection */}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedVoice && (
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{selectedVoice.name}</span>
                  {selectedVoice.description && (
                    <span className="text-xs text-muted-foreground">{selectedVoice.description}</span>
                  )}
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-96">
          {Object.keys(groupedVoices).length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No voices found matching your criteria
            </div>
          ) : (
            Object.entries(groupedVoices).map(([category, voices]) => (
              <SelectGroup key={category}>
                <SelectLabel className="flex items-center gap-2">
                  <span>{category}</span>
                  <Badge variant="secondary" className="text-xs">
                    {voices.length}
                  </Badge>
                </SelectLabel>
                {voices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{voice.name}</span>
                        {voice.description && (
                          <span className="text-xs text-muted-foreground">{voice.description}</span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Voice Count */}
      <div className="text-xs text-muted-foreground">
        {filteredVoices.length} of {allProviderVoices.length} voices
        {searchTerm && ` matching "${searchTerm}"`}
        {selectedCategory !== "all" && ` in ${selectedCategory}`}
      </div>
    </div>
  );
}
