import { NextApiRequest, NextApiResponse } from 'next';
import { signUp } from '../../../lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, fullName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }

    const { data, error } = await signUp(email, password, fullName);

    if (error) {
      console.error('Signup error:', error);
      return res.status(400).json({ 
        error: (error as any).message || 'Failed to create account' 
      });
    }

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        fullName: fullName
      }
    });

  } catch (error) {
    console.error('Signup API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
} 