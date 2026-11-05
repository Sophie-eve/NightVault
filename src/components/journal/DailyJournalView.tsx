import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Smile,
  Frown,
  Meh,
  Zap,
  Coffee,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import type { JournalEntry } from '../../types';

const MOODS: { mood: JournalEntry['mood']; label: string; icon: React.ElementType; color: string }[] = [
  { mood: 'inspired', label: 'Inspired', icon: Sparkles, color: '#A855F7' },
  { mood: 'great', label: 'Great', icon: Zap, color: '#10B981' },
  { mood: 'good', label: 'Good', icon: Smile, color: '#38BDF8' },
  { mood: 'neutral', label: 'Neutral', icon: Meh, color: '#94A3B8' },
  { mood: 'tired', label: 'Tired', icon: Coffee, color: '#F59E0B' },
  { mood: 'stressed', label: 'Stressed', icon: Frown, color: '#F43F5E' },
];

const PROMPT_SUGGESTIONS = [
  'What was your biggest breakthrough or win today?',
  'What is one thing you learned or want to remember?',
  'What challenge did you face and how did you approach it?',
  'List 3 things you are genuinely grateful for right now.',
  'What is the single most important task for tomorrow?',
];

export const DailyJournalView: React.FC = () => {
  const { journalEntries, saveJournalEntry, getJournalEntryForDate } = useVault();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [mood, setMood] = useState<JournalEntry['mood']>('good');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activePrompt, setActivePrompt] = useState('');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Load entry when selectedDate changes
  useEffect(() => {
    const entry = getJournalEntryForDate(selectedDate);
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setMood(entry.mood);
      setActivePrompt(entry.prompt || '');
    } else {
      setTitle(`Reflection for ${selectedDate}`);
      setContent('');
      setMood('good');
      setActivePrompt('');
    }
  }, [selectedDate, getJournalEntryForDate]);

  // Handle date shifting
  const changeDateBy = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const html = `<p>${content.replace(/\n/g, '<br/>')}</p>`;
    await saveJournalEntry(
      selectedDate,
      mood,
      title || `Journal: ${selectedDate}`,
      content,
      html,
      activePrompt
    );

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const formattedSelectedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#0a0b10] text-slate-100">
      {/* Left / Main Journal Entry Form */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto border-r border-white/10">
        {/* Date Selector Header */}
        <div className="p-6 border-b border-white/10 bg-[#0d0f17] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => changeDateBy(-1)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-purple-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#141624] border border-white/10 text-white text-xs sm:text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-semibold text-white ml-2 hidden sm:inline">
                {formattedSelectedDate}
              </span>
            </div>

            <button
              type="button"
              onClick={() => changeDateBy(1)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer"
            >
              {isSavedRecently ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSavedRecently ? 'Saved!' : 'Save Entry'}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-10 max-w-4xl mx-auto w-full space-y-6 flex-1">
          {/* Mood Tracker */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              How are you feeling today?
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {MOODS.map(m => {
                const IconComponent = m.icon;
                const isSelected = mood === m.mood;
                return (
                  <button
                    key={m.mood}
                    type="button"
                    onClick={() => setMood(m.mood)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-500 bg-purple-600/20 text-white shadow-md'
                        : 'border-white/5 bg-[#12141f] text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" style={{ color: isSelected ? m.color : undefined }} />
                    <span className="text-xs font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Writing Prompts
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActivePrompt(p);
                    setContent(prev => (prev ? `${prev}\n\n**${p}**\n` : `**${p}**\n`));
                  }}
                  className="px-2.5 py-1 text-xs bg-[#141624] hover:bg-purple-600/20 hover:text-purple-300 border border-white/10 rounded-lg text-slate-300 transition-colors text-left cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title for today's entry..."
              className="w-full text-xl sm:text-2xl font-bold text-white bg-transparent border-b border-white/10 pb-2 outline-none focus:border-purple-500 placeholder:text-slate-600"
            />
          </div>

          {/* Body Textarea */}
          <div className="flex-1">
            <textarea
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write freely about your day, breakthroughs, learnings, ideas, or challenges..."
              className="w-full p-4 text-sm sm:text-base leading-relaxed bg-[#12141f] border border-white/10 rounded-2xl text-slate-200 placeholder:text-slate-600 outline-none focus:border-purple-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar: Timeline of past journal entries */}
      <div className="w-full md:w-72 lg:w-80 bg-[#0e1017] p-5 overflow-y-auto shrink-0 border-t md:border-t-0 border-white/10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-purple-400" />
          <span>Past Entries ({journalEntries.length})</span>
        </h3>

        <div className="space-y-2">
          {journalEntries.length > 0 ? (
            journalEntries
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(entry => {
                const isSelected = entry.date === selectedDate;
                const moodObj = MOODS.find(m => m.mood === entry.mood);
                const IconComponent = moodObj?.icon || Sparkles;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedDate(entry.date)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-[#141624] border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-200 font-mono">{entry.date}</span>
                      <IconComponent className="w-3.5 h-3.5" style={{ color: moodObj?.color }} />
                    </div>
                    <p className="text-xs font-medium truncate">{entry.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {entry.content}
                    </p>
                  </button>
                );
              })
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">
              No entries logged yet. Write your thoughts for today!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
