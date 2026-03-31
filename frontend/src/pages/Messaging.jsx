import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import './Messaging.css';

const Messaging = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const params = new URLSearchParams(location.search);
  const initialUserId = params.get('userId');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const totalUnread = conversations.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages');
      setConversations(data);

      if (initialUserId) {
        const conversationUser = data.find(item => item.user._id === initialUserId);
        if (conversationUser) {
          setSelectedUser(conversationUser.user);
        } else {
          const other = { _id: initialUserId, name: 'Teammate' };
          setSelectedUser(other);
        }
      } else if (data.length > 0) {
        setSelectedUser(data[0].user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const { data } = await api.get('/messages', { params: { with: userId } });
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageText.trim()) return;

    try {
      await api.post('/messages', {
        recipientId: selectedUser._id,
        body: messageText.trim(),
      });
      setMessageText('');
      fetchMessages(selectedUser._id);
      fetchConversations();
    } catch (err) {
      console.error(err);
      alert('Unable to send message.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container messaging-page">
        <header className="dash-header flex-between">
          <div>
            <h1>Messaging</h1>
            <p>Keep your team conversations in one place.</p>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/teams')}>Back to Teams</button>
        </header>

        <div className="messages-layout">
          <aside className="conversation-list">
            <div className="messages-header-row">
              <h2>Conversations</h2>
              {totalUnread > 0 && <span className="notification-badge">{totalUnread}</span>}
            </div>
            {loading ? (
              <div className="loading">Loading chats...</div>
            ) : conversations.length === 0 ? (
              <div className="empty-state">No messages yet. Start by messaging a teammate.</div>
            ) : (
              <ul>
                {conversations.map(convo => (
                  <li
                    key={convo.user._id}
                    className={selectedUser?._id === convo.user._id ? 'conversation active' : 'conversation'}
                    onClick={() => setSelectedUser(convo.user)}
                  >
                    <div>
                      <strong>{convo.user.name}</strong>
                      <p>{convo.lastMessage}</p>
                    </div>
                    <div className="conversation-meta">
                      {convo.unreadCount > 0 && <span className="conversation-unread">{convo.unreadCount}</span>}
                      <span>{new Date(convo.timestamp).toLocaleDateString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <main className="chat-panel">
            {selectedUser ? (
              <>
                <div className="chat-header">
                  <div>
                    <h2>{selectedUser.name}</h2>
                    <p>Chat with your teammate</p>
                  </div>
                </div>
                <div className="chat-history">
                  {messages.length === 0 ? (
                    <div className="empty-state">No messages yet. Say hello!</div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg._id}
                        className={msg.sender._id === user.id ? 'chat-message outgoing' : 'chat-message incoming'}
                      >
                        <p>{msg.body}</p>
                        <small>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </div>
                    ))
                  )}
                  <div ref={scrollRef} />
                </div>
                <div className="chat-input-row">
                  <textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    rows={3}
                  />
                  <button className="btn-save" onClick={handleSendMessage} disabled={!messageText.trim()}>Send</button>
                </div>
              </>
            ) : (
              <div className="empty-state">Select a conversation to begin.</div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Messaging;
