import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/api/client';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`Authentication failed: ${errorParam}`);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        let response;

        switch (provider) {
          case 'google':
            response = await authApi.handleGoogleCallback(code);
            break;
          case 'slack':
            response = await authApi.handleSlackCallback(code);
            break;
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }

        setAuth(response);

        // Redirect based on onboarding status
        if (response.user.onboardingCompleted) {
          navigate('/', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };

    handleCallback();
  }, [provider, searchParams, setAuth, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-flash-white/50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 rounded-lg bg-red-50 p-4">
            <h2 className="mb-2 text-lg font-semibold text-red-800">
              Authentication Failed
            </h2>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-brand-violet hover:underline"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-flash-white/50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-violet" />
        <p className="text-sm text-grey">Completing authentication...</p>
      </div>
    </div>
  );
}
