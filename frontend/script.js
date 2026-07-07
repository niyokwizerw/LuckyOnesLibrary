// ============================================
// LUCKY ONES LIBRARY - script.js (COMPLETE v3)
// ============================================

const API = 'http://localhost:5000/api';

// ============================================
// 1. SLIDESHOW
// ============================================
let currentSlide = 0;
const slides = document.querySelectorAll('.slide-img');
function nextSlide() {
    if (slides.length === 0) return;
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}
if (slides.length > 0) setInterval(nextSlide, 4000);

// ============================================
// 2. WISDOM QUOTES
// ============================================
const wisdomQuotes = [
    '"The only true wisdom is in knowing you know nothing." — Socrates',
    '"Science is what you know. Philosophy is what you don\'t know." — Bertrand Russell',
    '"The unexamined life is not worth living." — Socrates',
    '"Turn your wounds into wisdom." — Oprah Winfrey',
    '"Be wise with speed; a fool at forty is a fool indeed." — Edward Young',
    '"The journey of a thousand miles begins with one step." — Lao Tzu',
    '"Climb the mountain not to plant your flag, but to embrace the challenge." — Unknown',
    '"Wisdom begins in wonder." — Socrates',
    '"There is no wealth like knowledge, no poverty like ignorance." — Ali Ibn Abi Talib',
    '"Do not go where the path may lead; go instead where there is no path and leave a trail." — Emerson'
];
let quoteIndex = 0;
function rotateQuotes() {
    const el = document.getElementById('quoteDisplay');
    if (!el) return;
    el.style.opacity = 0;
    setTimeout(() => {
        el.innerText = wisdomQuotes[quoteIndex];
        el.style.opacity = 1;
        quoteIndex = (quoteIndex + 1) % wisdomQuotes.length;
    }, 500);
}
setInterval(rotateQuotes, 7000);

// ============================================
// 3. ADMIN CHECK
// ============================================
function isAdmin() { return sessionStorage.getItem('isAdmin') === 'true'; }

// ============================================
// 4. FILE PICKER HELPERS
// ============================================
function triggerFile(inputId) {
    document.getElementById(inputId).click();
}

function onFileSelected(inputId, labelId, icon) {
    const file  = document.getElementById(inputId).files[0];
    const label = document.getElementById(labelId);
    if (!label) return;
    if (file) {
        label.classList.add('selected');
        label.innerHTML = `<i class="fas fa-check-circle"></i> <span>${file.name}</span>`;
    } else {
        label.classList.remove('selected');
        label.innerHTML = `<i class="${icon}"></i> <span>Click to choose file from your device</span>`;
    }
}

// Book PDF
function triggerBookFile()  { triggerFile('bFile'); }
function onBookFileSelected() { onFileSelected('bFile', 'bFileLabel', 'fas fa-file-pdf'); }

// Book Cover Image
function triggerBookImage()  { triggerFile('bImage'); }
function onBookImageSelected() { onFileSelected('bImage', 'bImageLabel', 'fas fa-image'); }

// Poem PDF
function triggerPoemFile()  { triggerFile('pFile'); }
function onPoemFileSelected() { onFileSelected('pFile', 'pFileLabel', 'fas fa-file-pdf'); }

// ============================================
// 5. BOOK CARD
// ============================================
function bookCard(b) {
    const deleteBtn = isAdmin()
        ? `<button class="btn-delete" onclick="deleteBook('${b._id}')"><i class="fas fa-trash"></i></button>`
        : '';

    const coverImg = b.coverImage
        ? `<div class="card-cover" style="background-image:url('http://localhost:5000/uploads/${b.coverImage}')"></div>`
        : `<div class="card-cover card-cover-placeholder"><i class="fas fa-book-open"></i></div>`;

    const downloadBtn = b.pdfPath
        ? `<a class="btn-download-card" href="http://localhost:5000/uploads/${b.pdfPath}" download title="Download PDF">
               <i class="fas fa-download"></i>
           </a>`
        : '';

    const desc = b.description ? b.description : b.content;

    return `
        <div class="book-card" id="card-${b._id}">
            ${coverImg}
            <div class="card-body">
                <div class="book-card-category"><i class="fas fa-tag"></i> &nbsp;${b.category}</div>
                <h3 onclick="openBook('${b._id}')">${b.title}</h3>
                <p>${desc.substring(0, 100)}...</p>
                <div class="book-card-footer">
                    <button class="btn-read" onclick="openBook('${b._id}')">
                        <i class="fas fa-book-open"></i> Read
                    </button>
                    ${downloadBtn}
                    ${deleteBtn}
                </div>
            </div>
        </div>`;
}

// ============================================
// 6. POEM CARD
// ============================================
function poemCard(p) {
    const deleteBtn = isAdmin()
        ? `<button class="btn-delete" onclick="deletePoem('${p._id}')"><i class="fas fa-trash"></i></button>`
        : '';

    const coverImg = p.coverImage
        ? `<div class="card-cover" style="background-image:url('http://localhost:5000/uploads/${p.coverImage}')"></div>`
        : `<div class="card-cover card-cover-placeholder"><i class="fas fa-feather-alt"></i></div>`;

    const downloadBtn = p.pdfPath
        ? `<a class="btn-download-card" href="http://localhost:5000/uploads/${p.pdfPath}" download title="Download PDF">
               <i class="fas fa-download"></i>
           </a>`
        : '';

    const desc = p.description ? p.description : p.content;

    return `
        <div class="poem-card" id="card-${p._id}">
            ${coverImg}
            <div class="card-body">
                <div class="poem-card-category"><i class="fas fa-feather-alt"></i> &nbsp;${p.author || 'Unknown'}</div>
                <h3 onclick="openPoem('${p._id}')">${p.title}</h3>
                <p class="poem-preview">${desc.substring(0, 100)}...</p>
                <div class="book-card-footer">
                    <button class="btn-read" onclick="openPoem('${p._id}')">
                        <i class="fas fa-eye"></i> Read
                    </button>
                    ${downloadBtn}
                    ${deleteBtn}
                </div>
            </div>
        </div>`;
}

// ============================================
// 7. FETCH BOOKS
// ============================================
let allBooks = [];
async function fetchBooks() {
    try {
        const res = await fetch(`${API}/books`);
        allBooks  = await res.json();

        const latestEl = document.getElementById('latestBooks');
        if (latestEl) {
            latestEl.innerHTML = allBooks.length === 0
                ? '<p style="color:var(--text-muted); grid-column:1/-1;">No books yet. Check back soon!</p>'
                : allBooks.slice(0, 3).map(b => bookCard(b)).join('');
        }

        const gridEl = document.getElementById('allBooksGrid');
        if (gridEl) {
            gridEl.innerHTML = allBooks.length === 0
                ? '<p style="color:var(--text-muted); grid-column:1/-1;">No books in the library yet.</p>'
                : allBooks.map(b => bookCard(b)).join('');
        }

        updateStats(allBooks, null);
    } catch (err) {
        console.error('fetchBooks error:', err);
        const el = document.getElementById('latestBooks') || document.getElementById('allBooksGrid');
        if (el) el.innerHTML = '<p style="color:#e74c3c; grid-column:1/-1;"><i class="fas fa-exclamation-triangle"></i> &nbsp;Could not connect to server.</p>';
    }
}

// ============================================
// 8. FETCH POEMS
// ============================================
let allPoems = [];
async function fetchPoems() {
    try {
        const res = await fetch(`${API}/poems`);
        allPoems  = await res.json();

        const latestEl = document.getElementById('latestPoems');
        if (latestEl) {
            latestEl.innerHTML = allPoems.length === 0
                ? '<p style="color:var(--text-muted); grid-column:1/-1;">No poems yet. Check back soon!</p>'
                : allPoems.slice(0, 3).map(p => poemCard(p)).join('');
        }

        const gridEl = document.getElementById('allPoemsGrid');
        if (gridEl) {
            gridEl.innerHTML = allPoems.length === 0
                ? '<p style="color:var(--text-muted); grid-column:1/-1;">No poems in the collection yet.</p>'
                : allPoems.map(p => poemCard(p)).join('');
        }

        updateStats(null, allPoems);
    } catch (err) {
        console.error('fetchPoems error:', err);
        const el = document.getElementById('latestPoems') || document.getElementById('allPoemsGrid');
        if (el) el.innerHTML = '<p style="color:#e74c3c; grid-column:1/-1;"><i class="fas fa-exclamation-triangle"></i> &nbsp;Could not connect to server.</p>';
    }
}

// ============================================
// 9. STATS BAR
// ============================================
let _books = [], _poems = [];
function updateStats(books, poems) {
    if (books !== null) _books = books;
    if (poems !== null) _poems = poems;
    const all           = [..._books, ..._poems];
    const totalLikes    = all.reduce((s, i) => s + (i.likes || 0), 0);
    const totalComments = all.reduce((s, i) => s + (i.comments ? i.comments.length : 0), 0);
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('statBooks',    _books.length);
    set('statPoems',    _poems.length);
    set('statLikes',    totalLikes);
    set('statComments', totalComments);
}

// ============================================
// 10. ADMIN MESSAGE
// ============================================
async function fetchAdminMessage() {
    try {
        const res  = await fetch(`${API}/message`);
        const data = await res.json();
        const box  = document.getElementById('adminMessageBox');
        const text = document.getElementById('adminMessageText');
        if (box && text && data.message && data.message.trim() !== '') {
            text.innerText = data.message;
            box.style.display = 'block';
        }
    } catch (err) { console.error('fetchAdminMessage error:', err); }
}

async function saveAdminMessage() {
    const msg = document.getElementById('adminMsgInput').value.trim();
    if (!msg) { alert('Please write a message before saving.'); return; }
    try {
        const res = await fetch(`${API}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        if (res.ok) { alert('Message published on Home!'); fetchAdminMessage(); }
    } catch (err) { alert('Could not save message.'); }
}

async function clearAdminMessage() {
    try {
        await fetch(`${API}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: '' })
        });
        const box = document.getElementById('adminMessageBox');
        if (box) box.style.display = 'none';
        const inp = document.getElementById('adminMsgInput');
        if (inp) inp.value = '';
        alert('Message cleared.');
    } catch (err) { console.error(err); }
}

// ============================================
// 11. UPLOAD BOOK
// ============================================
async function uploadBook() {
    const title       = document.getElementById('bTitle').value.trim();
    const category    = document.getElementById('bCat').value.trim();
    const description = document.getElementById('bDescription').value.trim();
    const content     = document.getElementById('bContent').value.trim();
    const pdfFile     = document.getElementById('bFile').files[0];
    const imageFile   = document.getElementById('bImage').files[0];

    if (!title || !category || !content) {
        alert('Please fill in Title, Category and Content before publishing.');
        return;
    }

    const formData = new FormData();
    formData.append('title',       title);
    formData.append('category',    category);
    formData.append('description', description);
    formData.append('content',     content);
    if (pdfFile)   formData.append('pdf',   pdfFile);
    if (imageFile) formData.append('image', imageFile);

    try {
        const res = await fetch(`${API}/books`, { method: 'POST', body: formData });
        if (res.ok) { alert('Book published successfully!'); location.reload(); }
        else alert('Something went wrong. Please try again.');
    } catch (err) { alert('Could not connect to server.'); console.error(err); }
}

// ============================================
// 12. UPLOAD POEM
// ============================================
async function uploadPoem() {
    const title       = document.getElementById('pTitle').value.trim();
    const author      = document.getElementById('pAuthor').value.trim();
    const description = document.getElementById('pDescription').value.trim();
    const content     = document.getElementById('pContent').value.trim();
    const pdfFile     = document.getElementById('pFile').files[0];
    const imageFile   = document.getElementById('pImage').files[0];

    if (!title || !content) {
        alert('Please fill in the Title and Poem Content before publishing.');
        return;
    }

    const formData = new FormData();
    formData.append('title',       title);
    formData.append('author',      author || 'Damie');
    formData.append('description', description);
    formData.append('content',     content);
    if (pdfFile)   formData.append('pdf',   pdfFile);
    if (imageFile) formData.append('image', imageFile);

    try {
        const res = await fetch(`${API}/poems`, { method: 'POST', body: formData });
        if (res.ok) { alert('Poem published successfully!'); location.reload(); }
        else alert('Something went wrong. Please try again.');
    } catch (err) { alert('Could not connect to server.'); console.error(err); }
}

// ============================================
// 13. DELETE BOOK / POEM
// ============================================
async function deleteBook(id) {
    if (!confirm('Are you sure you want to permanently delete this book?')) return;
    try {
        const res = await fetch(`${API}/books/${id}`, { method: 'DELETE' });
        if (res.ok) { document.getElementById(`card-${id}`)?.remove(); alert('Book deleted.'); }
        else alert('Could not delete.');
    } catch (err) { alert('Could not connect to server.'); }
}

async function deletePoem(id) {
    if (!confirm('Are you sure you want to permanently delete this poem?')) return;
    try {
        const res = await fetch(`${API}/poems/${id}`, { method: 'DELETE' });
        if (res.ok) { document.getElementById(`card-${id}`)?.remove(); alert('Poem deleted.'); }
        else alert('Could not delete.');
    } catch (err) { alert('Could not connect to server.'); }
}

// ============================================
// 14. OPEN BOOK MODAL
// ============================================
let currentBookId = null;
async function openBook(id) {
    currentBookId = id;
    try {
        const res  = await fetch(`${API}/books/${id}`);
        const book = await res.json();

        document.getElementById('mTitle').innerText         = book.title;
        document.getElementById('mContent').innerText       = book.content;
        document.getElementById('mLikeCount').innerText     = book.likes || 0;

        const dl = document.getElementById('mDownload');
        if (dl) {
            if (book.pdfPath) {
                dl.href = `http://localhost:5000/uploads/${book.pdfPath}`;
                dl.style.display = 'inline-flex';
            } else {
                dl.style.display = 'none';
            }
        }

        renderComments('mCommentsList', book.comments);
        document.getElementById('bookModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (err) { alert('Could not load book.'); console.error(err); }
}

function closeBook() {
    document.getElementById('bookModal').style.display = 'none';
    document.body.style.overflow = '';
    currentBookId = null;
}

// ============================================
// 15. OPEN POEM MODAL
// ============================================
let currentPoemId = null;
async function openPoem(id) {
    currentPoemId = id;
    try {
        const res  = await fetch(`${API}/poems/${id}`);
        const poem = await res.json();

        document.getElementById('mPoemTitle').innerText     = poem.title;
        document.getElementById('mPoemAuthor').innerText    = `By ${poem.author || 'Unknown'}`;
        document.getElementById('mPoemContent').innerText   = poem.content;
        document.getElementById('mPoemLikeCount').innerText = poem.likes || 0;

        // Download button inside modal
        const pdl = document.getElementById('mPoemDownload');
        if (pdl) {
            if (poem.pdfPath) {
                pdl.href = `http://localhost:5000/uploads/${poem.pdfPath}`;
                pdl.style.display = 'inline-flex';
            } else {
                pdl.style.display = 'none';
            }
        }

        const delBtn = document.getElementById('poemDeleteBtn');
        if (delBtn) delBtn.style.display = isAdmin() ? 'inline-flex' : 'none';

        renderComments('mPoemCommentsList', poem.comments);
        document.getElementById('poemModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (err) { alert('Could not load poem.'); console.error(err); }
}

function closePoem() {
    document.getElementById('poemModal').style.display = 'none';
    document.body.style.overflow = '';
    currentPoemId = null;
}

function deletePoemModal() {
    if (currentPoemId) { closePoem(); deletePoem(currentPoemId); }
}

// ============================================
// 16. RENDER COMMENTS
// ============================================
function renderComments(containerId, comments) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!comments || comments.length === 0) {
        el.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem;">No comments yet. Be the first!</p>';
        return;
    }
    el.innerHTML = comments.map(c => `
        <div class="comment-item">
            <strong>${c.userEmail}</strong>
            <p>${c.text}</p>
        </div>`).join('');
}

// ============================================
// 17. LIKE BOOK / POEM
// ============================================
async function likeBook() {
    if (!currentBookId) return;
    try {
        const res  = await fetch(`${API}/books/${currentBookId}/like`, { method: 'POST' });
        const data = await res.json();
        document.getElementById('mLikeCount').innerText = data.likes;
    } catch (err) { console.error('Like error:', err); }
}

async function likePoem() {
    if (!currentPoemId) return;
    try {
        const res  = await fetch(`${API}/poems/${currentPoemId}/like`, { method: 'POST' });
        const data = await res.json();
        document.getElementById('mPoemLikeCount').innerText = data.likes;
    } catch (err) { console.error('Like error:', err); }
}

// ============================================
// 18. SUBMIT COMMENTS
// ============================================
async function submitComment() {
    if (!currentBookId) return;
    const email = document.getElementById('cEmail').value.trim();
    const text  = document.getElementById('cText').value.trim();
    if (!email || !text) { alert('Please enter your email and comment.'); return; }
    try {
        const res = await fetch(`${API}/books/${currentBookId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, text })
        });
        if (res.ok) {
            document.getElementById('cEmail').value = '';
            document.getElementById('cText').value  = '';
            alert('Comment sent!');
            openBook(currentBookId);
        } else alert('Could not send comment.');
    } catch (err) { alert('Could not connect to server.'); }
}

async function submitPoemComment() {
    if (!currentPoemId) return;
    const email = document.getElementById('pcEmail').value.trim();
    const text  = document.getElementById('pcText').value.trim();
    if (!email || !text) { alert('Please enter your email and comment.'); return; }
    try {
        const res = await fetch(`${API}/poems/${currentPoemId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, text })
        });
        if (res.ok) {
            document.getElementById('pcEmail').value = '';
            document.getElementById('pcText').value  = '';
            alert('Comment sent!');
            openPoem(currentPoemId);
        } else alert('Could not send comment.');
    } catch (err) { alert('Could not connect to server.'); }
}

// ============================================
// 19. SEARCH
// ============================================
function searchBooks() {
    const query = document.getElementById('bookSearch')?.value.toLowerCase().trim() || '';
    const grid  = document.getElementById('allBooksGrid');
    if (!grid) return;
    if (query === '') {
        grid.innerHTML = allBooks.length === 0
            ? '<p style="color:var(--text-muted); grid-column:1/-1;">No books in the library yet.</p>'
            : allBooks.map(b => bookCard(b)).join('');
        return;
    }
    const results = allBooks.filter(b =>
        b.title.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query) ||
        (b.description || b.content).toLowerCase().includes(query)
    );
    grid.innerHTML = results.length === 0
        ? `<div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
               <i class="fas fa-search" style="font-size:2.5rem; color:var(--text-muted); opacity:0.4; display:block; margin-bottom:14px;"></i>
               <p style="color:var(--text-muted);">No books found for "<strong style="color:var(--gold-main);">${query}</strong>"</p>
               <p style="color:var(--text-muted); font-size:0.82rem; margin-top:6px;">Try a different keyword.</p>
           </div>`
        : results.map(b => bookCard(b)).join('');
}

function searchPoems() {
    const query = document.getElementById('poemSearch')?.value.toLowerCase().trim() || '';
    const grid  = document.getElementById('allPoemsGrid');
    if (!grid) return;
    if (query === '') {
        grid.innerHTML = allPoems.length === 0
            ? '<p style="color:var(--text-muted); grid-column:1/-1;">No poems yet.</p>'
            : allPoems.map(p => poemCard(p)).join('');
        return;
    }
    const results = allPoems.filter(p =>
        p.title.toLowerCase().includes(query) ||
        (p.author || '').toLowerCase().includes(query) ||
        (p.description || p.content).toLowerCase().includes(query)
    );
    grid.innerHTML = results.length === 0
        ? `<div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
               <i class="fas fa-search" style="font-size:2.5rem; color:var(--text-muted); opacity:0.4; display:block; margin-bottom:14px;"></i>
               <p style="color:var(--text-muted);">No poems found for "<strong style="color:var(--gold-main);">${query}</strong>"</p>
               <p style="color:var(--text-muted); font-size:0.82rem; margin-top:6px;">Try a different keyword.</p>
           </div>`
        : results.map(p => poemCard(p)).join('');
}

// ============================================
// 20. CLOSE MODAL ON OVERLAY / ESC
// ============================================
document.addEventListener('click', (e) => {
    if (e.target.id === 'bookModal') closeBook();
    if (e.target.id === 'poemModal') closePoem();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeBook(); closePoem(); }
});

// ============================================
// 21. ON PAGE LOAD
// ============================================
window.onload = () => {
    fetchBooks();
    fetchPoems();
    rotateQuotes();
    fetchAdminMessage();
};