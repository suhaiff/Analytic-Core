import React from 'react';
import { useSubscription } from '../SubscriptionContext';

interface PermissionGateProps {
  permissionKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Enterprise SaaS Permission Gate
 * Checks if the organization's active subscription includes the required permission key.
 * Now uses the global SubscriptionContext for zero-latency checks.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  permissionKey, 
  children, 
  fallback = null 
}) => {
  const { loading, hasPermission } = useSubscription();

  if (loading) {
    return <div className="animate-pulse h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>;
  }

  if (hasPermission(permissionKey)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

