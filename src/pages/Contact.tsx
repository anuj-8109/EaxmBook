import { UserLayout } from '@/components/UserLayout';
import { Mail, Phone, MapPin, MessageSquare, Send, Globe, Github, Twitter, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const Contact = () => {
  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      value: "support@easyexamgen.com",
      desc: "Our support team will get back to you within 24 hours.",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      icon: Phone,
      title: "Call Us",
      value: "+91 98765 43210",
      desc: "Available Mon-Fri, 9am - 6pm for quick assistance.",
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      value: "123 Study Plaza, Education Hub",
      desc: "Sector 45, Gurgaon, Haryana - 122003, India.",
      color: "text-purple-600",
      bg: "bg-purple-50"
    }
  ];

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Get in <span className="text-green-600">Touch</span></h1>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            Have questions about our mock tests or need help with your subscription? 
            Our dedicated support team is here to help you succeed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Cards */}
          <div className="lg:col-span-1 space-y-4">
            {contactInfo.map((item, idx) => (
              <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{item.value}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Social Links */}
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-600" />
                Social Presence
              </h3>
              <div className="flex gap-3">
                {[Twitter, Github, Linkedin].map((Icon, i) => (
                  <Button key={i} variant="outline" size="icon" className="rounded-xl hover:bg-green-50 hover:text-green-600 border-slate-200">
                    <Icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 text-white relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                 <h2 className="text-2xl font-bold flex items-center gap-2">
                   <Send className="w-6 h-6" />
                   Send us a Message
                 </h2>
                 <p className="text-green-50/80 text-sm mt-2">Fill out the form below and we'll reply as soon as possible.</p>
              </div>
              <CardContent className="p-8 bg-white">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name</Label>
                      <Input id="name" placeholder="John Doe" className="h-12 rounded-xl border-slate-200 focus:ring-green-500/20 focus:border-green-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address</Label>
                      <Input id="email" type="email" placeholder="john@example.com" className="h-12 rounded-xl border-slate-200 focus:ring-green-500/20 focus:border-green-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Subject</Label>
                    <Input id="subject" placeholder="How can we help?" className="h-12 rounded-xl border-slate-200 focus:ring-green-500/20 focus:border-green-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Message</Label>
                    <Textarea id="message" placeholder="Type your message here..." className="min-h-[150px] rounded-2xl border-slate-200 focus:ring-green-500/20 focus:border-green-500 resize-none" />
                  </div>

                  <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 text-base transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="rounded-[2.5rem] overflow-hidden h-[300px] bg-slate-100 border-4 border-white shadow-xl relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-slate-400">
             <MapPin className="w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform" />
             <p className="font-bold text-sm tracking-widest uppercase">Location Map View</p>
          </div>
          {/* In a real app, you'd embed an actual Google Map iframe here */}
          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg max-w-sm">
             <h4 className="font-bold text-slate-900 text-sm">Headquarters</h4>
             <p className="text-xs text-slate-500 mt-1">Study Hub, Knowledge Circle, Digital Valley, India</p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default Contact;
