import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { supabase } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        provider: string;
      };
    }
  }
}

export const generateToken = (userId: string, provider: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  const options: SignOptions = {
    expiresIn: '7d', // Token expires in 7 days
  };

  return jwt.sign({ id: userId, provider }, process.env.JWT_SECRET, options);
};

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: string;
      provider: string;
    };

    // Verify user exists in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, provider')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      provider: user.provider
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Error in authentication middleware:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: string;
      provider: string;
    };

    // Verify user exists in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, provider')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      provider: user.provider
    };

    // Refresh token if it's about to expire (less than 1 day left)
    const tokenExp = (decoded as any).exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (tokenExp - now < oneDay) {
      const newToken = generateToken(user.id, user.provider);
      res.setHeader('X-New-Token', newToken);
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 