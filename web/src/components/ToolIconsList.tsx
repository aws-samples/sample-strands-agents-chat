import ToolIcon from './ToolIcon';

interface ToolIconsListProps {
  tools: string[];
  className?: string;
}

function ToolIconsList({ tools, className = '' }: ToolIconsListProps) {
  if (!tools || tools.length === 0) {
    return null;
  }

  return (
    <div className={`mt-2 flex flex-wrap gap-1 ${className}`}>
      {tools.map((tool, index) => (
        <div
          key={index}
          className="flex items-center justify-center rounded bg-gray-100 p-1 text-gray-500 transition-colors duration-300 dark:bg-gray-700 dark:text-gray-400">
          <ToolIcon toolId={tool} size="sm" />
        </div>
      ))}
    </div>
  );
}

export default ToolIconsList;
