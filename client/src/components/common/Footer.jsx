import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-elevated border-t border-border-default px-6 py-4 shrink-0 transition-colors duration-300">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-text-secondary">
        <p>© {currentYear} AMS Pro. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="hover:text-primary-500 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary-500 transition-colors">Terms of Service</Link>
          <Link to="/help" className="hover:text-primary-500 transition-colors">Help Center</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;