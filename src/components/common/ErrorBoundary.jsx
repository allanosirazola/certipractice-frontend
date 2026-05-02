// src/components/common/ErrorBoundary.jsx
// Catches render-time errors anywhere below in the tree and shows a friendly
// fallback so a single bug in a leaf component doesn't blank out the page.
import { Component } from 'react';
import logger from '../../utils/logger.js';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('ErrorBoundary caught:', error?.message || error, errorInfo?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '';
  };

  render() {
    if (this.state.hasError) {
      const isSpanish = typeof navigator !== 'undefined' && navigator.language?.startsWith('es');
      const T = isSpanish
        ? {
            title: 'Algo ha salido mal',
            desc: 'La aplicación ha encontrado un error inesperado. Puedes recargar la página o volver al inicio.',
            reload: 'Recargar página',
            home: 'Volver al inicio',
            details: 'Detalles técnicos',
          }
        : {
            title: 'Something went wrong',
            desc: 'The application hit an unexpected error. You can reload the page or go back home.',
            reload: 'Reload page',
            home: 'Go home',
            details: 'Technical details',
          };

      return (
        <div
          className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-950"
          role="alert"
        >
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {T.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {T.desc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors"
              >
                {T.reload}
              </button>
              <button
                onClick={this.handleReset}
                className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
              >
                {T.home}
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left text-xs text-gray-500 dark:text-gray-400">
                <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                  {T.details}
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded overflow-auto whitespace-pre-wrap break-words">
                  {String(this.state.error?.message || this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
