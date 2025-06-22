const API_KEY = 'AIzaSyC0_lHixSzKJxw-JlWgtKyHNJjhP48zkhY';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

const chatMessages = document.getElementById('chat-messages');
// Gets the DOM element with the ID 'chat-messages', where the chat messages (user and bot) will be displayed.

const userInput = document.getElementById('user-input');
// Gets the DOM element with the ID 'user-input', which is the input field where the user types their message.

const sendButton = document.getElementById('send-button');
// Gets the DOM element with the ID 'send-button', which is the button the user clicks to send their message.

/**
 * Generates a response from the Google Gemini API.
 * @param {string} prompt - The user's input message.
 * @returns {Promise<string>} - The bot's response text.
 */
async function generateResponse(prompt) {
    const full_url = `${API_URL}?key=${API_KEY}`;
    
    let response;
    try {
        response = await fetch(full_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });
    } catch (error) {
        console.error('Network or fetch error:', error);
        throw new Error('Failed to fetch. Check your network connection and browser console for CORS issues.');
    }

    const data = await response.json();

    if (!response.ok) {
        console.error('API Error Response:', data);
        if (data.error) {
            if (data.error.message.includes("API key not valid")) {
                 throw new Error('Your Google API key is not valid. Please pass a valid API key.');
            }
            throw new Error(`API Error: ${data.error.message}`);
        }
        throw new Error(`Failed to generate response. Status: ${response.status}`);
    }
    
    if (!data.candidates || data.candidates.length === 0) {
        console.warn('API returned no candidates.', data);
        if (data.promptFeedback && data.promptFeedback.blockReason) {
            return `Your prompt was blocked for the following reason: ${data.promptFeedback.blockReason}. Please modify your prompt and try again.`;
        }
        return "I couldn't generate a response for that. Please try something else.";
    }

    return data.candidates[0].content.parts[0].text;
}

/**
 * Cleans basic markdown from the bot's response.
 * @param {string} text - The text to clean.
 * @returns {string} - The cleaned text.
 */
function cleanMarkdown(text) {
    return text
        .replace(/#{1,6}\s?/g, '')
        .replace(/\*\*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Adds a message to the chat window.
 * @param {string} message - The message content.
 * @param {boolean} isUser - True if the message is from the user.
 * @param {boolean} isError - True if the message is an error message.
 */
function addMessage(message, isUser, isError = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    if (isError) {
        messageElement.classList.add('bot-message', 'error-message');
    } else {
        messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
    }

    const profileImage = document.createElement('div');
    profileImage.classList.add('profile-image');
    profileImage.classList.add(isUser ? 'user-avatar' : 'bot-avatar');
    
    // Use initials or icons instead of images
    profileImage.textContent = isUser ? '👤' : '🤖';
    profileImage.style.display = 'flex';
    profileImage.style.alignItems = 'center';
    profileImage.style.justifyContent = 'center';
    profileImage.style.fontSize = '16px';
    profileImage.style.backgroundColor = isUser ? '#667eea' : '#764ba2';

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = message;

    messageElement.appendChild(profileImage);
    messageElement.appendChild(messageContent);

    // Add copy button for bot messages
    if (!isError && !isUser) {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = 'Copy text';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(message).then(() => {
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
        messageContent.appendChild(copyButton);
    }

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Handles the user input, sends it to the API, and displays the response.
 */
async function handleUserInput() {
    const userMessage = userInput.value.trim();
    // Retrieves the user input from the input field and trims any leading/trailing whitespace.

    if (userMessage) {
        addMessage(userMessage, true);
        userInput.value = '';
        sendButton.disabled = true;
        userInput.disabled = true;
        
        showTypingIndicator();

        try {
            const botMessage = await generateResponse(userMessage);
            addMessage(cleanMarkdown(botMessage), false);
        } catch (error) {
            console.error('Error:', error);
            addMessage(error.message, false, true); // Pass true for isError
        } finally {
            hideTypingIndicator();
            sendButton.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    }
}

/**
 * Shows the typing indicator animation.
 */
function showTypingIndicator() {
    const typingElement = document.createElement('div');
    typingElement.id = 'typing-indicator';
    typingElement.classList.add('message', 'bot-message', 'typing-indicator');
    typingElement.innerHTML = `
        <div class="profile-image bot-avatar" style="display: flex; align-items: center; justify-content: center; font-size: 16px; background-color: rgb(118, 75, 162);">🤖</div>
        <div class="message-content" style="background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Hides the typing indicator animation.
 */
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

sendButton.addEventListener('click', handleUserInput);
// Adds an event listener to the send button that calls `handleUserInput` when clicked.

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
    }
});

// Add a welcome message when the page loads
window.addEventListener('load', () => {
    addMessage("Hello! I'm Voxelle, your AI assistant. How can I help you today?", false);
});