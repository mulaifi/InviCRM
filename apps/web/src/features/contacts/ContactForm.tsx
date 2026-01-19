import { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useCreateContact, useUpdateContact, useCompaniesList } from './useContacts';
import type { Contact } from '@/types';
import type { SelectOption } from '@/components/ui';

export interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact; // If provided, we're editing; otherwise creating
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  companyId: string;
  source: string;
  notes: string;
}

interface FormErrors {
  firstName?: string;
  email?: string;
}

const sourceOptions: SelectOption[] = [
  { value: '', label: 'Select source' },
  { value: 'email', label: 'Email' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'event', label: 'Event' },
  { value: 'manual', label: 'Manual Entry' },
];

export function ContactForm({ isOpen, onClose, contact }: ContactFormProps) {
  const isEditing = !!contact;

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    companyId: '',
    source: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const { data: companiesData } = useCompaniesList();

  const isSubmitting = createContact.isPending || updateContact.isPending;

  // Reset form when modal opens or contact changes
  useEffect(() => {
    if (isOpen) {
      if (contact) {
        setFormData({
          firstName: contact.firstName,
          lastName: contact.lastName || '',
          email: contact.email || '',
          phone: contact.phone || '',
          title: contact.title || '',
          companyId: contact.companyId || '',
          source: contact.source || '',
          notes: contact.notes || '',
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          title: '',
          companyId: '',
          source: '',
          notes: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, contact]);

  // Build company options
  const companyOptions: SelectOption[] = [
    { value: '', label: 'Select a company (optional)' },
    ...(companiesData?.data || []).map((company) => ({
      value: company.id,
      label: company.name,
    })),
  ];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditing && contact) {
        await updateContact.mutateAsync({
          id: contact.id,
          data: {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim() || null,
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            title: formData.title.trim() || null,
            companyId: formData.companyId || null,
            source: formData.source || null,
          },
        });
      } else {
        await createContact.mutateAsync({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || undefined,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          title: formData.title.trim() || undefined,
          companyId: formData.companyId || undefined,
          source: formData.source || undefined,
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Contact' : 'New Contact'}
      description={
        isEditing
          ? 'Update the contact information below.'
          : 'Add a new contact to your network.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
            placeholder="Ahmed"
            autoFocus
          />
          <Input
            id="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Al-Sabah"
          />
        </div>

        {/* Email */}
        <Input
          id="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          placeholder="ahmed@example.com"
        />

        {/* Phone */}
        <Input
          id="phone"
          type="tel"
          label="Phone"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+965 2222 3333"
        />

        {/* Title */}
        <Input
          id="title"
          label="Job Title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Sales Manager"
        />

        {/* Company */}
        <Select
          label="Company"
          value={formData.companyId}
          onChange={(value) => handleChange('companyId', value)}
          options={companyOptions}
          placeholder="Select a company"
        />

        {/* Source */}
        <Select
          label="Source"
          value={formData.source}
          onChange={(value) => handleChange('source', value)}
          options={sourceOptions}
          placeholder="How did you meet?"
        />

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-bg-tertiary bg-bg-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
