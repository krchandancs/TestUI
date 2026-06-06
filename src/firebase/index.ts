// src/firebase/index.ts
export { db } from './config';

// functions not yet initialised — stub for services that import it
import { getFunctions } from 'firebase/functions';
import { getApps } from 'firebase/app';
export const functions = getFunctions(getApps()[0]);