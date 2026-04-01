'use client';

import React, { useState, useEffect } from 'react';

interface MissionGroupsFlowProps {
  phaseId: number;
  onStartGroup: (groupIndex: number) => void;
}

const MISSION_GROUPS = [
  {
    id: 0,
    icon: '🎬',
    title: 'Watch & Learn',
    description: 'Watch a video introduction to the topic',
    color: '#00D4FF',
    activities: 1,
  },
  {
    id: 1,
    icon: '✍️',
    title: 'Choose & Select',
    description: 'Select the correct sentences about hobbies',
    color: '#00FF88',
    activities: 1,
  },
  {
    id: 2,
    icon: '🎧',
    title: 'Listen & Repeat',
    description: 'Practice pronunciation with 8 sentences',
    color: '#FFD700',
    activities: 1,
  },
  {
    id: 3,
    icon: '🎤',
    title: 'Review & Master',
    description: 'Master 2 selected sentences',
    color: '#FF6B9D',
    activities: 2,
  },
  {
    id: 4,
    icon: '🦅',
    title: 'WOA Challenge',
    description: 'The ultimate speaking challenge',
    color: '#00F0FF',
    activities: 1,
  },
];

export const MissionGroupsFlow: React.FC<MissionGroupsFlowProps> = ({ phaseId, onStartGroup }) => {
  const [completedGroups, setCompletedGroups] = useState<Set<number>>(new Set());
  const [currentGroup, setCurrentGroup] = useState<number | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [allGroupsCompleted, setAllGroupsCompleted] = useState(false);

  // Load completed mission groups from database
  useEffect(() => {
    const loadCompletedGroups = async () => {
      try {
        const response = await fetch(`/api/mission-groups/${phaseId}/completed`);
        const completedGroupIds: number[] = await response.json();
        
        if (Array.isArray(completedGroupIds) && completedGroupIds.length > 0) {
          setCompletedGroups(new Set(completedGroupIds));
          // Check if all 5 groups are completed
          if (completedGroupIds.length === 5) {
            setAllGroupsCompleted(true);
          }
        } else {
          // If nothing is completed, start with empty set
          setCompletedGroups(new Set());
          setAllGroupsCompleted(false);
        }
      } catch (error) {
        console.error('Failed to load completed groups:', error);
        // Default to nothing completed on error
        setCompletedGroups(new Set());
        setAllGroupsCompleted(false);
      }
    };

    loadCompletedGroups();
  }, [phaseId]);

  const handleGroupClick = (groupIndex: number) => {
    // If trying to click a group and all groups are done, show completion modal
    if (allGroupsCompleted) {
      setShowCompletionModal(true);
      return;
    }

    // Otherwise, check if can start this group
    const isLocked = groupIndex > 0 && !completedGroups.has(groupIndex - 1);
    const canStart = !isLocked && !completedGroups.has(groupIndex);
    
    if (canStart) {
      setCurrentGroup(groupIndex);
      onStartGroup(groupIndex);
    }
  };

  const handleGroupComplete = (groupIndex: number) => {
    const updated = new Set(completedGroups);
    updated.add(groupIndex);
    setCompletedGroups(updated);
    
    // Check if all groups now completed
    if (updated.size === 5) {
      setAllGroupsCompleted(true);
    }
    
    // Move to next group
    if (groupIndex < MISSION_GROUPS.length - 1) {
      setCurrentGroup(groupIndex + 1);
      onStartGroup(groupIndex + 1);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
          Talking About Hobbies
        </h2>
        <p className="text-cyan-200/70">5 grupos de missões para dominar</p>
      </div>

      {/* Mission Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MISSION_GROUPS.map((group, idx) => {
          const isCompleted = completedGroups.has(idx);
          const isLocked = idx > 0 && !completedGroups.has(idx - 1);
          const canStart = !isLocked && !isCompleted && (idx === 0 || completedGroups.has(idx - 1));

          return (
            <button
              key={idx}
              onClick={() => handleGroupClick(idx)}
              disabled={isLocked}
              className="relative group overflow-hidden rounded-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {/* Background gradient - colorido se desbloqueado, preto/branco se bloqueado */}
              <div
                className="absolute inset-0"
                style={{
                  background: isCompleted || canStart
                    ? `linear-gradient(135deg, ${group.color}20, ${group.color}05)`
                    : 'linear-gradient(135deg, #333333, #1a1a1a)',
                  filter: isLocked ? 'grayscale(100%)' : 'none',
                }}
              />

              {/* Border */}
              <div
                className="absolute inset-0 rounded-2xl border-2 transition-all"
                style={{
                  borderColor: isCompleted || canStart ? group.color : '#555555',
                  boxShadow: isCompleted || canStart ? `0 0 20px ${group.color}40` : 'none',
                  filter: isLocked ? 'grayscale(100%)' : 'none',
                }}
              />

              {/* Content */}
              <div className="relative p-6 space-y-4 h-full flex flex-col justify-between">
                {/* Top section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl">{group.icon}</span>
                    <span
                      className="text-sm font-black tracking-widest px-2 py-1 rounded-full"
                      style={{
                        color: isCompleted || canStart ? group.color : '#999999',
                        background: isCompleted || canStart ? `${group.color}20` : '#33333340',
                        border: `1px solid ${isCompleted || canStart ? group.color : '#555555'}`,
                      }}
                    >
                      {group.activities} {group.activities === 1 ? 'ATIVIDADE' : 'ATIVIDADES'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white" style={{ color: isLocked ? '#999999' : 'white' }}>
                    {group.title}
                  </h3>
                  <p className="text-sm" style={{ color: isLocked ? '#666666' : 'rgba(147,197,253,0.7)' }}>
                    {group.description}
                  </p>
                </div>

                {/* Status badge */}
                <div className="pt-2 space-y-2">
                  {isCompleted && (
                    <div className="text-center py-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgb(34,197,94)' }}>
                      <p className="text-sm font-bold text-green-300">✅ COMPLETO</p>
                    </div>
                  )}

                  {isLocked && (
                    <div className="text-center py-2 rounded-lg" style={{ background: 'rgba(100,100,100,0.2)', border: '1px solid #555555' }}>
                      <p className="text-sm font-bold text-gray-400">🔒 BLOQUEADO</p>
                    </div>
                  )}

                  {canStart && (
                    <div
                      className="text-center py-2 rounded-lg font-bold transition-all"
                      style={{
                        background: `${group.color}20`,
                        border: `1px solid ${group.color}`,
                        color: group.color,
                      }}
                    >
                      ➡️ COMEÇAR
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info */}
      <div className="text-center text-cyan-200/50 text-sm">
        <p>💡 Complete cada grupo para desbloquear o próximo</p>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-2 border-cyan-400 rounded-3xl p-12 max-w-md text-center space-y-6">
            <div className="text-6xl animate-bounce">🏆</div>
            <h2 className="text-4xl font-black text-white">Fase Completa!</h2>
            <p className="text-xl text-cyan-200">Você completou todas as 6 atividades do grupo Talking About Hobbies!</p>
            
            <div className="space-y-3">
              <p className="text-yellow-300 text-lg font-bold">✨ 140 XP ganhos</p>
              <p className="text-yellow-400 text-lg font-bold">🪙 5 WOA COINS ganhos</p>
            </div>

            <div className="space-y-2 pt-4">
              <button
                onClick={() => (window.location.href = '/journey')}
                className="w-full px-6 py-3 rounded-lg font-bold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #003AB0, #0066FF)',
                  border: '2px solid #00D4FF',
                }}
              >
                ← VOLTAR À JORNADA
              </button>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="w-full px-6 py-3 rounded-lg font-bold text-cyan-300 transition-all hover:bg-cyan-500/20"
                style={{
                  border: '2px solid #00D4FF',
                }}
              >
                VER GRUPOS NOVAMENTE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
