import { useEffect } from 'react';
import { type Model } from '../types/parameter';

interface ModelBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: Model;
  models: Model[];
  onModelChange: (model: Model) => void;
}

function ModelBottomSheet({
  isOpen,
  onClose,
  selectedModel,
  models,
  onModelChange,
}: ModelBottomSheetProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleModelSelect = (model: Model) => {
    onModelChange(model);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${
        isOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={`relative w-full transform rounded-t-lg bg-white shadow-xl transition-transform duration-300 ease-out dark:bg-gray-800 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-1 dark:border-gray-700">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
            Select Model
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:hover:bg-gray-700 dark:hover:text-gray-300">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Model list */}
        <div className="max-h-96 overflow-y-auto">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelSelect(model)}
              className={`w-full px-4 py-4 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedModel?.id === model.id
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : ''
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div
                    className={`text-base font-medium ${
                      selectedModel?.id === model.id
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                    {model.displayName}
                  </div>
                </div>
                {selectedModel?.id === model.id && (
                  <svg
                    className="mr-1 h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ModelBottomSheet;
