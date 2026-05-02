// PrivacyControlPanel.jsx - Panel de control de privacidad completo
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { privacyAPI } from '../../services/api';

export default function PrivacyControlPanel({ onClose }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    dataSharing: false,
    analyticsTracking: false,
    marketingEmails: false
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      const response = await privacyAPI.getSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (err) {
    }
  };

  const handleUpdateSettings = async (key, value) => {
    try {
      setLoading(true);
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      await privacyAPI.updateSettings({ [key]: value });
    } catch (err) {
      // Revertir en caso de error
      setSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExportLoading(true);
      const response = await privacyAPI.exportUserData();
      
      // Crear blob y descargar
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certipractice-my-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al exportar los datos. Por favor intenta de nuevo.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert('Por favor introduce tu contraseña para confirmar');
      return;
    }

    try {
      setLoading(true);
      const response = await privacyAPI.deleteAccount(deletePassword);
      
      if (response.success) {
        alert('Tu cuenta ha sido eliminada permanentemente.');
        logout();
        onClose();
      } else {
        alert(response.error || 'Error al eliminar la cuenta');
      }
    } catch (err) {
      alert('Error al eliminar la cuenta. Verifica tu contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Acceso Requerido</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Debes iniciar sesión para acceder a la configuración de privacidad.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50 dark:bg-gray-900">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">🔐 Privacidad y Datos</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Controla tus datos y preferencias de privacidad</p>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 text-2xl">✕</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Información del usuario */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📧 Tu Información</h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Cuenta creada:</strong> {new Date(user?.createdAt).toLocaleDateString('es-ES')}</p>
              <p><strong>Último acceso:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'N/A'}</p>
            </div>
          </div>

          {/* Preferencias de comunicación */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">📬 Comunicaciones</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800">
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-100">Notificaciones por email</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Recibe actualizaciones sobre tus exámenes</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleUpdateSettings('emailNotifications', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800">
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-100">Emails de marketing</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Ofertas, novedades y promociones</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.marketingEmails}
                  onChange={(e) => handleUpdateSettings('marketingEmails', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Privacidad de datos */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">🔒 Privacidad de Datos</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800">
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-100">Analíticas de uso</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Ayúdanos a mejorar el servicio</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.analyticsTracking}
                  onChange={(e) => handleUpdateSettings('analyticsTracking', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800">
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-100">Compartir datos anónimos</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Datos estadísticos para mejorar las preguntas</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataSharing}
                  onChange={(e) => handleUpdateSettings('dataSharing', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Exportar datos */}
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">📥 Exportar tus Datos</h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-4">
              Descarga una copia de todos tus datos personales en formato JSON 
              (incluyendo historial de exámenes, estadísticas y preferencias).
            </p>
            <button
              onClick={handleExportData}
              disabled={exportLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {exportLoading ? '⏳ Preparando...' : '📥 Descargar mis Datos'}
            </button>
          </div>

          {/* Eliminar cuenta */}
          <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">⚠️ Eliminar Cuenta</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán todos 
              tus datos, historial de exámenes, estadísticas y preferencias.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                🗑️ Eliminar mi Cuenta
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  Introduce tu contraseña para confirmar:
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading || !deletePassword}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50 dark:bg-gray-900">
          <a href="/privacy-policy" target="_blank" className="text-sm text-blue-600 hover:underline">
            Política de Privacidad
          </a>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}