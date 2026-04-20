import { useState, useEffect, useRef } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { showError, showSuccess, showWarning } from '@/lib/sweetalert';
import { MessageSquare, Send, Bug, Lightbulb, Sparkles, HelpCircle, MoreHorizontal, Heart, Star, CheckCircle } from 'lucide-react';
import { feedbackAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import gsap from 'gsap';

const Feedback = () => {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();

  const formRef = useRef<HTMLFormElement>(null);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.feedback-header', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      gsap.fromTo('.feedback-card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.2 });
      gsap.fromTo('.info-card', { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.4 });
    });

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showError('Please login to submit feedback');
      return;
    }

    if (!category) {
      showWarning('Please select a category');
      return;
    }

    setLoading(true);

    try {
      await feedbackAPI.create({
        message,
        category,
        rating: rating > 0 ? rating : undefined,
      });
      setSubmitted(true);
      showSuccess('Thank you for your feedback!');
      
      // Animate success
      if (formRef.current) {
        gsap.to(formRef.current, { opacity: 0, y: -20, duration: 0.3, onComplete: () => {
          setMessage('');
          setCategory('');
          setRating(0);
        }});
      }
    } catch (error: any) {
      showError('Failed to submit feedback', error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setRating(0);
    setHoveredRating(0);
    gsap.fromTo(formRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 });
  };

  const categories = [
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500', bg: 'bg-red-50' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50' },
    { value: 'improvement', label: 'Improvement', icon: Sparkles, color: 'text-green-500', bg: 'bg-green-50' },
    { value: 'question', label: 'Question', icon: HelpCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
    { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-slate-500', bg: 'bg-slate-50' },
  ];

  const tips = [
    { icon: Star, text: 'Be specific about what you experienced', color: 'from-amber-500 to-orange-500' },
    { icon: Heart, text: 'Share what you love about the platform', color: 'from-green-500 to-emerald-500' },
    { icon: Lightbulb, text: 'Suggest features that would help you', color: 'from-purple-500 to-indigo-500' },
  ];

  return (
    <UserLayout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="feedback-header">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-green-500 p-6 sm:p-8 text-white shadow-lg">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black">Send Feedback</h1>
                <p className="text-green-50 text-[13px] mt-1 font-medium">Your voice matters. Help us improve EXAMPULSE!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feedback Form */}
          <div className="lg:col-span-2">
            <Card className="feedback-card border border-green-100 shadow-sm overflow-hidden bg-white rounded-2xl">
              {submitted ? (
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2">Thank You!</h2>
                  <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                    Your feedback has been submitted successfully. We appreciate your time and input!
                  </p>
                  <Button onClick={resetForm} className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl px-8 h-11">
                    Send Another Feedback
                  </Button>
                </CardContent>
              ) : (
                <CardContent className="p-6 sm:p-8">
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    {/* Star Rating */}
                    <div className="space-y-3">
                      <Label className="text-[13px] font-bold text-slate-700">Rate your experience (Optional)</Label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (hoveredRating || rating);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              className="transition-all duration-200 hover:scale-110 focus:outline-none"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  isFilled
                                    ? 'fill-green-500 text-green-500'
                                    : 'fill-slate-100 text-slate-200'
                                } transition-all duration-200`}
                              />
                            </button>
                          );
                        })}
                        {rating > 0 && (
                          <span className="ml-3 text-sm font-bold text-green-600">
                            {rating === 1 && 'Poor'}
                            {rating === 2 && 'Fair'}
                            {rating === 3 && 'Good'}
                            {rating === 4 && 'Very Good'}
                            {rating === 5 && 'Excellent'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-3">
                      <Label className="text-[13px] font-bold text-slate-700">What's your feedback about?</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {categories.map((cat) => {
                          const Icon = cat.icon;
                          const isSelected = category === cat.value;
                          return (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => setCategory(cat.value)}
                              className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                                isSelected 
                                  ? 'border-green-500 bg-green-50 shadow-md shadow-green-500/10' 
                                  : 'border-slate-100 hover:border-green-200 hover:bg-green-50/30'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-green-100' : cat.bg}`}>
                                <Icon className={`w-5 h-5 ${isSelected ? 'text-green-600' : cat.color}`} />
                              </div>
                              <span className={`text-[11px] font-bold ${isSelected ? 'text-green-700' : 'text-slate-500'}`}>
                                {cat.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-3">
                      <Label htmlFor="message" className="text-[13px] font-bold text-slate-700">Your Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us what's on your mind. Be as detailed as you'd like..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={6}
                        className="resize-none text-sm bg-slate-50 border-slate-100 rounded-2xl focus:bg-white focus:border-green-500 focus:ring-green-500/10 transition-all font-medium"
                      />
                      <p className="text-[10px] text-slate-400 text-right font-semibold">{message.length} / 1000 characters</p>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl shadow-lg shadow-green-500/20 text-base flex items-center gap-2 transition-all" 
                      disabled={loading || !category || !message}
                    >
                      {loading ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit Feedback
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Tips Sidebar */}
          <div className="space-y-4">
            <Card className="info-card border border-green-100 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-500" />
                  Tips for Great Feedback
                </h3>
                <div className="space-y-4">
                  {tips.map((tip, index) => {
                    const Icon = tip.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${tip.color} flex-shrink-0 shadow-sm`}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{tip.text}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="info-card border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative rounded-2xl">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '20px 20px' }} />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="w-6 h-6 fill-white/20" />
                  <h3 className="font-black">We Appreciate You!</h3>
                </div>
                <p className="text-[12px] text-green-50 font-medium leading-relaxed">
                  Every piece of feedback helps us create a better learning experience for everyone. Thank you for taking the time!
                </p>
              </CardContent>
            </Card>

            <Card className="info-card border border-slate-100 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-bold text-slate-800 text-xs mb-2">Response Time</h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  We review all feedback within <span className="font-black text-green-600">24-48 hours</span>. For urgent issues, please contact support directly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default Feedback;
