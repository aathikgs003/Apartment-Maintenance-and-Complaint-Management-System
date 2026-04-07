import React from 'react';
import { 
  WrenchScrewdriverIcon, 
  BoltIcon, 
  HomeIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Services = () => {
  const serviceCategories = [
    {
      title: "Plumbing Services",
      icon: <WrenchScrewdriverIcon className="w-8 h-8 text-sky-500" />,
      description: "From leaky faucets to major pipe repairs, our expert plumbers handle it all with precision.",
      features: ["Tap Repair", "Drain Cleaning", "Heater Fixes", "New Installations"]
    },
    {
      title: "Electrical Maintenance",
      icon: <BoltIcon className="w-8 h-8 text-amber-500" />,
      description: "Safe and secure electrical repairs including wiring, switches, and appliance setup.",
      features: ["Short Circuits", "Panel Upgrades", "Light Fittings", "Safety Audits"]
    },
    {
      title: "General Carpentry",
      icon: <HomeIcon className="w-8 h-8 text-emerald-500" />,
      description: "Furniture repair, door adjustments, and custom woodwork for your residential space.",
      features: ["Door Locks", "Cabinet Repair", "Polishing", "Hinge Fixes"]
    },
    {
      title: "HVAC & Cleaning",
      icon: <ShieldCheckIcon className="w-8 h-8 text-rose-500" />,
      description: "Air conditioning service and deep cleaning to keep your apartment fresh and healthy.",
      features: ["AC Service", "Filter Cleaning", "Deep Sanitization", "Pest Control"]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="max-w-3xl space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-full text-sky-600 font-black text-sm uppercase tracking-widest border border-sky-100">
          <WrenchScrewdriverIcon className="w-4 h-4" />
          Our Expertise
        </div>
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
          What we <span className="text-sky-500">Fix</span> for you.
        </h1>
        <p className="text-xl text-slate-500 font-medium leading-relaxed">
          Explore our wide range of professional maintenance services designed specifically for residential needs.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {serviceCategories.map((service, index) => (
          <div key={index} className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-50 hover:border-sky-200 transition-all group hover:shadow-2xl hover:shadow-sky-100">
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="shrink-0 p-6 bg-slate-50 rounded-3xl group-hover:bg-sky-50 group-hover:scale-110 transition-all border border-slate-100 group-hover:border-sky-100">
                {service.icon}
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{service.title}</h2>
                <p className="text-slate-500 font-medium leading-relaxed text-lg">{service.description}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {service.features.map((f, i) => (
                    <span key={i} className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-black border border-slate-100 group-hover:bg-white group-hover:border-sky-200 group-hover:text-sky-600">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col items-center text-center space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(56,189,248,0.1),transparent)] pointer-events-none"></div>
        <ClockIcon className="w-16 h-16 text-sky-400" />
        <div className="space-y-4">
          <h3 className="text-4xl font-black tracking-tight">Need a custom fix?</h3>
          <p className="max-w-2xl text-slate-400 text-lg font-medium">If you have a specialized requirement not listed above, raise a 'General' complaint and our experts will review it.</p>
        </div>
        <button className="px-12 py-5 bg-sky-500 text-white font-black rounded-2xl hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/20 active:scale-95 text-xl">
          Raise Request Now
        </button>
      </div>
    </div>
  );
};

export default Services;
