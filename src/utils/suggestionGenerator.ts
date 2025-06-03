const industries: string[] = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Entertainment",
  "Retail",
  "E-commerce",
  "Food & Beverage",
  "Travel & Hospitality",
  "Real Estate",
  "Fashion & Apparel",
  "Automotive",
  "Sustainability",
  "Wellness & Fitness",
  "Gaming",
  "Artificial Intelligence",
  "Biotechnology",
  "Renewable Energy",
  "Marketing & Advertising",
  "Consulting",
];

const styles: string[] = [
  "Modern",
  "Minimalist",
  "Classic",
  "Elegant",
  "Playful",
  "Bold",
  "Futuristic",
  "Retro",
  "Vintage",
  "Whimsical",
  "Sophisticated",
  "Friendly",
  "Techy",
  "Natural",
  "Organic",
  "Luxurious",
  "Rustic",
  "Artsy",
  "Corporate",
  "Casual",
];

const keywordSets: string[][] = [
  ["innovative", "global", "solutions"],
  ["sustainable", "eco-friendly", "community"],
  ["premium", "luxury", "exclusive"],
  ["fast", "efficient", "reliable"],
  ["creative", "artistic", "design"],
  ["data-driven", "analytics", "insights"],
  ["personalized", "custom", "unique"],
  ["simple", "easy-to-use", "intuitive"],
  ["next-gen", "advanced", "cutting-edge"],
  ["holistic", "wellbeing", "mindful"],
  ["local", "authentic", "handcrafted"],
  ["digital", "online", "connected"],
  ["vibrant", "dynamic", "energetic"],
  ["secure", "private", "trustworthy"],
  ["educational", "learning", "knowledge"],
];

const getRandomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const getRandomIndustry = (): string => getRandomElement(industries);

export const getRandomStyle = (): string => getRandomElement(styles);

export const getRandomKeywords = (): string => {
  const set = getRandomElement(keywordSets);
  // Shuffle the chosen set and pick 1 to 3 keywords
  const shuffledSet = [...set].sort(() => 0.5 - Math.random());
  const count = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 keywords
  return shuffledSet.slice(0, count).join(", ");
};

export const getRandomMaxLength = (): number => {
  // Between 8 and 20
  return Math.floor(Math.random() * (20 - 8 + 1)) + 8;
};

export const getRandomSuggestionCount = (): number => {
  // Between 5 and 15
  return Math.floor(Math.random() * (15 - 5 + 1)) + 5;
};

export interface RandomOptionalFields {
  industry: string;
  style: string;
  keywords: string;
  length: number;
  count: number;
}

export const getRandomOptionalFieldValues = (): RandomOptionalFields => ({
  industry: getRandomIndustry(),
  style: getRandomStyle(),
  keywords: getRandomKeywords(),
  length: getRandomMaxLength(),
  count: getRandomSuggestionCount(),
});
