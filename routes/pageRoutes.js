const express = require('express');
const pages = require('../controllers/pageController');
const pageAuth = require('../middleware/pageAuth');

const router = express.Router();

router.get('/', pages.getIndex);
router.get('/item/:id', pages.getItem);
router.get('/login', pages.getLogin);
router.get('/add', pageAuth, pages.getAdd);
router.post('/add', pageAuth, pages.createItem);
router.get('/logs', pageAuth, pages.getLogs);

module.exports = router;
