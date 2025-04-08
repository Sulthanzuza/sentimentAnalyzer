const express = require('express');
const router = express.Router();
const { scrapeInstagram } = require('../controller/instagramController');
const {analyzeYoutube }= require('../controller/youtubeController')


router.post('/scrape', scrapeInstagram);
router.post('/ytcomment',analyzeYoutube)

module.exports = router;
