import React, { useState, useEffect, useCallback } from 'react';
import { Save, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import SettingsSection from './SettingsSection';

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ProfileFormState {
  name: string;
  email: string;
  bio: string;
}

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormState, string>>>({});

  const getInitialState = useCallback((): ProfileFormState => {
    const metadata = user?.user_metadata ?? {};
    const firstName = typeof metadata.first_name === 'string' ? metadata.first_name : '';
    const lastName = typeof metadata.last_name === 'string' ? metadata.last_name : '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || '';

    return {
      name: fullName,
      email: user?.email ?? '',
      bio: '',
    };
  }, [user]);

  const [form, setForm] = useState<ProfileFormState>(getInitialState);

  useEffect(() => {
    setForm(getInitialState());
  }, [getInitialState]);

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user edits
    if (errors[field]) {
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSaving(true);
    setErrors({});

    // Mock save - simulate API delay
    setTimeout(() => {
      showSuccess('Settings saved');
      setIsSaving(false);
    }, 600);
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
          {/* Avatar Upload Placeholder */}
          <div className="flex items-start gap-6">
            <div
              className="flex-shrink-0 w-24 h-24 rounded-full bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-teal-400/50 hover:bg-white/15 transition-all duration-200 group"
              role="button"
              tabIndex={0}
              onClick={() => {}}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
              }}
              aria-label="Upload avatar (placeholder)"
            >
              <Camera className="w-8 h-8 text-gray-400 group-hover:text-teal-400 transition-colors" />
            </div>
            <div className="flex-1 min-w-0 pt-2">
              <p className="text-sm font-medium text-white">Profile photo</p>
              <p className="text-sm text-gray-400 mt-0.5">
                Click to upload a new avatar. JPG or PNG, max 2MB.
              </p>
            </div>
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
