import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { v4 as uuid } from "uuid";

export interface ClientDefinition {
  clientId: string;
  clientCode: string;
  displayName: string;
  status: "active" | "inactive";
  hl7FacilityCode?: string;
  hl7ApplicationCode?: string;
  defaultAccessionPrefix?: string;
  defaultProviderCode?: string;
  timezone?: string;
  preferredTransport?: "SFTP" | "API" | "VPN" | "None";
  logoUrl?: string;
  reportTemplates?: string[];
  headerRules?: string;
  footerRules?: string;
  disclaimerText?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientDictionaryContextValue {
  clients: ClientDefinition[];
  addClient: (
    data: Omit<ClientDefinition, "clientId" | "createdAt" | "updatedAt">
  ) => void;
  updateClient: (clientId: string, updates: Partial<ClientDefinition>) => void;
  deleteClient: (clientId: string) => void;
}

const ClientDictionaryContext = createContext<ClientDictionaryContextValue | undefined>(undefined);

export const ClientDictionaryProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<ClientDefinition[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("clientDictionary");
    if (stored) setClients(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("clientDictionary", JSON.stringify(clients));
  }, [clients]);

  const addClient = (
    data: Omit<ClientDefinition, "clientId" | "createdAt" | "updatedAt">
  ) => {
    const newClient: ClientDefinition = {
      clientId: uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    setClients((prev) => [...prev, newClient]);
  };

  const updateClient = (clientId: string, updates: Partial<ClientDefinition>) => {
    setClients((prev) =>
      prev.map((c) =>
        c.clientId === clientId
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  const deleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.clientId !== clientId));
  };

  return (
    <ClientDictionaryContext.Provider
      value={{ clients, addClient, updateClient, deleteClient }}
    >
      {children}
    </ClientDictionaryContext.Provider>
  );
};

export const useClientDictionary = () => {
  const ctx = useContext(ClientDictionaryContext);
  if (!ctx) {
    throw new Error("useClientDictionary must be used within ClientDictionaryProvider");
  }
  return ctx;
};
