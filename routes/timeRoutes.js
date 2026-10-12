const express = require('express');
const { getTime, echoBody } = require('../controllers/timeController');

const router = express.Router();

router.get('/time', getTime);
router.post('/echo', echoBody);

module.exports = router;
