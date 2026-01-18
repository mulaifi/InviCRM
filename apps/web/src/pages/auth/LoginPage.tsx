import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks';

export function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-semibold">IC</span>
          </div>
          <span className="text-xl font-semibold text-text-primary">
            InviCRM
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-text-primary text-center mb-2">
          Welcome back
        </h1>
        <p className="text-text-secondary text-center mb-8">
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {loginError && (
            <p className="text-sm text-danger">
              {loginError instanceof Error
                ? loginError.message
                : 'Login failed. Please check your credentials.'}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={isLoggingIn}
          >
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
