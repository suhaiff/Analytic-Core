import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, LayoutDashboard, CheckCircle2, ChevronRight, Save, X, DollarSign, Box } from 'lucide-react';
import { API_BASE } from '../../config/api';

interface Plan {
  id: string;
  name: string;
  type: string;
  monthly_price: number;
  yearly_price: number;
}

interface Feature {
  id: string;
  permission_key: string;
  display_name: string;
  description?: string;
  monthly_price?: number;
  yearly_price?: number;
}

interface Module {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  features?: Feature[];
}

export const AdminSubscriptionManagement: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'modules' | 'features'>('modules');

  // States for Editing
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  // States for Adding Module
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleForm, setNewModuleForm] = useState({
    name: '',
    description: '',
    monthly_price: 0,
    yearly_price: 0,
    icon: 'LayoutDashboard'
  });

  // States for Adding Feature to Module
  const [isAddingFeatureTo, setIsAddingFeatureTo] = useState<string | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState('');

  // States for Creating Standalone Feature
  const [isCreatingFeature, setIsCreatingFeature] = useState(false);
  const [newFeatureForm, setNewFeatureForm] = useState({
    display_name: '',
    permission_key: '',
    description: '',
    monthly_price: 0,
    yearly_price: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, modulesRes, featuresRes] = await Promise.all([
        fetch(`${API_BASE}/subscriptions/plans`),
        fetch(`${API_BASE}/subscriptions/modules`),
        fetch(`${API_BASE}/subscriptions/features`)
      ]);

      if (plansRes.ok) setPlans(await plansRes.json());
      if (modulesRes.ok) setModules(await modulesRes.json());
      if (featuresRes.ok) setAllFeatures(await featuresRes.json());
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  };

  const handleUpdatePlanPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/plans/${editingPlan.id}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthly_price: editingPlan.monthly_price,
          yearly_price: editingPlan.yearly_price
        })
      });
      if (res.ok) {
        setEditingPlan(null);
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModuleForm)
      });
      if (res.ok) {
        setIsAddingModule(false);
        setNewModuleForm({ name: '', description: '', monthly_price: 0, yearly_price: 0, icon: 'LayoutDashboard' });
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssignFeatureToModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddingFeatureTo || !selectedFeatureId) return;
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/modules/${isAddingFeatureTo}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_id: selectedFeatureId })
      });
      if (res.ok) {
        setIsAddingFeatureTo(null);
        setSelectedFeatureId('');
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeatureForm)
      });
      if (res.ok) {
        setIsCreatingFeature(false);
        setNewFeatureForm({ display_name: '', permission_key: '', description: '', monthly_price: 0, yearly_price: 0 });
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/20 dark:border-slate-800/50 shadow-sm">
        <div>
          <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Subscription & Revenue Engine
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Configure base plans, module pricing, and feature gating.</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('modules')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'modules' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Plans & Modules
          </button>
          <button 
            onClick={() => setActiveTab('features')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'features' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Feature Library
          </button>
        </div>
      </div>

      {activeTab === 'modules' && (
        <>
          {/* Plans Management */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 ml-2">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Settings className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Base Plans Overview</h3>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="relative group perspective">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${plan.type === 'PREMIUM' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                        {plan.type}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active
                      </span>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {plan.type === 'PREMIUM' ? 'All-inclusive enterprise access to every module.' : 'Flexible base platform with modular add-ons.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setEditingPlan(plan)}
                    className="p-2.5 text-slate-400 hover:text-indigo-500 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20 shrink-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Simulated Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Orgs</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {plan.type === 'PREMIUM' ? '24' : '156'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Monthly MRR</p>
                    <p className="text-xl font-bold text-emerald-500 flex items-center gap-1.5">
                      ${plan.type === 'PREMIUM' ? (24 * plan.monthly_price).toLocaleString() : (156 * plan.monthly_price).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-auto">
                  {editingPlan?.id === plan.id ? (
                    <form onSubmit={handleUpdatePlanPrice} className="space-y-5 animate-fade-in-up bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Monthly Price</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              type="number" 
                              value={editingPlan.monthly_price}
                              onChange={e => setEditingPlan({...editingPlan, monthly_price: Number(e.target.value)})}
                              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Yearly Price</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              type="number" 
                              value={editingPlan.yearly_price}
                              onChange={e => setEditingPlan({...editingPlan, yearly_price: Number(e.target.value)})}
                              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                          <Save className="w-4 h-4" /> Save Pricing
                        </button>
                        <button type="button" onClick={() => setEditingPlan(null)} className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-center relative overflow-hidden group/card">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover/card:scale-110 transition-transform">
                           <DollarSign className="w-12 h-12" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 relative z-10">Monthly Billing</span>
                        <div className="flex items-baseline gap-1 relative z-10">
                          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">${plan.monthly_price}</span>
                          <span className="text-sm font-medium text-slate-500">/mo</span>
                        </div>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-center relative overflow-hidden group/card">
                         <div className="absolute right-0 top-0 p-4 opacity-5 group-hover/card:scale-110 transition-transform">
                           <DollarSign className="w-12 h-12" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 relative z-10">Yearly Billing</span>
                        <div className="flex items-baseline gap-1 relative z-10">
                          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">${plan.yearly_price}</span>
                          <span className="text-sm font-medium text-slate-500">/yr</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules Management */}
      <div className="pt-8">
        <div className="flex justify-between items-center mb-6 ml-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Box className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Business Modules</h3>
          </div>
          <button 
            onClick={() => setIsAddingModule(true)}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" /> New Module
          </button>
        </div>
        
        <div className="grid gap-6">
          {modules.map(mod => (
            <div key={mod.id} className="bg-white dark:bg-slate-800/80 backdrop-blur-xl p-6 lg:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col lg:flex-row gap-8">
              
              {/* Module Header & Pricing */}
              <div className="lg:w-1/3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{mod.name}</h4>
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Monthly</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">${mod.monthly_price}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Yearly</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">${mod.yearly_price}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Features List */}
              <div className="lg:w-2/3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Bundled Features
                  </h5>
                  <button 
                    onClick={() => setIsAddingFeatureTo(mod.id)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3"/> Add Feature
                  </button>
                </div>
                
                {mod.features && mod.features.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {mod.features.map(feat => (
                      <div key={feat.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm group">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{feat.display_name}</span>
                          <span className="text-[10px] font-mono text-slate-400 mt-0.5">{feat.permission_key}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="text-sm text-slate-500">No features assigned to this module yet.</p>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center ml-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Box className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Master Feature Library</h3>
            </div>
            <button 
              onClick={() => setIsCreatingFeature(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2"
            >
              <Plus className="w-4 h-4"/> Create Feature
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allFeatures.map(feat => (
              <div key={feat.id} className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">{feat.display_name}</h4>
                  <span className="text-[10px] font-mono text-purple-600 bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded-md">
                    {feat.permission_key}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{feat.description || 'No description provided.'}</p>
                <div className="flex items-center gap-4 text-sm font-bold">
                  <span className="text-slate-700 dark:text-slate-300">${feat.monthly_price}/mo</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-700 dark:text-slate-300">${feat.yearly_price}/yr</span>
                </div>
              </div>
            ))}
            {allFeatures.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                No features in the library. Create one to get started!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {isAddingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Module</h3>
              <button onClick={() => setIsAddingModule(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleAddModule} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Module Name</label>
                <input 
                  type="text" required
                  value={newModuleForm.name}
                  onChange={e => setNewModuleForm({...newModuleForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Advanced Analytics"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Description</label>
                <textarea 
                  value={newModuleForm.description}
                  onChange={e => setNewModuleForm({...newModuleForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  placeholder="Brief description of the module..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Monthly Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" required
                      value={newModuleForm.monthly_price}
                      onChange={e => setNewModuleForm({...newModuleForm, monthly_price: Number(e.target.value)})}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Yearly Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" required
                      value={newModuleForm.yearly_price}
                      onChange={e => setNewModuleForm({...newModuleForm, yearly_price: Number(e.target.value)})}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/25">
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Feature to Module Modal */}
      {isAddingFeatureTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Assign Feature</h3>
              <button onClick={() => { setIsAddingFeatureTo(null); setSelectedFeatureId(''); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleAssignFeatureToModule} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Select Feature from Library</label>
                <div className="relative">
                  <select 
                    required
                    value={selectedFeatureId}
                    onChange={e => setSelectedFeatureId(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium text-slate-700 dark:text-slate-200"
                  >
                    <option value="" disabled>-- Select a feature --</option>
                    {allFeatures.map(f => (
                      <option key={f.id} value={f.id}>{f.display_name} ({f.permission_key})</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/25">
                  Assign to Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Standalone Feature Modal */}
      {isCreatingFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Feature</h3>
              <button onClick={() => setIsCreatingFeature(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateFeature} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Display Name</label>
                <input 
                  type="text" required
                  value={newFeatureForm.display_name}
                  onChange={e => setNewFeatureForm({...newFeatureForm, display_name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Export to PDF"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Permission Key (Code identifier)</label>
                <input 
                  type="text" required
                  value={newFeatureForm.permission_key}
                  onChange={e => setNewFeatureForm({...newFeatureForm, permission_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  placeholder="e.g., export_pdf"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Description</label>
                <textarea 
                  value={newFeatureForm.description}
                  onChange={e => setNewFeatureForm({...newFeatureForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  placeholder="Brief description of the feature..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Monthly Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" required
                      value={newFeatureForm.monthly_price}
                      onChange={e => setNewFeatureForm({...newFeatureForm, monthly_price: Number(e.target.value)})}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Yearly Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" required
                      value={newFeatureForm.yearly_price}
                      onChange={e => setNewFeatureForm({...newFeatureForm, yearly_price: Number(e.target.value)})}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-purple-500/25">
                  Create Feature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
