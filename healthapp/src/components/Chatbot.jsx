import { useState, useRef, useEffect } from 'react';
import { IoSparkles, IoImageOutline, IoSend, IoCloseCircle } from 'react-icons/io5';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

// Lyzr AI Configuration
const LYZR_CONFIG = {
    chatEndpoint: 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/',
    uploadEndpoint: 'https://agent-prod.studio.lyzr.ai/v3/assets/upload',
    apiKey: import.meta.env.VITE_LYZR_API_KEY || 'sk-default-cct6kTZStziDusmcEoYBxr0MHNwPFRKY',
    userId: import.meta.env.VITE_LYZR_USER_ID || 'shaswatshaswat620@gmail.com',
    agentId: import.meta.env.VITE_LYZR_AGENT_ID || '69b2f60c88c4456ed85f58b9',
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
    const [sessionId, setSessionId] = useState('');

    // Initialize session ID once on mount
    useEffect(() => {
        const randomStr = Math.random().toString(36).substring(7);
        setSessionId(`${LYZR_CONFIG.agentId}-${randomStr}`);
    }, []);

    // Typewriter effect state
    const [typingMessageId, setTypingMessageId] = useState(null);
    const [displayedText, setDisplayedText] = useState('');
    const typewriterSpeed = 8;

    const chatContainerRef = useRef(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (isTyping || messages.length > 1) scrollToBottom();
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
            setTypingMessageId(null);
        }
    }, [displayedText, typingMessageId, messages]);

    // Upload image to Lyzr Assets and return asset_id
    const uploadImageToLyzr = async (file) => {
        try {
            const formData = new FormData();
            formData.append('files', file);

            const response = await fetch(LYZR_CONFIG.uploadEndpoint, {
                method: 'POST',
                headers: { 'x-api-key': LYZR_CONFIG.apiKey },
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('Lyzr Asset Upload Error:', response.status, errText);
                return null;
            }

            const data = await response.json();
            console.log('Lyzr Asset Upload Success:', data);
            // Response format: { results: [{ asset_id, success, ... }] }
            return data?.results?.[0]?.asset_id || null;
        } catch (error) {
            console.error('Lyzr Asset Upload Error:', error);
            return null;
        }
    };

    // Send message (with optional asset IDs) to Lyzr and get response
    const callLyzrAI = async (messageText, assetIds = []) => {
        try {
            const body = {
                user_id: LYZR_CONFIG.userId,
                agent_id: LYZR_CONFIG.agentId,
                session_id: sessionId,
                message: messageText,
            };

            if (assetIds.length > 0) {
                body.assets = assetIds;
            }

            console.log('Lyzr Chat Payload:', body);

            const response = await fetch(LYZR_CONFIG.chatEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': LYZR_CONFIG.apiKey,
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('Lyzr Chat Error:', response.status, errText);
                throw new Error('API request failed');
            }

            const data = await response.json();
            console.log('Lyzr Chat Response:', data);
            return data.response || "I'm sorry, I'm having trouble processing that right now.";
        } catch (error) {
            console.error('Lyzr AI Error:', error);
            return "Connection error. Please check your network and try again.";
        }
    };

    const handleSendMessage = async () => {
        const text = inputValue.trim();
        if (!text && !pendingImage) return;

        const currentImageUrl = previewUrl;
        const currentImageFile = pendingImage;

        // Show user message immediately
        const newMsg = { id: Date.now(), text, sender: 'user', imageUrl: currentImageUrl };
        setMessages(prev => [...prev, newMsg]);

        // Reset inputs
        setInputValue('');
        setPendingImage(null);
        setPreviewUrl(null);
        setIsTyping(true);

        let finalMessage = text;
        let assetIds = [];

        if (currentImageFile) {
            // Upload image to Lyzr and get asset_id
            const assetId = await uploadImageToLyzr(currentImageFile);

            if (assetId) {
                assetIds = [assetId];
                // If no text provided, give a default prompt
                if (!finalMessage) {
                    finalMessage = 'I have uploaded an image. Please analyze it and provide detailed health information about what you see.';
                }
            } else {
                // Upload failed — tell the user
                setIsTyping(false);
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: '⚠️ Failed to upload the image to the server. Please check your connection and try again.',
                    sender: 'ai'
                }]);
                return;
            }
        }

        const aiResponseText = await callLyzrAI(finalMessage, assetIds);

        const newMessageId = Date.now();
        setIsTyping(false);
        setMessages(prev => [...prev, { id: newMessageId, text: aiResponseText, sender: 'ai' }]);

        setDisplayedText('');
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
        e.target.value = '';
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
                                        placeholder={previewUrl ? 'Ask about this image...' : 'Ask a health question...'}
                                        rows="1"
                                    />
                                    <button onClick={handleSendMessage} className="send-btn">
                                        <IoSend style={{ marginLeft: '4px' }} />
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
