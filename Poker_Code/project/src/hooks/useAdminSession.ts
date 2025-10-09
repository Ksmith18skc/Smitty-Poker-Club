import { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';

export function useAdminSession() {
  const [isValid, setIsValid] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = () => {
      const valid = AdminService.validateSession();
      setIsValid(valid);
      setLoading(false);
    };

    validateSession();

    // Revalidate session every minute
    const interval = setInterval(validateSession, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { isValid, loading };
}