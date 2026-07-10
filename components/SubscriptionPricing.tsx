import { fetchWithAuth } from '../utils/fetchWithAuth';
import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, Building2, ChevronDown, ChevronUp, Sparkles, CreditCard, LayoutDashboard, BrainCircuit, FileText } from 'lucide-react';
import { API_BASE } from '../config/api';
import { User } from '../types';
import { PaymentQRModal } from './PaymentQRModal';

interface Plan {
  id: string;
  name: string;
  type: 'PREMIUM' | 'CUSTOM';
  description: string;
  monthly_price: number;
  yearly_price: number;
}

interface Feature {
  id: string;
  permission_key: string;
  display_name: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  monthly_price: number;
  yearly_price: number;
  features?: Feature[];
}

interface SubscriptionPricingProps {
  onBack?: () => void;
  user: User | null;
}

export const SubscriptionPricing: React.FC<SubscriptionPricingProps> = ({ onBack, user }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [previouslyPurchasedModules, setPreviouslyPurchasedModules] = useState<string[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    planId: string;
    planName: string;
    planType: 'PREMIUM' | 'CUSTOM';
    amount: number;
  } | null>(null);

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const fetchPromises = [
          fetchWithAuth(`${API_BASE}/subscriptions/plans`),
          fetchWithAuth(`${API_BASE}/subscriptions/modules`)
        ];

        if (user && user.organization_id) {
          fetchPromises.push(fetchWithAuth(`${API_BASE}/subscriptions/${user.organization_id}`));
        }

        const responses = await Promise.all(fetchPromises);
        const [plansRes, modulesRes, subRes] = responses;

        if (plansRes.ok) setPlans(await plansRes.json());
        if (modulesRes.ok) setModules(await modulesRes.json());

        if (subRes && subRes.ok) {
          const subscription = await subRes.json();
          if (subscription && subscription.status === 'ACTIVE') {
            if (subscription.plans) {
              setCurrentPlanId(subscription.plans.id);
            }
            if (subscription.billing_cycle) {
              setBillingCycle(subscription.billing_cycle);
            }
            if (subscription.purchased_modules && subscription.purchased_modules.length > 0) {
              setSelectedModules(subscription.purchased_modules);
              setPreviouslyPurchasedModules(subscription.purchased_modules);
            }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        setLoading(false);
      }
    };
    fetchPricingData();
  }, []);

  const premiumPlan = plans.find(p => p.type === 'PREMIUM');
  const customPlan = plans.find(p => p.type === 'CUSTOM');

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const calculateCustomTotal = () => {
    let total = 0;
    // Only charge for modules that weren't previously purchased
    const newModules = selectedModules.filter(id => !previouslyPurchasedModules.includes(id));
    newModules.forEach(moduleId => {
      const mod = modules.find(m => m.id === moduleId);
      if (mod) {
        total += billingCycle === 'YEARLY' ? mod.yearly_price : mod.monthly_price;
      }
    });
    return total;
  };

  const calculateCustomMonthlyEquivalent = () => {
    if (billingCycle === 'MONTHLY') return calculateCustomTotal();
    return calculateCustomTotal() / 12;
  };

  const openPaymentModal = (planId: string, isCustom: boolean) => {
    if (!user) {
      alert('You need to be logged in to subscribe.');
      return;
    }
    const plan = isCustom ? customPlan : premiumPlan;
    if (!plan) return;
    const amount = isCustom
      ? (billingCycle === 'YEARLY' ? calculateCustomTotal() : calculateCustomTotal())
      : (billingCycle === 'YEARLY' ? premiumPlan!.yearly_price : premiumPlan!.monthly_price);

    setPaymentModal({
      open: true,
      planId,
      planName: plan.name,
      planType: isCustom ? 'CUSTOM' : 'PREMIUM',
      amount,
    });
  };

  const filteredModules = modules.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const IconMap: Record<string, React.ElementType> = {
    LayoutDashboard,
    BrainCircuit,
    FileText,
    Building2,
    Sparkles
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  const mainContent = (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          &larr; Back to Dashboard
        </button>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Enterprise Scale. Intelligent Pricing.
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Choose the complete Premium experience or build a Custom solution tailored for your organization.
          </p>

          <div className="flex items-center justify-center mt-8">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm flex items-center border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  billingCycle === 'MONTHLY' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  billingCycle === 'YEARLY' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Yearly <span className="ml-1 text-xs text-green-300 bg-green-700/30 px-2 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Premium Card */}
          {premiumPlan && (
            <div className="relative group perspective">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="absolute top-0 right-0 -mr-2 -mt-2">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Recommended
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{premiumPlan.name}</h3>
                    {currentPlanId === premiumPlan.id && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active Plan
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">{premiumPlan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight">
                      ₹{billingCycle === 'YEARLY' ? (premiumPlan.yearly_price / 12).toFixed(0) : premiumPlan.monthly_price}
                    </span>
                    <span className="text-slate-500 font-medium">/mo</span>
                  </div>
                  {billingCycle === 'YEARLY' && (
                    <p className="text-sm text-slate-500 mt-2">Billed ₹{(premiumPlan.yearly_price).toLocaleString()} yearly</p>
                  )}
                </div>

                <ul className="space-y-4 mb-8 flex-grow">
                  {[
                    "Every feature in the application",
                    "Unlimited access to all modules",
                    "Future features automatically included",
                    "No feature selection required",
                    "Priority 24/7 Enterprise Support",
                    "Dedicated Account Manager"
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full">
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">{feat}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => openPaymentModal(premiumPlan.id, false)}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {currentPlanId === premiumPlan.id ? 'Update Premium Subscription' : 'Subscribe to Premium'} <Sparkles className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Custom Plan Builder */}
          {customPlan && (
            <div className="relative h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col">
              <div className="p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{customPlan.name}</h3>
                  {currentPlanId === customPlan.id && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active Plan
                    </span>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400">{customPlan.description}</p>
                
                <div className="mt-6 relative">
                  <input 
                    type="text" 
                    placeholder="Search modules (e.g., Dashboard, AI)" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-4 max-h-[500px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {filteredModules.map(mod => {
                  const isSelected = selectedModules.includes(mod.id);
                  const isExpanded = expandedModule === mod.id;
                  const Icon = IconMap[mod.icon] || LayoutDashboard;
                  const price = billingCycle === 'YEARLY' ? mod.yearly_price : mod.monthly_price;

                  return (
                    <div 
                      key={mod.id} 
                      className={`border rounded-2xl transition-all duration-300 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-md' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                      }`}
                    >
                      <div 
                        className="p-4 flex items-center cursor-pointer select-none"
                        onClick={() => handleModuleToggle(mod.id)}
                      >
                        <div className="mr-4">
                          <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4 text-blue-600 dark:text-blue-400">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-semibold text-slate-900 dark:text-white">{mod.name}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{mod.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-slate-900 dark:text-white">₹{price}</div>
                          <div className="text-xs text-slate-500">/{billingCycle === 'YEARLY' ? 'yr' : 'mo'}</div>
                        </div>
                        <div 
                          className="ml-4 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedModule(isExpanded ? null : mod.id);
                          }}
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                        </div>
                      </div>

                      {/* Expanded Features */}
                      {isExpanded && mod.features && (
                        <div className="px-14 pb-5 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                          <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-3">Included Features:</h5>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mod.features.map(feat => (
                              <li key={feat.id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                {feat.display_name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredModules.length === 0 && (
                  <div className="text-center py-8 text-slate-500">No modules found.</div>
                )}
              </div>

              {/* Sticky Summary */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Estimated Total</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-900 dark:text-white">
                        ₹{calculateCustomMonthlyEquivalent().toFixed(0)}
                      </span>
                      <span className="text-slate-500">/mo</span>
                    </div>
                    {billingCycle === 'YEARLY' && (
                      <div className="text-xs text-slate-500 mt-1">Billed ₹{calculateCustomTotal().toLocaleString()} yearly</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {selectedModules.length} Modules Selected
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => openPaymentModal(customPlan.id, true)}
                  disabled={selectedModules.length === 0}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    selectedModules.length > 0
                      ? 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  {currentPlanId === customPlan.id ? 'Update Custom Plan' : 'Subscribe to Custom Plan'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Payment QR Modal
  const modal = paymentModal?.open ? (
    <PaymentQRModal
      isOpen={true}
      onClose={() => setPaymentModal(null)}
      user={user}
      planId={paymentModal.planId}
      planName={paymentModal.planName}
      planType={paymentModal.planType}
      billingCycle={billingCycle}
      amount={paymentModal.amount}
      moduleIds={selectedModules}
      organizationId={user?.organization_id || null}
    />
  ) : null;

  return (
    <>
      {mainContent}
      {modal}
    </>
  );
};
