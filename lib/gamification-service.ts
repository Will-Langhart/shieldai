import { supabase } from './supabase';

export interface XPActivity {
  id: string;
  user_id: string;
  activity_type: 'conversation' | 'verse_reference' | 'apologetics' | 'theology' | 'streak' | 'achievement';
  xp_earned: number;
  description: string;
  metadata?: any;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
}

export class GamificationService {
  static async addXP(userId: string, activityType: string, xpAmount: number, description: string, metadata?: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('xp_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          xp_earned: xpAmount,
          description,
          metadata
        });

      if (error) {
        console.error('Error adding XP:', error);
        throw error;
      }

      // Update user's total XP
      await this.updateUserXP(userId, xpAmount);
      
      // Check for achievement unlocks
      await this.checkAchievements(userId);
    } catch (error) {
      console.error('Error in addXP:', error);
    }
  }

  static async updateUserXP(userId: string, xpAmount: number): Promise<void> {
    try {
      // Get current user XP
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('total_xp, level')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching user XP:', fetchError);
        return;
      }

      const newTotalXP = (userData.total_xp || 0) + xpAmount;
      const newLevel = Math.floor(newTotalXP / 200) + 1; // Level up every 200 XP

      // Update user XP and level
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          total_xp: newTotalXP,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user XP:', updateError);
      }
    } catch (error) {
      console.error('Error in updateUserXP:', error);
    }
  }

  static async checkAchievements(userId: string): Promise<void> {
    try {
      // Get user stats
      const { data: userStats, error: statsError } = await supabase
        .from('users')
        .select('conversations_completed, verses_referenced, streak_days')
        .eq('id', userId)
        .single();

      if (statsError) {
        console.error('Error fetching user stats:', statsError);
        return;
      }

      // Check for achievement unlocks based on stats
      const achievements = [
        {
          id: 'apologist_badge',
          condition: userStats.conversations_completed >= 50,
          xp: 100
        },
        {
          id: 'scripture_scholar',
          condition: userStats.verses_referenced >= 100,
          xp: 200
        },
        {
          id: 'daily_devotion_streak',
          condition: userStats.streak_days >= 7,
          xp: 75
        }
      ];

      for (const achievement of achievements) {
        if (achievement.condition) {
          await this.unlockAchievement(userId, achievement.id, achievement.xp);
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  static async unlockAchievement(userId: string, achievementId: string, xpReward: number): Promise<void> {
    try {
      // Check if already unlocked
      const { data: existing, error: checkError } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (existing) {
        return; // Already unlocked
      }

      // Unlock achievement
      const { error: unlockError } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          unlocked_at: new Date().toISOString()
        });

      if (unlockError) {
        console.error('Error unlocking achievement:', unlockError);
        return;
      }

      // Award XP for achievement
      await this.addXP(userId, 'achievement', xpReward, `Unlocked ${achievementId}`, { achievement_id: achievementId });
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }

  static async getUserProgress(userId: string): Promise<any> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('level, total_xp, conversations_completed, verses_referenced, streak_days')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user progress:', error);
        return null;
      }

      const xpToNextLevel = (user.level + 1) * 200;
      const currentXP = user.total_xp % 200;

      return {
        level: user.level,
        currentXP,
        xpToNextLevel,
        totalXP: user.total_xp,
        conversationsCompleted: user.conversations_completed,
        versesReferenced: user.verses_referenced,
        streakDays: user.streak_days
      };
    } catch (error) {
      console.error('Error in getUserProgress:', error);
      return null;
    }
  }
} 