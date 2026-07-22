import PropTypes from 'prop-types';

export default function EmptyState({
  icon = '📦',
  title = 'No data found',
  description = 'Get started by creating your first item',
  action,
  actionLabel = 'Get Started'
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{description}</p>
      {action && (
        <button onClick={action} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.func,
  actionLabel: PropTypes.string,
};