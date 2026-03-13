import { IoPulseOutline, IoLeafOutline, IoTimeOutline } from 'react-icons/io5';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const Features = () => {
    useIntersectionObserver();

    return (
        <section id="features" className="features-section">
            <div className="container container-features">
                <div className="feature-grid">
                    {/* Feature 1 */}
                    <div className="feature-card glass animate-on-scroll">
                        <div className="feature-icon-wrapper">
                            <IoPulseOutline />
                        </div>
                        <h3 className="feature-title">Symptom Guidance</h3>
                        <p className="feature-text">Ask questions about common symptoms and get helpful suggestions. Guided by advanced AI logic.</p>
                    </div>

                    {/* Feature 2 */}
                    <div className="feature-card glass animate-on-scroll">
                        <div className="feature-icon-wrapper">
                            <IoLeafOutline />
                        </div>
                        <h3 className="feature-title">Health Awareness</h3>
                        <p className="feature-text">Learn simple health tips to improve your daily wellbeing and overall lifestyle choices.</p>
                    </div>

                    {/* Feature 3 */}
                    <div className="feature-card glass animate-on-scroll">
                        <div className="feature-icon-wrapper">
                            <IoTimeOutline />
                        </div>
                        <h3 className="feature-title">Instant Assistance</h3>
                        <p className="feature-text">Get quick responses from the AI assistant anytime, anywhere. No waiting, no hassle.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
