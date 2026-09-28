import React from 'react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Developer database modal disabled.
 * Database connections and credentials are strictly managed server-side.
 */
export const SupabaseModal: React.FC<SupabaseModalProps> = () => {
  return null;
};
