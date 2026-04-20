import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import { ArrowLeft, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [stage, setStage] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (stage === 'request') {
        await authAPI.requestPasswordOtp(email);
        toast.success('OTP sent to your email');
        setStage('verify');
      } else {
        if (!otp || !newPassword) {
          toast.error('Enter OTP and new password');
          setLoading(false);
          return;
        }
        await authAPI.resetPasswordWithOtp({ email, code: otp, password: newPassword });
        toast.success('Password updated successfully');
        setStage('request');
        setOtp('');
        setNewPassword('');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent/10 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center">
            <Mail className="h-10 w-10 text-accent-foreground" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Forgot Password</CardTitle>
            <CardDescription>
              {stage === 'request'
                ? 'Enter your email to get a one-time reset code'
                : 'Enter the OTP and choose a new password'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={stage === 'verify'}
              />
            </div>

            {stage === 'verify' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Didn&apos;t get the code?{' '}
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => {
                      setStage('request');
                      setOtp('');
                    }}
                  >
                    Resend OTP
                  </button>
                </p>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? stage === 'request'
                  ? 'Sending...'
                  : 'Updating...'
                : stage === 'request'
                  ? 'Send OTP'
                  : 'Reset Password'}
            </Button>
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:underline inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
