import { Search, Building2 } from 'lucide-react';
import { Input, Select } from '@/components/ui';
import { useCompaniesList } from './useContacts';
import type { SelectOption } from '@/components/ui';

export interface ContactsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  companyId: string;
  onCompanyChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

const sortOptions: SelectOption[] = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'last_contacted', label: 'Last Contacted' },
];

export function ContactsFilters({
  search,
  onSearchChange,
  companyId,
  onCompanyChange,
  sortBy,
  onSortChange,
}: ContactsFiltersProps) {
  const { data: companiesData } = useCompaniesList();

  // Build company options for select
  const companyOptions: SelectOption[] = [
    { value: '', label: 'All Companies' },
    ...(companiesData?.data || []).map((company) => ({
      value: company.id,
      label: company.name,
      icon: <Building2 className="h-4 w-4 text-text-muted" />,
    })),
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
        <Input
          type="search"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Company filter */}
      <Select
        value={companyId}
        onChange={onCompanyChange}
        options={companyOptions}
        placeholder="Filter by company"
        className="w-full sm:w-48"
      />

      {/* Sort */}
      <Select
        value={sortBy}
        onChange={onSortChange}
        options={sortOptions}
        placeholder="Sort by"
        className="w-full sm:w-40"
      />
    </div>
  );
}
