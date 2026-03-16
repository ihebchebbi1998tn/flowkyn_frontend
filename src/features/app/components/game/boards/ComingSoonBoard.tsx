import React from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, Clock, MessageSquare } from 'lucide-react';

interface ComingSoonBoardProps {
  gameName: string;
  onBack?: () => void;
}

export function ComingSoonBoard({ gameName, onBack }: ComingSoonBoardProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Rocket className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        {gameName} {t('common.tbd', 'Coming Soon')}
      </h2>

      <p className="text-gray-600 max-w-md mb-8">
        {t('games.comingSoonDescription', 'We are currently polishing this activity to ensure the best experience for your team. Stay tuned!')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl mb-10">
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Research & Design</p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
            <div className="bg-blue-500 h-1.5 rounded-full w-[100%]"></div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <MessageSquare className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Alpha Testing</p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
            <div className="bg-purple-500 h-1.5 rounded-full w-[85%]"></div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <Rocket className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Final Polish</p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
            <div className="bg-green-500 h-1.5 rounded-full w-[40%]"></div>
          </div>
        </div>
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          {t('common.backToEvents', 'Back to Events')}
        </button>
      )}
    </div>
  );
}
