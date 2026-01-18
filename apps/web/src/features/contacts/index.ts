// Components
export { ContactCard, type ContactCardProps } from './ContactCard';
export { ContactsFilters, type ContactsFiltersProps } from './ContactsFilters';
export { ContactsListView, type ContactsListViewProps } from './ContactsListView';
export { ContactDetailView, type ContactDetailViewProps } from './ContactDetailView';
export { ContactForm, type ContactFormProps } from './ContactForm';
export { ContactsEmptyState, type ContactsEmptyStateProps } from './ContactsEmptyState';

// Hooks
export {
  useContactsList,
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useCustomersList,
  useCompaniesList, // Legacy alias
  contactsKeys,
  customersKeys,
  companiesKeys, // Legacy alias
} from './useContacts';
