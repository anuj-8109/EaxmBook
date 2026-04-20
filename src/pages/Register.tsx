import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/sweetalert';
import Logo from '@/components/Logo';
import { User, Mail, KeyRound, ArrowRight, Sparkles, CheckCircle, BookOpen, Award, TrendingUp, Shield } from 'lucide-react';
import gsap from 'gsap';

const Register = () => {
   const [name, setName] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [otp, setOtp] = useState('');
   const [step, setStep] = useState<'form' | 'otp'>('form');
   const [loading, setLoading] = useState(false);
   const [verifying, setVerifying] = useState(false);
   const { requestRegisterOtp, verifyRegisterOtp } = useAuth();
   const navigate = useNavigate();

   const leftPanelRef = useRef<HTMLDivElement>(null);
   const rightPanelRef = useRef<HTMLDivElement>(null);

   // GSAP Animations
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

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const { error } = await requestRegisterOtp({ email, password, fullName: name });
      setLoading(false);
      if (error) {
         showError(error.message);
         return;
      }
      showSuccess('OTP sent!', 'Check your inbox to verify.');
      setStep('otp');
   };

   const handleVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!otp) {
         showError('Enter the OTP from your email');
         return;
      }
      setVerifying(true);
      const { error } = await verifyRegisterOtp(email, otp);
      setVerifying(false);
      if (error) {
         showError(error.message);
         return;
      }
      showSuccess('Account created successfully');
      navigate('/dashboard');
   };

   const features = [
      { icon: BookOpen, text: '500+ Mock Tests', desc: 'Practice with real patterns' },
      { icon: Award, text: 'Instant Results', desc: 'Detailed performance analytics' },
      { icon: TrendingUp, text: 'Track Progress', desc: 'Monitor your improvement' },
      { icon: Shield, text: '100% Free', desc: 'No hidden charges' },
   ];

   return (
      <div className="min-h-screen flex">
         {/* LEFT - Welcome Section */}
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
                  <span className="text-sm text-white font-medium">Start Your Journey</span>
               </div>

               <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                  Join Easy Exam Gen
               </h1>
               <p className="text-lg text-white/80 mb-10">
                  Create your free account and start preparing for your exams today.
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
               <div className="mb-6">
                  <h1 className="text-3xl font-bold text-slate-900">
                     {step === 'form' ? 'Create Account' : 'Verify Email'}
                  </h1>
                  <p className="text-slate-500 mt-2">
                     {step === 'form' ? 'Fill in your details to get started' : 'Enter the code sent to your email'}
                  </p>
               </div>

               {step === 'form' ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                           <User className="w-4 h-4 text-slate-400" />
                           Full Name
                        </Label>
                        <Input
                           id="name"
                           type="text"
                           placeholder="John Doe"
                           value={name}
                           onChange={(e) => setName(e.target.value)}
                           required
                           className="h-12 bg-slate-50 border-slate-200 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500/20"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                           <Mail className="w-4 h-4 text-slate-400" />
                           Email Address
                        </Label>
                        <Input
                           id="email"
                           type="email"
                           placeholder="your.email@example.com"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           required
                           className="h-12 bg-slate-50 border-slate-200 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500/20"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                           <KeyRound className="w-4 h-4 text-slate-400" />
                           Password
                        </Label>
                        <Input
                           id="password"
                           type="password"
                           placeholder="Create a strong password"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           required
                           className="h-12 bg-slate-50 border-slate-200 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500/20"
                        />
                     </div>

                     {/* Benefits Box */}
                     <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3">
                           <CheckCircle className="w-5 h-5 text-emerald-600" />
                           <span className="font-semibold text-emerald-800">What you'll get:</span>
                        </div>
                        <ul className="space-y-2 text-sm text-emerald-700">
                           <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Free access to all mock tests
                           </li>
                           <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Detailed performance analytics
                           </li>
                           <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Track your progress over time
                           </li>
                        </ul>
                     </div>

                     <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 text-base mt-6 relative z-10"
                        disabled={loading}
                     >
                        {loading ? (
                           <span className="flex items-center gap-2">
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Sending OTP...
                           </span>
                        ) : (
                           <span className="flex items-center gap-2">
                              Create Account <ArrowRight className="w-5 h-5" />
                           </span>
                        )}
                     </Button>
                  </form>
               ) : (
                  <form onSubmit={handleVerify} className="space-y-5">
                     <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Email Address</Label>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                           <Mail className="w-5 h-5 text-slate-400" />
                           <span className="text-sm text-slate-700 font-medium">{email}</span>
                        </div>
                        <p className="text-sm text-slate-500">
                           Not your email?{' '}
                           <button
                              type="button"
                              onClick={() => { setStep('form'); setOtp(''); }}
                              className="text-emerald-600 font-medium hover:underline"
                           >
                              Change email
                           </button>
                        </p>
                     </div>

                     <div className="space-y-3">
                        <Label htmlFor="otp" className="text-sm font-medium text-slate-700">Verification Code</Label>
                        <Input
                           id="otp"
                           placeholder="000000"
                           value={otp}
                           onChange={(e) => setOtp(e.target.value)}
                           maxLength={6}
                           className="h-16 bg-slate-50 border-slate-200 rounded-xl text-center text-3xl tracking-[0.5em] font-mono focus:border-emerald-500"
                        />
                        <div className="flex justify-center gap-2">
                           {[...Array(6)].map((_, i) => (
                              <div key={i} className={`w-3 h-3 rounded-full transition-all ${otp.length > i ? 'bg-emerald-500 scale-110' : 'bg-slate-200'}`} />
                           ))}
                        </div>
                     </div>

                     <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 text-base"
                        disabled={verifying}
                     >
                        {verifying ? (
                           <span className="flex items-center gap-2">
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Verifying...
                           </span>
                        ) : (
                           <span className="flex items-center gap-2">
                              Verify & Create Account <Sparkles className="w-5 h-5" />
                           </span>
                        )}
                     </Button>
                  </form>
               )}

               {/* Login Link */}
               <p className="mt-6 text-center text-base text-slate-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">
                     Sign In
                  </Link>
               </p>
            </div>
         </div>
      </div>
   );
};

export default Register;
