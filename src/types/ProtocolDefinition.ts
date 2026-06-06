export type ProtocolSource = "CAP" | "RCPath" | "Custom";

export interface ProtocolOption {
  id: string;
  label: string;
}

export type ProtocolQuestionType = "choice" | "text" | "number" | "boolean";

export interface ProtocolQuestion {
  id: string;
  text: string;
  type: ProtocolQuestionType;
  required: boolean;
  options?: ProtocolOption[];
}

export interface ProtocolSection {
  id: string;
  title: string;
  questions: ProtocolQuestion[];
}

export type ProtocolLifecycleState = "draft" | "validated" | "published" | "archived";

export interface ProtocolDefinition {
  id: string;
  name: string;
  version: string;
  source: ProtocolSource;
  lifecycle: ProtocolLifecycleState;
  category?: string;
  isBaseTemplate: boolean;  
  sections: ProtocolSection[];
}
