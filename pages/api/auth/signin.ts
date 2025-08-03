import { NextApiRequest, NextApiResponse } from 'next';
import { signIn, generateToken } from '../../../lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const { data, error } = await signIn(email, password);

    if (error) {
      console.error('Signin error:', error);
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    if (!data.user) {
      return res.status(401).json({ 
        error: 'Authentication failed' 
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: data.user.id,
      email: data.user.email!
    });

    return res.status(200).json({
      message: 'Signed in successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name
      },
      token
    });

  } catch (error) {
    console.error('Signin API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
} 