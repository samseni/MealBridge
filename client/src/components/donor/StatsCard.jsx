import PropTypes from 'prop-types';

export default function StatsCard({ title, value, icon, color = 'primary', subtitle, trend }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  const trendClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="card hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm font-medium mt-2 ${trendClasses[trend.direction]}`}>
              {trend.direction === 'up' && '↑'}
              {trend.direction === 'down' && '↓'}
              {trend.direction === 'neutral' && '→'}
              {' '}{trend.value}
            </p>
          )}
        </div>
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${colorClasses[color]}`}>
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
};