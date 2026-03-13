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
    sessionId: '69b2f60c88c4456ed85f58b9-uc62e73gmvk',
    assetUploadEndpoint: 'https://agent-prod.studio.lyzr.ai/v3/assets/upload'
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

    const uploadLyzrAsset = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(LYZR_CONFIG.assetUploadEndpoint, {
                method: 'POST',
                headers: {
                    'x-api-key': LYZR_CONFIG.apiKey
                },
                body: formData
            });

            if (!response.ok) throw new Error('Asset upload failed');

            const data = await response.json();
            console.log("Asset uploaded successfully. Asset ID:", data.asset_id);
            return data.asset_id;
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

            if (assetIds.length > 0) {
                body.asset_ids = assetIds;
            }

            const response = await fetch(LYZR_CONFIG.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': LYZR_CONFIG.apiKey
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            return data.response || "I'm sorry, I'm having trouble processing that right now.";
        } catch (error) {
            console.error('Lyzr AI Error:', error);
            return "Connection error. Please check your API key or network and try again.";
        }
    };

    const handleSendMessage = async () => {
        const text = inputValue.trim();
        if (!text && !pendingImage) return;

        let userMessageContext = text;
        const currentImageUrl = previewUrl;
        const currentImageFile = pendingImage;

        if (currentImageFile) {
            userMessageContext = `[SYSTEM-LEVEL ANALYSIS REQUEST]: The user has attached an image of a health-related item (tablet/prescription). Please analyze this image context and provide detailed information, benefits, and health guidance based on the visual data provided. User Query: "${text}"`;
        }

        // Add user message to UI
        const newMsg = { id: Date.now(), text, sender: 'user', imageUrl: currentImageUrl };
        setMessages(prev => [...prev, newMsg]);

        // Reset inputs immediately
        setInputValue('');
        setPendingImage(null);
        setPreviewUrl(null);
        setIsTyping(true);

        // Upload and Call API
        let assetIds = [];
        if (currentImageFile) {
            const assetId = await uploadLyzrAsset(currentImageFile);
            if (assetId) {
                assetIds.push(assetId);
            }
        }

        const aiResponseText = await callLyzrAI(userMessageContext, assetIds);
        
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
