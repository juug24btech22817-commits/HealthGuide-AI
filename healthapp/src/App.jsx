import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Chatbot from './components/Chatbot';
import Disclaimer from './components/Disclaimer';
import Footer from './components/Footer';

function App() {
  const handleGetStarted = (e) => {
    e.preventDefault();
    const element = document.getElementById('chatbot');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Animated Background Blob */}
      <div className="bg-animation">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
      </div>

      <Navbar />
      <Hero onGetStarted={handleGetStarted} />
      <Chatbot />
      <Features />
      <Disclaimer />
      <Footer />
    </>
  );
}

export default App;
