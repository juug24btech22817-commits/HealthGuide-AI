import { useState, useRef, useEffect } from 'react';
import { IoSparkles, IoImageOutline, IoSend, IoCloseCircle } from 'react-icons/io5';
import { marked } from 'marked';
import DOMPurify from 'dompurify'; // Need to add this to dependancies for security! 
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

// Lyzr AI Configuration
const LYZR_CONFIG = {
    endpoint: 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/',
    apiKey: 'sk-default-cct6kTZStziDusmcEoYBxr0MHNwPFRKY',
    userId: 'shaswatshaswat620@gmail.com',
    agentId: '69b2f60c88c4456ed85f58b9',
    sessionId: '69b2f60c88c4456ed85f58b9-0yi3hgnqk7o9',
};

// Gemini Vision API Configuration
const GEMINI_CONFIG = {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDYMBCibf0aMZaMCpAH_gCRvxvKu6GXHMI',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
};

const Chatbot = () => {
    useIntersectionObserver();

    const [messages, setMessages] = useState([
        { id: 1, text: "Hi, I'm HealthGuide. How can I help?", sender: 'ai' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [pendingImage, setPendingImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    
    // Typewriter effect state
    const [typingMessageId, setTypingMessageId] = useState(null);
    const [displayedText, setDisplayedText] = useState("");
    const typewriterSpeed = 8; // ms per character (lowered from 15 to 8 for faster but still visible pacing)

    const chatContainerRef = useRef(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
             // Let user scroll if they want, but snap bottom strictly within this container box 
             // without affecting the whole HTML page scroll.
             chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        // Only scroll when typing just finished so we are ready for the answer
        if (isTyping || messages.length > 1) {
             scrollToBottom();
        }
    }, [messages, isTyping]);

    // Typewriter effect engine
    useEffect(() => {
        if (!typingMessageId) return;
        
        const messageObject = messages.find(m => m.id === typingMessageId);
        if (!messageObject) return;

        const fullText = messageObject.text;
        
        if (displayedText.length < fullText.length) {
            const timer = setTimeout(() => {
                setDisplayedText(fullText.slice(0, displayedText.length + 1));
            }, typewriterSpeed);
            
            return () => clearTimeout(timer);
        } else {
            // Finished typing
            setTypingMessageId(null);
        }
    }, [displayedText, typingMessageId, messages]);

    // Convert a File object to a base64 data string
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // strip data:...;base64, prefix
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    // Use Gemini Vision to analyze a tablet packet / prescription image
    const analyzeImageWithGemini = async (file) => {
        try {
            const base64Data = await fileToBase64(file);
            const mimeType = file.type || 'image/jpeg';

            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: `You are a medical image analysis expert. Carefully examine this image and extract ALL visible information. 
If it is a medicine / tablet / drug:
- Full medicine name and brand name
- Active ingredients and salt composition
- Dosage (mg/ml)
- Usage instructions or indications
- Warnings or precautions visible
- Manufacturer and batch/expiry if visible

If it is a doctor's prescription:
- Medicines prescribed (names, dosage, frequency)
- Diagnosis or condition mentioned
- Doctor's instructions
- Patient details if visible

If it is something else health-related, describe it in detail.
Return a clear, structured summary of everything you can read from the image.`
                        },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1024
                }
            };

            const response = await fetch(`${GEMINI_CONFIG.endpoint}?key=${GEMINI_CONFIG.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('Gemini Vision Error:', errText);
                return null;
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('Gemini Vision result:', text);
            return text || null;
        } catch (error) {
            console.error('Gemini Vision Error:', error);
            return null;
        }
    };

    // Upload a file to Lyzr Assets
    const uploadLyzrAsset = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('https://agent-prod.studio.lyzr.ai/v3/assets/upload/', {
                method: 'POST',
                headers: {
                    'x-api-key': LYZR_CONFIG.apiKey
                },
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('Lyzr Asset Upload Error Response:', errText);
                throw new Error('Asset upload failed');
            }

            const data = await response.json();
            console.log('Lyzr Asset Upload Success:', data);
            return data.asset_id; // returns the ID needed for chat inference
        } catch (error) {
            console.error('Lyzr Asset Upload Error:', error);
            return null;
        }
    };

    const callLyzrAI = async (messageText, assetIds = []) => {
        try {
            const body = {
                user_id: LYZR_CONFIG.userId,
                agent_id: LYZR_CONFIG.agentId,
                session_id: LYZR_CONFIG.sessionId,
                message: messageText
            };

            // If we have uploaded assets, include them in the request
            // Using 'assets' as the key based on latest Lyzr API patterns
            if (assetIds && assetIds.length > 0) {
                body.assets = assetIds; 
            }

            console.log('Lyzr Chat Payload:', body);
            const response = await fetch(LYZR_CONFIG.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': LYZR_CONFIG.apiKey
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('Lyzr AI API Error Response:', errText);
                throw new Error('API request failed');
            }

            const data = await response.json();
            console.log('Lyzr Chat Response:', data);
            return data.response || "I'm sorry, I'm having trouble processing that right now.";
        } catch (error) {
            console.error('Lyzr AI Error:', error);
            return "Connection error. Please check your API key or network and try again.";
        }
    };

    const handleSendMessage = async () => {
        const text = inputValue.trim();
        if (!text && !pendingImage) return;

        const currentImageUrl = previewUrl;
        const currentImageFile = pendingImage;

        // Add user message to UI
        const newMsg = { id: Date.now(), text, sender: 'user', imageUrl: currentImageUrl };
        setMessages(prev => [...prev, newMsg]);

        // Reset inputs immediately
        setInputValue('');
        setPendingImage(null);
        setPreviewUrl(null);
        setIsTyping(true);

        let finalMessage = text;
        let assetIds = [];

        if (currentImageFile) {
            // Step 1: Upload the image to Lyzr Assets first
            const assetId = await uploadLyzrAsset(currentImageFile);
            
            if (assetId) {
                assetIds = [assetId];
                // Context for the agent if no text is provided
                if (!finalMessage) {
                    finalMessage = "I've uploaded an image. Please analyze it and provide health guidance.";
                }
            } else {
                // Fallback to Gemini if Lyzr upload fails (optional, keeping for robustness)
                console.log('Lyzr upload failed, falling back to Gemini Vision extraction...');
                const imageAnalysis = await analyzeImageWithGemini(currentImageFile);
                if (imageAnalysis) {
                    finalMessage = `The user uploaded a health-related image. Extracted info: ${imageAnalysis}. Question: ${text || 'Please analyze this.'}`;
                }
            }
        }

        const aiResponseText = await callLyzrAI(finalMessage, assetIds);
        
        // Add AI message empty, then start typewriter
        const newMessageId = Date.now();
        setIsTyping(false);
        setMessages(prev => [...prev, { id: newMessageId, text: aiResponseText, sender: 'ai' }]);
        
        // Start typing effect for this specific message id
        setDisplayedText("");
        setTypingMessageId(newMessageId);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPendingImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
        e.target.value = ''; // Reset file input
    };

    const removeImage = () => {
        setPendingImage(null);
        setPreviewUrl(null);
    };

    return (
        <section id="chatbot" className="chatbot-section">
            <div className="container chatbot-container">
                <div className="section-header animate-on-scroll">
                    <p className="section-tag">AI-Powered Assistance</p>
                    <h2 className="section-title">Ask HealthGuide AI about symptoms, health tips, or basic wellness advice.</h2>
                </div>

                <div className="chat-interface-wrapper animate-on-scroll">
                    <div className="chat-interface glass">
                        <div className="chat-header">
                            <div className="ai-avatar">
                                <IoSparkles />
                            </div>
                            <div className="ai-status">
                                <p className="ai-name">HealthGuide AI Assistant</p>
                                <p className="status-indicator"><span className="dot"></span> Online</p>
                            </div>
                        </div>
                        
                        <div className="chat-messages" id="chatMessages" ref={chatContainerRef}>
                            {messages.map((msg) => (
                                <div key={msg.id} className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}>
                                    <div className="message-content">
                                        {msg.imageUrl && (
                                            <img src={msg.imageUrl} className="chat-image-preview" alt="User upload" />
                                        )}
                                        {msg.text && (
                                            msg.sender === 'ai' ? (
                                                msg.id === typingMessageId ? (
                                                     <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(displayedText, { breaks: true })) }} />
                                                ) : (
                                                     <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(msg.text, { breaks: true })) }} />
                                                )
                                            ) : (
                                                <div>{msg.text}</div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="message ai-message typing-indicator">
                                    <div className="message-content">
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="chat-input-area">
                            {previewUrl && (
                                <div className="image-preview-container">
                                    <img src={previewUrl} alt="Selected preview" />
                                    <button onClick={removeImage} className="remove-image-btn"><IoCloseCircle /></button>
                                </div>
                            )}
                            <div className="input-row">
                                <div className="input-actions">
                                    <label htmlFor="imageUpload" className="upload-btn action-btn">
                                        <IoImageOutline />
                                        <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} hidden />
                                    </label>
                                </div>
                                <div className="input-wrapper">
                                    <textarea 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={previewUrl ? "What is in this image?" : "Ask a health question..."} 
                                        rows="1"
                                    />
                                    <button onClick={handleSendMessage} className="send-btn">
                                        <IoSend style={{marginLeft: '4px'}}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Chatbot;
