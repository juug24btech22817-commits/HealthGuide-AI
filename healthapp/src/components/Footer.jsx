import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const Footer = () => {
    useIntersectionObserver();

    return (
        <footer>
            <div className="container footer-content animate-on-scroll">
                <p>&copy; 2024 HealthGuide AI – AI-powered health awareness platform.</p>
                <div className="footer-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Use</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
