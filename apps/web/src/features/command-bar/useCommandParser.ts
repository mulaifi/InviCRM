import { useMemo } from 'react';
import { matchCommands, isReportQuery } from './command-registry';
import type { CommandSuggestion } from '@/types/command';

interface UseCommandParserResult {
  suggestions: CommandSuggestion[];
  needsAI: boolean;
  isReportRequest: boolean;
}

export function useCommandParser(query: string): UseCommandParserResult {
  return useMemo(() => {
    const trimmedQuery = query.trim();

    // Empty query - show default suggestions
    if (!trimmedQuery) {
      return {
        suggestions: matchCommands(''),
        needsAI: false,
        isReportRequest: false,
      };
    }

    // Check if it's a potential report request
    const isReport = isReportQuery(trimmedQuery);

    // Try to match local commands first
    const localMatches = matchCommands(trimmedQuery);

    // If we have exact/good local matches, use them
    if (localMatches.length > 0 && !isReport) {
      return {
        suggestions: localMatches,
        needsAI: false,
        isReportRequest: false,
      };
    }

    // For report requests or no local matches, indicate AI is needed
    return {
      suggestions: localMatches, // Still show any partial matches
      needsAI: localMatches.length === 0 || isReport,
      isReportRequest: isReport,
    };
  }, [query]);
}
