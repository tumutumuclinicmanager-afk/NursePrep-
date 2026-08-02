import React, { useState, useEffect } from 'react';
import { 
  fetchBadgeConfigs, 
  saveBadgeConfig, 
  deleteBadgeConfig, 
  resetBadgeConfigsToDefault, 
  BadgeConfig, 
  ICON_MAP,
  DEFAULT_BADGES 
} from '@/lib/badges';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Award, 
  Plus, 
  Trash2, 
  Edit2, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  Flame, 
  Medal, 
  Star, 
  Target, 
  Shield, 
  Zap, 
  BookOpen 
} from 'lucide-react';

const COLOR_OPTIONS = [
  { label: 'Blue', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  { label: 'Orange', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { label: 'Amber', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { label: 'Emerald', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { label: 'Purple', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  { label: 'Indigo', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  { label: 'Rose', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
];

export default function AdminBadges() {
  const [badges, setBadges] = useState<BadgeConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<BadgeConfig, 'id'>>({
    name: '',
    description: '',
    conditionType: 'streak',
    conditionValue: 3,
    icon: 'Flame',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    enabled: true,
  });

  const loadBadges = async () => {
    setLoading(true);
    const data = await fetchBadgeConfigs();
    setBadges(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      conditionType: 'streak',
      conditionValue: 3,
      icon: 'Flame',
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      enabled: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (badge: BadgeConfig) => {
    setEditingId(badge.id);
    setFormData({
      name: badge.name,
      description: badge.description,
      conditionType: badge.conditionType,
      conditionValue: badge.conditionValue,
      icon: badge.icon,
      color: badge.color,
      bg: badge.bg,
      enabled: badge.enabled,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const id = editingId || `badge_${Date.now()}`;
    const newBadge: BadgeConfig = {
      id,
      ...formData,
    };

    await saveBadgeConfig(newBadge);
    setShowModal(false);
    await loadBadges();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this badge configuration?')) {
      await deleteBadgeConfig(id);
      await loadBadges();
    }
  };

  const handleReset = async () => {
    if (confirm('Reset all badge configurations to system default preset?')) {
      const reset = await resetBadgeConfigsToDefault();
      setBadges(reset);
    }
  };

  const toggleEnableBadge = async (badge: BadgeConfig) => {
    const updated = { ...badge, enabled: !badge.enabled };
    await saveBadgeConfig(updated);
    await loadBadges();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Badges & Streak Gamification Admin
          </h2>
          <p className="text-slate-500 text-sm">
            Configure student progression badges, streak thresholds, and achievement rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="text-xs gap-1.5 text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
          </Button>

          <Button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Create New Badge
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <Flame className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 leading-relaxed">
          <p className="font-bold text-amber-900">Dynamic Student Progression System</p>
          <p className="mt-0.5 text-amber-800">
            Students start with a <strong>Beginner Badge</strong> upon completing their 1st practice quiz.
            As they maintain continuous daily study streaks (1, 3, 7, 14, 30 days) or complete question milestones,
            higher-tier badges unlock automatically on their student dashboard.
          </p>
        </div>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          Loading badge configurations...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const IconComp = ICON_MAP[badge.icon] || Award;
            return (
              <div
                key={badge.id}
                className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  badge.enabled ? 'border-slate-200 shadow-xs' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${badge.bg} ${badge.color}`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{badge.name}</h4>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block mt-0.5">
                          {badge.conditionType === 'beginner' && 'First Step / Entry'}
                          {badge.conditionType === 'streak' && `${badge.conditionValue}-Day Streak Target`}
                          {badge.conditionType === 'questionsCount' && `${badge.conditionValue} Questions Target`}
                          {badge.conditionType === 'score' && `${badge.conditionValue}% Accuracy Target`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleEnableBadge(badge)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                        badge.enabled
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {badge.enabled ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Rule ID: {badge.id}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(badge)}
                      className="h-8 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(badge.id)}
                      className="h-8 text-xs gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Add / Edit Badge */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                {editingId ? 'Edit Badge Rule' : 'Create New Badge Rule'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-tight">Badge Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7-Day Streak Master"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-tight">Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Complete practice sessions for 7 consecutive days"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-tight">Condition Type</label>
                  <select
                    value={formData.conditionType}
                    onChange={(e) => setFormData({ ...formData, conditionType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                  >
                    <option value="beginner">Beginner (1st Quiz)</option>
                    <option value="streak">Streak Days</option>
                    <option value="questionsCount">Total Questions</option>
                    <option value="score">Min Accuracy Score (%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-tight">Requirement Target</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.conditionValue}
                    onChange={(e) => setFormData({ ...formData, conditionValue: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-tight">Badge Icon</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                  >
                    {Object.keys(ICON_MAP).map((iconName) => (
                      <option key={iconName} value={iconName}>
                        {iconName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-tight">Badge Palette</label>
                  <select
                    value={formData.color}
                    onChange={(e) => {
                      const selectedColor = e.target.value;
                      const match = COLOR_OPTIONS.find((c) => c.color === selectedColor);
                      setFormData({
                        ...formData,
                        color: selectedColor,
                        bg: match ? match.bg : 'bg-blue-50 border-blue-200',
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.color} value={c.color}>
                        {c.label} Theme
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Live Preview</span>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${formData.bg} ${formData.color}`}>
                    {React.createElement(ICON_MAP[formData.icon] || Award, { className: 'w-5 h-5' })}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{formData.name || 'Badge Title'}</h5>
                    <p className="text-[10px] text-slate-500">{formData.description || 'Badge description preview'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  {editingId ? 'Save Changes' : 'Create Badge'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
