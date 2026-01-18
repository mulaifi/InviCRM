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
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const sourceOptions: SelectOption[] = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'gmail', label: 'Gmail' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'slack', label: 'Slack' },
  { value: 'whatsapp', label: 'WhatsApp' },
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
    source: 'manual',
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
          lastName: contact.lastName,
          email: contact.email || '',
          phone: contact.phone || '',
          title: contact.title || '',
          companyId: contact.companyId || '',
          source: contact.source || 'manual',
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          title: '',
          companyId: '',
          source: 'manual',
        });
      }
      setErrors({});
    }
  }, [isOpen, contact]);

  // Build company options
  const companyOptions: SelectOption[] = [
    { value: '', label: 'No Company' },
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

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
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
      const data = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        title: formData.title.trim() || undefined,
        companyId: formData.companyId || undefined,
        source: formData.source || undefined,
      };

      if (isEditing && contact) {
        await updateContact.mutateAsync({ id: contact.id, data });
      } else {
        await createContact.mutateAsync(data);
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
            error={errors.lastName}
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
          placeholder="+965 9999 1234"
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

        {/* Source (only for new contacts) */}
        {!isEditing && (
          <Select
            label="Source"
            value={formData.source}
            onChange={(value) => handleChange('source', value)}
            options={sourceOptions}
          />
        )}

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
