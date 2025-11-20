/**
 * 模拟用户数据 - 用于好友系统、排行榜等社交功能
 * 实际应用中应从后端API获取
 */

export const mockUsers = [
  {
    id: 'user_001',
    nickname: '健身达人小李',
    email: 'xiaoli@example.com',
    avatar: 'https://i.pravatar.cc/150?img=11',
    level: '专家',
    totalWorkouts: 156,
    streakDays: 42,
    totalCaloriesBurned: 45600,
    bio: '马拉松爱好者，目标是跑完六大满贯！',
    joinDate: '2024-01-15',
    badges: ['7 日连胜', '21 日铁粉', '百次训练'],
  },
  {
    id: 'user_002',
    nickname: '力量王者',
    email: 'powerking@example.com',
    avatar: 'https://i.pravatar.cc/150?img=12',
    level: '大师',
    totalWorkouts: 203,
    streakDays: 67,
    totalCaloriesBurned: 72300,
    bio: '专注力量训练5年，硬拉200kg+',
    joinDate: '2023-09-20',
    badges: ['7 日连胜', '21 日铁粉', '百次训练', '卡路里杀手'],
  },
  {
    id: 'user_003',
    nickname: '瑜伽小仙女',
    email: 'yoga@example.com',
    avatar: 'https://i.pravatar.cc/150?img=45',
    level: '进阶',
    totalWorkouts: 89,
    streakDays: 21,
    totalCaloriesBurned: 12400,
    bio: '瑜伽教练，热爱冥想和伸展',
    joinDate: '2024-05-10',
    badges: ['7 日连胜', '21 日铁粉'],
  },
  {
    id: 'user_004',
    nickname: '减脂进行时',
    email: 'fatburn@example.com',
    avatar: 'https://i.pravatar.cc/150?img=33',
    level: '新手',
    totalWorkouts: 34,
    streakDays: 12,
    totalCaloriesBurned: 8900,
    bio: '正在减脂路上，已减重10kg！',
    joinDate: '2024-08-01',
    badges: ['3 日火花', '7 日连胜'],
  },
  {
    id: 'user_005',
    nickname: 'CrossFit狂热者',
    email: 'crossfit@example.com',
    avatar: 'https://i.pravatar.cc/150?img=56',
    level: '专家',
    totalWorkouts: 178,
    streakDays: 55,
    totalCaloriesBurned: 58900,
    bio: 'CrossFit Level 2认证教练',
    joinDate: '2023-11-05',
    badges: ['7 日连胜', '21 日铁粉', '百次训练'],
  },
  {
    id: 'user_006',
    nickname: '晨跑者',
    email: 'morningrun@example.com',
    avatar: 'https://i.pravatar.cc/150?img=68',
    level: '进阶',
    totalWorkouts: 112,
    streakDays: 28,
    totalCaloriesBurned: 23400,
    bio: '每天5点晨跑10公里',
    joinDate: '2024-03-15',
    badges: ['7 日连胜', '21 日铁粉'],
  },
  {
    id: 'user_007',
    nickname: '增肌小白',
    email: 'bulking@example.com',
    avatar: 'https://i.pravatar.cc/150?img=15',
    level: '新手',
    totalWorkouts: 45,
    streakDays: 15,
    totalCaloriesBurned: 11200,
    bio: '健身房新人，努力增肌中',
    joinDate: '2024-07-20',
    badges: ['3 日火花', '7 日连胜'],
  },
  {
    id: 'user_008',
    nickname: '铁人三项选手',
    email: 'triathlon@example.com',
    avatar: 'https://i.pravatar.cc/150?img=32',
    level: '大师',
    totalWorkouts: 245,
    streakDays: 89,
    totalCaloriesBurned: 98500,
    bio: '完成过3次Ironman比赛',
    joinDate: '2023-06-10',
    badges: ['7 日连胜', '21 日铁粉', '百次训练', '卡路里杀手', '铁人'],
  },
  {
    id: 'user_009',
    nickname: '普拉提爱好者',
    email: 'pilates@example.com',
    avatar: 'https://i.pravatar.cc/150?img=47',
    level: '进阶',
    totalWorkouts: 98,
    streakDays: 24,
    totalCaloriesBurned: 15600,
    bio: '普拉提让我找到身心平衡',
    joinDate: '2024-04-05',
    badges: ['7 日连胜', '21 日铁粉'],
  },
  {
    id: 'user_010',
    nickname: '游泳健将',
    email: 'swimmer@example.com',
    avatar: 'https://i.pravatar.cc/150?img=60',
    level: '专家',
    totalWorkouts: 134,
    streakDays: 38,
    totalCaloriesBurned: 34500,
    bio: '自由泳、蝶泳样样精通',
    joinDate: '2024-02-28',
    badges: ['7 日连胜', '21 日铁粉', '百次训练'],
  },
];

/**
 * 根据ID获取用户
 * 优先从真实用户中查找，如果找不到则从模拟用户中查找
 */
export const getUserById = (userId) => {
  // 先尝试从模拟用户中查找
  const mockUser = mockUsers.find(user => user.id === userId);
  if (mockUser) {
    return mockUser;
  }

  // 如果找不到，尝试从实际注册用户中查找
  try {
    const users = JSON.parse(localStorage.getItem('fitspark:users') || '[]');
    const realUser = users.find(user => user.id === userId);
    if (realUser) {
      // 返回统一格式的用户对象
      return {
        id: realUser.id,
        nickname: realUser.nickname || realUser.email?.split('@')[0] || '用户',
        email: realUser.email,
        avatar: realUser.avatar || 'https://i.pravatar.cc/150?img=' + (Math.floor(Math.random() * 70) + 1),
        level: '新手',
        totalWorkouts: 0,
        streakDays: 0,
        totalCaloriesBurned: 0,
        bio: '',
        joinDate: realUser.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        badges: []
      };
    }
  } catch (error) {
    console.error('Error fetching user from storage:', error);
  }

  // 如果都找不到，返回 null
  return null;
};

/**
 * 搜索用户（昵称或邮箱）
 */
export const searchUsers = (keyword) => {
  if (!keyword || keyword.trim() === '') {
    return mockUsers;
  }
  const lowerKeyword = keyword.toLowerCase();
  return mockUsers.filter(user =>
    user.nickname.toLowerCase().includes(lowerKeyword) ||
    user.email.toLowerCase().includes(lowerKeyword)
  );
};

/**
 * 获取推荐好友（基于等级、训练次数相似度）
 */
export const getRecommendedFriends = (currentUser, existingFriendIds = []) => {
  if (!currentUser) return [];

  return mockUsers
    .filter(user =>
      user.id !== currentUser.id &&
      !existingFriendIds.includes(user.id)
    )
    .sort((a, b) => {
      // 简单推荐算法：等级相同优先，训练次数接近优先
      const levelScore = a.level === currentUser.level ? 1 : 0;
      const workoutDiff = Math.abs(a.totalWorkouts - currentUser.totalWorkouts);
      return levelScore - workoutDiff * 0.01;
    })
    .slice(0, 5);
};
