import React from 'react';
import { 
  ExclamationTriangleIcon, 
  ScaleIcon, 
  ShieldExclamationIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

const Disclaimer = () => {
  const points = [
    {
      title: "No Professional Advice",
      icon: <NoSymbolIcon className="w-8 h-8 text-rose-500" />,
      content: "The information provided by AMS Pro is for general maintenance management purposes only. It is not intended to substitute professional engineering or legal advice."
    },
    {
      title: "Limitation of Liability",
      icon: <ScaleIcon className="w-8 h-8 text-sky-500" />,
      content: "AMS Pro and its developers are not liable for any property damage, personal injury, or financial loss resulting from the use of the platform or the actions of maintenance staff."
    },
    {
      title: "Third-Party Links",
      icon: <ShieldExclamationIcon className="w-8 h-8 text-amber-500" />,
      content: "Our system integrates with third-party gateways (Razorpay). We are not responsible for their availability, security policies, or any transaction failures on their side."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 py-12">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-rose-50 rounded-2xl mb-4">
          <ExclamationTriangleIcon className="w-12 h-12 text-rose-600" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Legal Disclaimer</h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">Please read these important notices regarding the use of our maintenance platform.</p>
      </div>

      <div className="space-y-6">
        {points.map((p, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border-2 border-slate-50 shadow-sm flex flex-col md:flex-row gap-6 items-start hover:border-rose-100 transition-colors">
            <div className="shrink-0 p-4 bg-slate-50 rounded-2xl">{p.icon}</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">{p.title}</h3>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">{p.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Last Reviewed: April 2024</p>
        <p className="mt-4 text-slate-100 font-medium">By continuing to use this site, you acknowledge that you have read and understood this disclaimer.</p>
      </div>
    </div>
  );
};

export default Disclaimer;
