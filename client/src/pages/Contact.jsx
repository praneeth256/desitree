import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { submitContactForm } from '../services/api';

const SUBJECTS = [
  'Please choose a subject...',
  'Illegal content or rights violation',
  'Need Help',
  'Suggestions and bug report',
  'Advertising',
  'Other'
];

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: SUBJECTS[0],
    message: ''
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.subject === SUBJECTS[0] || !form.message.trim()) {
      setStatus('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await submitContactForm(form);
      setStatus('Message sent successfully! We will get back to you soon.');
      setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' });
    } catch (error) {
      setStatus('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation showAdmin={false} />
      <main className="contact-page">
        <div className="contact-card">
          <h1>Send us a Message</h1>
          <form onSubmit={handleSubmit} className="contact-form">
            <label>
              Your Name *
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Enter your full name"
                required
              />
            </label>
            <label>
              Your Email *
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="your@email.com"
                required
              />
            </label>
            <label>
              Subject *
              <select value={form.subject} onChange={handleChange('subject')} required>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Message (English only) *
              <textarea
                value={form.message}
                onChange={handleChange('message')}
                placeholder="Please describe your issue or question in detail..."
                rows="5"
                required
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </button>
            {status && <p className="contact-status">{status}</p>}
          </form>
          <Link to="/" className="btn btn-ghost contact-back">Back to Home</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

