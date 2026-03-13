import { IoArrowForwardOutline } from 'react-icons/io5';

const Hero = ({ onGetStarted }) => {
    return (
        <section id="hero" className="hero">
            <div className="container hero-content animate-fade-in">
                <h1 className="hero-title">HealthGuide <span className="text-gradient">AI</span></h1>
                <p className="hero-subtitle">Your Smart Assistant for Basic Health Guidance</p>
                <p className="hero-description">
                    HealthGuide AI helps you understand common health symptoms and provides simple guidance. 
                    Ask questions about health concerns and receive helpful suggestions instantly.
                </p>
                <a href="#chatbot" onClick={onGetStarted} className="btn btn-primary">
                    Get Started
                    <IoArrowForwardOutline style={{ marginLeft: '8px' }} />
                </a>
            </div>
        </section>
    );
};

export default Hero;
