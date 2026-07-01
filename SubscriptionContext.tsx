import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE } from './config/api';

interface SubscriptionContextType {
  loading: boolean;
  hasPermission: (permissionKey: string) => boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{
  organizationId?: string;
  children: ReactNode;
}> = ({ organizationId, children }) => {
  const [loading, setLoading] = useState(true);
  const [allowedFeatures, setAllowedFeatures] = useState<Set<string>>(new Set());
  const [isPremium, setIsPremium] = useState(false);

  const refreshSubscription = async () => {
    if (!organizationId) {
      setAllowedFeatures(new Set());
      setIsPremium(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/subscriptions/${organizationId}`);
      if (!response.ok) {
        setLoading(false);
        return;
      }

      const subscription = await response.json();
      
      if (!subscription || subscription.status !== 'ACTIVE') {
        setAllowedFeatures(new Set());
        setIsPremium(false);
        setLoading(false);
        return;
      }

      if (subscription.plans?.type === 'PREMIUM') {
        setIsPremium(true);
        setLoading(false);
        return;
      }

      if (subscription.plans?.type === 'CUSTOM') {
        const purchasedModules = subscription.purchased_modules || [];
        if (purchasedModules.length === 0) {
          setAllowedFeatures(new Set());
          setLoading(false);
          return;
        }

        const modResponse = await fetch(`${API_BASE}/subscriptions/modules`);
        if (modResponse.ok) {
          const allModules = await modResponse.json();
          const activeFeatures = new Set<string>();
          
          allModules.forEach((mod: any) => {
            if (purchasedModules.includes(mod.id)) {
              mod.features?.forEach((feat: any) => {
                if (feat.is_active) {
                  activeFeatures.add(feat.permission_key);
                }
              });
            }
          });
          
          setAllowedFeatures(activeFeatures);
          setIsPremium(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [organizationId]);

  const hasPermission = (permissionKey: string): boolean => {
    if (isPremium) return true;
    return allowedFeatures.has(permissionKey);
  };

  return (
    <SubscriptionContext.Provider value={{ loading, hasPermission, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
