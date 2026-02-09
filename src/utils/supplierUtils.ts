import type { Supplier } from '@/lib/supabase';

const hasPrimaryFlag = (person: { is_primary?: boolean; isPrimary?: boolean }): boolean =>
  Boolean(person.is_primary ?? person.isPrimary);

export const getSupplierPrimaryEmail = (supplier: Supplier): string | null => {
  const contactPersons = Array.isArray(supplier?.contact_persons) ? supplier.contact_persons : [];

  if (contactPersons.length === 0) {
    return null;
  }

  const primaryContact = contactPersons.find((person) => hasPrimaryFlag(person));
  if (primaryContact?.email) {
    return primaryContact.email;
  }

  const firstWithEmail = contactPersons.find((person) => Boolean(person?.email));
  return firstWithEmail?.email || null;
};
