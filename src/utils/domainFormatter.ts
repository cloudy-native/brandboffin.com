export const formatDomainFromBrand = (brandName: string): string => {
  if (!brandName || brandName.trim() === "") {
    return "mybrand.com"; // Fallback for empty or whitespace-only input
  }

  const originalLower = brandName.toLowerCase();
  let processedDomain = originalLower.normalize("NFD").replace(/\p{M}/gu, ""); // Unaccent

  // Replace '&' with 'and'
  processedDomain = processedDomain.replace(/&/g, "and");

  // Check if accents were removed by comparing originalLower with the unaccented version
  const hadAccents = originalLower !== processedDomain;

  if (hadAccents) {
    // If accents were present, remove spaces to form compound words
    processedDomain = processedDomain.replace(/\s+/g, "");
  } else {
    // If no accents were present, convert spaces to hyphens
    processedDomain = processedDomain.replace(/\s+/g, "-");
  }

  // Remove any character that is not a letter (a-z), a digit (0-9), or a hyphen
  processedDomain = processedDomain.replace(/[^a-z0-9-]+/g, "");

  // Consolidate multiple hyphens into a single hyphen (if any were introduced)
  processedDomain = processedDomain.replace(/-+/g, "-");

  // Remove leading and trailing hyphens
  processedDomain = processedDomain.replace(/^-+|-+$/g, "");

  // If the domain becomes empty after sanitization, provide a fallback
  if (processedDomain === "") {
    return "mybrand.com";
  }

  return `${processedDomain}.com`;
};
