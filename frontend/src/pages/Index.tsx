import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Award, Target, ArrowRight, Sparkles, TrendingUp, CheckCircle, Star, Users, Briefcase, GraduationCap, MapPin, PlayCircle } from 'lucide-react';
import Logo from '@/components/Logo';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const heroRef = useRef<HTMLDivElement>(null);
  const whyChooseRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.fromTo('.hero-content > *', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });

      // Features (Why Choose) animation
      if (whyChooseRef.current) {
        gsap.fromTo(whyChooseRef.current.querySelectorAll('.feature-card'),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out', scrollTrigger: { trigger: whyChooseRef.current, start: "top 80%" } }
        );
      }

      // Testimonial Scroller Infinite Animation
      if (scrollerRef.current) {
        gsap.to(scrollerRef.current, {
          xPercent: -50,
          ease: "none",
          duration: 15, // Faster speed
          repeat: -1
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const whyChoose = [
    { icon: Target, title: 'Custom Practice', description: 'Create tailored tests focusing on topics and difficulties of your choice.', color: 'from-purple-500 to-purple-400' },
    { icon: TrendingUp, title: 'Basic to Advance', description: 'Structured learning paths progressing logically from basics to mastery.', color: 'from-green-500 to-green-400' },
    { icon: Award, title: 'Improve Accuracy', description: 'Detailed analytics and insights to help you eliminate mistakes.', color: 'from-emerald-500 to-teal-400' },
  ];

  const allIndiaExams = ['SSC', 'Railway', 'Banking', 'Others'];
  const stateExams = ['UP', 'MP', 'Bihar', 'Other States'];

  const highlights = [
    { value: '100%', label: 'Free Platform', icon: CheckCircle },
    { value: '10K+', label: 'Students', icon: Users },
    { value: '50+', label: 'Exams', icon: BookOpen },
  ];

  const testimonials = [
    { name: 'Rahul S.', exam: 'SSC CGL', text: 'EXAMPULSE changed the way I prepare. The custom practice feature is a game changer!', rating: 5 },
    { name: 'Priya M.', exam: 'Banking PO', text: 'The mock tests are highly relevant and accurate. It feels just like the real exam.', rating: 5 },
    { name: 'Amit K.', exam: 'RRB NTPC', text: 'Best platform for previous year questions and topic-wise analytics.', rating: 4 },
    { name: 'Sneha R.', exam: 'UP Police', text: 'I loved the basic to advance modules. Very structured and absolutely free.', rating: 5 },
    { name: 'Vikash T.', exam: 'SSC CHSL', text: 'The detailed solutions provided after every mock test helped me clear my doubts.', rating: 5 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-purple-200 selection:text-purple-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-3 sm:gap-4">
              <Button variant="ghost" onClick={() => navigate('/login')} className="text-slate-600 hover:text-purple-700 font-semibold hidden sm:flex">
                Login
              </Button>
              <Button onClick={() => navigate('/login')} className="bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white font-bold px-5 sm:px-6 shadow-lg shadow-purple-500/25 rounded-xl border-none">
                Sign Up / Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Abstract Background Enhancements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
          <div className="hero-content max-w-4xl mx-auto flex flex-col items-center">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-slate-700 font-bold tracking-wide uppercase">EXAMPULSE - Smart Study</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-slate-900 leading-[1.15] tracking-tight">
              Master Your Exam <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-green-500">
                Preparation
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-600 mb-10 max-w-2xl font-medium">
              Prepare Smarter Not Harder
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <Button size="lg" onClick={() => navigate('/login')} className="bg-gradient-to-r from-purple-600 to-green-500 hover:scale-105 text-white text-lg font-bold px-8 py-6 rounded-2xl shadow-xl shadow-purple-500/20 transition-all border-none w-full sm:w-auto">
                Start Preparing Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section ref={whyChooseRef} className="py-20 relative bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Why Choose EXAMPULSE?</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-purple-500 to-green-500 mx-auto mt-6 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {whyChoose.map((feature, index) => (
              <div key={index} className="feature-card relative p-8 rounded-[24px] bg-slate-50 border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 rounded-full blur-2xl transition-opacity`} />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 text-lg leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Categories */}
      <section ref={categoriesRef} className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Exam Categories</h2>
            <p className="text-slate-400 text-lg">Comprehensive mock tests for all major government exams</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* All India Exams */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-[24px] p-8 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-8">
                <Briefcase className="w-8 h-8 text-purple-400" />
                <h3 className="text-2xl font-bold text-white">All India Level Exams</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {allIndiaExams.map((exam, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 text-white font-medium border border-white/5">
                    <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    {exam}
                  </div>
                ))}
              </div>
              <p className="text-center text-purple-300 font-medium italic">And many more...</p>
            </div>

            {/* State Exams */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-[24px] p-8 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-8">
                <MapPin className="w-8 h-8 text-green-400" />
                <h3 className="text-2xl font-bold text-white">State Level Exams</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {stateExams.map((exam, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 text-white font-medium border border-white/5">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    {exam}
                  </div>
                ))}
              </div>
              <p className="text-center text-green-300 font-medium italic">And many more...</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Highlights */}
      <section ref={highlightsRef} className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Platform Highlights</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-purple-500 to-green-500 mx-auto mt-6 rounded-full" />
          </div>

          <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
            {highlights.map((stat, index) => (
              <div key={index} className="flex flex-col items-center bg-slate-50 border border-slate-100 rounded-[24px] p-8 min-w-[280px] hover:shadow-xl transition-all">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                  <stat.icon className="w-10 h-10 text-purple-600" />
                </div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-green-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-xl font-bold text-slate-700">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Ticker */}
      <section ref={testimonialsRef} className="py-10 bg-white border-y border-slate-100 relative overflow-hidden">
        <div className="flex items-center">
           <div className="px-8 border-r border-slate-100 hidden md:flex items-center gap-3 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <div className="text-left">
                 <h2 className="text-sm font-black text-slate-900 leading-none">STUDENT VOICE</h2>
                 <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tighter uppercase">Real Reviews</p>
              </div>
           </div>

           <div className="relative flex-1 overflow-hidden h-12 flex items-center">
              <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
              <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

              <div ref={scrollerRef} className="flex w-max gap-16 items-center">
                {[...testimonials, ...testimonials, ...testimonials].map((t, idx) => (
                  <div key={idx} className="flex items-center gap-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                       <span className="text-base font-black text-slate-900">{t.name}</span>
                       <div className="flex text-amber-400">
                          {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                       </div>
                    </div>
                    <span className="text-base text-slate-600 font-medium italic">"{t.text}"</span>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{t.exam} Aspirant</span>
                    <span className="text-slate-200">/</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-slate-900 text-white py-16 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center">
          <Logo variant="dark" size="lg" className="justify-center mb-8" />
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Ready to ace your exams?</h2>
          <Button size="lg" onClick={() => navigate('/login')} className="bg-gradient-to-r from-purple-600 to-green-500  hover:from-purple-500 hover:to-green-400 text-white text-lg font-bold px-10 py-6 rounded-2xl shadow-xl border-none">
            Start Free Trial Now
          </Button>
          <p className="mt-12 text-slate-500 font-medium text-sm">© {new Date().getFullYear()} EXAMPULSE - Smart Study. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
