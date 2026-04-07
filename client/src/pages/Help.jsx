import React from 'react';
import { 
  LifebuoyIcon, 
  QuestionMarkCircleIcon, 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Help = () => {
  const helpSections = [
    {
      title: "Self-Service Support",
      icon: <QuestionMarkCircleIcon className="w-8 h-8 text-sky-500" />,
      description: "Quick guides on how to use the AMS features.",
      items: [
        "How to Raise a Complaint",
        "Tracking Ticket Status",
        "Making Online Payments",
        "Updating Your Profile"
      ]
    },
    {
      title: "Maintenance Guides",
      icon: <WrenchScrewdriverIcon className="w-8 h-8 text-amber-500" />,
      description: "Learn about the types of services we offer.",
      items: [
        "Emergency vs General Repairs",
        "Plumbing Basics",
        "Electrical Safety Checklists",
        "Periodic Inspection Schedules"
      ]
    },
    {
      title: "Contact Support",
      icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-emerald-500" />,
      description: "Reach out to our technical team directly.",
      items: [
        "24/7 Emergency Hotline",
        "Live Chat Assistance",
        "Email Ticket Support",
        "Office HQ Visit"
      ]
    },
    {
      title: "Security & Safety",
      icon: <ShieldCheckIcon className="w-8 h-8 text-rose-500" />,
      description: "Safety protocols and data security info.",
      items: [
        "Identity Verification Process",
        "Payment Security Measures",
        "Disaster Response Plan",
        "Privacy Settings Guide"
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center p-3 bg-sky-50 rounded-2xl mb-4">
          <LifebuoyIcon className="w-10 h-10 text-sky-600" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">How can we help?</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
          Whether you're a resident, staff member, or admin, we've got you covered with guides and 24/7 support.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {helpSections.map((section, index) => (
          <div key={index} className="bg-white border-2 border-slate-50 rounded-3xl p-8 hover:border-sky-100 hover:shadow-2xl hover:shadow-sky-100/50 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative flex gap-6">
              <div className="shrink-0 p-4 bg-slate-50 rounded-2xl group-hover:bg-white group-hover:scale-110 transition-all border border-slate-100 shadow-sm">
                {section.icon}
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-2xl font-black text-slate-800">{section.title}</h2>
                <p className="text-slate-500 font-medium leading-relaxed">{section.description}</p>
                <div className="space-y-3 pt-2">
                  {section.items.map((item, i) => (
                    <button key={i} className="flex items-center gap-2 text-slate-600 hover:text-sky-600 font-bold text-sm transition-colors w-full text-left group/item">
                      <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover/item:text-sky-500 group-hover/item:translate-x-1 transition-all" />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Support Card */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-3xl p-10 text-white shadow-xl shadow-sky-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-3xl font-black">Still have questions?</h3>
            <p className="text-sky-100 text-lg font-medium">Our support team is here for you 24/7. No problem is too small.</p>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-white text-sky-600 font-black rounded-2xl hover:bg-sky-50 transition-all shadow-lg active:scale-95 text-sm md:text-base">
              Contact Us
            </button>
            <button className="px-8 py-4 bg-sky-500 text-white font-black rounded-2xl hover:bg-sky-400 transition-all active:scale-95 border border-sky-400 text-sm md:text-base">
              Live Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
