import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { supabase } from '@/lib/supabase';
import SettingsSection from './SettingsSection';

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 10 avatar presets: distinct colors; avatar shows user initials */
const AVATAR_PRESETS = [
  { id: 0, label: 'Teal', bgClass: 'bg-teal-500' },
  { id: 1, label: 'Blue', bgClass: 'bg-blue-500' },
  { id: 2, label: 'Violet', bgClass: 'bg-violet-500' },
  { id: 3, label: 'Amber', bgClass: 'bg-amber-500' },
  { id: 4, label: 'Rose', bgClass: 'bg-rose-500' },
  { id: 5, label: 'Emerald', bgClass: 'bg-emerald-500' },
  { id: 6, label: 'Sky', bgClass: 'bg-sky-500' },
  { id: 7, label: 'Indigo', bgClass: 'bg-indigo-500' },
  { id: 8, label: 'Orange', bgClass: 'bg-orange-500' },
  { id: 9, label: 'Pink', bgClass: 'bg-pink-500' },
] as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ProfileFormState {
  name: string;
  email: string;
  bio: string;
  avatarId: number;
  companyName: string;
  phoneNumber: string;
}

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormState, string>>>({});

  const getInitialState = useCallback((): ProfileFormState => {
    const metadata = user?.user_metadata ?? {};
    const firstName = typeof metadata.first_name === 'string' ? metadata.first_name : '';
    const lastName = typeof metadata.last_name === 'string' ? metadata.last_name : '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || '';
    const bio = typeof metadata.bio === 'string' ? metadata.bio : '';
    const avatarId =
      typeof metadata.avatar_id === 'number' && metadata.avatar_id >= 0 && metadata.avatar_id <= 9
        ? metadata.avatar_id
        : 0;
    const companyName = typeof metadata.company_name === 'string' ? metadata.company_name : '';
    const phoneNumber = typeof metadata.phone_number === 'string' ? metadata.phone_number : '';

    return {
      name: fullName,
      email: user?.email ?? '',
      bio,
      avatarId,
      companyName,
      phoneNumber,
    };
  }, [user]);

  const [form, setForm] = useState<ProfileFormState>(getInitialState);

  useEffect(() => {
    setForm(getInitialState());
  }, [getInitialState]);

  // Pre-populate company/phone from producers table on mount (source of truth for business branding)
  useEffect(() => {
    if (!user?.id) return;

    const loadProducer = async () => {
      const { data } = await supabase
        .from('producers')
        .select('company_name, phone_number')
        .eq('id', user.id)
        .single();

      if (data) {
        setForm((prev) => ({
          ...prev,
          companyName: data.company_name ?? '',
          phoneNumber: data.phone_number ?? '',
        }));
      }
    };

    loadProducer();
  }, [user?.id]);

  const handleChange = (field: keyof ProfileFormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof ProfileFormState, string>> = {};

    if (!form.name.trim()) {
      next.name = 'Name is required';
    }

    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(form.email)) {
      next.email = 'Please enter a valid email address';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (!user) {
      showError('You must be logged in to update your profile.');
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      // Split name into first and last
      const parts = form.name.trim().split(/\s+/).filter(Boolean);
      const firstName = parts[0] ?? '';
      const lastName = parts.slice(1).join(' ');

      const { error: authError } = await supabase.auth.updateUser({
        email: form.email.trim(),
        data: {
          ...(user.user_metadata ?? {}),
          first_name: firstName,
          last_name: lastName,
          bio: form.bio.trim(),
          avatar_id: form.avatarId,
          company_name: form.companyName.trim(),
          phone_number: form.phoneNumber.trim(),
        },
      });

      if (authError) throw authError;

      const { error: producerError } = await supabase
        .from('producers')
        .upsert(
          {
            id: user.id,
            full_name: form.name.trim(),
            email: form.email.trim(),
            company_name: form.companyName.trim() || null,
            phone_number: form.phoneNumber.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (producerError) throw producerError;

      showSuccess('Settings saved');
    } catch (err) {
      console.error('[ProfileSettings] Failed to update profile:', err);
      showError(
        err instanceof Error ? err.message : 'Failed to update profile. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputBase =
    'w-full px-4 py-2.5 bg-black/20 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all duration-200';

  const inputError = 'border-red-400/60 focus:ring-red-400';
  const inputDefault = 'border-white/20 focus:border-transparent';

  return (
    <form onSubmit={handleSave}>
      <SettingsSection
        title="Profile"
        description="Update your personal information and how others see you."
      >
        <div className="space-y-6">
          {/* Avatar: click to open change section */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-white">Avatar</p>
            <button
              type="button"
              onClick={() => setIsAvatarPickerOpen((prev) => !prev)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-transparent"
              aria-expanded={isAvatarPickerOpen}
              aria-controls="avatar-picker-section"
              id="avatar-trigger"
            >
              <div
                className={`flex-shrink-0 w-16 h-16 rounded-full ${AVATAR_PRESETS[form.avatarId].bgClass} flex items-center justify-center text-xl font-bold text-white shadow-lg ring-2 ring-white/30`}
              >
                {getInitials(form.name)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-300">Click to change</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                  isAvatarPickerOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isAvatarPickerOpen && (
                <motion.div
                  id="avatar-picker-section"
                  role="region"
                  aria-labelledby="avatar-trigger"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 pl-2 pb-2 space-y-3 border-t border-white/10 overflow-visible">
                    <p className="text-sm text-gray-400">
                      Choose a style. Your avatar shows your initials.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 py-3">
                      {AVATAR_PRESETS.map((preset) => {
                        const isSelected = form.avatarId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleChange('avatarId', preset.id)}
                            className={`flex-shrink-0 w-11 h-11 rounded-full ${preset.bgClass} flex items-center justify-center text-sm font-bold text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent ${
                              isSelected
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110'
                                : 'opacity-90 hover:opacity-100'
                            }`}
                            title={preset.label}
                            aria-label={`Select ${preset.label} avatar`}
                            aria-pressed={isSelected}
                          >
                            {getInitials(form.name)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-200 mb-2">
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your full name"
              className={`${inputBase} ${errors.name ? inputError : inputDefault}`}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1.5 text-sm text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-gray-200 mb-2">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="you@example.com"
              className={`${inputBase} ${errors.email ? inputError : inputDefault}`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1.5 text-sm text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="profile-company" className="block text-sm font-medium text-gray-200 mb-2">
              Company Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="profile-company"
              type="text"
              value={form.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Your company or organization"
              className={`${inputBase} ${errors.companyName ? inputError : inputDefault}`}
              aria-invalid={!!errors.companyName}
            />
          </div>

          {/* Business Phone Number */}
          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-200 mb-2">
              Business Phone Number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={`${inputBase} ${errors.phoneNumber ? inputError : inputDefault}`}
              aria-invalid={!!errors.phoneNumber}
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="profile-bio" className="block text-sm font-medium text-gray-200 mb-2">
              Bio <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="profile-bio"
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Tell us a bit about yourself..."
              rows={4}
              className={`${inputBase} resize-y min-h-[100px] ${errors.bio ? inputError : inputDefault}`}
              aria-invalid={!!errors.bio}
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </SettingsSection>
    </form>
  );
};

export default ProfileSettings;
