import React from 'react';
import { Trophy, Medal, Star, Award } from 'lucide-react';

export default function LeaderboardPage() {
  // Mock data for leaderboard
  const citizens = [
    { rank: 1, name: 'Rahul S.', points: 2450, issues: 32, tier: 'Diamond' },
    { rank: 2, name: 'Priya K.', points: 1800, issues: 24, tier: 'Platinum' },
    { rank: 3, name: 'Amit V.', points: 1550, issues: 21, tier: 'Gold' },
    { rank: 4, name: 'Sneha M.', points: 900, issues: 12, tier: 'Silver' },
    { rank: 5, name: 'Vikram J.', points: 450, issues: 6, tier: 'Bronze' },
  ];

  const officials = [
    { rank: 1, name: 'Officer Sharma', points: 5200, resolved: 89, dept: 'Public Works' },
    { rank: 2, name: 'Officer Desai', points: 4100, resolved: 72, dept: 'Sanitation' },
    { rank: 3, name: 'Officer Patel', points: 3800, resolved: 65, dept: 'Roads' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-serif font-bold text-ink flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-olive" />
          Community Heroes
        </h1>
        <p className="text-ink/60 italic">Recognizing the citizens and officials making our city better.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Citizens Leaderboard */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-sand overflow-hidden p-6">
          <div className="mb-4">
            <h3 className="font-serif text-2xl text-ink">Leaderboard</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {citizens.map((user) => (
              <div key={user.rank} className="flex items-center justify-between text-sm py-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-ink w-4">{user.rank}.</span>
                  <span className="text-ink">{user.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold opacity-40 uppercase tracking-widest">{user.tier}</span>
                  <span className="font-bold text-olive">{user.points} pts</span>
                </div>
              </div>
            ))}
            <div className="mt-2 pt-4 border-t border-dashed border-sand flex items-center justify-between text-[10px] font-bold uppercase opacity-50 tracking-widest">
              <p>Your Rank</p>
              <p>#142</p>
            </div>
          </div>
        </div>

        {/* Officials Leaderboard */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-sand overflow-hidden p-6">
          <div className="mb-4">
            <h3 className="font-serif text-2xl text-ink">Official Rankings</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {officials.map((user) => (
              <div key={user.rank} className="flex items-center justify-between text-sm py-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-ink w-4">{user.rank}.</span>
                  <span className="text-ink">{user.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold opacity-40 uppercase tracking-widest">{user.dept}</span>
                  <span className="font-bold text-sage">{user.resolved} fixed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
