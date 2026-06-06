import { IUserService, StaffUser } from './IUserService';
import { ServiceResult, ID } from '../types';
import { storageGet, storageSet } from '../mockStorage';

// ─── Seed data (Updated with standardized Voice Profiles) ─────────────────────
const SEED_USERS: StaffUser[] = [
  { id: '1',  firstName: 'Sarah',   middleName: 'Li',        lastName: 'Chen',    credentials: 'MD, FCAP',    email: 'schen@hospital.org',    roles: ['Pathologist'], npi: '1234567890', license: 'MD-12345', phone: '555-0101', department: 'Anatomic Pathology',  status: 'Active',   voiceProfile: 'EN-US' },
  { id: '2',  firstName: 'James',   middleName: 'Emeka',     lastName: 'Okafor',  credentials: 'MD',  email: 'jokafor@hospital.org',  roles: ['Resident'],    npi: '1234567891', license: 'MD-12346', phone: '555-0102', department: 'Anatomic Pathology',  status: 'Active',   voiceProfile: 'EN-US' },
  { id: '3',  firstName: 'Pete',    middleName: '',           lastName: 'Nimmo',   credentials: '',   email: 'pnimmo@hospital.org',   roles: ['Admin'],       npi: '',           license: '',         phone: '555-0103', department: 'Administration',       status: 'Active',   voiceProfile: 'EN-US' },
  { id: '4',  firstName: 'Maria',   middleName: 'Elena',     lastName: 'Santos',  credentials: 'MD, FCAP',  email: 'msantos@hospital.org',  roles: ['Pathologist'], npi: '1234567892', license: 'MD-12347', phone: '555-0104', department: 'Surgical Pathology',   status: 'Inactive', voiceProfile: 'EN-US' },
  { id: '5',  firstName: 'Kevin',   middleName: 'James',     lastName: 'Park',    credentials: 'MD',    email: 'kpark@hospital.org',    roles: ['Resident'],    npi: '1234567893', license: 'MD-12348', phone: '555-0105', department: 'Anatomic Pathology',  status: 'Active',   voiceProfile: 'EN-US' },
  { id: '6',  firstName: 'Aisha',   middleName: 'Priya',     lastName: 'Patel',   credentials: 'MD, FCAP',   email: 'apatel@hospital.org',   roles: ['Pathologist'], npi: '1234567894', license: 'MD-12349', phone: '555-0106', department: 'Neuropathology',       status: 'Active',   voiceProfile: 'EN-US' },
  { id: '7',  firstName: 'Thomas',  middleName: 'Van',       lastName: 'Nguyen',  credentials: 'MD',  email: 'tnguyen@hospital.org',  roles: ['Pathologist'], npi: '1234567895', license: 'MD-12350', phone: '555-0107', department: 'Surgical Pathology',   status: 'Active',   voiceProfile: 'EN-US' },
  { id: '8',  firstName: 'Lisa',    middleName: '',    lastName: 'Hoffman', credentials: 'MD', email: 'lhoffman@hospital.org', roles: ['Resident'],    npi: '1234567896', license: 'MD-12351', phone: '555-0108', department: 'Anatomic Pathology',  status: 'Active',   voiceProfile: 'EN-US' },
  { id: '9',  firstName: 'Marcus',  lastName: 'Webb',    credentials: 'MD, FCAP',    email: 'mwebb@hospital.org',    roles: ['Pathologist'], npi: '1234567897', license: 'MD-12352', phone: '555-0109', department: 'Hematopathology',      status: 'Active',   voiceProfile: 'EN-US' },
  { id: '10', firstName: 'Priya',   lastName: 'Sharma',  credentials: 'MD',  email: 'psharma@hospital.org',  roles: ['Resident'],    npi: '1234567898', license: 'MD-12353', phone: '555-0110', department: 'Anatomic Pathology',  status: 'Active',   voiceProfile: 'EN-US' },
  
  // ── US / UK Demo Users ─────────────────────────────────────────────────────
  { id: 'PATH-US-001', firstName: 'Amber',   lastName: 'Fehrs-Battey', credentials: 'MD, FCAP', canViewPediatric: false, email: 'amber.fehrs-battey@mpa.org',  roles: ['Pathologist', 'Admin'], npi: '1234567900', license: 'MD-12360', phone: '313-555-2001', department: 'Surgical Pathology', status: 'Active', voiceProfile: 'EN-US' },
  { id: 'PATH-US-002', firstName: 'J. Mark', lastName: 'Tuthill',      credentials: 'MD, FCAP', canViewPediatric: false,      email: 'mark.tuthill@hfhs.org',       roles: ['Pathologist'], npi: '1234567901', license: 'MD-12361', phone: '313-555-2002', department: 'Pathology Informatics',   status: 'Active', voiceProfile: 'EN-US' },
  { id: 'PATH-UK-001', firstName: 'Paul',    lastName: 'Carter',       credentials: 'MBChB, FRCPath',       email: 'paul.carter@mft.nhs.uk',      roles: ['Pathologist'], npi: '',           license: 'GMC-12362', phone: '+44-161-555-2003', department: 'Histopathology', status: 'Active', voiceProfile: 'EN-GB' },
  { id: 'PATH-UK-002', firstName: 'Oliver',  lastName: 'Pemberton',    credentials: 'MBChB, FRCPath',    email: 'oliver.pemberton@mft.nhs.uk', roles: ['Pathologist'], npi: '',           license: 'GMC-12363', phone: '+44-161-555-2004', department: 'Histopathology', status: 'Active', voiceProfile: 'EN-GB' },
  { id: 'PATH-RB-001', firstName: 'Rossana', lastName: 'Babakhani',    credentials: '', email: 'rossana.babakhani@pathscribe.ai',
  roles: ['Pathologist', 'Admin'], npi: '', license: '',  phone: '', department: 'UIUX Review', status: 'Active',  voiceProfile: 'EN-US', canViewPediatric: true },
];

// Increment USERS_VERSION whenever SEED_USERS is changed.
const USERS_VERSION = '5'; // bumped: Amber now has dual roles [Pathologist, Admin]
const USERS_VERSION_KEY = 'pathscribe_users_version';
if (localStorage.getItem(USERS_VERSION_KEY) !== USERS_VERSION) {
  localStorage.removeItem('pathscribe_mock_pathscribe_users');
  localStorage.setItem(USERS_VERSION_KEY, USERS_VERSION);
}

const load = () => {
  const data = storageGet<StaffUser[]>('pathscribe_users', SEED_USERS);
  // Migration: Ensure all loaded users have a default voice profile if missing
  return data.map(u => ({ ...u, voiceProfile: u.voiceProfile || 'EN-US' }));
};

const persist = (data: StaffUser[]) => storageSet('pathscribe_users', data);
let MOCK_USERS: StaffUser[] = load();

const ok  = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err = <T>(error: string): ServiceResult<T> => ({ ok: false, error });
const delay = () => new Promise(r => setTimeout(r, 80));

export const mockUserService: IUserService = {
  async getAll() {
    await delay();
    return ok([...MOCK_USERS]);
  },

  async getById(id: ID) {
    await delay();
    const user = MOCK_USERS.find(u => u.id === id);
    return user ? ok({ ...user }) : err(`User ${id} not found`);
  },

  async add(user) {
    await delay();
    // Default to 'EN-US' if not provided in the 'add' payload
    const newUser: StaffUser = { 
      ...user, 
      id: String(Date.now()),
      voiceProfile: user.voiceProfile || 'EN-US'
    };
    MOCK_USERS = [...MOCK_USERS, newUser];
    persist(MOCK_USERS);
    return ok({ ...newUser });
  },

  async update(id, changes) {
    await delay();
    const idx = MOCK_USERS.findIndex(u => u.id === id);
    if (idx === -1) return err(`User ${id} not found`);
    
    // Create the updated user object
    const updatedUser = { ...MOCK_USERS[idx], ...changes };
    
    MOCK_USERS = MOCK_USERS.map(u => u.id === id ? updatedUser : u);
    persist(MOCK_USERS);
    return ok(updatedUser);
  },

  async deactivate(id) {
    return mockUserService.update(id, { status: 'Inactive' });
  },

  async reactivate(id) {
    return mockUserService.update(id, { status: 'Active' });
  },
};
