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

    // Try to match local commands first
    const localMatches = matchCommands(trimmedQuery);

    // Check if it's a potential report request
    const isReport = isReportQuery(trimmedQuery);

    // If we have strong local matches, prioritize them over AI
    // This handles queries like "show me all contacts" where "contacts" matches
    if (localMatches.length > 0) {
      return {
        suggestions: localMatches,
        needsAI: false,
        isReportRequest: false,
      };
    }

    // No local matches - might need AI for complex queries
    return {
      suggestions: [],
      needsAI: true,
      isReportRequest: isReport,
    };
  }, [query]);
}
