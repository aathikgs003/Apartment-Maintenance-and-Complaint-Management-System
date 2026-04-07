import React from 'react';
import { 
  UserGroupIcon, 
  RocketLaunchIcon, 
  HeartIcon, 
  GlobeAltIcon,
  SparklesIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const About = () => {
  const milestones = [
    { year: "2020", title: "Inception", body: "AMS Pro began as a small project to solve local apartment woes." },
    { year: "2022", title: "Growth", body: "Expanded to 50+ residential complexes across the city." },
    { year: "2024", title: "Innovation", body: "Integrated AI-driven chatbots and real-time payment tracking." }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Vision & Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="p-4 bg-sky-50 rounded-2xl inline-flex shadow-sm">
            <RocketLaunchIcon className="w-10 h-10 text-sky-600" />
          </div>
          <h1 className="text-6xl font-black text-slate-900 leading-tight tracking-tighter">
            Redefining <span className="text-sky-500 italic">Living</span> Standards.
          </h1>
          <p className="text-xl text-slate-500 font-medium leading-relaxed">
            Apartment Maintenance System (AMS Pro) is more than just a ticketing tool. 
            We are dedicated to providing efficient and transparent maintenance management services 
            to modern residential communities.
          </p>
          <div className="flex gap-4">
            <div className="flex -space-x-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200"></div>
              ))}
            </div>
            <p className="text-slate-400 font-bold self-center">Trusted by 10k+ Residents</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-sky-500 rounded-[2rem] p-8 text-white space-y-4 shadow-xl shadow-sky-200">
            <HeartIcon className="w-8 h-8" />
            <h3 className="text-2xl font-black">Our Passion</h3>
            <p className="text-sky-100 font-medium">To make every home a worry-free haven.</p>
          </div>
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-4 mt-8 shadow-xl shadow-slate-300">
            <GlobeAltIcon className="w-8 h-8 text-sky-400" />
            <h3 className="text-2xl font-black">Global Impact</h3>
            <p className="text-slate-400 font-medium">Standardizing maintenance quality worldwide.</p>
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Our Journey</h2>
          <p className="text-slate-500 font-bold max-w-xl mx-auto mt-2 italic">From a simple idea to a state-of-the-art platform.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {milestones.map((m, i) => (
            <div key={i} className="bg-white border-2 border-slate-50 rounded-3xl p-10 hover:border-sky-500 transition-all group shadow-sm hover:shadow-2xl">
              <span className="text-5xl font-black text-slate-100 group-hover:text-sky-100 transition-colors">{m.year}</span>
              <h4 className="text-2xl font-black text-slate-800 mt-4">{m.title}</h4>
              <p className="text-slate-500 font-medium mt-2 leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Values */}
      <div className="bg-slate-50 rounded-[3rem] p-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div className="space-y-4">
          <SparklesIcon className="w-12 h-12 text-amber-500 mx-auto" />
          <h5 className="text-xl font-black">Quality First</h5>
          <p className="text-slate-500 font-medium">No compromises on the excellence of our services.</p>
        </div>
        <div className="space-y-4">
          <AcademicCapIcon className="w-12 h-12 text-emerald-500 mx-auto" />
          <h5 className="text-xl font-black">Expert Staff</h5>
          <p className="text-slate-500 font-medium">Only certified professionals handle your home.</p>
        </div>
        <div className="space-y-4">
          <UserGroupIcon className="w-12 h-12 text-rose-500 mx-auto" />
          <h5 className="text-xl font-black">Community Led</h5>
          <p className="text-slate-500 font-medium">User feedback drives our entire product roadmap.</p>
        </div>
      </div>
    </div>
  );
};

export default About;
