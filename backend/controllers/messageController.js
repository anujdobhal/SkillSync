const Message = require('../models/Message');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, body } = req.body;

    if (!recipientId || !body) {
      return res.status(400).json({ message: 'Recipient and message body are required' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const message = await Message.create({
      sender: req.user.id,
      recipient: recipientId,
      body,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const withUser = req.query.with;

    if (withUser) {
      await Message.updateMany(
        {
          sender: withUser,
          recipient: req.user.id,
          read: false,
        },
        { read: true }
      );

      const conversation = await Message.find({
        $or: [
          { sender: req.user.id, recipient: withUser },
          { sender: withUser, recipient: req.user.id },
        ],
      })
      .sort('createdAt')
      .populate('sender', 'name username avatar')
      .populate('recipient', 'name username avatar');

      return res.json(conversation);
    }

    const allMessages = await Message.find({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ]
    })
    .sort('-createdAt')
    .populate('sender', 'name username avatar')
    .populate('recipient', 'name username avatar');

    const unreadCounts = {};
    allMessages.forEach(message => {
      const senderId = message.sender._id.toString();
      if (message.recipient._id.toString() === req.user.id && !message.read) {
        unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
      }
    });

    const conversations = [];
    const seen = new Set();

    allMessages.forEach(message => {
      const otherUser = message.sender._id.toString() === req.user.id
        ? message.recipient
        : message.sender;
      const otherId = otherUser._id.toString();

      if (!seen.has(otherId)) {
        seen.add(otherId);
        conversations.push({
          user: otherUser,
          lastMessage: message.body,
          timestamp: message.createdAt,
          unreadCount: unreadCounts[otherId] || 0,
        });
      }
    });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages', error: err.message });
  }
};
