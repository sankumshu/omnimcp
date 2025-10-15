/**
 * Authentication Service
 * Handles user registration, login, and token management using Supabase Auth
 */

// @ts-nocheck
import { supabase } from '../db/supabase.js';
import crypto from 'crypto';

/**
 * Register a new user
 */
export async function register(
  email: string,
  password: string,
  name?: string
) {
  // 1. Create auth user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    throw new Error(`Registration failed: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('User creation failed');
  }

  // 2. Generate API key
  const apiKey = `omni_${crypto.randomBytes(32).toString('hex')}`;

  // 3. Create user record in our users table
  const { error: dbError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    password_hash: '', // Supabase Auth handles passwords
    name,
    subscription_tier: 'free',
    api_key: apiKey,
  });

  if (dbError) {
    throw new Error(`Failed to create user profile: ${dbError.message}`);
  }

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email!,
      name,
      subscriptionTier: 'free',
      apiKey,
    },
    session: authData.session,
  };
}

/**
 * Login user
 */
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Login failed: ${error.message}`);
  }

  if (!data.user || !data.session) {
    throw new Error('Login failed');
  }

  // Get user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (userError) {
    throw new Error(`Failed to fetch user profile: ${userError.message}`);
  }

  return {
    user: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      subscriptionTier: userData.subscription_tier,
      apiKey: userData.api_key,
    },
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

/**
 * Get user from JWT token
 */
export async function getUserFromToken(token: string) {
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  // Get full user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (userError) {
    return null;
  }

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    subscriptionTier: userData.subscription_tier,
    apiKey: userData.api_key,
  };
}

/**
 * Get user from API key
 */
export async function getUserFromApiKey(apiKey: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    subscriptionTier: data.subscription_tier,
    apiKey: data.api_key,
  };
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string) {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    throw new Error('Token refresh failed');
  }

  return {
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

/**
 * Logout user
 */
export async function logout(token: string) {
  const { error } = await supabase.auth.admin.signOut(token);

  if (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
}
