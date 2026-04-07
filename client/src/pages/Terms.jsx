import React from 'react';
import { 
  DocumentTextIcon, 
  ScaleIcon, 
  CheckCircleIcon, 
  CurrencyRupeeIcon,
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Terms = () => {
  const clauses = [
    {
      title: "User Obligations",
      icon: <UserCircleIcon className="w-7 h-7 text-sky-500" />,
      content: "Residents agree to provide accurate details for maintenance requests and ensure staff accessibility during the 'Preferred Visit Time' specified in the complaint form."
    },
    {
      title: "Service Scope",
      icon: <CheckCircleIcon className="w-7 h-7 text-emerald-500" />,
      content: "The system provides a platform for connecting residents with qualified staff. While we strive for excellence, emergency response times depend on staff availability and severity."
    },
    {
      title: "Payments & Fees",
      icon: <CurrencyRupeeIcon className="w-7 h-7 text-amber-500" />,
      content: "Online payments via Razorpay are final. For offline payments, residents must collect a digital acknowledgment within the app to ensure the complaint is accurately closed."
    },
    {
      title: "Timeframes",
      icon: <ClockIcon className="w-7 h-7 text-indigo-500" />,
      content: "Admin-set deadlines are estimates. Delays beyond 48 hours will trigger a system-wide alert for prioritization. We guarantee a 24-hour response time for 'High' priority issues."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-sky-600 px-12 py-20 text-white text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="relative inline-flex p-4 bg-white/20 rounded-2xl mb-4 backdrop-blur-md">
            <DocumentTextIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="relative text-5xl font-black tracking-tight italic">Terms of Service</h1>
          <p className="relative text-sky-100 font-bold uppercase tracking-widest text-sm opacity-90">Agreement between AMS Pro and Users</p>
        </div>

        {/* Introduction */}
        <div className="px-12 py-12 bg-slate-50 border-b border-slate-100 italic font-medium text-slate-500 text-center text-lg">
          "By accessing the Apartment Maintenance System (AMS Pro), you agree to be bound by these Terms of Service. These terms govern the relationship between residents, maintenance staff, and management."
        </div>

        {/* Content */}
        <div className="px-12 py-16 space-y-16">
          <div className="grid grid-cols-1 gap-12">
            {clauses.map((clause, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-8 items-start p-8 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                <div className="shrink-0 p-4 bg-white rounded-2xl shadow-md border border-slate-100">
                  {clause.icon}
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{clause.title}</h2>
                  <p className="text-slate-600 leading-relaxed font-medium text-lg">
                    {clause.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="bg-slate-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex gap-4 items-center">
              <ScaleIcon className="w-12 h-12 text-sky-400" />
              <div>
                <h3 className="text-xl font-bold">Governing Law</h3>
                <p className="text-slate-400 font-medium">Subject to local apartment bylaws and state civil code.</p>
              </div>
            </div>
            <button className="px-10 py-4 bg-sky-500 text-white font-black rounded-2xl hover:bg-sky-400 transition-all shadow-lg active:scale-95">
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
