import React from 'react';
import { 
  ShieldCheckIcon, 
  LockClosedIcon, 
  EyeIcon, 
  ServerIcon,
  CreditCardIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const Privacy = () => {
  const policies = [
    {
      title: "Data We Collect",
      icon: <EyeIcon className="w-7 h-7 text-sky-500" />,
      content: "We collect personal information such as your name, email, phone number, and apartment number to ensure efficient maintenance service delivery. We also collect usage data (IP address, browser type) to improve site security."
    },
    {
      title: "How We Use It",
      icon: <ServerIcon className="w-7 h-7 text-emerald-500" />,
      content: "Your data is used to process maintenance requests, notify you about ticket status via email, and manage staff assignments. We do not sell or share your personal data with third-party advertisers."
    },
    {
      title: "Third-Party Services",
      icon: <CreditCardIcon className="w-7 h-7 text-amber-500" />,
      content: "We use Razorpay for secure payments and Cloudinary for image storage. These services handle your data according to their own strict privacy policies. No payment card details are stored on our servers."
    },
    {
      title: "Data Security",
      icon: <LockClosedIcon className="w-7 h-7 text-rose-500" />,
      content: "All data is encrypted using 256-bit SSL during transmission. We regularly audit our systems to prevent unauthorized access and ensure your information remains private and secure."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-12 py-16 border-b border-slate-100 text-center space-y-4">
          <div className="inline-flex p-4 bg-sky-100 rounded-2xl mb-4">
            <ShieldCheckIcon className="w-12 h-12 text-sky-600" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight italic">Privacy Policy</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Last Updated: April 2024</p>
        </div>

        {/* Content */}
        <div className="px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {policies.map((policy, index) => (
              <div key={index} className="space-y-5 p-4 rounded-3xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                    {policy.icon}
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{policy.title}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium text-lg">
                  {policy.content}
                </p>
              </div>
            ))}
          </div>

          {/* Legal Note */}
          <div className="mt-16 bg-sky-50 border-2 border-sky-100 rounded-3xl p-8 flex gap-6 items-start">
            <div className="shrink-0 p-3 bg-sky-500 rounded-2xl text-white shadow-lg">
              <ExclamationCircleIcon className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-sky-900">Your Rights under GDPR/CCPA</h3>
              <p className="text-sky-700 font-medium leading-relaxed">
                You have the right to access, correct, or delete your personal data at any time. For data deletion requests, please contact our administrator at <span className="font-bold underline">privacy@ams.pro</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
