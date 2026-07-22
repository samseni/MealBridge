import PropTypes from 'prop-types';

export default function StatsCard({ title, value, icon, color = 'primary', subtitle, trend, onClick }) {
  const cardClasses = {
    primary: 'border-l-4 border-primary-500 bg-gradient-to-r from-primary-50 to-white',
    green: 'border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-white',
    blue: 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white',
    yellow: 'border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-50 to-white',
    red: 'border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-white',
    purple: 'border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-white',
  };

  const iconClasses = {
    primary: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30',
    green: 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30',
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30',
    yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30',
    red: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30',
  };

  const trendClasses = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  return (
    <div
      className={`card card-hover-lift overflow-hidden ${cardClasses[color]} ${onClick ? 'cursor-pointer hover:shadow-xl' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{title}</p>
          <h3 className="text-4xl font-bold text-gray-900 mb-1">{value}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mt-3 ${trendClasses[trend.direction]}`}>
              {trend.direction === 'up' && '↑'}
              {trend.direction === 'down' && '↓'}
              {trend.direction === 'neutral' && '→'}
              {' '}{trend.value}
            </div>
          )}
        </div>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-transform duration-200 hover:scale-110 ${iconClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['primary', 'green', 'blue', 'yellow', 'red', 'purple']),
  subtitle: PropTypes.string,
  trend: PropTypes.shape({
    direction: PropTypes.oneOf(['up', 'down', 'neutral']).isRequired,
    value: PropTypes.string.isRequired,
  }),
  onClick: PropTypes.func,
};