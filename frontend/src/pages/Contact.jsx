import React, { useState } from 'react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-8 md:p-12 shadow-xl grid md:grid-cols-2 gap-12">
        
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">Contact Us</h1>
          <p className="text-gray-400 text-sm mb-8">Have a question about a recent auction, need help with your wallet, or want to become a streamer? Drop us a message!</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Support</h3>
              <p className="text-emerald-400 font-bold">support@cardbid.app</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Business Inquiries</h3>
              <p className="text-white font-bold">partners@cardbid.app</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">HQ Address</h3>
              <p className="text-white text-sm">Rzeszów University of Technology<br/>Al. Powstańców Warszawy 12<br/>35-959 Rzeszów, Poland</p>
            </div>
          </div>
        </div>

        <div className="bg-black/50 p-6 rounded-xl border border-gray-800">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="bg-green-500/20 text-green-400 p-4 rounded-full mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Message Sent!</h3>
              <p className="text-sm text-gray-400">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Your Name</label>
                <input required type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500" placeholder="John Doe" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Email Address</label>
                <input required type="email" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500" placeholder="john@example.com" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Message</label>
                <textarea required rows="4" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500 resize-none" placeholder="How can we help?"></textarea>
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider py-3 rounded-lg transition-all shadow-[0_5px_15px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2">
                Send Message 
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}