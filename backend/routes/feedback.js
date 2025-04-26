const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const authMiddleware = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/feedback');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/webm' || file.mimetype === 'audio/mpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only .webm and .mp3 files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Post feedback for an event
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    const {memberId, eventId, text, rating } = req.body;
    // const memberId = req.user.id; // From authMiddleware
 
    // Validate required fields
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Create feedback object
    const feedbackData = {
      eventId,
      memberId,
      text: text || '',
      rating: rating ? parseInt(rating) : undefined,
      likes: 0,
      dislikes: 0,
      comments: [],
    };

    // Handle audio file if uploaded
    if (req.file) {
      feedbackData.audio = `/uploads/feedback/${req.file.filename}`; // Store relative path
    }

    const feedback = new Feedback(feedbackData);
    await feedback.save();

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error posting feedback:', error);
    res.status(500).json({ message: 'Error posting feedback', error: error.message });
  }
});

// Fetch feedback for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ eventId: req.params.eventId })
      .populate('memberId', 'name verified')
      .populate('eventId', 'name');
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
});

// Serve audio files
router.get('/audio/:filename', (req, res) => {
  const { filename } = req.params;
  const audioPath = path.join(__dirname, '../uploads/feedback', filename);
  if (fs.existsSync(audioPath)) {
    res.sendFile(audioPath, { headers: { 'Content-Type': 'audio/webm' } });
  } else {
    res.status(404).json({ message: 'Audio file not found' });
  }
});

// Like a feedback
router.put('/:id/like', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    feedback.likes += 1;
    await feedback.save();
    res.json({ likes: feedback.likes });
  } catch (error) {
    res.status(500).json({ message: 'Error liking feedback', error: error.message });
  }
});

// Dislike a feedback
router.put('/:id/dislike', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    feedback.dislikes += 1;
    await feedback.save();
    res.json({ dislikes: feedback.dislikes });
  } catch (error) {
    res.status(500).json({ message: 'Error disliking feedback', error: error.message });
  }
});

// Add a comment to feedback
router.put('/:id/comment', async (req, res) => {
  try {
    const { id: memberId, text, parentCommentId } = req.body;
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    const newComment = { text, memberId: memberId || req.user.id, date: new Date() };

    if (parentCommentId) {
      const findAndReply = (comments) => {
        for (let comment of comments) {
          if (!comment._id) continue; // Skip if _id is missing
          if (comment._id.toString() === parentCommentId.toString()) {
            if (!comment.replies) comment.replies = [];
            comment.replies.push(newComment);
            return true;
          }
          if (comment.replies && findAndReply(comment.replies)) {
            return true;
          }
        }
        return false;
      };

      const found = findAndReply(feedback.comments);
      if (!found) return res.status(404).json({ message: 'Parent comment not found' });
    } else {
      if (!feedback.comments) feedback.comments = [];
      feedback.comments.push(newComment);
    }

    await feedback.save();
    res.json(feedback.comments);
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

// Toggle verification (admin-only)
router.put('/:id/verify', async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'admin') return res.status(403).json({ message: 'Forbidden: Admins only' });
    const feedback = await Feedback.findById(req.params.id).populate('memberId');
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    feedback.memberId.verified = !feedback.memberId.verified;
    await feedback.memberId.save();
    res.json({ verified: feedback.memberId.verified });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling verification', error: error.message });
  }
});

module.exports = router;