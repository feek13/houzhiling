/**
 * 论坛主题模拟数据
 * 包含多个分类的讨论主题
 */

export const CATEGORIES = [
  { id: 'training', name: '训练技巧', icon: '💪' },
  { id: 'nutrition', name: '营养饮食', icon: '🥗' },
  { id: 'equipment', name: '器械装备', icon: '🏋️' },
  { id: 'recovery', name: '恢复休息', icon: '😴' },
  { id: 'motivation', name: '动力分享', icon: '🔥' },
  { id: 'qa', name: '问答求助', icon: '❓' },
];

export const mockTopics = [
  {
    id: 'topic_001',
    category: 'training',
    title: '深蹲时膝盖内扣怎么办？',
    content: '最近深蹲时发现膝盖有点内扣，想问问大家有什么好的纠正方法？是因为臀中肌无力吗？',
    author: {
      id: 'user_001',
      nickname: '健身达人小李',
      avatar: 'https://i.pravatar.cc/150?img=11',
      level: '专家',
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    views: 156,
    likes: 24,
    replies: [
      {
        id: 'reply_001_001',
        author: {
          id: 'user_002',
          nickname: '瑜伽教练Anna',
          avatar: 'https://i.pravatar.cc/150?img=5',
          level: '专家',
        },
        content: '确实是臀中肌和外展肌群力量不足。建议多做蚌式开合、侧卧抬腿等激活训练。深蹲前先用弹力带做热身，套在膝盖上方做几组深蹲激活臀部。',
        createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 18,
      },
      {
        id: 'reply_001_002',
        author: {
          id: 'user_003',
          nickname: '力量举选手王强',
          avatar: 'https://i.pravatar.cc/150?img=12',
          level: '专家',
        },
        content: '除了臀部激活，还要检查踝关节灵活性。踝关节背屈不足也会导致膝盖内扣。试试靠墙深蹲和脚踝拉伸。',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 12,
      },
    ],
    isPinned: false,
    isHighlighted: false,
  },
  {
    id: 'topic_002',
    category: 'nutrition',
    title: '增肌期碳水摄入量怎么安排？',
    content: '身高180cm，体重75kg，目标增肌。现在每天蛋白质180g，碳水应该吃多少？训练日和休息日要区别对待吗？',
    author: {
      id: 'user_004',
      nickname: '健身小白张三',
      avatar: 'https://i.pravatar.cc/150?img=8',
      level: '入门',
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    views: 289,
    likes: 42,
    replies: [
      {
        id: 'reply_002_001',
        author: {
          id: 'user_005',
          nickname: '营养师Linda',
          avatar: 'https://i.pravatar.cc/150?img=9',
          level: '专家',
        },
        content: '增肌期建议碳水6-8g/kg体重，你可以从450g开始尝试。训练日可以适当增加到500g，休息日降到400g。重点是围绕训练时段分配碳水。',
        createdAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 28,
      },
    ],
    isPinned: false,
    isHighlighted: false,
  },
  {
    id: 'topic_003',
    category: 'motivation',
    title: '坚持健身100天的感悟',
    content: '从零基础到现在坚持了100天，体重从90kg降到82kg，体脂从28%降到20%。分享一下心得：1. 不要追求完美，70分的坚持胜过100分的放弃；2. 饮食比训练更重要；3. 找到适合自己的节奏。',
    author: {
      id: 'user_006',
      nickname: '逆袭的胖子',
      avatar: 'https://i.pravatar.cc/150?img=15',
      level: '中级',
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    views: 512,
    likes: 89,
    replies: [
      {
        id: 'reply_003_001',
        author: {
          id: 'user_001',
          nickname: '健身达人小李',
          avatar: 'https://i.pravatar.cc/150?img=11',
          level: '专家',
        },
        content: '太励志了！100天减8kg非常健康的速度。70分坚持这句话说得太好了，健身是一辈子的事情。',
        createdAt: new Date(Date.now() - 0.8 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 15,
      },
      {
        id: 'reply_003_002',
        author: {
          id: 'user_007',
          nickname: '健身博主Mike',
          avatar: 'https://i.pravatar.cc/150?img=13',
          level: '专家',
        },
        content: '可以分享一下你的饮食计划吗？很好奇你是怎么控制饮食的。',
        createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 8,
      },
    ],
    isPinned: true,
    isHighlighted: true,
  },
  {
    id: 'topic_004',
    category: 'equipment',
    title: '家庭健身必备器械推荐',
    content: '预算3000元，想在家里搭建一个小健身房。大家有什么推荐的器械吗？我主要做力量训练。',
    author: {
      id: 'user_008',
      nickname: '居家健身者',
      avatar: 'https://i.pravatar.cc/150?img=14',
      level: '入门',
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    views: 234,
    likes: 31,
    replies: [
      {
        id: 'reply_004_001',
        author: {
          id: 'user_003',
          nickname: '力量举选手王强',
          avatar: 'https://i.pravatar.cc/150?img=12',
          level: '专家',
        },
        content: '推荐配置：可调节哑铃（1000元）+ 可调节卧推凳（800元）+ 引体向上架（600元）+ 阻力带套装（200元）+ 瑜伽垫（200元）。这套组合基本覆盖全身训练。',
        createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 22,
      },
    ],
    isPinned: false,
    isHighlighted: false,
  },
  {
    id: 'topic_005',
    category: 'recovery',
    title: '肌肉酸痛持续4天了，正常吗？',
    content: '上周做了腿部训练，现在都第4天了还是很酸痛，走路都困难。这正常吗？需要看医生吗？',
    author: {
      id: 'user_009',
      nickname: '新手小白',
      avatar: 'https://i.pravatar.cc/150?img=16',
      level: '入门',
    },
    createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    views: 178,
    likes: 12,
    replies: [
      {
        id: 'reply_005_001',
        author: {
          id: 'user_010',
          nickname: '康复师Tom',
          avatar: 'https://i.pravatar.cc/150?img=17',
          level: '专家',
        },
        content: '新手第一次练腿出现延迟性肌肉酸痛（DOMS）持续3-5天是正常的。建议：1. 轻度有氧促进血液循环；2. 泡沫轴放松；3. 补充蛋白质和水分。如果伴随剧烈疼痛或肿胀，建议就医。',
        createdAt: new Date(Date.now() - 0.3 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 9,
      },
    ],
    isPinned: false,
    isHighlighted: false,
  },
  {
    id: 'topic_006',
    category: 'qa',
    title: '早上空腹有氧真的能更好地减脂吗？',
    content: '网上有人说早上空腹做有氧能更好地燃烧脂肪，但也有人说会掉肌肉。到底哪种说法对？',
    author: {
      id: 'user_004',
      nickname: '健身小白张三',
      avatar: 'https://i.pravatar.cc/150?img=8',
      level: '入门',
    },
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    views: 345,
    likes: 38,
    replies: [
      {
        id: 'reply_006_001',
        author: {
          id: 'user_005',
          nickname: '营养师Linda',
          avatar: 'https://i.pravatar.cc/150?img=9',
          level: '专家',
        },
        content: '空腹有氧确实会动用更多脂肪供能，但总体减脂效果和进食后有氧差别不大。关键还是看全天总热量摄入。至于掉肌肉，只要保证每天蛋白质摄入充足（1.6-2.2g/kg），影响很小。',
        createdAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 25,
      },
      {
        id: 'reply_006_002',
        author: {
          id: 'user_007',
          nickname: '健身博主Mike',
          avatar: 'https://i.pravatar.cc/150?img=13',
          level: '专家',
        },
        content: '补充一点：如果你容易低血糖或者训练强度大，建议还是吃点东西再练。香蕉或者一片全麦面包就行。',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 16,
      },
    ],
    isPinned: false,
    isHighlighted: false,
  },
];

/**
 * 根据ID获取主题
 */
export const getTopicById = (id) => {
  return mockTopics.find(topic => topic.id === id);
};

/**
 * 根据分类筛选主题
 */
export const getTopicsByCategory = (categoryId) => {
  if (categoryId === 'all') return mockTopics;
  return mockTopics.filter(topic => topic.category === categoryId);
};

/**
 * 搜索主题
 */
export const searchTopics = (keyword) => {
  if (!keyword) return mockTopics;
  const lowerKeyword = keyword.toLowerCase();
  return mockTopics.filter(topic =>
    topic.title.toLowerCase().includes(lowerKeyword) ||
    topic.content.toLowerCase().includes(lowerKeyword) ||
    topic.author.nickname.toLowerCase().includes(lowerKeyword)
  );
};

/**
 * 获取热门主题（按浏览量排序）
 */
export const getHotTopics = (limit = 5) => {
  return [...mockTopics]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
};

/**
 * 获取最新主题
 */
export const getLatestTopics = (limit = 10) => {
  return [...mockTopics]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};
