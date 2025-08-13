interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function Loading({ size = 'md', className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-300 border-t-blue-500 transition-colors duration-300 dark:border-gray-600 dark:border-t-blue-400`}></div>
    </div>
  );
}

export default Loading;
