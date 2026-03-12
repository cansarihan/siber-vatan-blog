const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'siber-vatan-gizli-key',
    resave: false,
    saveUninitialized: true
}));

// Görselleri dışarıya açıyoruz
app.use('/logo.png', express.static(path.join(__dirname, 'sibervatan_renkli-yatay.png')));
app.use('/login-logo.png', express.static(path.join(__dirname, 'sibervatan_renkli.png')));
app.use('/favicon.png', express.static(path.join(__dirname, 'favicon.png')));

const DATA_FILE = './data.json';
const getPosts = () => {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
    return JSON.parse(fs.readFileSync(DATA_FILE));
};

const checkAuth = (req, res, next) => {
    if (req.session.loggedIn) next();
    else res.redirect('/login');
};

// ROTALAR
app.get('/', (req, res) => {
    const posts = getPosts().filter(p => p.status === 'public');
    res.render('index', { posts });
});

app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') {
        req.session.loggedIn = true;
        res.redirect('/admin');
    } else res.render('login', { error: 'Hatalı kullanıcı adı veya şifre!' });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/admin', checkAuth, (req, res) => {
    res.render('admin', { posts: getPosts() });
});

app.post('/admin/add', checkAuth, (req, res) => {
    const posts = getPosts();
    posts.unshift({
        id: Date.now(),
        title: req.body.title,
        content: req.body.content,
        status: req.body.status,
        date: new Date().toLocaleDateString('tr-TR')
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
    res.redirect('/admin');
});

app.post('/admin/edit/:id', checkAuth, (req, res) => {
    let posts = getPosts();
    const index = posts.findIndex(p => p.id === parseInt(req.params.id));
    if (index !== -1) {
        posts[index] = { ...posts[index], title: req.body.title, content: req.body.content, status: req.body.status };
        fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
    }
    res.redirect('/admin');
});

app.post('/admin/delete/:id', checkAuth, (req, res) => {
    const posts = getPosts().filter(p => p.id !== parseInt(req.params.id));
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
    res.redirect('/admin');
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu aktif!`);
    console.log(`Yerel erişim: http://localhost:${PORT}`);
    console.log(`Ağ erişimi: http://[SENIN-IP-ADRESIN]:${PORT}`);
});