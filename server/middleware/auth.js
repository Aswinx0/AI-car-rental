import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next)=>{
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({success: false, message: "Not authorized, token missing"})
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // token payload may be a string (when signed with a string) or an object
        const userId = typeof decoded === 'string' ? decoded : (decoded.id || decoded._id || decoded.userId)

        if(!userId){
            return res.status(401).json({success: false, message: "Not authorized"})
        }

        req.user = await User.findById(userId).select("-password")
        if(!req.user){
            return res.status(401).json({success: false, message: "User not found"})
        }

        next();
    } catch (error) {
        return res.status(401).json({success: false, message: "Not authorized"})
    }
}