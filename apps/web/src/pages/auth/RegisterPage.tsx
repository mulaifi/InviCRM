import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks';

export function RegisterPage() {
  const { register, isRegistering, registerError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    tenantName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(formData);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
          Create your account
        </h1>
        <p className="text-text-secondary text-center mb-8">
          Get started with InviCRM
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              required
            />
            <Input
              label="Last name"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              required
            />
          </div>

          <Input
            label="Work email"
            type="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
          />

          <Input
            label="Company name"
            placeholder="Your company"
            value={formData.tenantName}
            onChange={(e) => updateField('tenantName', e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            required
          />

          {registerError && (
            <p className="text-sm text-danger">
              {registerError instanceof Error
                ? registerError.message
                : 'Registration failed. Please try again.'}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={isRegistering}
          >
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
