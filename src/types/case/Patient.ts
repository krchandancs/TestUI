export interface Patient {
  id: string;
  mrn?: string;

  firstName: string;
  lastName: string;
  middleName?: string;

  dateOfBirth?: string; // ISO date
  sex?: 'M' | 'F' | 'U';

  // Optional demographic fields
  phone?: string;
  email?: string;
  address?: string;
}