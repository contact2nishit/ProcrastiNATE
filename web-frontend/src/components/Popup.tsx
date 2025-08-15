import React from 'react';

type PopupProps = {
  message: string;
  onClose: () => void;
};

const Popup: React.FC<PopupProps> = ({ message, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
      data-testid="app-popup"
    >
      <div className="bg-white rounded-2xl border-4 border-orange-400 shadow-2xl p-4 w-[85%] max-w-md" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-teal-800 text-base font-bold flex-1" data-testid="app-popup-message">{message}</p>
          <button
            className="bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl px-3 py-1 text-sm font-bold hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-md"
            onClick={onClose}
            data-testid="app-popup-close"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
