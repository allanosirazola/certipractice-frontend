// src/components/user/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function UserProfile({ onClose }) {
  const { user, logout, updateProfile, getUserStats } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  const loadStats = async () => {
    setLoading(true);
    const result = await getUserStats();
    if (result.success) {
      setStats(result.stats);
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await updateProfile(formData);

    if (result.success) {
      setSuccess(t('profile.saveSuccess'));
      setEditMode(false);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Mi Perfil</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'
            }`}
          >
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'stats'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'
            }`}
          >
            Estadísticas
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'profile' && (
            <div>
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4">
                  {success}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">@{user?.username}</p>
                  </div>
                </div>

                {editMode ? (
                  <form onSubmit={handleUpdateProfile}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Apellido
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {loading ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="space-y-3 mb-6">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('profile.emailLabel')}</span>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('profile.memberSinceLabel')}</span>
                        <p className="font-medium">
                          {new Date(user?.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('profile.lastLogin')}</span>
                        <p className="font-medium">
                          {user?.lastLogin 
                            ? new Date(user.lastLogin).toLocaleDateString('es-ES')
                            : 'Nunca'
                          }
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-4"
                    >
                      Editar Perfil
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">{t('profile.loadingStats')}</p>
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300">{t('profile.totalExamsLabel')}</h4>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalExams}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800">{t('profile.passedLabel')}</h4>
                      <p className="text-2xl font-bold text-green-600">{stats.passedExams}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800">{t('profile.avgScoreLabel')}</h4>
                      <p className="text-2xl font-bold text-purple-600">{stats.averageScore}%</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-800">{t('profile.accuracyLabel')}</h4>
                      <p className="text-2xl font-bold text-orange-600">
                        {stats.totalQuestions > 0 
                          ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
                          : 0
                        }%
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('profile.summaryTitle')}</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p>{t('profile.totalQuestions')} {stats.totalQuestions}</p>
                      <p>{t('profile.correctAnswers')} {stats.correctAnswers}</p>
                      <p>{t('profile.successRate')} {stats.totalExams > 0 ? Math.round((stats.passedExams / stats.totalExams) * 100) : 0}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-300">{t('profile.noStatsAvailable')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50 dark:bg-gray-900">
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cerrar Sesión
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}