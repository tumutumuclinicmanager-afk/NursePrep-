import DOMPurify from 'dompurify';
import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

/**
 * Catches and logs Firestore permission/execution errors securely.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Security Audit Exception:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Sanitizes user text inputs to prevent XSS script injections.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input.trim());
}

/**
 * Validates phone numbers for M-Pesa / SMS APIs (strictly digits, optional + prefix).
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[0-9]{9,15}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Validates email addresses using RFC standard regex.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
