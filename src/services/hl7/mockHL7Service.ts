/**
 * mockHL7Service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * HL7 v2.x stub — simulates outbound messages to the LIS.
 * Replace with a real HTTP/MLLP transport when connecting to production.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { ServiceResult } from '../types';

export type HL7MessageType =
  | 'ADT^A08'   // Update Patient Information — used to update case owner
  | 'ORM^O01'   // Order Message — used for new/updated orders
  | 'ORU^R01';  // Observation Result — used for result transmission

export interface HL7Message {
  messageType:   HL7MessageType;
  messageId:     string;
  timestamp:     string;
  patientId?:    string;
  caseId:        string;
  payload:       Record<string, string>;
}

export interface IHL7Service {
  send(msg: HL7Message): Promise<ServiceResult<{ ack: string }>>;
  updateCaseOwner(caseId: string, newOwnerId: string, patientId?: string): Promise<ServiceResult<{ ack: string }>>;
}

const ok  = <T>(data: T): ServiceResult<T>    => ({ ok: true,  data });
const delay = () => new Promise(r => setTimeout(r, 120));

export const mockHL7Service: IHL7Service = {

  async send(msg: HL7Message) {
    await delay();
    console.info(`[HL7 STUB] ${msg.messageType} → caseId=${msg.caseId} msgId=${msg.messageId}`);
    // Simulate ACK:AA (Application Accept)
    return ok({ ack: `MSH|^~\\&|PATHSCRIBE|LAB|LIS|HOSP|${msg.timestamp}||ACK^${msg.messageType.split('^')[1]}|${msg.messageId}|P|2.5\rMSA|AA|${msg.messageId}` });
  },

  async updateCaseOwner(caseId, newOwnerId, patientId) {
    const msgId = `HL7-${Date.now()}`;
    return mockHL7Service.send({
      messageType: 'ADT^A08',
      messageId:   msgId,
      timestamp:   new Date().toISOString(),
      caseId,
      patientId,
      payload: {
        PID_3:  patientId ?? '',
        PV1_7:  newOwnerId,   // Attending Doctor field
        ZPS_1:  caseId,       // Custom PathScribe segment
        ZPS_2:  newOwnerId,
      },
    });
  },

};
