import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Building2, Users, FolderPlus, RefreshCcw, ArrowRight } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingStatus {
  hasCompanyInfo: boolean;
  supplierCount: number;
  projectCount: number;
}

const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<OnboardingStatus>({
    hasCompanyInfo: false,
    supplierCount: 0,
    projectCount: 0
  });

  const hasCompanyInfo = useMemo(() => {
    const companyName = user?.user_metadata?.company_name;
    return typeof companyName === 'string' && companyName.trim().length > 0;
  }, [user?.user_metadata]);

  const loadOnboardingStatus = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = await getSupabase();

      const [{ count: supplierCount, error: suppliersError }, { count: projectCount, error: projectsError }] = await Promise.all([
        supabase
          .from('suppliers')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('producer_id', user.id)
      ]);

      if (suppliersError) throw suppliersError;
      if (projectsError) throw projectsError;

      setStatus({
        hasCompanyInfo,
        supplierCount: supplierCount ?? 0,
        projectCount: projectCount ?? 0
      });
    } catch (err) {
      console.error('[Onboarding] Failed to load onboarding status:', err);
      setError('Could not load onboarding status. Please try again.');
      setStatus(prev => ({
        ...prev,
        hasCompanyInfo
      }));
    } finally {
      setIsLoading(false);
    }
  }, [user, hasCompanyInfo]);

  useEffect(() => {
    loadOnboardingStatus();
  }, [loadOnboardingStatus]);

  const profileDone = status.hasCompanyInfo;
  const suppliersDone = status.supplierCount > 0;
  const projectsDone = status.projectCount > 0;
  const completedSteps = [profileDone, suppliersDone, projectsDone].filter(Boolean).length;
  const allDone = completedSteps === 3;

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Welcome to ProdBay! Let&apos;s get you set up.
        </h1>
        <p className="text-gray-200 mb-6">
          Complete these steps to unlock your full producer workflow.
        </p>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-200 mb-2">
            <span>Progress</span>
            <span>{completedSteps}/3 complete</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${(completedSteps / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <OnboardingItem
            icon={<Building2 className="w-5 h-5 text-blue-300" />}
            title="Complete Profile"
            done={profileDone}
            description={
              profileDone
                ? 'Company name found in your account profile.'
                : 'Add your company name to complete your producer profile.'
            }
            ctaLabel="Edit Profile"
            ctaTo="/producer/settings"
            ctaState={{ fromOnboarding: true }}
          />

          <OnboardingItem
            icon={<Users className="w-5 h-5 text-purple-300" />}
            title="Add Suppliers"
            done={suppliersDone}
            description={
              suppliersDone
                ? `${status.supplierCount} supplier${status.supplierCount === 1 ? '' : 's'} available.`
                : 'Add at least one supplier so you can request quotes.'
            }
            ctaLabel="Add Supplier"
            ctaTo="/producer/suppliers"
          />

          <OnboardingItem
            icon={<FolderPlus className="w-5 h-5 text-teal-300" />}
            title="Create First Project"
            done={projectsDone}
            description={
              projectsDone
                ? `${status.projectCount} project${status.projectCount === 1 ? '' : 's'} created.`
                : 'Create your first project to start managing production assets.'
            }
            ctaLabel="Create Project"
            ctaTo="/producer/dashboard"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadOnboardingStatus}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors disabled:opacity-60"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>

          {allDone && (
            <Link
              to="/producer/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-300">{error}</p>
        )}
      </div>
    </div>
  );
};

interface OnboardingItemProps {
  icon: React.ReactNode;
  title: string;
  done: boolean;
  description: string;
  ctaLabel: string;
  ctaTo: string;
  ctaState?: Record<string, unknown>;
}

const OnboardingItem: React.FC<OnboardingItemProps> = ({
  icon,
  title,
  done,
  description,
  ctaLabel,
  ctaTo,
  ctaState
}) => {
  return (
    <div className="rounded-lg border border-white/20 bg-black/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              {done ? (
                <span className="inline-flex items-center gap-1 text-emerald-300 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Done
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-300 text-sm">
                  <Circle className="w-4 h-4" />
                  Pending
                </span>
              )}
            </div>
            <p className="text-sm text-gray-200 mt-1">{description}</p>
          </div>
        </div>

        <Link
          to={ctaTo}
          state={ctaState}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-md bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default OnboardingPage;
