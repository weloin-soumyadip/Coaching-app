import type { RequestHandler } from 'express';
import { verifyAccess, type UserType } from '../lib/auth/jwt.js';
import ApiError from '../utils/ApiError.js';
import Owner from '../models/Owner.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Admin from '../models/Admin.js';
import type { AuthUser } from '../types/express.js';

const protect: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid Authorization header');
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) throw new ApiError(401, 'Missing token');

    let payload;
    try {
      payload = verifyAccess(token);
    } catch {
      throw new ApiError(401, 'Invalid or expired token');
    }

    const { sub, userType } = payload;
    const auth = await loadAuthUser(userType, sub);
    if (!auth) throw new ApiError(401, 'User no longer exists');
    if (!auth.doc.isActive) throw new ApiError(401, 'User no longer active');
    req.auth = auth;
    next();
  } catch (err) {
    next(err);
  }
};

async function loadAuthUser(userType: UserType, id: string): Promise<AuthUser | null> {
  switch (userType) {
    case 'owner': {
      const doc = await Owner.findById(id);
      return doc ? { type: 'owner', doc } : null;
    }
    case 'teacher': {
      const doc = await Teacher.findById(id);
      return doc ? { type: 'teacher', doc } : null;
    }
    case 'student': {
      const doc = await Student.findById(id);
      return doc ? { type: 'student', doc } : null;
    }
    case 'admin': {
      const doc = await Admin.findById(id);
      return doc ? { type: 'admin', doc } : null;
    }
  }
}

export default protect;
