import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-white/10 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-gray-500 text-sm font-bold tracking-wider uppercase">
          &copy; {new Date().getFullYear()} CardBid. All rights reserved.
        </div>
        <div className="flex gap-6 text-sm font-bold text-gray-500">
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}