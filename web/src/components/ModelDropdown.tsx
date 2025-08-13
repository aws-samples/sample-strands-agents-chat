import { useState, useRef, useEffect } from 'react';
import { type Model } from '../types/parameter';

interface ModelDropdownProps {
  selectedModel: Model;
  models: Model[];
  onModelChange: (model: Model) => void;
}

function ModelDropdown({
  selectedModel,
  models,
  onModelChange,
}: ModelDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleModelSelect = (model: Model) => {
    onModelChange(model);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[1px] text-sm transition-all duration-300 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none active:from-blue-700 active:via-purple-700 active:to-pink-700">
        <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-gray-700 transition-colors duration-300 hover:bg-gray-50 active:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600">
          <span className="text-xs">{selectedModel.displayName}</span>
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-64 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <div className="py-1">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model)}
                className={`w-full px-4 py-2 text-left transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  selectedModel?.id === model.id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                <div className="text-xs font-medium">{model.displayName}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelDropdown;
