import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PasswordChange: React.FC = () => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password strength validation
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    try {
      setIsLoading(true);

      // Note: Supabase doesn't require current password for password change
      // when the user is already authenticated. This is a security consideration.
      // For maximum security, you might want to implement a custom backend endpoint
      // that verifies the current password before allowing the change.
      
      const { error } = await changePassword(newPassword);

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password changed successfully!');
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password change error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (password.length === 0) {
      return { strength: 0, label: '', color: '' };
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) {
      return { strength, label: 'Weak', color: 'bg-red-500' };
    } else if (strength <= 3) {
      return { strength, label: 'Fair', color: 'bg-yellow-500' };
    } else if (strength <= 4) {
      return { strength, label: 'Good', color: 'bg-blue-500' };
    } else {
      return { strength, label: 'Strong', color: 'bg-green-500' };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
          <Lock className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-noto font-semibold text-black">Change Password</h2>
          <p className="text-sm text-gray-600">Update your account password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 pr-12"
              placeholder="Enter current password"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 pr-12"
              placeholder="Enter new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Password strength:</span>
                <span className={`text-xs font-medium ${
                  passwordStrength.label === 'Weak' ? 'text-red-600' :
                  passwordStrength.label === 'Fair' ? 'text-yellow-600' :
                  passwordStrength.label === 'Good' ? 'text-blue-600' :
                  'text-green-600'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Password Requirements */}
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <p>Password must contain:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                One lowercase letter
              </li>
              <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>
                One number
              </li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-600' : ''}>
                One special character
              </li>
            </ul>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 pr-12"
              placeholder="Confirm new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Password Match Indicator */}
          {confirmPassword && (
            <div className="mt-1 flex items-center space-x-1">
              {newPassword === confirmPassword ? (
                <span className="text-xs text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Passwords match
                </span>
              ) : (
                <span className="text-xs text-red-600">Passwords do not match</span>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              {success}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Changing Password...
            </>
          ) : (
            'Change Password'
          )}
        </button>
      </form>
    </div>
  );
};

export default PasswordChange;

