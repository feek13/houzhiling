import { authService } from './services/authService.js';
import { workoutService } from './services/workoutService.js';
import { postService } from './services/postService.js';

const runTest = async () => {
    const log = (msg, type = 'info') => {
        const el = document.getElementById('results');
        const div = document.createElement('div');
        div.className = `log ${type}`;
        div.textContent = msg;
        el.appendChild(div);
        console.log(`[${type.toUpperCase()}] ${msg}`);
    };

    try {
        log('开始用户隔离测试...', 'info');

        // 1. 清理旧数据 (可选，为了测试准确性)
        // localStorage.clear(); // 慎用，会清除所有数据

        const timestamp = Date.now();
        const userAEmail = `userA_${timestamp}@test.com`;
        const userBEmail = `userB_${timestamp}@test.com`;

        // 2. 注册并登录 User A
        log(`正在注册 User A: ${userAEmail}...`, 'info');
        const userA = await authService.register({
            email: userAEmail,
            password: 'password123',
            nickname: 'User A'
        });
        log('User A 注册成功', 'success');

        // 3. User A 创建私有课程 (草稿) 和 公开课程
        log('User A 创建私有课程 (草稿)...', 'info');
        const privateCourse = workoutService.createWorkout({
            title: 'User A Private Course',
            description: 'This is a private draft',
            muscleKey: 'chest',
            muscle: '胸部',
            levelKey: 'easy',
            level: '入门',
            equipmentKey: 'bodyweight',
            equipment: '自重',
            durationKey: 'short',
            duration: '15分钟',
            goalFocus: 'keep_fit',
            steps: ['Step 1', 'Step 2'],
            status: 'draft' // 草稿状态
        });
        log(`私有课程创建成功: ${privateCourse.id}`, 'success');

        log('User A 创建公开课程...', 'info');
        const publicCourse = workoutService.createWorkout({
            title: 'User A Public Course',
            description: 'This is a public course',
            muscleKey: 'legs',
            muscle: '下肢',
            levelKey: 'medium',
            level: '中级',
            equipmentKey: 'barbell',
            equipment: '杠铃',
            durationKey: 'medium',
            duration: '30分钟',
            goalFocus: 'muscle_gain',
            steps: ['Step 1', 'Step 2'],
            status: 'published' // 发布状态
        });
        log(`公开课程创建成功: ${publicCourse.id}`, 'success');

        // 4. 登出 User A
        log('User A 登出...', 'info');
        authService.logout();

        // 5. 注册并登录 User B
        log(`正在注册 User B: ${userBEmail}...`, 'info');
        const userB = await authService.register({
            email: userBEmail,
            password: 'password123',
            nickname: 'User B'
        });
        log('User B 注册成功', 'success');

        // 6. 验证 User B 的可见性
        log('验证 User B 是否能看到 User A 的课程...', 'info');
        const allWorkouts = workoutService.getAllWorkouts();

        const canSeePrivate = allWorkouts.find(w => w.id === privateCourse.id);
        const canSeePublic = allWorkouts.find(w => w.id === publicCourse.id);

        if (canSeePrivate) {
            log('❌ 失败: User B 能看到 User A 的私有草稿课程!', 'error');
        } else {
            log('✅ 成功: User B 无法看到 User A 的私有草稿课程', 'success');
        }

        if (canSeePublic) {
            log('✅ 成功: User B 能看到 User A 的公开课程', 'success');
        } else {
            log('❌ 失败: User B 无法看到 User A 的公开课程!', 'error');
        }

        // 7. 验证修改权限
        log('验证 User B 是否能修改 User A 的公开课程...', 'info');
        try {
            workoutService.updateWorkout(publicCourse.id, { title: 'Hacked by B' });
            log('❌ 失败: User B 成功修改了 User A 的课程!', 'error');
        } catch (e) {
            log(`✅ 成功: User B 修改失败 (符合预期): ${e.message}`, 'success');
        }

        log('测试完成!', 'info');

    } catch (error) {
        log(`测试过程发生错误: ${error.message}`, 'error');
        console.error(error);
    }
};

// 启动测试
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTest);
} else {
    runTest();
}
