import { supabase } from '../lib/supabase';
import { z } from 'zod';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export class AdminService {
  /**
   * Log admin action
   */
  static async logAction(action: string, details: string, targetId: string) {
    try {
      // First try to log to admin_audit_log
      try {
        const { error } = await supabase
          .from('admin_audit_log')
          .insert({
            admin_id: (await supabase.auth.getUser()).data.user?.id || '',
            action,
            details,
            target_id: targetId
            // Don't include ip_address as it's causing errors
          });

        if (!error) return true;
      } catch (err) {
        console.log('Admin audit log table not available, using transactions table instead');
      }

      // Fallback to transactions table if admin_audit_log doesn't exist
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id || '',
          amount: 0,
          transaction_type: 'admin_action',
          description: `${action}: ${details} (target: ${targetId})`
        });

      if (transactionError) {
        console.error('Error logging to transactions table:', transactionError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw the error, just log it and continue
      return false;
    }
  }

  /**
   * Validate admin session
   */
  static validateSession(): boolean {
    try {
      const sessionStr = sessionStorage.getItem('adminSession');
      if (!sessionStr) return false;
      
      const session = JSON.parse(sessionStr);
      
      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        sessionStorage.removeItem('adminSession');
        return false;
      }
      
      // Check if it's the admin user
      if (session.email !== 'korysmith@arizona.edu') {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }
}