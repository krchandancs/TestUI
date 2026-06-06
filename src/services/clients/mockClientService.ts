import { ServiceResult, ID } from '../types';
import { storageGet, storageSet } from '../mockStorage';

export interface Client {
  id: ID;
  name: string;
  code: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  status: 'Active' | 'Inactive';
  /** Age threshold (in years) below which a patient is considered pediatric.
   *  Null = not configured — admin must verify with this client before enabling. */
  pediatricAgeThreshold: number | null;
  /** User IDs explicitly approved to report pediatric cases from this client.
   *  Both this AND canViewPediatric on the user record must be true (Option C). */
  authorizedPediatricPathologistIds: string[];
  // ── TAT configuration ─────────────────────────────────────────────────────
  /** Hours from receivedDate before a first-touch escalation fires.
   *  Null = use system default (SystemConfig.defaults.tatFirstTouchHours). */
  tatFirstTouchHours: number | null;
  /** Total case TAT target in hours (receivedDate → finalizedAt).
   *  Null = use system default (SystemConfig.defaults.tatTotalHours). */
  tatTotalHours: number | null;
  /** Roles to notify when a TAT threshold is breached. Empty = no notifications. */
  escalationTargets: ('pathGroup' | 'admin' | 'referrer')[];
  /** Urgency level applied to escalation alerts for this client. */
  escalationPriority: 'high' | 'critical';
}

export interface IClientService {
  getAll(): Promise<ServiceResult<Client[]>>;
  getById(id: ID): Promise<ServiceResult<Client>>;
  add(client: Omit<Client, 'id'>): Promise<ServiceResult<Client>>;
  update(id: ID, changes: Partial<Omit<Client, 'id'>>): Promise<ServiceResult<Client>>;
  deactivate(id: ID): Promise<ServiceResult<Client>>;
  reactivate(id: ID): Promise<ServiceResult<Client>>;
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
const SEED_CLIENTS: Client[] = [
  {
    id: 'c1', name: 'Metro General Hospital',   code: 'MGH',  address: '100 Main St',      phone: '555-2001', fax: '555-2002', email: 'lab@metrogeneral.org',
    status: 'Active',   pediatricAgeThreshold: 18,   authorizedPediatricPathologistIds: [],
    // Academic centre — tight SLAs negotiated in contract
    tatFirstTouchHours: 4,  tatTotalHours: 24,
    escalationTargets: ['pathGroup', 'admin'], escalationPriority: 'critical',
  },
  {
    id: 'c2', name: 'Riverside Medical Center', code: 'RMC',  address: '200 River Rd',     phone: '555-2003', fax: '555-2004', email: 'lab@riverside.org',
    status: 'Active',   pediatricAgeThreshold: null, authorizedPediatricPathologistIds: [],
    // Community hospital — standard 2-day TAT
    tatFirstTouchHours: 8,  tatTotalHours: 48,
    escalationTargets: ['admin'], escalationPriority: 'high',
  },
  {
    id: 'c3', name: 'Northside Clinic',         code: 'NSC',  address: '300 North Ave',    phone: '555-2005', fax: '555-2006', email: 'lab@northside.org',
    status: 'Active',   pediatricAgeThreshold: null, authorizedPediatricPathologistIds: [],
    // Small clinic — no custom targets, inherits system defaults
    tatFirstTouchHours: null, tatTotalHours: null,
    escalationTargets: [], escalationPriority: 'high',
  },
  {
    id: 'c4', name: 'Westview Surgery Center',  code: 'WSC',  address: '400 West Blvd',    phone: '555-2007', fax: '555-2008', email: 'lab@westview.org',
    status: 'Active',   pediatricAgeThreshold: null, authorizedPediatricPathologistIds: [],
    // Surgical centre — rapid intra-op consults expected
    tatFirstTouchHours: 6,  tatTotalHours: 36,
    escalationTargets: ['pathGroup', 'referrer'], escalationPriority: 'high',
  },
  {
    id: 'c5', name: 'Eastpark Oncology',        code: 'EPO',  address: '500 East Park Dr', phone: '555-2009', fax: '555-2010', email: 'lab@eastpark.org',
    status: 'Inactive', pediatricAgeThreshold: null, authorizedPediatricPathologistIds: [],
    // Oncology centre — fast first touch, 24h total
    tatFirstTouchHours: 4,  tatTotalHours: 24,
    escalationTargets: ['pathGroup', 'admin', 'referrer'], escalationPriority: 'critical',
  },
];

const load = () => storageGet<Client[]>('pathscribe_clients', SEED_CLIENTS);
const persist = (data: Client[]) => storageSet('pathscribe_clients', data);
let MOCK_CLIENTS: Client[] = load();

const ok    = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err   = <T>(error: string): ServiceResult<T> => ({ ok: false, error });
const delay = () => new Promise(r => setTimeout(r, 80));

export const mockClientService: IClientService = {
  async getAll() { await delay(); return ok([...MOCK_CLIENTS]); },

  async getById(id: ID) {
    await delay();
    const c = MOCK_CLIENTS.find(c => c.id === id);
    return c ? ok({ ...c }) : err(`Client ${id} not found`);
  },

  async add(client) {
    await delay();
    const newC: Client = { ...client, id: 'c' + Date.now() };
    MOCK_CLIENTS = [...MOCK_CLIENTS, newC];
    persist(MOCK_CLIENTS);
    return ok({ ...newC });
  },

  async update(id, changes) {
    await delay();
    const idx = MOCK_CLIENTS.findIndex(c => c.id === id);
    if (idx === -1) return err(`Client ${id} not found`);
    MOCK_CLIENTS = MOCK_CLIENTS.map(c => c.id === id ? { ...c, ...changes } : c);
    persist(MOCK_CLIENTS);
    return ok({ ...MOCK_CLIENTS[idx], ...changes });
  },

  async deactivate(id) { return mockClientService.update(id, { status: 'Inactive' }); },
  async reactivate(id) { return mockClientService.update(id, { status: 'Active' }); },
};
