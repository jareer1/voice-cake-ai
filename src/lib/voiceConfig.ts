// Voice configuration for the application
// This file centralizes all voice options for better maintainability

export interface VoiceOption {
  id: string;
  name: string;
  provider: string;
  category?: string;
  description?: string;
  language?: string;
  gender?: string;
  age_group?: string;
  accent?: string;
}

// Hume AI Voices (VoiceCake provider)
export const humeVoices: VoiceOption[] = [
  // Character Voices
  { id: "Colton Rivers", name: "Colton Rivers", provider: "voicecake", category: "Character", description: "Professional male voice" },
  { id: "Dungeon Master", name: "Dungeon Master", provider: "voicecake", category: "Character", description: "Dramatic fantasy narrator" },
  { id: "Female Meditation Guide", name: "Female Meditation Guide", provider: "voicecake", category: "Wellness", description: "Calming meditation voice" },
  { id: "Friendly Troll", name: "Friendly Troll", provider: "voicecake", category: "Character", description: "Playful fantasy character" },
  { id: "Geraldine Wallace", name: "Geraldine Wallace", provider: "voicecake", category: "Character", description: "Elegant female voice" },
  { id: "Ghost With Unfinished Business", name: "Ghost With Unfinished Business", provider: "voicecake", category: "Character", description: "Mysterious supernatural voice" },
  { id: "Imani Carter", name: "Imani Carter", provider: "voicecake", category: "Character", description: "Warm female voice" },
  { id: "Lady Elizabeth", name: "Lady Elizabeth", provider: "voicecake", category: "Character", description: "Refined British female" },
  { id: "Male Protagonist", name: "Male Protagonist", provider: "voicecake", category: "Character", description: "Heroic male voice" },
  { id: "Medieval Peasant Woman", name: "Medieval Peasant Woman", provider: "voicecake", category: "Character", description: "Historical female voice" },
  { id: "Medieval Town Crier", name: "Medieval Town Crier", provider: "voicecake", category: "Character", description: "Announcing historical voice" },
  { id: "Mrs. Pembroke", name: "Mrs. Pembroke", provider: "voicecake", category: "Character", description: "Sophisticated female voice" },
  { id: "Nasal Podcast Host", name: "Nasal Podcast Host", provider: "voicecake", category: "Media", description: "Casual podcast voice" },
  { id: "Old School Radio Announcer", name: "Old School Radio Announcer", provider: "voicecake", category: "Media", description: "Classic radio voice" },
  { id: "Old-Timey English Priest", name: "Old-Timey English Priest", provider: "voicecake", category: "Character", description: "Historical religious voice" },
  { id: "Pirate Captain", name: "Pirate Captain", provider: "voicecake", category: "Character", description: "Adventurous pirate voice" },
  { id: "Relaxing ASMR Woman", name: "Relaxing ASMR Woman", provider: "voicecake", category: "Wellness", description: "Soothing ASMR voice" },
  { id: "Sad Old British Man", name: "Sad Old British Man", provider: "voicecake", category: "Character", description: "Melancholic British voice" },
  { id: "Scottish Guy", name: "Scottish Guy", provider: "voicecake", category: "Character", description: "Scottish accent male" },
  { id: "Tough Guy", name: "Tough Guy", provider: "voicecake", category: "Character", description: "Strong masculine voice" },
  { id: "Wrestling Announcer", name: "Wrestling Announcer", provider: "voicecake", category: "Media", description: "Energetic sports announcer" },
  { id: "Medieval Peasant Man", name: "Medieval Peasant Man", provider: "voicecake", category: "Character", description: "Historical male voice" },
  { id: "Terrence Bentley", name: "Terrence Bentley", provider: "voicecake", category: "Character", description: "Distinguished male voice" },
  { id: "Sebastian Lockwood", name: "Sebastian Lockwood", provider: "voicecake", category: "Character", description: "Sophisticated British male" },
  { id: "Charming Cowgirl", name: "Charming Cowgirl", provider: "voicecake", category: "Character", description: "Western female voice" },
  { id: "Donovan Sinclair", name: "Donovan Sinclair", provider: "voicecake", category: "Character", description: "Charismatic male voice" },
  { id: "Nature Documentary Narrator", name: "Nature Documentary Narrator", provider: "voicecake", category: "Media", description: "Educational documentary voice" },
  { id: "Alice Bennett", name: "Alice Bennett", provider: "voicecake", category: "Character", description: "Friendly female voice" },
  { id: "Sitcom Girl", name: "Sitcom Girl", provider: "voicecake", category: "Media", description: "Comedic female voice" },
  { id: "Unserious Movie Trailer Narrator", name: "Unserious Movie Trailer Narrator", provider: "voicecake", category: "Media", description: "Funny trailer voice" },
  { id: "Wise Wizard", name: "Wise Wizard", provider: "voicecake", category: "Character", description: "Magical wise voice" },
  { id: "Unserious TV Host", name: "Unserious TV Host", provider: "voicecake", category: "Media", description: "Playful TV host voice" },
  { id: "French Chef", name: "French Chef", provider: "voicecake", category: "Character", description: "French accent chef" },
  { id: "Turtle Guru", name: "Turtle Guru", provider: "voicecake", category: "Character", description: "Wise turtle voice" },
  { id: "Big Dicky", name: "Big Dicky", provider: "voicecake", category: "Character", description: "Bold character voice" },
  { id: "Awe Inspired Guy", name: "Awe Inspired Guy", provider: "voicecake", category: "Character", description: "Inspiring male voice" },
  { id: "Ava Song", name: "Ava Song", provider: "voicecake", category: "Character", description: "Musical female voice" },
  { id: "Sir Spandrel", name: "Sir Spandrel", provider: "voicecake", category: "Character", description: "Noble knight voice" },
  { id: "Live Comedian", name: "Live Comedian", provider: "voicecake", category: "Media", description: "Stand-up comedy voice" },
  { id: "Spanish Instructor", name: "Spanish Instructor", provider: "voicecake", category: "Education", description: "Spanish teaching voice" },
  { id: "Dramatic Movie Trailer Narrator", name: "Dramatic Movie Trailer Narrator", provider: "voicecake", category: "Media", description: "Epic trailer voice" },
  { id: "Vince Douglas", name: "Vince Douglas", provider: "voicecake", category: "Character", description: "Confident male voice" },
  { id: "Campfire Narrator", name: "Campfire Narrator", provider: "voicecake", category: "Character", description: "Storytelling voice" },
  { id: "TikTok Fashion Influencer", name: "TikTok Fashion Influencer", provider: "voicecake", category: "Media", description: "Trendy social media voice" },
  { id: "Male Australian Naturalist", name: "Male Australian Naturalist", provider: "voicecake", category: "Education", description: "Australian nature voice" },
  { id: "English Children's Book Narrator", name: "English Children's Book Narrator", provider: "voicecake", category: "Education", description: "Gentle children's voice" },
  { id: "Literature Professor", name: "Literature Professor", provider: "voicecake", category: "Education", description: "Academic literary voice" },
  { id: "Comforting Male Conversationalist", name: "Comforting Male Conversationalist", provider: "voicecake", category: "Conversational", description: "Warm male conversationalist" },
  { id: "Deep Male Conversational Voice", name: "Deep Male Conversational Voice", provider: "voicecake", category: "Conversational", description: "Rich deep male voice" },
  { id: "Casual Podcast Host", name: "Casual Podcast Host", provider: "voicecake", category: "Media", description: "Relaxed podcast voice" },
  { id: "Cool Journalist", name: "Cool Journalist", provider: "voicecake", category: "Media", description: "Professional journalist voice" },
  { id: "Demure Conversationalist", name: "Demure Conversationalist", provider: "voicecake", category: "Conversational", description: "Gentle female conversationalist" },
  { id: "Conversational English Guy", name: "Conversational English Guy", provider: "voicecake", category: "Conversational", description: "Casual English male" },
  { id: "English Casual Conversationalist", name: "English Casual Conversationalist", provider: "voicecake", category: "Conversational", description: "Relaxed English voice" },
  { id: "Serene Assistant", name: "Serene Assistant", provider: "voicecake", category: "Assistant", description: "Calm AI assistant voice" },
  { id: "Soft Male Conversationalist", name: "Soft Male Conversationalist", provider: "voicecake", category: "Conversational", description: "Gentle male conversationalist" },
  { id: "Booming American Narrator", name: "Booming American Narrator", provider: "voicecake", category: "Media", description: "Powerful American narrator" },
  { id: "Booming British Narrator", name: "Booming British Narrator", provider: "voicecake", category: "Media", description: "Powerful British narrator" },
  { id: "Articulate ASMR British Narrator", name: "Articulate ASMR British Narrator", provider: "voicecake", category: "Wellness", description: "Clear British ASMR voice" },
  { id: "Male English Actor", name: "Male English Actor", provider: "voicecake", category: "Media", description: "Professional English actor" },
  { id: "Cheerful Irishman", name: "Cheerful Irishman", provider: "voicecake", category: "Character", description: "Happy Irish accent" },
  { id: "Friendly Kiwi Guy", name: "Friendly Kiwi Guy", provider: "voicecake", category: "Character", description: "New Zealand male voice" },
  { id: "Friendly Kiwi Girl", name: "Friendly Kiwi Girl", provider: "voicecake", category: "Character", description: "New Zealand female voice" },
  { id: "Highly Reactive Guy", name: "Highly Reactive Guy", provider: "voicecake", category: "Character", description: "Expressive male voice" },
  { id: "Warm Welsh Lady", name: "Warm Welsh Lady", provider: "voicecake", category: "Character", description: "Welsh accent female" },
  { id: "Welsh Folk Storyteller", name: "Welsh Folk Storyteller", provider: "voicecake", category: "Character", description: "Traditional Welsh storyteller" },
  { id: "Cheerful Canadian", name: "Cheerful Canadian", provider: "voicecake", category: "Character", description: "Happy Canadian voice" },
  { id: "Brooding Intellectual Man", name: "Brooding Intellectual Man", provider: "voicecake", category: "Character", description: "Thoughtful intellectual voice" },
  { id: "Groovy Guy", name: "Groovy Guy", provider: "voicecake", category: "Character", description: "Retro cool voice" },
  { id: "Grizzled New Yorker", name: "Grizzled New Yorker", provider: "voicecake", category: "Character", description: "New York accent male" },
  { id: "Opinionated Guy", name: "Opinionated Guy", provider: "voicecake", category: "Character", description: "Strong opinionated voice" },
  { id: "Caring Mother", name: "Caring Mother", provider: "voicecake", category: "Character", description: "Nurturing maternal voice" },
  { id: "Classical Film Actor", name: "Classical Film Actor", provider: "voicecake", category: "Media", description: "Vintage film actor voice" },
  { id: "Inspiring Older Guy", name: "Inspiring Older Guy", provider: "voicecake", category: "Character", description: "Motivational older male" },
  { id: "Inspiring Man", name: "Inspiring Man", provider: "voicecake", category: "Character", description: "Motivational male voice" },
  { id: "Inspiring Woman", name: "Inspiring Woman", provider: "voicecake", category: "Character", description: "Motivational female voice" },
  { id: "Mysterious Woman", name: "Mysterious Woman", provider: "voicecake", category: "Character", description: "Enigmatic female voice" },
  { id: "New York Comedian Guy", name: "New York Comedian Guy", provider: "voicecake", category: "Media", description: "NYC comedy voice" },
  { id: "Expressive Girl", name: "Expressive Girl", provider: "voicecake", category: "Character", description: "Animated female voice" },
  { id: "Charismatic Politician Man", name: "Charismatic Politician Man", provider: "voicecake", category: "Character", description: "Political speaker voice" },
  { id: "Sitcom Guy", name: "Sitcom Guy", provider: "voicecake", category: "Media", description: "Comedic male voice" },
  { id: "Yorkshire Chap", name: "Yorkshire Chap", provider: "voicecake", category: "Character", description: "Yorkshire accent male" },
  { id: "Seasoned Midwestern Actress", name: "Seasoned Midwestern Actress", provider: "voicecake", category: "Media", description: "Midwest American female" },
  { id: "Classical Film Actress", name: "Classical Film Actress", provider: "voicecake", category: "Media", description: "Vintage film actress voice" },
  { id: "Warm American Female", name: "Warm American Female", provider: "voicecake", category: "Character", description: "Friendly American female" },
  { id: "American Lead Actress", name: "American Lead Actress", provider: "voicecake", category: "Media", description: "Professional American actress" },
  { id: "Indian Actor", name: "Indian Actor", provider: "voicecake", category: "Character", description: "Indian accent male" },
  { id: "Indian Actress", name: "Indian Actress", provider: "voicecake", category: "Character", description: "Indian accent female" },
  { id: "California Frat Bro", name: "California Frat Bro", provider: "voicecake", category: "Character", description: "Casual California male" },
  { id: "Comical Vampire", name: "Comical Vampire", provider: "voicecake", category: "Character", description: "Funny vampire voice" },
  { id: "Colorful Fashion Influencer", name: "Colorful Fashion Influencer", provider: "voicecake", category: "Media", description: "Trendy fashion voice" },
  { id: "Excitable British Naturalist", name: "Excitable British Naturalist", provider: "voicecake", category: "Education", description: "Enthusiastic British nature voice" },
  { id: "Aunt Tea", name: "Aunt Tea", provider: "voicecake", category: "Character", description: "Warm aunt voice" },
  { id: "Steve Frisch", name: "Steve Frisch", provider: "voicecake", category: "Character", description: "Friendly male voice" },
  { id: "Warm Female Assistant Voice", name: "Warm Female Assistant Voice", provider: "voicecake", category: "Assistant", description: "Friendly AI assistant" },
  { id: "Male Podcaster", name: "Male Podcaster", provider: "voicecake", category: "Media", description: "Professional male podcaster" },
  { id: "Fastidious Robo-Butler", name: "Fastidious Robo-Butler", provider: "voicecake", category: "Character", description: "Precise robotic butler" },
  { id: "Anna", name: "Anna", provider: "voicecake", category: "Character", description: "Simple female voice" },
  { id: "Leon", name: "Leon", provider: "voicecake", category: "Character", description: "Simple male voice" },
  { id: "Ito", name: "Ito", provider: "voicecake", category: "Character", description: "Simple character voice" },
  { id: "Kora", name: "Kora", provider: "voicecake", category: "Character", description: "Simple character voice" },
  
  // Legacy voices (keeping for backward compatibility)
  { id: "Lee - Scott", name: "Lee Scott", provider: "voicecake", category: "Legacy", description: "Classic male voice" },
  { id: "Adele - Young - British", name: "Adele Young British", provider: "voicecake", category: "Legacy", description: "Young British female" },
  { id: "Steve - American", name: "Steve American", provider: "voicecake", category: "Legacy", description: "American male voice" },
  { id: "Adam - British", name: "Adam - British", provider: "voicecake", category: "Legacy", description: "British male voice" },
  { id: "Chloe - British", name: "Chloe British", provider: "voicecake", category: "Legacy", description: "British female voice" },
  { id: "Veronica - Young - British", name: "Veronica Young British", provider: "voicecake", category: "Legacy", description: "Young British female" },
  { id: "Lucy - Mature  - British", name: "Lucy Mature British", provider: "voicecake", category: "Legacy", description: "Mature British female" },
  { id: "Carol  - Mature - British", name: "Carol Mature British", provider: "voicecake", category: "Legacy", description: "Mature British female" },
];

// Cartesia voices
export const cartesiaVoices: VoiceOption[] = [
  { id: "default", name: "Default Voice", provider: "cartesia", category: "Default", description: "Standard Cartesia voice" },
];

// All voices combined
export const allVoices: VoiceOption[] = [
  ...humeVoices,
  ...cartesiaVoices,
];

// Get voices by provider
export const getVoicesByProvider = (provider: string): VoiceOption[] => {
  return allVoices.filter(voice => voice.provider === provider);
};

// Get voices by category
export const getVoicesByCategory = (provider: string, category?: string): VoiceOption[] => {
  const providerVoices = getVoicesByProvider(provider);
  if (!category) return providerVoices;
  return providerVoices.filter(voice => voice.category === category);
};

// Get unique categories for a provider
export const getCategoriesByProvider = (provider: string): string[] => {
  const providerVoices = getVoicesByProvider(provider);
  const categories = providerVoices.map(voice => voice.category).filter(Boolean);
  return [...new Set(categories)];
};

// Search voices by name or description
export const searchVoices = (provider: string, searchTerm: string): VoiceOption[] => {
  const providerVoices = getVoicesByProvider(provider);
  const term = searchTerm.toLowerCase();
  return providerVoices.filter(voice => 
    voice.name.toLowerCase().includes(term) ||
    voice.description?.toLowerCase().includes(term) ||
    voice.category?.toLowerCase().includes(term)
  );
};
