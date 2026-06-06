import { IRoleService, Role } from './IRoleService';
import { ServiceResult, ID } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../../constants/systemActions';
import { storageGet, storageSet } from '../mockStorage';

const SEED_ROLES: Role[] = [
  { id: 'pathologist', name: 'Pathologist', canViewPediatric: false, description: 'Licensed pathologist with full clinical case access and sign-out authority.',   color: '#8AB4F8', caseAccess: true,  configAccess: false, permissions: DEFAULT_ROLE_PERMISSIONS['Pathologist'], builtIn: true  },
  { id: 'resident',    name: 'Resident',    canViewPediatric: false,    description: 'Pathology resident with case access and co-sign capability.',                    color: '#81C995', caseAccess: true,  configAccess: false, permissions: DEFAULT_ROLE_PERMISSIONS['Resident'],    builtIn: true  },
  { id: 'admin',       name: 'Admin',       canViewPediatric: false,       description: 'System administrator with configuration access but no clinical case access.',    color: '#FDD663', caseAccess: false, configAccess: true,  permissions: DEFAULT_ROLE_PERMISSIONS['Admin'],       builtIn: true  },
  { id: 'physician',   name: 'Physician',   canViewPediatric: false,   description: 'External ordering physician. Directory only — no app access.',                   color: '#C084FC', caseAccess: false, configAccess: false, permissions: DEFAULT_ROLE_PERMISSIONS['Physician'],   builtIn: true  },
];

const load = () => storageGet<Role[]>('pathscribe_roles', SEED_ROLES);
const persist = (data: Role[]) => storageSet('pathscribe_roles', data);
let MOCK_ROLES: Role[] = load();

const ok    = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err   = <T>(error: string): ServiceResult<T> => ({ ok: false, error });
const delay = () => new Promise(r => setTimeout(r, 80));

export const mockRoleService: IRoleService = {
  async getAll() {
    await delay();
    return ok([...MOCK_ROLES]);
  },

  async getById(id: ID) {
    await delay();
    const role = MOCK_ROLES.find(r => r.id === id);
    return role ? ok({ ...role }) : err(`Role ${id} not found`);
  },

  async add(role) {
    await delay();
    const newRole: Role = { ...role, id: role.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() };
    MOCK_ROLES = [...MOCK_ROLES, newRole];
    persist(MOCK_ROLES);
    return ok({ ...newRole });
  },

  async update(id, changes) {
    await delay();
    const idx = MOCK_ROLES.findIndex(r => r.id === id);
    if (idx === -1) return err(`Role ${id} not found`);
    MOCK_ROLES = MOCK_ROLES.map(r => r.id === id ? { ...r, ...changes } : r);
    persist(MOCK_ROLES);
    return ok({ ...MOCK_ROLES[idx], ...changes });
  },

  async delete(id) {
    await delay();
    const role = MOCK_ROLES.find(r => r.id === id);
    if (!role) return err(`Role ${id} not found`);
    if (role.builtIn) return err(`Cannot delete built-in role "${role.name}"`);
    MOCK_ROLES = MOCK_ROLES.filter(r => r.id !== id);
    persist(MOCK_ROLES);
    return ok(undefined);
  },
};
