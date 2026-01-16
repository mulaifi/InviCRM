import { AIClient } from '../client';

export interface ContactForDuplication {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName?: string;
  company?: string;
}

export interface DuplicateMatch {
  contactId: string;
  matchedContactId: string;
  confidence: number;
  matchReasons: string[];
  suggestedAction: 'merge' | 'review' | 'ignore';
}

export interface DuplicateAnalysisResult {
  duplicates: DuplicateMatch[];
  totalAnalyzed: number;
}

const DUPLICATE_PROMPT = `You are an AI assistant that identifies duplicate contacts in a CRM system.
Given a list of contacts, identify pairs that likely represent the same person.

Consider these matching criteria:
1. EXACT MATCH (confidence 1.0):
   - Same email address (case-insensitive)
   - Same phone number (normalized, ignoring formatting)

2. HIGH CONFIDENCE (0.8-0.95):
   - Same first name + last name + company
   - Same email domain + first name + last name
   - Very similar names with same company

3. MEDIUM CONFIDENCE (0.6-0.79):
   - Similar names (typos, nicknames like "Mike/Michael", "Bob/Robert")
   - Same phone with different names (could be assistant)
   - Same company + similar role + partial name match

4. LOW CONFIDENCE (0.4-0.59):
   - Same company + first name only
   - Similar email pattern

For GCC names, be aware of:
- Arabic names may have multiple transliterations (Mohammed/Muhammad/Mohammad)
- Patronymic naming (bin/ibn for "son of")
- Honorifics (Sheikh, Dr., Eng.)

Respond in JSON format only.`;

export class DuplicateDetector {
  constructor(private client: AIClient) {}

  /**
   * Detect potential duplicates using exact matching rules
   * This is fast and doesn't require AI
   */
  detectExactDuplicates(contacts: ContactForDuplication[]): DuplicateMatch[] {
    const duplicates: DuplicateMatch[] = [];
    const emailIndex = new Map<string, string[]>();
    const phoneIndex = new Map<string, string[]>();

    // Build indexes
    for (const contact of contacts) {
      if (contact.email) {
        const normalizedEmail = contact.email.toLowerCase().trim();
        const existing = emailIndex.get(normalizedEmail) || [];
        existing.push(contact.id);
        emailIndex.set(normalizedEmail, existing);
      }

      if (contact.phone) {
        const normalizedPhone = this.normalizePhone(contact.phone);
        if (normalizedPhone) {
          const existing = phoneIndex.get(normalizedPhone) || [];
          existing.push(contact.id);
          phoneIndex.set(normalizedPhone, existing);
        }
      }
    }

    // Find duplicates by email
    for (const [email, ids] of emailIndex.entries()) {
      if (ids.length > 1) {
        for (let i = 0; i < ids.length - 1; i++) {
          duplicates.push({
            contactId: ids[i],
            matchedContactId: ids[i + 1],
            confidence: 1.0,
            matchReasons: [`Exact email match: ${email}`],
            suggestedAction: 'merge',
          });
        }
      }
    }

    // Find duplicates by phone
    for (const [phone, ids] of phoneIndex.entries()) {
      if (ids.length > 1) {
        // Check if this pair is already matched by email
        for (let i = 0; i < ids.length - 1; i++) {
          const existing = duplicates.find(
            (d) =>
              (d.contactId === ids[i] && d.matchedContactId === ids[i + 1]) ||
              (d.contactId === ids[i + 1] && d.matchedContactId === ids[i]),
          );

          if (existing) {
            existing.matchReasons.push(`Exact phone match: ${phone}`);
          } else {
            duplicates.push({
              contactId: ids[i],
              matchedContactId: ids[i + 1],
              confidence: 0.95,
              matchReasons: [`Exact phone match: ${phone}`],
              suggestedAction: 'merge',
            });
          }
        }
      }
    }

    return duplicates;
  }

  /**
   * Detect potential duplicates using fuzzy name matching
   */
  detectFuzzyNameDuplicates(contacts: ContactForDuplication[]): DuplicateMatch[] {
    const duplicates: DuplicateMatch[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const a = contacts[i];
        const b = contacts[j];
        const pairKey = `${a.id}:${b.id}`;

        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const nameSimilarity = this.calculateNameSimilarity(a, b);
        const companySame = a.company && b.company &&
          a.company.toLowerCase() === b.company.toLowerCase();

        if (nameSimilarity >= 0.9 && companySame) {
          duplicates.push({
            contactId: a.id,
            matchedContactId: b.id,
            confidence: 0.9,
            matchReasons: [
              `Very similar names: ${a.firstName} ${a.lastName || ''} / ${b.firstName} ${b.lastName || ''}`,
              `Same company: ${a.company}`,
            ],
            suggestedAction: 'review',
          });
        } else if (nameSimilarity >= 0.8 && companySame) {
          duplicates.push({
            contactId: a.id,
            matchedContactId: b.id,
            confidence: 0.75,
            matchReasons: [
              `Similar names: ${a.firstName} ${a.lastName || ''} / ${b.firstName} ${b.lastName || ''}`,
              `Same company: ${a.company}`,
            ],
            suggestedAction: 'review',
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Use AI to analyze potential duplicates that couldn't be matched with rules
   * This is more expensive but catches complex cases
   */
  async detectWithAI(contacts: ContactForDuplication[]): Promise<DuplicateMatch[]> {
    if (contacts.length < 2 || contacts.length > 50) {
      // Too few or too many for efficient AI analysis
      return [];
    }

    const contactList = contacts
      .map(
        (c) =>
          `ID: ${c.id} | Name: ${c.firstName} ${c.lastName || ''} | Email: ${c.email || 'N/A'} | Phone: ${c.phone || 'N/A'} | Company: ${c.company || 'N/A'}`,
      )
      .join('\n');

    const userMessage = `Analyze these contacts for potential duplicates:

${contactList}

Return JSON with this structure:
{
  "duplicates": [
    {
      "contactId": "id1",
      "matchedContactId": "id2",
      "confidence": 0.0-1.0,
      "matchReasons": ["reason1", "reason2"],
      "suggestedAction": "merge|review|ignore"
    }
  ]
}

Only return pairs with confidence >= 0.5. Be conservative - false positives are worse than false negatives.`;

    const result = await this.client.completeJSON<{ duplicates: DuplicateMatch[] }>(
      DUPLICATE_PROMPT,
      userMessage,
      { maxTokens: 2000 },
    );

    return result?.duplicates || [];
  }

  /**
   * Full duplicate detection pipeline
   */
  async analyzeForDuplicates(
    contacts: ContactForDuplication[],
    options: { useAI?: boolean; minConfidence?: number } = {},
  ): Promise<DuplicateAnalysisResult> {
    const { useAI = true, minConfidence = 0.5 } = options;
    let allDuplicates: DuplicateMatch[] = [];

    // Step 1: Exact matching (fast)
    const exactDupes = this.detectExactDuplicates(contacts);
    allDuplicates.push(...exactDupes);

    // Step 2: Fuzzy name matching (medium)
    const fuzzyDupes = this.detectFuzzyNameDuplicates(contacts);
    allDuplicates.push(...fuzzyDupes);

    // Step 3: AI analysis for remaining ambiguous cases (slow)
    if (useAI && contacts.length <= 50) {
      // Filter out contacts already matched
      const matchedIds = new Set<string>();
      for (const d of allDuplicates) {
        matchedIds.add(d.contactId);
        matchedIds.add(d.matchedContactId);
      }

      const unmatched = contacts.filter((c) => !matchedIds.has(c.id));
      if (unmatched.length >= 2) {
        const aiDupes = await this.detectWithAI(unmatched);
        allDuplicates.push(...aiDupes);
      }
    }

    // Deduplicate and filter by confidence
    allDuplicates = this.deduplicateMatches(allDuplicates).filter(
      (d) => d.confidence >= minConfidence,
    );

    return {
      duplicates: allDuplicates,
      totalAnalyzed: contacts.length,
    };
  }

  private normalizePhone(phone: string): string | null {
    // Remove all non-digit characters except +
    const digits = phone.replace(/[^\d+]/g, '');
    if (digits.length < 7) return null;
    return digits;
  }

  private calculateNameSimilarity(a: ContactForDuplication, b: ContactForDuplication): number {
    const nameA = `${a.firstName} ${a.lastName || ''}`.toLowerCase().trim();
    const nameB = `${b.firstName} ${b.lastName || ''}`.toLowerCase().trim();

    if (nameA === nameB) return 1.0;

    // Check for common nickname variations
    const nicknameScore = this.checkNicknames(a.firstName, b.firstName);
    if (nicknameScore > 0 && a.lastName?.toLowerCase() === b.lastName?.toLowerCase()) {
      return nicknameScore;
    }

    // Levenshtein similarity
    return this.levenshteinSimilarity(nameA, nameB);
  }

  private checkNicknames(name1: string, name2: string): number {
    const n1 = name1.toLowerCase();
    const n2 = name2.toLowerCase();

    const nicknames: { [key: string]: string[] } = {
      michael: ['mike', 'mick', 'mickey'],
      robert: ['rob', 'bob', 'bobby'],
      william: ['will', 'bill', 'billy'],
      richard: ['rick', 'dick', 'rich'],
      james: ['jim', 'jimmy', 'jamie'],
      mohammed: ['muhammad', 'mohammad', 'mohamed', 'mohamad'],
      ahmed: ['ahmad', 'ahmet'],
      abdullah: ['abdallah', 'abdalla'],
      abdulaziz: ['abdul aziz', 'abdel aziz'],
      khalid: ['khaled'],
      fatima: ['fatimah', 'fatma'],
    };

    for (const [canonical, variants] of Object.entries(nicknames)) {
      const allVariants = [canonical, ...variants];
      if (allVariants.includes(n1) && allVariants.includes(n2)) {
        return 0.9;
      }
    }

    return 0;
  }

  private levenshteinSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[s2.length][s1.length];
  }

  private deduplicateMatches(matches: DuplicateMatch[]): DuplicateMatch[] {
    const seen = new Map<string, DuplicateMatch>();

    for (const match of matches) {
      const key = [match.contactId, match.matchedContactId].sort().join(':');
      const existing = seen.get(key);

      if (!existing || match.confidence > existing.confidence) {
        // Merge reasons if existing
        if (existing) {
          match.matchReasons = [...new Set([...existing.matchReasons, ...match.matchReasons])];
        }
        seen.set(key, match);
      }
    }

    return Array.from(seen.values());
  }
}
