const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/nowp', { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = mongoose;