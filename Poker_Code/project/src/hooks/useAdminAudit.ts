import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { toast } from 'react-hot-toast';

interface AuditLogEntry {
  action: string;
  details: string;
  targetId: string;
}

export function useAdminAudit() {
  const { user } = useAuth();

  const logAction = useCallback(async (entry: AuditLogEntry) => {
    if (!user) return;

    try {
      // Validate targetId is a valid UUID
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.targetId);
      
      // If not a valid UUID, use the current user's ID instead
      const safeTargetId = isValidUUID ? entry.targetId : user.id;

      // First try to log to admin_audit_log
      try {
        const { error } = await supabase
          .from('admin_audit_log')
          .insert({
            admin_id: user.id,
            action: entry.action,
            details: entry.details,
            target_id: safeTargetId
            // Don't include ip_address as it's causing errors
          });

        if (!error) return;
      } catch (err) {
        // Silently fail and try the fallback
        console.log('Admin audit log table not available, using transactions table instead');
      }

      // Fallback to transactions table if admin_audit_log doesn't exist
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: 0,
          transaction_type: 'admin_action',
          description: `${entry.action}: ${entry.details} (target: ${safeTargetId})`
        });

      if (transactionError) {
        console.error('Error logging to transactions table:', transactionError);
      }
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw the error, just log it
    }
  }, [user]);

  const getAuditLogs = useCallback(async () => {
    try {
      // First try to get logs from admin_audit_log
      try {
        const { data, error } = await supabase
          .from('admin_audit_log')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!error) return data || [];
      } catch (err) {
        // Silently fail and try the fallback
        console.log('Admin audit log table not available, using transactions table instead');
      }

      // Fallback to transactions table if admin_audit_log doesn't exist
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id as admin_id,
          transaction_type as action,
          description as details,
          created_at as timestamp
        `)
        .eq('transaction_type', 'admin_action')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
      return [];
    }
  }, []);

  return { logAction, getAuditLogs };
}