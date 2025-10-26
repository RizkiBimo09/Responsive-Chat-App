document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.querySelector('.message-input');
    const sendButton = document.querySelector('.send-button');
    const loadingIndicator = document.querySelector('.loading-indicator');


    const API_URL = '../../data/chat_room_endpoint_extended.json';


    const CURRENT_USER_ID = 'user1';

    // Function to fetch chat data
    async function fetchChatData() {
        try {
            loadingIndicator.style.display = 'block';
            console.log('Fetching data from:', API_URL);

            const response = await fetch(API_URL);
            console.log('Fetch response:', response);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText || ''}. Response Body: ${errorText.substring(0, 200)}`);
            }

            const data = await response.json();
            console.log('Parsed JSON data:', data);


            if (Array.isArray(data)) {
                return data;
            } else if (data && Array.isArray(data.data)) {
                return data.data;
            } else {
                throw new Error("Fetched data is not an array or does not contain a 'data' array.");
            }

        } catch (error) {
            console.error('Error fetching chat data:', error);
            chatMessages.innerHTML = '<div class="loading-indicator">Failed to load messages. Please try again.<br>Error: ' + error.message + '</div>';
            return [];
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    // Function to render a single message
    function renderMessage(message) {
        const isSender = message.sender.id === CURRENT_USER_ID;
        const messageClass = isSender ? 'message-sender' : 'message-receiver';

        const avatarSrc = message.sender.avatar || `https://via.placeholder.com/30/${stringToColorHash(message.sender.username)}/FFFFFF?text=${message.sender.username.charAt(0).toUpperCase()}`;

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', messageClass);

        const timestamp = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let messageContentHtml = '';

        // Logic for different message types
        switch (message.type) {
            case 'text':
                messageContentHtml = `<div class="message-text">${message.message}</div>`;
                break;
            case 'image':
                messageContentHtml = `
                    <div class="message-image">
                        <a href="${message.file_url}" target="_blank">
                            <img src="${message.thumbnail_url || message.file_url}" alt="${message.message || 'Image'}" class="image-preview">
                        </a>
                        ${message.message ? `<div class="image-caption">${message.message}</div>` : ''}
                    </div>
                `;
                break;
            case 'video':
                messageContentHtml = `
                    <div class="message-video">
                        <video controls poster="${message.thumbnail_url || ''}" class="video-player">
                            <source src="${message.file_url}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        ${message.message ? `<div class="video-caption">${message.message}</div>` : ''}
                    </div>
                `;
                break;
            case 'file':
                const isPdf = message.file_url && message.file_url.toLowerCase().endsWith('.pdf');
                const fileIcon = isPdf ? 'picture_as_pdf' : 'description';
                messageContentHtml = `
                    <div class="message-file">
                        <a href="${message.file_url}" target="_blank" class="file-link">
                            <i class="material-icons file-icon">${fileIcon}</i>
                            <div class="file-info">
                                <span class="file-name">${message.file_name || 'File'}</span>
                                ${message.file_size ? `<span class="file-size">${message.file_size}</span>` : ''}
                                ${message.message ? `<span class="file-description">${message.message}</span>` : ''}
                            </div>
                        </a>
                    </div>
                `;
                break;
            default:
                messageContentHtml = `<div class="message-text">Unsupported message type: ${message.type}</div>`;
        }
        // End of Logic for different message types


        messageElement.innerHTML = `
            ${!isSender ? `<img src="${avatarSrc}" alt="${message.sender.username}" class="message-avatar">` : ''}
            <div class="message-bubble">
                ${!isSender ? `<div class="message-header" style="color: ${stringToColor(message.sender.username)};">${message.sender.username}</div>` : ''}
                <div class="message-content">${messageContentHtml}</div>
                <div class="message-info">${timestamp}</div>
            </div>
        `;
        chatMessages.appendChild(messageElement);
    }

    // Function to render all messages and scroll to bottom
    async function renderAllMessages() {
        const chatData = await fetchChatData();
        chatMessages.innerHTML = '';

        if (chatData.length === 0) {
            chatMessages.innerHTML = '<div class="loading-indicator">No messages found.</div>';
            return;
        }

        chatData.forEach(message => renderMessage(message));
        scrollToBottom();
    }

    // Function to scroll to the bottom of the chat
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to simulate sending a message
    function sendMessage() {
        const content = messageInput.value.trim();
        if (content) {
            const newMessage = {
                id: `msg-${Date.now()}`,
                chat_id: "chat-room-1",
                sender: {
                    id: CURRENT_USER_ID,
                    username: "You",
                    avatar: null
                },
                message: content,
                type: "text",
                created_at: new Date().toISOString(),
                is_read: false
            };
            renderMessage(newMessage);
            messageInput.value = '';
            scrollToBottom();

           
            console.log('Simulated message sent:', newMessage);
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Helper function to generate a consistent color for sender's username
    function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            let value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }

    // Helper function to generate a consistent color hash for placeholder avatars
    function stringToColorHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '';
        for (let i = 0; i < 3; i++) {
            let value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }


    // Initial load of messages
    renderAllMessages();
});
