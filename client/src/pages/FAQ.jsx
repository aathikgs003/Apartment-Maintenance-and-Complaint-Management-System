import React from 'react';
import { motion } from 'framer-motion';

const FAQ = () => {
  const faqs = [
    {
      question: "How do I raise a maintenance request?",
      answer: "You can raise a maintenance request by clicking the 'Raise Complaint' button on your resident dashboard. Fill in the category, description, and submit. Our staff will be notified immediately."
    },
    {
      question: "What are the common maintenance categories?",
      answer: "Common categories include Plumbing, Electrical, Carpentry, Painting, and General Upkeep. Each category has specialist staff to handle the requests."
    },
    {
      question: "How long does it typically take to resolve a complaint?",
      answer: "Minor issues are usually addressed within 24-48 hours. More complex repairs may take 3-5 business days depending on part availability and urgency."
    },
    {
      question: "Who can see my complaints?",
      answer: "Your complaints are visible to you, the assigned staff members, and the building administrators. All data is kept secure."
    },
    {
      question: "Can I track the status of my request?",
      answer: "Yes! You can track the status of all your requests in the 'My Complaints' section. You'll see real-time updates as the staff members work on your issue."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-lg text-slate-600 mb-10 text-center md:text-left">Everything you need to know about our apartment maintenance system.</p>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-3">{faq.question}</h3>
              <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default FAQ;
