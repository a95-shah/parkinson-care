'use server';

import { createClient } from '@/lib/supabase/client';
import { Resend } from 'resend';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function inviteCaretaker(email: string, role: 'patient' | 'admin') {
    const cookieStore = await cookies();

    // Create server-side Supabase client to access cookies
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'Not authenticated' };
    }

    // 1. Check for existing pending invitation
    // Note: We need to use `supabase` client here with RLS
    const { data: existing } = await supabase
        .from('caretaker_invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .single();

    if (existing) {
        return { error: 'An invitation is already pending for this email.' };
    }

    // 2. Create the invitation record
    const { data: invitation, error: insertError } = await supabase
        .from('caretaker_invitations')
        .insert({
            email,
            invited_by_user_id: user.id,
            invited_by_role: role,
        })
        .select()
        .single();

    if (insertError) {
        console.error('Error creating invitation:', insertError);
        return { error: 'Failed to create invitation record.' };
    }

    // 3. Send Email via Resend
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite?token=${invitation.token}`;

    try {
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Parkinson Care <onboarding@resend.dev>', // Use resend.dev for testing unless domain is verified
            to: email,
            subject: 'You have been invited to join Parkinson Care',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4f46e5;">Welcome to Parkinson Care</h2>
          <p>You have been invited to join as a Caretaker.</p>
          <p>Click the link below to accept the invitation and set up your account:</p>
          <a href="${inviteLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Accept Invitation</a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">Or copy this link: ${inviteLink}</p>
        </div>
      `,
        });

        if (emailError) {
            console.error('Error sending email:', emailError);
            // Return success but with a warning and the link so the user can share it manually
            return {
                success: true,
                warning: 'Invitation created, but email could not be sent (likely due to unverified domain in dev mode). Please share the link manually.',
                inviteLink
            };
        }

        return { success: true, emailId: emailData?.id, inviteLink };
    } catch (err) {
        console.error('Unexpected error sending email:', err);
        // Return success but with a warning and the link
        return {
            success: true,
            warning: 'Invitation created, but an error occurred sending the email. Please share the link manually.',
            inviteLink
        };
    }
}

/**
 * Validate an invitation token
 */
export async function validateInvitationToken(token: string): Promise<{
    isValid: boolean;
    email?: string;
    error?: string;
}> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data, error } = await supabase
        .from('caretaker_invitations')
        .select('email, status')
        .eq('token', token)
        .single();

    if (error || !data) {
        return { isValid: false, error: 'Invalid invitation token' };
    }

    if (data.status === 'accepted') {
        return { isValid: false, error: 'This invitation has already been used' };
    }

    return { isValid: true, email: data.email };
}
