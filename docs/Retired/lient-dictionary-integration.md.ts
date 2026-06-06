/**
 * useClientDictionary.ts
 * Located at: src/context/useClientDictionary.ts
 *
 * Manages the client dictionary â€” the list of lab clients (submitting practices,
 * hospitals, etc.) with their HL7 settings and reporting preferences.
 *
 * Persists to localStorage so entries survive page refresh.
 * Exported as a plain hook (no React context needed â€” the data set is small
 * and only consumed by the Client Dictionary config page).
 */

import { useState, useCallback } from "react";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  name: string;           // e.g. "Northwest Oncology Group"
  code: string;           // short identifier e.g. "NWOG"
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  active: boolean;
  hl7: ClientHL7Settings;
  reporting: ClientReportingPreferences;
  createdAt: string;      // ISO date string
  updatedAt: string;
}

export type ClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">;

// â”€â”€â”€ localStorage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Demo data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DEMO_CLIENTS: Client[] = [
  {
    id: "client-001",
    name: "Northwest Oncology Group",
    code: "NWOG",
    contactName: "Dr. Patricia Lee",
    contactEmail: "plee@nwog.example.com",
    contactPhone: "555-210-4400",
    address: "4400 Medical Parkway, Seattle, WA 98101",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "NWOG",
      hl7Version: "2.5.1",
      enabled: true,
    },
    reporting: {
      reportFormat: "Both",
      deliveryMethod: "HL7",
      autoRelease: true,
      copyToReferring: false,
    },
    createdAt: "2025-01-10T09:00:00Z",
    updatedAt: "2025-01-10T09:00:00Z",
  },
  {
    id: "client-002",
    name: "Valley Women's Health",
    code: "VWH",
    contactName: "Dr. Sandra Kim",
    contactEmail: "skim@vwh.example.com",
    contactPhone: "555-880-2200",
    address: "220 Wellness Blvd, Portland, OR 97201",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "VWH",
      hl7Version: "2.5.1",
      enabled: false,
    },
    reporting: {
      reportFormat: "PDF",
      deliveryMethod: "Portal",
      autoRelease: false,
      copyToReferring: true,
    },
    createdAt: "2025-03-05T11:00:00Z",
    updatedAt: "2025-03-05T11:00:00Z",
  },
  {
    id: "client-003",
    name: "Summit Regional Medical Center",
    code: "SRMC",
    contactName: "James Ortega",
    contactEmail: "jortega@srmc.example.com",
    contactPhone: "555-340-7700",
    address: "7700 Summit Drive, Denver, CO 80201",
    active: true,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "SRMC",
      hl7Version: "2.5.1",
      enabled: true,
    },
    reporting: {
      reportFormat: "Both",
      deliveryMethod: "HL7",
      autoRelease: true,
      copyToReferring: true,
    },
    createdAt: "2025-04-18T14:30:00Z",
    updatedAt: "2025-04-18T14:30:00Z",
  },
  {
    id: "client-004",
    name: "Eastside Dermatology Partners",
    code: "EDP",
    contactName: "Dr. Michelle Tran",
    contactEmail: "mtran@edp.example.com",
    contactPhone: "555-620-1100",
    address: "1100 Eastside Ave, Bellevue, WA 98004",
    active: false,
    hl7: {
      sendingFacility: "pathscribe",
      receivingFacility: "EDP",
      hl7Version: "2.4",
      enabled: false,
    },
    reporting: {
      reportFormat: "PDF",
      deliveryMethod: "Email",
      autoRelease: false,
      copyToReferring: false,
    },
    createdAt: "2024-11-01T08:00:00Z",
    updatedAt: "2025-02-14T10:15:00Z",
  },
];

// â”€â”€â”€ Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  return { clients, addClient, updateClient, deleteClient, getClient };
};

