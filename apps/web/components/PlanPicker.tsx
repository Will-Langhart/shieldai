import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { ClientService } from '../lib/client-service';

interface PlanPickerProps {
  userId: string;
  theme?: 'light' | 'dark';
  anchorClassName?: string;
  onClose: () => void;
  pendingVerse?: { reference: string; text: string } | null;
  pendingMessage?: { content: string } | null;
  onAdded?: () => void;
}

export default function PlanPicker({ userId, theme = 'dark', anchorClassName = '', onClose, pendingVerse, pendingMessage, onAdded }: PlanPickerProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const result = await ClientService.listStudyPlans(userId);
        setPlans(result.plans || []);
      } catch (e) {
        console.error('Failed to load plans', e);
      }
    };
    loadPlans();
  }, [userId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onClick = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [onClose]);

  const handleChoosePlan = async (planId: string) => {
    try {
      if (pendingVerse) {
        await ClientService.createStudyPlanStep({ planId, reference: pendingVerse.reference, title: pendingVerse.reference, notes: pendingVerse.text });
      } else if (pendingMessage) {
        const firstLine = pendingMessage.content.split('\n')[0].slice(0, 60);
        await ClientService.createStudyPlanStep({ planId, title: firstLine, notes: pendingMessage.content });
      }
      onAdded?.();
      onClose();
    } catch (e) {
      console.error('Failed to add to plan', e);
    }
  };

  return (
    <div ref={containerRef} className={`absolute ${anchorClassName} z-[3000] w-72 rounded-xl shadow-xl p-3 border ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-shield-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Choose a plan</div>
        <button onClick={onClose} className={`p-1 rounded ${theme==='dark'?'hover:bg-gray-800':'hover:bg-gray-100'}`}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {plans.map((p) => (
          <button key={p.id} onClick={() => handleChoosePlan(p.id)} className={`w-full text-left p-2 rounded border ${theme==='dark'?'border-gray-700 hover:bg-gray-800':'border-gray-200 hover:bg-gray-50'}`}>
            <div className="font-medium truncate">{p.title}</div>
            {p.description && <div className="text-xs opacity-70 truncate">{p.description}</div>}
          </button>
        ))}
        {plans.length === 0 && (
          <div className={`text-sm ${theme==='dark'?'text-gray-400':'text-gray-500'}`}>No plans. Create one first.</div>
        )}
      </div>
    </div>
  );
}


