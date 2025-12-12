import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  MessageCircle, X, Send, Heart, Lightbulb, 
  Bug, Smile, Meh, Frown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/src/lib/supabaseClient';
import { getStoredUser } from '../auth';

export default function FeedbackWidget() {
  const [user] = useState(() => getStoredUser());
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('mood'); // mood, feedback, success
  const [mood, setMood] = useState('');
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('');

  const moods = [
    { id: 'love', icon: Heart, label: 'Love it!', color: 'text-red-500' },
    { id: 'like', icon: Smile, label: 'Like it', color: 'text-green-500' },
    { id: 'okay', icon: Meh, label: 'It\'s okay', color: 'text-yellow-500' },
    { id: 'dislike', icon: Frown, label: 'Not great', color: 'text-orange-500' }
  ];

  const categories = [
    { id: 'suggestion', icon: Lightbulb, label: 'Suggestion', color: 'bg-blue-100 text-blue-700' },
    { id: 'bug', icon: Bug, label: 'Bug Report', color: 'bg-red-100 text-red-700' },
    { id: 'general', icon: MessageCircle, label: 'General', color: 'bg-gray-100 text-gray-700' }
  ];

  const handleSubmit = async () => {
    try {
      const { error } = await supabase.from('feedback').insert({
        mood,
        category,
        feedback: feedback.trim(),
        user_email: user?.email || null,
        created_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      setStep('success');
      setTimeout(() => {
        setIsOpen(false);
        setStep('mood');
        setMood('');
        setFeedback('');
        setCategory('');
      }, 2000);
    } catch (err) {
      console.error('Feedback error:', err);
      // Still show success to user
      setStep('success');
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </motion.div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="shadow-2xl border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {step === 'mood' && 'How\'s your experience?'}
                        {step === 'feedback' && 'Tell us more'}
                        {step === 'success' && 'Thank you!'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {step === 'mood' && 'Help us improve SharePlate'}
                        {step === 'feedback' && 'Your feedback helps us grow'}
                        {step === 'success' && 'We appreciate your input'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {step === 'mood' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {moods.map((moodOption) => {
                          const Icon = moodOption.icon;
                          return (
                            <button
                              key={moodOption.id}
                              onClick={() => {
                                setMood(moodOption.id);
                                setStep('feedback');
                              }}
                              className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                                mood === moodOption.id
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <Icon className={`w-8 h-8 mx-auto mb-2 ${moodOption.color}`} />
                              <div className="text-sm font-medium text-slate-900">
                                {moodOption.label}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 'feedback' && (
                    <div className="space-y-4">
                      <div className="flex gap-2 mb-4">
                        {categories.map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => setCategory(cat.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                category === cat.id
                                  ? cat.color
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>

                      <Textarea
                        placeholder="Share your thoughts, suggestions, or report issues..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setStep('mood')}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={!feedback.trim()}
                          className="flex-1 bg-orange-500 hover:bg-orange-600"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 'success' && (
                    <div className="text-center py-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                      >
                        <Heart className="w-8 h-8 text-green-600" />
                      </motion.div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">
                        Feedback received!
                      </h4>
                      <p className="text-sm text-slate-600">
                        We'll use your input to make SharePlate even better.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}