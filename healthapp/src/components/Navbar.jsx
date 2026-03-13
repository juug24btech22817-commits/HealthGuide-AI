import { useState, useEffect } from 'react';
import { IoHeartHalfOutline } from 'react-icons/io5';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    return (
        <nav className={scrolled ? 'scrolled' : ''}>
            <div className="container container-nav">
                <div className="logo">
                    <span className="logo-icon"><IoHeartHalfOutline /></span>
                    <span className="logo-text">HealthGuide <span className="text-gradient">AI</span></span>
                </div>
                <div className="nav-links">
                    <a href="#hero" onClick={(e) => scrollToSection(e, 'hero')}>Home</a>
                    <a href="#chatbot" onClick={(e) => scrollToSection(e, 'chatbot')}>Chatbot</a>
                    <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
