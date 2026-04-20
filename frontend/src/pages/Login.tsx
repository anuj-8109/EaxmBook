import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/sweetalert';
import Logo from '@/components/Logo';
import { settingsAPI } from '@/lib/api';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { KeyRound, Mail, ArrowRight, Sparkles, BookOpen, Award, TrendingUp, Shield } from 'lucide-react';
import gsap from 'gsap';

const Login = () => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [otp, setOtp] = useState('');
   const [otpSent, setOtpSent] = useState(false);
   const [sending, setSending] = useState(false);
   const [verifying, setVerifying] = useState(false);
   const [passwordLoading, setPasswordLoading] = useState(false);
   const [googleClientId, setGoogleClientId] = useState<string | null>(null);
   const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
   const { requestLoginOtp, verifyLoginOtp, signInWithPassword, loginWithGoogle, user } = useAuth();
   const navigate = useNavigate();

   const leftPanelRef = useRef<HTMLDivElement>(null);
   const rightPanelRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (user) {
         if (user.role === 'admin') {
            navigate('/admin/dashboard');
         } else {
            navigate('/dashboard');
         }
      }
   }, [user, navigate]);

   useEffect(() => {
      const fetchPublicSettings = async () => {
         try {
            const data = await settingsAPI.getPublic();
            setGoogleClientId(data.google?.clientId || null);
         } catch (error) {
            console.error('Failed to load public settings', error);
         }
      };
      fetchPublicSettings();
   }, []);

   // GSAP Entrance Animation
   useEffect(() => {
      const ctx = gsap.context(() => {
         gsap.fromTo(leftPanelRef.current,
            { opacity: 0, x: -50 },
            { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
         );
         gsap.fromTo(rightPanelRef.current,
            { opacity: 0, x: 50 },
            { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
         );
      });

      return () => ctx.revert();
   }, []);

   const requestOtp = async () => {
      if (!email) {
         showError('Please enter your email');
         return;
      }
      setSending(true);
      const { error } = await requestLoginOtp(email);
      setSending(false);
      if (error) {
         showError(error.message);
         return;
      }
      showSuccess('Verification code sent to your email');
      setOtp('');
      setOtpSent(true);
   };

   const verifyOtpCode = async () => {
      if (!otp) {
         showError('Enter the OTP sent to your email');
         return;
      }
      setVerifying(true);
      const { error } = await verifyLoginOtp(email, otp);
      setVerifying(false);
      if (error) {
         showError(error.message);
         return;
      }
      showSuccess('Login successful!');
   };

   const handlePasswordLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) {
         showError('Please enter both email and password');
         return;
      }
      setPasswordLoading(true);
      const { error } = await signInWithPassword(email, password);
      setPasswordLoading(false);
      if (error) {
         showError(error.message);
         return;
      }
      showSuccess('Login successful!');
   };

   const handleGoogleSuccess = async (credential?: string) => {
      if (!credential) {
         showError('Google login failed');
         return;
      }
      const { error } = await loginWithGoogle(credential);
      if (error) {
         showError(error.message);
         return;
      }
      showSuccess('Logged in with Google');
   };

   const features = [
      { icon: BookOpen, text: 'Study Anytime', desc: 'Access your materials anywhere' },
      { icon: Award, text: 'Get Certified', desc: 'Prepare for major government exams' },
      { icon: TrendingUp, text: 'Track Progress', desc: 'Monitor your improvement' },
      { icon: Shield, text: 'Secure Access', desc: 'Your data is always protected' },
   ];

   return (
      <div className="min-h-screen flex">
         {/* LEFT - Welcome Section (Emerald theme to match Register) */}
         <div
            ref={leftPanelRef}
            className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-12 xl:p-16 flex-col justify-between relative overflow-hidden min-h-screen"
         >
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
            <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-10 w-56 h-56 bg-teal-400/20 rounded-full blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />

            {/* Logo */}
            <div className="relative z-10">
               <Logo size="lg" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 mb-6 w-fit">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-sm text-white font-medium">Welcome Back</span>
               </div>

               <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                  Sign in to Easy Exam Gen
               </h1>
               <p className="text-lg text-white/80 mb-10">
                  Pick up where you left off and continue your learning journey.
               </p>

               {/* Features */}
               <div className="grid grid-cols-2 gap-4">
                  {features.map((f, i) => (
                     <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                           <f.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                           <p className="text-white font-medium text-sm">{f.text}</p>
                           <p className="text-white/60 text-xs">{f.desc}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 text-white/60 text-sm">
               © 2024 Easy Exam Gen. All rights reserved.
            </div>
         </div>

         {/* RIGHT - Form Section */}
         <div
            ref={rightPanelRef}
            className="w-full lg:w-1/2 bg-white flex flex-col min-h-screen"
         >
            {/* Mobile Header */}
            <div className="lg:hidden p-6 border-b border-slate-100">
               <Logo size="md" />
            </div>

            {/* Form Container */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-8 overflow-y-auto">
               {/* Header */}
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-slate-900">Sign In</h1>
                  <p className="text-slate-500 mt-2">Choose your preferred login method</p>
               </div>

               {/* Toggle Password/OTP */}
               <div className="flex bg-slate-50 p-1.5 rounded-xl mb-8 border border-slate-100 max-w-sm">
                  <button
                     type="button"
                     onClick={() => { setLoginMode('password'); setOtpSent(false); setOtp(''); }}
                     className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${loginMode === 'password'
                        ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                  >
                     <KeyRound className="w-4 h-4" />
                     Password
                  </button>
                  <button
                     type="button"
                     onClick={() => { setLoginMode('otp'); setPassword(''); }}
                     className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${loginMode === 'otp'
                        ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                  >
                     <Mail className="w-4 h-4" />
                     OTP
                  </button>
               </div>

               {/* Form */}
               <div className="max-w-md w-full">
                  {loginMode === 'password' ? (
                     <form onSubmit={handlePasswordLogin} className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              Email Address
                           </Label>
                           <Input
                              id="email"
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="h-12 bg-slate-50 border-slate-200 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500/20"
                           />
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                              <Label htmlFor="password" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                 <KeyRound className="w-4 h-4 text-slate-400" />
                                 Password
                              </Label>
                              <Link to="/forgot-password" className="text-xs text-emerald-600 font-semibold hover:underline">
                                 Forgot Password?
                              </Link>
                           </div>
                           <Input
                              id="password"
                              type="password"
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="h-12 bg-slate-50 border-slate-200 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500/20"
                           />
                        </div>
                        <Button
                           type="submit"
                           className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 text-base mt-2"
                           disabled={passwordLoading}
                        >
                           {passwordLoading ? (
                              <span className="flex items-center gap-2">
                                 <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                 Signing in...
                              </span>
                           ) : (
                              <span className="flex items-center gap-2">
                                 Sign In <ArrowRight className="w-5 h-5" />
                              </span>
                           )}
                        </Button>
                     </form>
                  ) : (
                     <form
                        onSubmit={async (e) => {
                           e.preventDefault();
                           if (otpSent) await verifyOtpCode();
                           else await requestOtp();
                        }}
                        className="space-y-4"
                     >
                        <div className="space-y-2">
                           <Label htmlFor="otp-email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              Email Address
                           </Label>
                           <Input
                              id="otp-email"
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              disabled={otpSent}
                              className="h-12 bg-slate-50 border-slate-200 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-60"
                           />
                        </div>

                        {otpSent && (
                           <div className="space-y-4">
                              <Input
                                 id="otp"
                                 placeholder="000000"
                                 value={otp}
                                 onChange={(e) => setOtp(e.target.value)}
                                 maxLength={6}
                                 className="h-16 bg-slate-50 border-slate-200 rounded-xl text-center text-3xl tracking-[0.5em] font-mono focus:border-emerald-500"
                              />
                              <div className="flex justify-between items-center">
                                 <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }} className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors">
                                    Change email
                                 </button>
                                 <button type="button" onClick={requestOtp} className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                                    Resend code
                                 </button>
                              </div>
                           </div>
                        )}

                        <Button
                           type="submit"
                           className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 text-base mt-2"
                           disabled={sending || verifying}
                        >
                           {otpSent ? (
                              verifying ? (
                                 <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                 </span>
                              ) : (
                                 <span className="flex items-center gap-2">
                                    Verify & Sign In <ArrowRight className="w-5 h-5" />
                                 </span>
                              )
                           ) : sending ? (
                              <span className="flex items-center gap-2">
                                 <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                 Sending...
                              </span>
                           ) : (
                              <span className="flex items-center gap-2">
                                 Send OTP <Mail className="w-5 h-5" />
                              </span>
                           )}
                        </Button>
                     </form>
                  )}

                  {/* Divider */}
                  <div className="relative my-8">
                     <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-100" />
                     </div>
                     <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-4 text-slate-400 font-medium uppercase tracking-wider">or continue with</span>
                     </div>
                  </div>

                  <div className="mb-8">
                     {googleClientId ? (
                        <GoogleOAuthProvider clientId={googleClientId}>
                           <GoogleLogin
                              onSuccess={(r) => handleGoogleSuccess(r.credential)}
                              onError={() => showError('Google login failed')}
                              shape="rectangular"
                              size="large"
                              logo_alignment="center"
                              width="100%"
                           />
                        </GoogleOAuthProvider>
                     ) : (
                        <div className="text-center text-sm text-slate-400 p-4 border border-slate-100 rounded-xl bg-slate-50 font-medium">
                           Google login not configured
                        </div>
                     )}
                  </div>

                  {/* Register Link */}
                  {/* <p className="text-center text-slate-500 font-medium">
                     Don't have an account?{' '}
                     <Link to="/register" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors underline-offset-4 hover:underline">
                        Create Account
                     </Link>
                  </p> */}
               </div>
            </div>
         </div>
      </div>
   );
};

export default Login;
