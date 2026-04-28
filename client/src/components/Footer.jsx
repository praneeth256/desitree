import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="footer-logo">
        Desi<span>Tree</span>
      </div>
      <div className="footer-links">
        <Link to="/about">About us</Link>
        <Link to="/contact">DMCA and Report</Link>
      </div>
      <div className="footer-copy">
        © {new Date().getFullYear()} DesiTree. All rights reserved.
      </div>
    </footer>
  );
}

