// src/components/auth/Register.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Register({ onSwitchToLogin, onClose }) {
  const { register } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', firstName: '', lastName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      setLoading(false);
      return;
    }

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    if (result.success) { onClose(); } else { setError(result.error); }
    setLoading(false);
  };

  const field = (id, label, type = 'text', placeholder = '') => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{label}</label>
      <input
        type={type} id={id} name={id}
        value={formData[id]} onChange={handleChange} required
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('auth.register')}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 text-2xl">×</button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {field('firstName', t('auth.firstName'), 'text', t('auth.firstNamePlaceholder'))}
          {field('lastName', t('auth.lastName'), 'text', t('auth.lastNamePlaceholder'))}
          {field('username', t('auth.username'), 'text', t('auth.usernamePlaceholder'))}
          {field('email', t('auth.email'), 'email', t('auth.emailPlaceholder'))}
          {field('password', t('auth.password'), 'password', t('auth.passwordPlaceholder'))}
          {field('confirmPassword', t('auth.confirmPassword'), 'password', t('auth.confirmPasswordPlaceholder'))}

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('auth.registering') : t('auth.registerButton')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={onSwitchToLogin} className="text-blue-600 hover:underline text-sm">
            {t('auth.switchToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
