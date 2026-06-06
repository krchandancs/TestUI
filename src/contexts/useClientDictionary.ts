/**
 * useClientDictionary.ts
 * Located at: src/context/useClientDictionary.ts
 *
 * Manages the client dictionary — the list of lab clients (submitting practices,
 * hospitals, etc.) with their HL7 settings and reporting preferences.
 *
 * Persists to localStorage so entries survive page refresh.
 * Exported as a plain hook (no React context needed — the data set is small
 * and only consumed by the Client Dictionary config page).
 */

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientType = "internal" | "external";
//   internal — the purchasing institution and its affiliated sites
//   external — independent submitting practices or reference lab partners

export interface ClientHL7Settings {
  sendingFacility: string;   // MSH-4
  receivingFacility: string; // MSH-6
  hl7Version: string;        // e.g. "2.5.1"
  enabled: boolean;
}

export interface ClientReportingPreferences {
  reportFormat: "PDF" | "HL7" | "Both";
  deliveryMethod: "Email" | "Fax" | "Portal" | "HL7";
  autoRelease: boolean;
  copyToReferring: boolean;
}

export interface Client {
  id: string;
  clientType: ClientType;  // "internal" = institution/affiliate, "external" = outside client
  parentId?: string;       // affiliates only — points to the parent institution's id
  name: string;            // e.g. "Riverview Health System"
  code: string;            // short uppercase identifier e.g. "RHS"
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  active: boolean;
  hl7: ClientHL7Settings;
  reporting: ClientReportingPreferences;
  createdAt: string;       // ISO date string
  updatedAt: string;
}

export type ClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">;

// ─── localStorage ─────────────────────────────────────────────────────────────

const LS_KEY = "pathscribe:clientDictionary";

const load = (): Client[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : DEMO_CLIENTS;
  } catch {
    return DEMO_CLIENTS;
  }
};

const persist = (clients: Client[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(clients));
  } catch { /* ignore */ }
};

// ─── Demo data ────────────────────────────────────────────────────────────────
//
// Scenario: "Riverview Health System" has purchased pathscribeAI.
// They operate a central pathology lab that serves:
//   &bull; Their own network of affiliated sites           (internal)
//   &bull; Independent practices and reference lab partners (external)
//
// Internal hierarchy:
//   client-INT-001  Riverview Health System          ← parent institution (no parentId)
//   client-INT-002  Riverview Memorial Hospital      ← affiliate
//   client-INT-003  Riverview Eastside Clinic        ← affiliate
//   client-INT-004  Riverview Oncology Center        ← affiliate
//   client-INT-005  Riverview Outreach — Northgate   ← affiliate draw site
//
// External clients:
//   client-EXT-001  Blue Ridge Family Medicine       ← submitting practice
//   client-EXT-002  Summit Women's Health Group      ← submitting practice
//   client-EXT-003  Crestwood Dermatology            ← submitting practice (inactive)
//   client-EXT-004  Pacific Coast Reference Labs     ← reference lab (send-out partner)
//   client-EXT-005  TriState Pathology Consultants   ← reference lab (overflow reads)

const DEMO_CLIENTS: Client[] = [

  // ── Internal: parent institution ───────────────────────────────────────────

  {
    id: "client-INT-001",
    clientType: "internal",
    name: "Riverview Health System",
    code: "RHS",
    contactName: "Dr. Carol Nguyen",
    contactEmail: "cnguyen@riverview.example.com",
    contactPhone: "555-100-0001",
    address: "1 Riverview Plaza, Springfield, IL 62701",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "RHS",
      hl7Version: "2.5.1",
      enabled: true,
    },
    reporting: {
      reportFormat: "Both",
      deliveryMethod: "HL7",
      autoRelease: true,
      copyToReferring: false,
    },
    createdAt: "2024-09-01T08:00:00Z",
    updatedAt: "2024-09-01T08:00:00Z",
  },

  // ── Internal: affiliates ────────────────────────────────────────────────────

  {
    id: "client-INT-002",
    clientType: "internal",
    parentId: "client-INT-001",
    name: "Riverview Memorial Hospital",
    code: "RMH",
    contactName: "Sandra Pratt",
    contactEmail: "spratt@riverview.example.com",
    contactPhone: "555-100-0100",
    address: "100 Memorial Drive, Springfield, IL 62702",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "RMH",
      hl7Version: "2.5.1",
      enabled: true,
    },
    reporting: {
      reportFormat: "Both",
      deliveryMethod: "HL7",
      autoRelease: true,
      copyToReferring: true,
    },
    createdAt: "2024-09-01T08:30:00Z",
    updatedAt: "2024-09-01T08:30:00Z",
  },

  {
    id: "client-INT-003",
    clientType: "internal",
    parentId: "client-INT-001",
    name: "Riverview Eastside Clinic",
    code: "REC",
    contactName: "Tom Vasquez",
    contactEmail: "tvasquez@riverview.example.com",
    contactPhone: "555-100-0200",
    address: "200 Eastside Blvd, Springfield, IL 62703",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "REC",
      hl7Version: "2.5.1",
      enabled: true,
    },
    reporting: {
      reportFormat: "PDF",
      deliveryMethod: "Portal",
      autoRelease: true,
      copyToReferring: true,
    },
    createdAt: "2024-09-02T09:00:00Z",
    updatedAt: "2024-09-02T09:00:00Z",
  },

  {
    id: "client-INT-004",
    clientType: "internal",
    parentId: "client-INT-001",
    name: "Riverview Oncology Center",
    code: "ROC",
    contactName: "Dr. Anita Shah",
    contactEmail: "ashah@riverview.example.com",
    contactPhone: "555-100-0300",
    address: "300 Cancer Care Way, Springfield, IL 62704",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "ROC",
      hl7Version: "2.5.1",
      enabled: true,
    },
    reporting: {
      reportFormat: "Both",
      deliveryMethod: "HL7",
      autoRelease: false,  // oncology requires pathologist sign-off before release
      copyToReferring: true,
    },
    createdAt: "2024-09-03T10:00:00Z",
    updatedAt: "2025-01-15T14:00:00Z",
  },

  {
    id: "client-INT-005",
    clientType: "internal",
    parentId: "client-INT-001",
    name: "Riverview Outreach — Northgate",
    code: "RON",
    contactName: "Lisa Chen",
    contactEmail: "lchen@riverview.example.com",
    contactPhone: "555-100-0400",
    address: "400 Northgate Pkwy, Springfield, IL 62705",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "RON",
      hl7Version: "2.5.1",
      enabled: false,      // draw site uses portal, not direct HL7
    },
    reporting: {
      reportFormat: "PDF",
      deliveryMethod: "Portal",
      autoRelease: true,
      copyToReferring: true,
    },
    createdAt: "2025-02-10T11:00:00Z",
    updatedAt: "2025-02-10T11:00:00Z",
  },

  // ── External: submitting practices ─────────────────────────────────────────

  {
    id: "client-EXT-001",
    clientType: "external",
    name: "Blue Ridge Family Medicine",
    code: "BRFM",
    contactName: "Dr. Kevin O'Brien",
    contactEmail: "kobrien@blueridge.example.com",
    contactPhone: "555-210-1000",
    address: "1000 Blue Ridge Rd, Decatur, IL 62521",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "BRFM",
      hl7Version: "2.5.1",
      enabled: true,
    },
    reporting: {
      reportFormat: "Both",
      deliveryMethod: "HL7",
      autoRelease: true,
      copyToReferring: false,
    },
    createdAt: "2024-10-15T09:00:00Z",
    updatedAt: "2024-10-15T09:00:00Z",
  },

  {
    id: "client-EXT-002",
    clientType: "external",
    name: "Summit Women's Health Group",
    code: "SWHG",
    contactName: "Dr. Maria Flores",
    contactEmail: "mflores@summitwomens.example.com",
    contactPhone: "555-310-2000",
    address: "2000 Summit Blvd, Peoria, IL 61602",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "SWHG",
      hl7Version: "2.5.1",
      enabled: false,
    },
    reporting: {
      reportFormat: "PDF",
      deliveryMethod: "Fax",
      autoRelease: false,
      copyToReferring: true,
    },
    createdAt: "2024-11-20T10:30:00Z",
    updatedAt: "2024-11-20T10:30:00Z",
  },

  {
    id: "client-EXT-003",
    clientType: "external",
    name: "Crestwood Dermatology",
    code: "CRWD",
    contactName: "Dr. Alan Park",
    contactEmail: "apark@crestwood.example.com",
    contactPhone: "555-410-3000",
    address: "3000 Crestwood Lane, Rockford, IL 61101",
    active: false,           // contract lapsed — kept for historical case lookup
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "CRWD",
      hl7Version: "2.4",
      enabled: false,
    },
    reporting: {
      reportFormat: "PDF",
      deliveryMethod: "Email",
      autoRelease: false,
      copyToReferring: false,
    },
    createdAt: "2024-06-01T08:00:00Z",
    updatedAt: "2025-03-01T16:00:00Z",
  },

  // ── External: reference labs ────────────────────────────────────────────────

  {
    id: "client-EXT-004",
    clientType: "external",
    name: "Pacific Coast Reference Labs",
    code: "PCRL",
    contactName: "Rebecca Moss",
    contactEmail: "rmoss@pcrl.example.com",
    contactPhone: "555-510-4000",
    address: "4000 Harbor View Dr, Chicago, IL 60601",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "PCRL",
      hl7Version: "2.5.1",
      enabled: true,         // send-out results return via HL7
    },
    reporting: {
      reportFormat: "HL7",
      deliveryMethod: "HL7",
      autoRelease: false,    // send-outs require pathologist reconciliation
      copyToReferring: false,
    },
    createdAt: "2024-09-15T12:00:00Z",
    updatedAt: "2025-01-08T09:30:00Z",
  },

  {
    id: "client-EXT-005",
    clientType: "external",
    name: "TriState Pathology Consultants",
    code: "TSPC",
    contactName: "Dr. Howard Brennan",
    contactEmail: "hbrennan@tristate.example.com",
    contactPhone: "555-610-5000",
    address: "5000 Tri-State Tollway, Aurora, IL 60502",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "TSPC",
      hl7Version: "2.5.1",
      enabled: true,         // overflow digital reads returned via HL7
    },
    reporting: {
      reportFormat: "Both",
      deliveryMethod: "HL7",
      autoRelease: false,    // consultant reports require attending sign-off
      copyToReferring: true,
    },
    createdAt: "2025-01-20T13:00:00Z",
    updatedAt: "2025-01-20T13:00:00Z",
  },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useClientDictionary = () => {
  const [clients, setClients] = useState<Client[]>(load);

  const save = useCallback((updated: Client[]) => {
    setClients(updated);
    persist(updated);
  }, []);

  const addClient = useCallback(
    (input: ClientInput): Client => {
      const now = new Date().toISOString();
      const newClient: Client = {
        ...input,
        id: `client-${crypto.randomUUID()}`,
        createdAt: now,
        updatedAt: now,
      };
      save([...clients, newClient]);
      return newClient;
    },
    [clients, save],
  );

  const updateClient = useCallback(
    (id: string, input: Partial<ClientInput>) => {
      save(
        clients.map((c) =>
          c.id === id
            ? { ...c, ...input, updatedAt: new Date().toISOString() }
            : c,
        ),
      );
    },
    [clients, save],
  );

  const deleteClient = useCallback(
    (id: string) => {
      save(clients.filter((c) => c.id !== id));
    },
    [clients, save],
  );

  const getClient = useCallback(
    (id: string): Client | undefined => {
      return clients.find((c) => c.id === id);
    },
    [clients],
  );

  // Convenience selectors — useful for dropdowns and filtered views elsewhere
  const internalClients = clients.filter((c) => c.clientType === "internal");
  const externalClients = clients.filter((c) => c.clientType === "external");
  const parentInstitution = clients.find(
    (c) => c.clientType === "internal" && !c.parentId,
  );

  return {
    clients,
    internalClients,
    externalClients,
    parentInstitution,
    addClient,
    updateClient,
    deleteClient,
    getClient,
  };
};
