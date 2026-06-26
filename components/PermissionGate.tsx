import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config/api';

interface PermissionGateProps {
  permissionKey: string;
  organizationId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Enterprise SaaS Permission Gate
 * Checks if the organization's active subscription includes the required permission key.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  permissionKey, 
  organizationId, 
  children, 
  fallback = null 
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      if (!organizationId) {
        setHasPermission(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/subscriptions/${organizationId}`);
        if (!response.ok) {
          setHasPermission(false);
          return;
        }

        const subscription = await response.json();
        
        if (!subscription || subscription.status !== 'ACTIVE') {
          setHasPermission(false);
          return;
        }

        // 1. Premium Plan allows everything
        if (subscription.plans?.type === 'PREMIUM') {
          setHasPermission(true);
          return;
        }

        // 2. Custom Plan checks module features
        if (subscription.plans?.type === 'CUSTOM') {
          const purchasedModules = subscription.purchased_modules || [];
          if (purchasedModules.length === 0) {
            setHasPermission(false);
            return;
          }

          // Fetch all modules to check feature permissions
          // Alternatively, we could create a specific `/api/subscriptions/:org_id/permissions` endpoint
          // For now, we will fetch modules and check if the purchased modules contain the feature.
          const modResponse = await fetch(`${API_BASE}/subscriptions/modules`);
          if (modResponse.ok) {
            const allModules = await modResponse.json();
            const hasAccess = allModules.some((mod: any) => 
              purchasedModules.includes(mod.id) &&
              mod.features?.some((feat: any) => feat.permission_key === permissionKey && feat.is_active)
            );
            
            setHasPermission(hasAccess);
            return;
          }
        }
        
        setHasPermission(false);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [permissionKey, organizationId]);

  if (hasPermission === null) {
    return <div className="animate-pulse h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>;
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
