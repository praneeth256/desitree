import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function About() {
  return (
    <>
      <Navigation showAdmin={false} />
      <main className="about-page">
        <div className="about-card">
          <h1>About Us</h1>
          <p>
            Desitree is a reliable site which itself a gamechanger for everyone who tends to find a soulful videos for free and feel free to contact us anytime if you found any bug or issue!
          </p>
          <p className="about-signoff">
            Thanks ~ Team Desitree
          </p>
          <Link to="/" className="btn btn-primary about-back">Back to Home</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

