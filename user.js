const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/nowp', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = mongoose.Schema({
    email: String,
    sp_access: String,
    sp_refresh: String,
    sp_expires: Date
});

module.exports = mongoose.model('User', userSchema);