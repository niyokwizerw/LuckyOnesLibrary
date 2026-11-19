const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userEmail: { type: String, required: true, trim: true },
    text:      { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
});

const bookSchema = new mongoose.Schema({
    title:       { type: String, required: [true, 'Title is required'], trim: true },
    category:    { type: String, required: [true, 'Category is required'], trim: true },
    description: { type: String, default: '', trim: true },
    content:     { type: String, required: [true, 'Content is required'], maxlength: 20000 },
    pdfPath:     { type: String, default: null },
    coverImage:  { type: String, default: null },
    likes:       { type: Number, default: 0 },
    comments:    [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);