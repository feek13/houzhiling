/**
 * Mock Posts数据 - 社区帖子示例数据
 *
 * 用于初始化和演示社区Feed流功能
 */

import { PostModel, PostType } from './postModel.js';

/**
 * Mock用户数据
 */
export const mockUsers = {
  'user_001': {
    id: 'user_001',
    nickname: '健身达人小李',
    avatar: 'https://i.pravatar.cc/150?img=11',
    bio: '健身教练 | 5年经验 | 帮你科学增肌',
    level: '专家',
    verified: true
  },
  'user_002': {
    id: 'user_002',
    nickname: '瑜伽教练Anna',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: '瑜伽 | 普拉提 | 身心合一',
    level: '专家',
    verified: true
  },
  'user_003': {
    id: 'user_003',
    nickname: '跑步狂人',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: '马拉松PB 3:15 | 每天10公里',
    level: '高级',
    verified: false
  },
  'user_004': {
    id: 'user_004',
    nickname: '减脂小白',
    avatar: 'https://i.pravatar.cc/150?img=8',
    bio: '从90kg到70kg的逆袭之路',
    level: '入门',
    verified: false
  },
  'user_005': {
    id: 'user_005',
    nickname: '营养师Linda',
    avatar: 'https://i.pravatar.cc/150?img=9',
    bio: '注册营养师 | 科学饮食 | 健康生活',
    level: '专家',
    verified: true
  }
};

/**
 * Mock帖子数据
 */
export const mockPosts = [
  // 原创帖子 - 训练打卡
  PostModel.create({
    id: 'post_001',
    type: PostType.ORIGINAL,
    userId: 'user_001',
    content: '今天完成了5x5深蹲训练，突破了100kg大关！💪 坚持就是胜利，兄弟们冲啊！ #力量训练 #深蹲',
    tags: ['#力量训练', '#深蹲'],
    workoutRef: {
      id: 'workout_123',
      type: '力量训练',
      duration: 60,
      calories: 320
    },
    stats: {
      likes: 89,
      comments: 12,
      reposts: 5,
      views: 234,
      bookmarks: 8
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),  // 2小时前
    isPinned: true
  }),

  // 原创帖子 - 饮食分享
  PostModel.create({
    id: 'post_002',
    type: PostType.ORIGINAL,
    userId: 'user_005',
    content: '增肌期的早餐分享🍳：燕麦50g + 鸡蛋3个 + 香蕉1根 + 牛奶250ml\n总计：蛋白质35g，碳水60g，脂肪15g，约500卡\n#健身餐 #增肌饮食',
    tags: ['#健身餐', '#增肌饮食'],
    media: [],
    stats: {
      likes: 156,
      comments: 28,
      reposts: 15,
      views: 542,
      bookmarks: 42
    },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),  // 5小时前
  }),

  // 原创帖子 - 跑步记录
  PostModel.create({
    id: 'post_003',
    type: PostType.ORIGINAL,
    userId: 'user_003',
    content: '早上晨跑10公里完成！配速5分15秒，感觉超级棒！🏃\n今天天气真好，跑步的最佳时机 #晨跑 #跑步',
    tags: ['#晨跑', '#跑步'],
    workoutRef: {
      id: 'workout_124',
      type: '跑步',
      duration: 52,
      calories: 580
    },
    stats: {
      likes: 67,
      comments: 8,
      reposts: 2,
      views: 189,
      bookmarks: 5
    },
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),  // 8小时前
  }),

  // 引用转发 - 带评论的转发
  PostModel.create({
    id: 'post_004',
    type: PostType.QUOTE,
    userId: 'user_004',
    content: '太励志了！我也要开始练深蹲，请问新手应该从多少重量开始？',
    originalPostId: 'post_001',
    tags: [],
    stats: {
      likes: 23,
      comments: 6,
      reposts: 0,
      views: 95,
      bookmarks: 2
    },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),  // 3小时前
  }),

  // 原创帖子 - 减脂心得
  PostModel.create({
    id: 'post_005',
    type: PostType.ORIGINAL,
    userId: 'user_004',
    content: '减脂第30天，体重从90kg降到85kg！分享一下我的经验：\n1. 控制热量缺口500卡\n2. 每天有氧30分钟\n3. 高蛋白饮食\n4. 充足睡眠\n坚持就是胜利！💪 #减脂 #减肥打卡',
    tags: ['#减脂', '#减肥打卡'],
    stats: {
      likes: 234,
      comments: 45,
      reposts: 28,
      views: 1023,
      bookmarks: 67
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),  // 1天前
    isHighlighted: true
  }),

  // 原创帖子 - 瑜伽分享
  PostModel.create({
    id: 'post_006',
    type: PostType.ORIGINAL,
    userId: 'user_002',
    content: '瑜伽新手必看👇\n最适合初学者的5个体式：\n1⃣ 山式 - 打好基础\n2⃣ 下犬式 - 拉伸全身\n3⃣ 战士一式 - 增强力量\n4⃣ 树式 - 练习平衡\n5⃣ 婴儿式 - 放松休息\n每个体式保持5个呼吸 #瑜伽 #新手教程',
    tags: ['#瑜伽', '#新手教程'],
    stats: {
      likes: 178,
      comments: 32,
      reposts: 18,
      views: 678,
      bookmarks: 54
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),  // 2天前
  }),

  // 直接转发
  PostModel.create({
    id: 'post_007',
    type: PostType.REPOST,
    userId: 'user_003',
    content: '',
    originalPostId: 'post_002',
    tags: [],
    stats: {
      likes: 12,
      comments: 2,
      reposts: 0,
      views: 45,
      bookmarks: 1
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),  // 4小时前
  }),

  // 原创帖子 - 装备推荐
  PostModel.create({
    id: 'post_008',
    type: PostType.ORIGINAL,
    userId: 'user_001',
    content: '新手健身装备推荐清单📋：\n✅ 护腕 - 保护手腕（深蹲卧推必备）\n✅ 腰带 - 支撑腰部（大重量时用）\n✅ 运动鞋 - 稳定性要好\n✅ 运动服 - 吸汗透气\n✅ 水壶 - 及时补水\n\n不要一开始就买太多，循序渐进！ #健身装备 #新手指南',
    tags: ['#健身装备', '#新手指南'],
    stats: {
      likes: 98,
      comments: 15,
      reposts: 8,
      views: 321,
      bookmarks: 23
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),  // 3天前
  }),

  // 原创帖子 - 问答求助
  PostModel.create({
    id: 'post_009',
    type: PostType.ORIGINAL,
    userId: 'user_004',
    content: '请教一下各位大佬，我现在85kg，想减到75kg，大概需要多久？每天500卡热量缺口够吗？会不会掉肌肉？🤔 #减脂 #求助',
    tags: ['#减脂', '#求助'],
    stats: {
      likes: 34,
      comments: 18,
      reposts: 1,
      views: 167,
      bookmarks: 4
    },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),  // 6小时前
  }),

  // 原创帖子 - 动力分享
  PostModel.create({
    id: 'post_010',
    type: PostType.ORIGINAL,
    userId: 'user_003',
    content: '跑步一年整，从5公里都跑不下来到现在全马完赛🏃\n\n最大的感悟：不要和别人比，只和昨天的自己比。\n\n每天进步一点点，一年后你会感谢现在拼命的自己！\n\n#跑步 #坚持 #马拉松',
    tags: ['#跑步', '#坚持', '#马拉松'],
    stats: {
      likes: 567,
      comments: 89,
      reposts: 45,
      views: 2134,
      bookmarks: 123
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),  // 5天前
    isHighlighted: true,
    isPinned: true
  }),
];

/**
 * 获取帖子的作者信息
 * @param {string} postId - 帖子ID
 * @returns {Object|null} 用户信息
 */
export const getPostAuthor = (postId) => {
  const post = mockPosts.find(p => p.id === postId);
  if (!post) return null;
  return mockUsers[post.userId] || null;
};

/**
 * 获取原帖（用于显示转发）
 * @param {string} postId - 帖子ID
 * @returns {Object|null} 原帖信息
 */
export const getOriginalPost = (postId) => {
  const post = mockPosts.find(p => p.id === postId);
  if (!post || !post.originalPostId) return null;
  return mockPosts.find(p => p.id === post.originalPostId) || null;
};

/**
 * 获取热门话题
 * @param {number} limit - 返回数量
 * @returns {Array} 话题数组 [{ tag, count, posts }]
 */
export const getTrendingTags = (limit = 10) => {
  const tagMap = new Map();

  mockPosts.forEach(post => {
    post.tags.forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, {
          tag,
          count: 0,
          posts: [],
          totalEngagement: 0  // 互动总数
        });
      }
      const tagData = tagMap.get(tag);
      tagData.count++;
      tagData.posts.push(post.id);
      tagData.totalEngagement += (post.stats.likes + post.stats.comments + post.stats.reposts);
    });
  });

  // 按互动总数排序
  return Array.from(tagMap.values())
    .sort((a, b) => b.totalEngagement - a.totalEngagement)
    .slice(0, limit);
};
