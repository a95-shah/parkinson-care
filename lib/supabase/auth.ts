// lib/supabase/auth.ts
// import { createClient } from './client';
// import { UserRole, UserProfile } from './config';
// import { User } from '@supabase/supabase-js';

// // Create a single instance for client-side auth operations
// const getSupabase = () => createClient();

// export interface SignUpData {
//   email: string;
//   password: string;
//   fullName: string;
//   role: UserRole;
//   phone?: string;
// }

// export interface SignInData {
//   email: string;
//   password: string;
// }

// // Create user profile in database
// const createUserProfile = async (
//   userId: string,
//   data: {
//     email: string;
//     fullName: string;
//     role: UserRole;
//     phone?: string;
//   }
// ): Promise<{ error: Error | null }> => {
//   const supabase = getSupabase();
//   const { error } = await supabase.from('profiles').insert({
//     id: userId,
//     email: data.email,
//     full_name: data.fullName,
//     role: data.role,
//     phone: data.phone,
//   });

//   if (error) {
//     return { error: new Error(error.message) };
//   }

//   return { error: null };
// };

// // Sign up with email and password
// export const signUp = async (
//   data: SignUpData
// ): Promise<{ user: User | null; error: Error | null; needsConfirmation?: boolean }> => {
//   const supabase = getSupabase();
//   try {
//     const { data: authData, error: authError } = await supabase.auth.signUp({
//       email: data.email,
//       password: data.password,
//       options: {
//         data: {
//           full_name: data.fullName,
//           role: data.role,
//         },
//         emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
//       },
//     });

//     if (authError) {
//       // Provide more user-friendly error messages
//       let errorMessage = authError.message;
//       if (authError.message.includes('email_address_invalid') || authError.message.includes('invalid')) {
//         errorMessage = 'Unable to send confirmation email. Please try again or contact support.';
//       }
//       return { user: null, error: new Error(errorMessage) };
//     }

//     if (!authData.user) {
//       return { user: null, error: new Error('Failed to create user') };
//     }

//     // Check if email confirmation is required (user exists but no session)
//     if (!authData.session) {
//       // User created but needs email confirmation
//       // Profile will be created automatically by database trigger
//       return { 
//         user: authData.user, 
//         error: null, 
//         needsConfirmation: true 
//       };
//     }

//     // Profile is automatically created by database trigger (handle_new_user)
//     // Wait a moment for the trigger to complete
//     await new Promise(resolve => setTimeout(resolve, 500));

//     // Verify the profile was created
//     const { data: profile, error: profileError } = await supabase
//       .from('profiles')
//       .select('id')
//       .eq('id', authData.user.id)
//       .single();

//     if (profileError || !profile) {
//       // Trigger didn't work, create profile manually as fallback
//       const { error: manualProfileError } = await createUserProfile(authData.user.id, {
//         email: data.email,
//         fullName: data.fullName,
//         role: data.role,
//         phone: data.phone,
//       });

//       if (manualProfileError) {
//         return { user: null, error: new Error('Failed to create user profile. Please try again.') };
//       }
//     }

//     return { user: authData.user, error: null };
//   } catch (error) {
//     return {
//       user: null,
//       error: error instanceof Error ? error : new Error('Sign up failed'),
//     };
//   }
// };

// // Sign in with email and password
// export const signIn = async (
//   data: SignInData
// ): Promise<{ user: User | null; error: Error | null }> => {
//   const supabase = getSupabase();
//   try {
//     const { data: authData, error: authError } =
//       await supabase.auth.signInWithPassword({
//         email: data.email,
//         password: data.password,
//       });

//     if (authError) {
//       return { user: null, error: new Error(authError.message) };
//     }

//     return { user: authData.user, error: null };
//   } catch (error) {
//     return {
//       user: null,
//       error: error instanceof Error ? error : new Error('Sign in failed'),
//     };
//   }
// };

// // Sign in with Google
// export const signInWithGoogle = async (): Promise<{
//   error: Error | null;
// }> => {
//   const supabase = getSupabase();
//   try {
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: 'google',
//       options: {
//         redirectTo: `${window.location.origin}/auth/callback`,
//       },
//     });

//     if (error) {
//       return { error: new Error(error.message) };
//     }

//     return { error: null };
//   } catch (error) {
//     return {
//       error:
//         error instanceof Error ? error : new Error('Google sign in failed'),
//     };
//   }
// };

// // Sign out
// export const signOut = async (): Promise<{ error: Error | null }> => {
//   const supabase = getSupabase();
//   try {
//     const { error } = await supabase.auth.signOut();

//     if (error) {
//       return { error: new Error(error.message) };
//     }

//     return { error: null };
//   } catch (error) {
//     return {
//       error: error instanceof Error ? error : new Error('Sign out failed'),
//     };
//   }
// };

// // Get current user
// export const getCurrentUser = async (): Promise<{
//   user: User | null;
//   error: Error | null;
// }> => {
//   const supabase = getSupabase();
//   try {
//     const {
//       data: { user },
//       error,
//     } = await supabase.auth.getUser();

//     if (error) {
//       return { user: null, error: new Error(error.message) };
//     }

//     return { user, error: null };
//   } catch (error) {
//     return {
//       user: null,
//       error:
//         error instanceof Error ? error : new Error('Failed to get current user'),
//     };
//   }
// };

// // Get user profile
// export const getUserProfile = async (
//   userId: string
// ): Promise<{ profile: UserProfile | null; error: Error | null }> => {
//   const supabase = getSupabase();
//   try {
//     const { data, error } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', userId)
//       .single();

//     if (error) {
//       return { profile: null, error: new Error(error.message) };
//     }

//     return { profile: data, error: null };
//   } catch (error) {
//     return {
//       profile: null,
//       error:
//         error instanceof Error ? error : new Error('Failed to get user profile'),
//     };
//   }
// };

// // Update user profile
// export const updateUserProfile = async (
//   userId: string,
//   updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>
// ): Promise<{ error: Error | null }> => {
//   const supabase = getSupabase();
//   try {
//     const { error } = await supabase
//       .from('profiles')
//       .update(updates)
//       .eq('id', userId);

//     if (error) {
//       return { error: new Error(error.message) };
//     }

//     return { error: null };
//   } catch (error) {
//     return {
//       error:
//         error instanceof Error
//           ? error
//           : new Error('Failed to update user profile'),
//     };
//   }
// };









// lib/supabase/auth.ts
import { supabase } from './config';
import { User } from '@supabase/supabase-js';

export const signUp = async (data: {
  email: string;
  password: string;
  fullName: string;
  role: string;
  phone?: string;
}) => {
  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        role: data.role,
        phone: data.phone,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return {
    user: result.user,
    error: error ? new Error(error.message) : null,
    needsConfirmation: !result.session,
  };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    error: error ? new Error(error.message) : null,
  };
};

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return { error: error ? new Error(error.message) : null };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error: error ? new Error(error.message) : null };
};
