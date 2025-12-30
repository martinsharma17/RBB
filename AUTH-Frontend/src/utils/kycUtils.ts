import type { KycData } from '../types';

/**
 * Cleans form data before sending to the backend.
 * Specifically converts empty strings ("") to null for nullable backend types (like DateTime?).
 */
export const cleanKycData = (data: KycData): KycData => {
    const cleaned: KycData = { ...data };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === "") {
            cleaned[key] = null;
        }
    });
    return cleaned;
};
