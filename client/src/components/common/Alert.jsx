import PropTypes from 'prop-types';

export default function Alert({ type = 'info', title, message, onClose, className = '' }) {
  const typeConfig = {
    success: {
      icon: '✓',
      className: 'alert-success',
    },
    error: {
      icon: '✕',
      className: 'alert-error',
    },
    warning: {
      icon: '⚠',
      className: 'alert-warning',
    },
    info: {
      icon: 'ℹ',
      className: 'alert-info',
    },
  };

  const config = typeConfig[type];

  return (
    <div className={`alert ${config.className} ${className}`}>
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-current flex items-center justify-center text-white text-xs font-bold">
        {config.icon}
      </div>
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 w-6 h-6 rounded-lg hover:bg-black hover:bg-opacity-10 flex items-center justify-center transition-colors"
        >
          <span className="text-lg">×</span>
        </button>
      )}
    </div>
  );
}

Alert.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  className: PropTypes.string,
};