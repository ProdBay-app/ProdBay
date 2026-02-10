import React, { useEffect, useMemo, useState } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/hooks/useNotification';

interface ProfileFormState {
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber: string;
}

const ProducerSettings: React.FC = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const initialFormState = useMemo<ProfileFormState>(() => {
    const metadata = user?.user_metadata ?? {};
    return {
      firstName: typeof metadata.first_name === 'string' ? metadata.first_name : '',
      lastName: typeof metadata.last_name === 'string' ? metadata.last_name : '',
      companyName: typeof metadata.company_name === 'string' ? metadata.company_name : '',
      phoneNumber: typeof metadata.phone_number === 'string' ? metadata.phone_number : ''
    };
  }, [user?.user_metadata]);

  const [form, setForm] = useState<ProfileFormState>(initialFormState);
  const cameFromOnboarding = Boolean((location.state as { fromOnboarding?: boolean } | null)?.fromOnboarding);
  const hasCompanyName = form.companyName.trim().length > 0;
  const showBackToOnboarding = cameFromOnboarding || !hasCompanyName;

  useEffect(() => {
    setForm(initialFormState);
  }, [initialFormState]);

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      showError('You must be logged in to update your profile.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...(user.user_metadata ?? {}),
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          company_name: form.companyName.trim(),
          phone_number: form.phoneNumber.trim()
        }
      });

      if (error) throw error;

      showSuccess('Profile updated successfully.');
    } catch (err) {
      console.error('[ProducerSettings] Failed to update profile:', err);
      showError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="bg-transparent border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-200 mt-1">Update your producer profile details.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Profile</h2>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-200 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-200 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-200 mb-2">
                Company Name <span className="text-red-300">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                required
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-200 mb-2">
                Phone Number <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                {showBackToOnboarding && (
                  <button
                    type="button"
                    onClick={() => navigate('/onboarding')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Onboarding
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ProducerSettings;
