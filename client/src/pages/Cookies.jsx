import React from 'react';
import { 
  PuzzlePieceIcon, 
  ShieldCheckIcon, 
  HandThumbUpIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const Cookies = () => {
  const cookieTypes = [
    {
      title: "Essential Cookies",
      icon: <ShieldCheckIcon className="w-8 h-8 text-sky-500" />,
      content: "These are necessary for the website to function. They handle authentication, security, and basic navigation. The system cannot work without them."
    },
    {
      title: "Preference Cookies",
      icon: <CogIcon className="w-8 h-8 text-amber-500" />,
      content: "These allow us to remember choices you make, such as your preferred language, theme (Dark/Light mode), and sidebar state."
    },
    {
      title: "Analytics Cookies",
      icon: <PuzzlePieceIcon className="w-8 h-8 text-emerald-500" />,
      content: "We use these to understand how residents interact with the platform, which helps us improve the user interface and resolution efficiency."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 py-12">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-sky-50 rounded-2xl mb-4">
          <HandThumbUpIcon className="w-12 h-12 text-sky-600" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Cookie Policy</h1>
        <p className="text-xl text-slate-500 font-medium">We use cookies to enhance your maintenance management experience.</p>
      </div>

      <div className="space-y-6">
        {cookieTypes.map((c, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border-2 border-slate-50 shadow-sm flex flex-col md:flex-row gap-6 items-start hover:border-sky-100 transition-colors">
            <div className="shrink-0 p-4 bg-slate-50 rounded-2xl">{c.icon}</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">{c.title}</h3>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-10 bg-slate-100 rounded-[2.5rem] border border-slate-200">
        <h3 className="text-xl font-black text-slate-900">How to manage cookies?</h3>
        <p className="mt-2 text-slate-600 font-medium leading-relaxed">
          You can change your cookie settings through your browser at any time. However, please note that disabling essential cookies will prevent you from logging in and raising complaints.
        </p>
      </div>
    </div>
  );
};

export default Cookies;
