import React from 'react';
import { motion } from 'framer-motion';
import { 
  QuestionMarkCircleIcon, 
  ChevronDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const FAQ = () => {
  const faqs = [
    {
      question: "How do I raise a maintenance request?",
      answer: "Log in as a resident and go to 'My Complaints' > 'Raise Complaint'. Provide specific details such as the category (Plumbing, Electrical, etc.), a thorough description, and a preferred date/time for the staff visit. You can also upload images to help the staff understand the issue."
    },
    {
      question: "What are the common maintenance categories?",
      answer: "We support several categories: Plumbing (leaks, blockages), Electrical (wiring, switches, light fittings), Carpentry (doors, cabinets), Painting (touch-ups), and General Maintenance (everything else!). Specialist staff are assigned based on the category."
    },
    {
      question: "How long does it typically take to resolve a complaint?",
      answer: "We aim for 'High Priority' issues like major leaks or power outages to be resolved within 24 hours. General maintenance issues are typically addressed within 48 to 72 hours. You can see the assigned staff's estimated completion time in the ticket details."
    },
    {
      question: "How do I pay for the services?",
      answer: "Once a task is marked 'Completed' by the staff, you will see a 'Proceed to Pay' button if the staff has added a service amount. You can pay securely online via Razorpay (UPI, Card, Net Banking) or choose 'Request Offline' if you prefer to pay the staff directly."
    },
    {
      question: "Can I rate the service provided by the staff?",
      answer: "Yes! After your payment is verified (either online success or staff-confirmed offline), a rating and feedback section will appear on the complaint details page. Your feedback is crucial for maintaining our quality standards."
    },
    {
      question: "What if my complaint is not resolved properly?",
      answer: "If the task is marked as 'Completed' but you are not satisfied, do not proceed with the payment. Instead, use the chat feature to talk to our AI Assistant or contact the building administrator directly via the Help Center."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 py-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-sky-50 rounded-2xl mb-2">
          <QuestionMarkCircleIcon className="w-12 h-12 text-sky-600" />
        </div>
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
          Everything <span className="text-sky-500">Explanied</span>.
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed">
          Clear answers to common questions about our Apartment Maintenance System.
        </p>
      </div>

      {/* FAQ Accordion-like Grid */}
      <div className="grid grid-cols-1 gap-6">
        {faqs.map((faq, index) => (
          <motion.details 
            key={index} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white border-2 border-slate-50 rounded-3xl overflow-hidden hover:border-sky-100 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-sky-100/30"
          >
            <summary className="list-none p-8 flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-sky-600 transition-colors">
                {faq.question}
              </h3>
              <div className="shrink-0 p-3 bg-slate-50 rounded-xl text-slate-400 group-open:bg-sky-500 group-open:text-white transition-all transform group-open:rotate-180">
                <ChevronDownIcon className="w-6 h-6" />
              </div>
            </summary>
            <div className="px-8 pb-8">
              <div className="h-px bg-slate-100 mb-6"></div>
              <p className="text-lg text-slate-500 leading-relaxed font-medium">
                {faq.answer}
              </p>
            </div>
          </motion.details>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="bg-sky-500 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-sky-500/20">
        <div className="space-y-3 text-center md:text-left">
          <h3 className="text-3xl font-black italic tracking-tight">Still have a question?</h3>
          <p className="text-sky-100 text-lg font-medium opacity-90">We're here to help you around the clock.</p>
        </div>
        <button className="px-12 py-5 bg-white text-sky-600 font-black rounded-[2rem] hover:bg-sky-50 transition-all shadow-lg active:scale-95 text-xl">
          Get in Touch
        </button>
      </div>
    </div>
  );
};

export default FAQ;
