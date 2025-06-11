/**
 * Utility function for conditionally joining class names together
 * Filters out falsy values and joins the remaining strings with spaces
 */
export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(Boolean).join(" ");
}
