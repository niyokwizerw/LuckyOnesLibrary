// ============================================
// LUCKY ONES LIBRARY - server.js (COMPLETE v3)
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
require('dotenv').config();

const Book = require('./models/Book');
const Poem = require('./models/Poem');
const app = express();

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('backend/uploads'));

// ============================================
// MULTER — PDF + Image Upload
// ============================================
const storage = multer.diskStorage({
    destination: 'backend/uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PDF and image files are allowed.'), false);
    },
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB max
});

// Accept both pdf and image fields
const uploadFields = upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]);

// ============================================
// DATABASE
// ============================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Database Connected — Lucky Ones Library Online'))
    .catch(err => console.log('❌ DB Error:', err));

// ============================================
// NODEMAILER
// ============================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function sendNotification(subject, text) {
    try {
        await transporter.sendMail({
            from: `"Lucky Ones Library" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject, text
        });
        console.log('✅ Email sent:', subject);
    } catch (err) {
        console.log('⚠️ Email not sent:', err.message);
    }
}

// ============================================
// ADMIN MESSAGE
// ============================================
const messageSchema = new mongoose.Schema({ message: { type: String, default: '' } });
const Message = mongoose.model('Message', messageSchema);

app.get('/api/message', async (req, res) => {
    try {
        let msg = await Message.findOne();
        if (!msg) msg = { message: '' };
        res.json(msg);
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

app.post('/api/message', async (req, res) => {
    try {
        const { message } = req.body;
        let msg = await Message.findOne();
        if (msg) { msg.message = message; await msg.save(); }
        else { await new Message({ message }).save(); }
        res.json({ success: true, message });
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

// ============================================
// BOOKS ROUTES
// ============================================

app.get('/api/books', async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        res.json(books);
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

app.get('/api/books/:id', async (req, res) => {
    try {
        const foundBook = await Book.findById(req.params.id);
        if (!foundBook) return res.status(404).json({ msg: 'Book not found' });
        res.json(foundBook);
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

app.post('/api/books', uploadFields, async (req, res) => {
    try {
        const { title, category, description, content } = req.body;
        if (!title || !category || !content)
            return res.status(400).json({ msg: 'Title, category and content are required.' });

        const newBook = new Book({
            title,
            category,
            description: description || '',
            content,
            pdfPath: req.files?.pdf?.[0]?.filename || null,
            coverImage: req.files?.image?.[0]?.filename || null
        });
        await newBook.save();
        res.status(201).json(newBook);
    } catch (err) {
        console.log('❌ Upload error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

app.delete('/api/books/:id', async (req, res) => {
    try {
        const deletedBook = await Book.findByIdAndDelete(req.params.id);
        if (!deletedBook) return res.status(404).json({ msg: 'Book not found' });
        res.json({ msg: 'Book deleted successfully.' });
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

app.post('/api/books/:id/like', async (req, res) => {
    try {
        const foundBook = await Book.findById(req.params.id);
        if (!foundBook) return res.status(404).json({ msg: 'Book not found' });
        foundBook.likes = (foundBook.likes || 0) + 1;
        await foundBook.save();
        await sendNotification(`❤️ New Like on "${foundBook.title}"`, `Someone liked: "${foundBook.title}"\nTotal likes: ${foundBook.likes}`);
        res.json({ likes: foundBook.likes });
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

app.post('/api/books/:id/comment', async (req, res) => {
    try {
        const foundBook = await Book.findById(req.params.id);
        if (!foundBook) return res.status(404).json({ msg: 'Book not found' });
        const { email, text } = req.body;
        if (!email || !text) return res.status(400).json({ msg: 'Email and comment are required.' });
        foundBook.comments.push({ userEmail: email, text });
        await foundBook.save();
        await sendNotification(`💬 New Comment on "${foundBook.title}"`, `${email} commented:\n\n"${text}"`);
        res.json(foundBook);
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

// ============================================
// POEMS ROUTES
// ============================================

app.get('/api/poems', async (req, res) => {
    try {
        const poems = await Poem.find().sort({ createdAt: -1 });
        res.json(poems);
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

app.get('/api/poems/:id', async (req, res) => {
    try {
        const poem = await Poem.findById(req.params.id);
        if (!poem) return res.status(404).json({ msg: 'Poem not found' });
        res.json(poem);
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

app.post('/api/poems', uploadFields, async (req, res) => {
    try {
        const { title, author, description, content } = req.body;
        if (!title || !content)
            return res.status(400).json({ msg: 'Title and content are required.' });

        const newPoem = new Poem({
            title,
            author: author || 'Damie',
            description: description || '',
            content,
            pdfPath: req.files?.pdf?.[0]?.filename || null,
            coverImage: req.files?.image?.[0]?.filename || null
        });
        await newPoem.save();
        res.status(201).json(newPoem);
    } catch (err) {
        console.log('❌ Poem upload error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

app.delete('/api/poems/:id', async (req, res) => {
    try {
        const poem = await Poem.findByIdAndDelete(req.params.id);
        if (!poem) return res.status(404).json({ msg: 'Poem not found' });
        res.json({ msg: 'Poem deleted successfully.' });
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

app.post('/api/poems/:id/like', async (req, res) => {
    try {
        const poem = await Poem.findById(req.params.id);
        if (!poem) return res.status(404).json({ msg: 'Poem not found' });
        poem.likes = (poem.likes || 0) + 1;
        await poem.save();
        await sendNotification(`❤️ New Like on "${poem.title}"`, `Someone liked: "${poem.title}"\nTotal likes: ${poem.likes}`);
        res.json({ likes: poem.likes });
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

app.post('/api/poems/:id/comment', async (req, res) => {
    try {
        const poem = await Poem.findById(req.params.id);
        if (!poem) return res.status(404).json({ msg: 'Poem not found' });
        const { email, text } = req.body;
        if (!email || !text) return res.status(400).json({ msg: 'Email and comment are required.' });
        poem.comments.push({ userEmail: email, text });
        await poem.save();
        await sendNotification(`💬 New Comment on "${poem.title}"`, `${email} commented:\n\n"${text}"`);
        res.json(poem);
    } catch (err) { res.status(500).json({ msg: 'Server error', error: err.message }); }
});

// ============================================
// START SERVER (Vercel & Local Compatible)
// ============================================
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;