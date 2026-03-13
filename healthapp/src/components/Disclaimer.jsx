import { IoAlertCircleOutline } from 'react-icons/io5';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const Disclaimer = () => {
    useIntersectionObserver();

    return (
        <section className="disclaimer">
            <div className="container">
                <div className="disclaimer-box glass animate-on-scroll">
                    <IoAlertCircleOutline />
                    <p><strong>HealthGuide AI</strong> provides general health information for awareness purposes only. It does not replace professional medical advice. Please consult a healthcare professional for serious medical concerns.</p>
                </div>
            </div>
        </section>
    );
};

export default Disclaimer;
