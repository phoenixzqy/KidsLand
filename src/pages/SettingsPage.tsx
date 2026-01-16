import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AppImage } from '../components/ui/AppImage';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { useVoiceSettings } from '../hooks/useVoiceSettings';

export function SettingsPage() {
  const navigate = useNavigate();
  const { stars, state } = useUser();
  const { equippedSkins } = useTheme();
  const { settings, availableVoices, updateSettings, testVoice, isLoading } = useVoiceSettings();

  const equippedCount = Object.values(equippedSkins).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-bg-primary pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm p-4 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/')} className="text-2xl">
            ←
          </button>
          <h1 className="text-xl font-bold text-slate-800">⚙️ Settings</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Profile Section */}
        <Card>
          <h2 className="font-bold text-slate-700 mb-3">📊 Your Stats</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Emeralds</span>
              <span className="font-bold text-star flex items-center gap-1">{stars}<AppImage src="/images/minecraft-renders/materials/minecraft-emerald.png" alt="emerald" className="w-5 h-5 inline-block" /></span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Words Studied</span>
              <span className="font-bold text-slate-800">
                {state.wordProgress.filter((w) => w.timesStudied > 0).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Words Mastered</span>
              <span className="font-bold text-success">
                {state.wordProgress.filter((w) => w.mastered).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Items Owned</span>
              <span className="font-bold text-slate-800">{state.ownedItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Skins Equipped</span>
              <span className="font-bold text-primary-600">{equippedCount}</span>
            </div>
          </div>
        </Card>

        {/* Theme Preview */}
        <Card>
          <h2 className="font-bold text-slate-700 mb-3">🎨 Active Skins</h2>
          {equippedCount > 0 ? (
            <div className="space-y-2">
              {Object.entries(equippedSkins).map(([target, prizeId]) => (
                prizeId && (
                  <div key={target} className="flex justify-between items-center">
                    <span className="text-slate-600 capitalize">{target}</span>
                    <span className="text-sm text-primary-600">Active ✓</span>
                  </div>
                )
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No skins equipped. Visit your collection!</p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => navigate('/collection')}
          >
            Manage Skins
          </Button>
        </Card>

        {/* Voice Settings */}
        <Card>
          <h2 className="font-bold text-slate-700 mb-3">🔊 Voice Settings</h2>
          {isLoading ? (
            <p className="text-slate-500 text-sm">Loading voices...</p>
          ) : (
            <div className="space-y-4">
              {/* Voice Selection */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">Voice</label>
                <select
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-700"
                  value={settings?.voiceName ?? ''}
                  onChange={(e) => updateSettings({ voiceName: e.target.value || null })}
                >
                  <option value="">Auto (Best available)</option>
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed Slider */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Speed: {((settings?.rate ?? 0.85) * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={settings?.rate ?? 0.85}
                  onChange={(e) => updateSettings({ rate: parseFloat(e.target.value) })}
                  className="w-full accent-primary-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Pitch Slider */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Pitch: {((settings?.pitch ?? 1.0) * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={settings?.pitch ?? 1.0}
                  onChange={(e) => updateSettings({ pitch: parseFloat(e.target.value) })}
                  className="w-full accent-primary-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Test Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => testVoice(settings?.voiceName ?? null)}
              >
                🔊 Test Voice
              </Button>
            </div>
          )}
        </Card>

        {/* About Section */}
        <Card>
          <h2 className="font-bold text-slate-700 mb-3">ℹ️ About</h2>
          <div className="text-sm text-slate-600 space-y-2">
            <p><strong>KidsLand</strong> - Learn English Words</p>
            <p>Version 1.0.0</p>
            <p>A fun app for kids to learn English words through games and quizzes!</p>
          </div>
        </Card>

        {/* Tips Section */}
        <Card className="bg-primary-50 border border-primary-200">
          <h2 className="font-bold text-primary-700 mb-3">💡 Tips</h2>
          <ul className="text-sm text-primary-600 space-y-2">
            <li>• Complete quizzes to earn stars</li>
            <li>• Hard mode gives you 3x stars!</li>
            <li>• Buy cards and skins in the Market</li>
            <li>• Master words by passing 3 quizzes</li>
          </ul>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button variant="primary" fullWidth onClick={() => navigate('/')}>
            🏠 Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
