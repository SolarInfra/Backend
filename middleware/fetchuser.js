const jwt = require('jsonwebtoken');
const user = require('../models/user');
const JWT_SECRET = '%v5sx2C&&@$!%#*&UBXYQV%8b269xe';

const fetchuser = (req, res, next)=>{
    const token = req.header('authtoken');
    if(!token){
        res.status(401).json({error: 'Please authenticate using valid token'})
    }

    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        next();
    } catch (error) {
         res.status(401).json({error: 'Please authenticate using valid token'})
    }
    
}


module.exports = fetchuser;