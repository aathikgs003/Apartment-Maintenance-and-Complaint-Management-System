import React from 'react';
import { 
  EnvelopeIcon, 
  MapPinIcon, 
  PhoneIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

const Contact = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 py-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Get in <span className="text-sky-500 italic">Touch</span>.</h1>
        <p className="max-w-xl mx-auto text-xl text-slate-500 font-medium">Have a special request or a technical issue? Connect with us directly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-sky-500 rounded-[2.5rem] p-10 text-white space-y-8 shadow-xl shadow-sky-100">
            <h2 className="text-3xl font-black italic">Contact Info</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                  <EnvelopeIcon className="w-6 h-6" />
                </div>
                <div className="font-bold">
                  <p className="text-sky-100 text-xs uppercase tracking-widest">Email Us</p>
                  <p className="text-lg">support@ams.pro</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                  <PhoneIcon className="w-6 h-6" />
                </div>
                <div className="font-bold">
                  <p className="text-sky-100 text-xs uppercase tracking-widest">Call Center</p>
                  <p className="text-lg">+1 (888) 123-AMS-7</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                  <MapPinIcon className="w-6 h-6" />
                </div>
                <div className="font-bold">
                  <p className="text-sky-100 text-xs uppercase tracking-widest">HQ Office</p>
                  <p className="text-lg">123 Skyline Towers, NY</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
            <h3 className="text-xl font-black text-slate-800">Support Hours</h3>
            <div className="mt-4 space-y-2 opacity-80 font-bold text-slate-500">
              <div className="flex justify-between"><span>Mon-Fri</span><span>24/7</span></div>
              <div className="flex justify-between"><span>Sat-Sun</span><span>9 AM - 6 PM</span></div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4 text-sky-500">
            <ChatBubbleBottomCenterTextIcon className="w-8 h-8" />
            <h2 className="text-3xl font-black text-slate-800">Send us a Message</h2>
          </div>
          
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-2">Your Name</label>
              <input type="text" placeholder="John Doe" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-sky-500 transition-all font-bold text-slate-800 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-2">Email Address</label>
              <input type="email" placeholder="john@example.com" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-sky-500 transition-all font-bold text-slate-800 focus:outline-none" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-2">Subject</label>
              <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-sky-500 transition-all font-bold text-slate-800 focus:outline-none appearance-none">
                <option>Technical Issue</option>
                <option>Payment Query</option>
                <option>Feature Suggestion</option>
                <option>Other</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-2">Message</label>
              <textarea rows="5" placeholder="How can we help?" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-sky-500 transition-all font-bold text-slate-800 focus:outline-none resize-none"></textarea>
            </div>
            <button className="md:col-span-2 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-sky-600 transition-all shadow-xl active:scale-95 text-xl">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
