import { IAIBehaviorService, AIBehaviorConfig, AI_BEHAVIOR_DEFAULTS } from './IAIBehaviorService';
import { storageGet, storageSet } from '../mockStorage';
import { ServiceResult } from '../types';

const load    = () => storageGet<AIBehaviorConfig>('pathscribe_aiBehavior', AI_BEHAVIOR_DEFAULTS);
const persist = (d: AIBehaviorConfig) => storageSet('pathscribe_aiBehavior', d);
let MOCK_CONFIG: AIBehaviorConfig = load();

const ok    = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const delay = () => new Promise(r => setTimeout(r, 80));

export const mockAIBehaviorService: IAIBehaviorService = {
  async get() {
    await delay();
    return ok({ ...MOCK_CONFIG });
  },

  async update(changes) {
    await delay();
    MOCK_CONFIG = { ...MOCK_CONFIG, ...changes };
    persist(MOCK_CONFIG);
    return ok({ ...MOCK_CONFIG });
  },

  async reset() {
    await delay();
    MOCK_CONFIG = { ...AI_BEHAVIOR_DEFAULTS };
    persist(MOCK_CONFIG);
    return ok({ ...MOCK_CONFIG });
  },
};
