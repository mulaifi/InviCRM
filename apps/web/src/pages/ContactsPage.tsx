import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AmbientShell } from '@/components/layout';
import { CommandBar } from '@/features/command-bar';
import {
  ContactsListView,
  ContactDetailView,
  ContactForm,
} from '@/features/contacts';
import { useKeyboardShortcuts } from '@/hooks';
import type { Contact } from '@/types';

export function ContactsPage() {
  useKeyboardShortcuts();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: urlContactId } = useParams<{ id?: string }>();

  // Check if we're on /contacts/new
  const isNewRoute = location.pathname === '/contacts/new';

  // Selected contact for detail view
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    urlContactId && urlContactId !== 'new' ? urlContactId : null
  );

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(isNewRoute);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();

  // Sync URL parameter with state
  useEffect(() => {
    if (urlContactId && urlContactId !== 'new') {
      setSelectedContactId(urlContactId);
    } else {
      setSelectedContactId(null);
    }
  }, [urlContactId]);

  // Open form when navigating to /contacts/new
  useEffect(() => {
    if (isNewRoute) {
      setIsFormOpen(true);
      setEditingContact(undefined);
    }
  }, [isNewRoute]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContactId(contact.id);
    navigate(`/contacts/${contact.id}`, { replace: true });
  };

  const handleCloseDetail = () => {
    setSelectedContactId(null);
    navigate('/contacts', { replace: true });
  };

  const handleCreateContact = () => {
    setEditingContact(undefined);
    setIsFormOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingContact(undefined);
    // Navigate back to /contacts if we were on /contacts/new
    if (isNewRoute) {
      navigate('/contacts', { replace: true });
    }
  };

  return (
    <>
      <AmbientShell showZoomControls={false} showBackButton>
        <ContactsListView
          onSelectContact={handleSelectContact}
          onCreateContact={handleCreateContact}
          selectedContactId={selectedContactId || undefined}
        />
      </AmbientShell>

      {/* Detail slide-over */}
      <ContactDetailView
        contactId={selectedContactId}
        onClose={handleCloseDetail}
        onEdit={handleEditContact}
      />

      {/* Create/Edit modal */}
      <ContactForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        contact={editingContact}
      />

      {/* Command Bar */}
      <CommandBar />
    </>
  );
}
