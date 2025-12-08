# 播放控制功能实现计划

## 目标
实现完整的播放队列系统，包含：
- ✅ Next/Previous 按钮（队列导航）
- ✅ Shuffle 和 Repeat 整合为一个"播放模式系统"
- ✅ 歌曲结束自动处理

---

## 架构设计

### 1. 播放模式系统（整合 Shuffle + Repeat）

**数据结构**：
```typescript
type PlayMode = 
  | 'normal'        // 按顺序播放，列表结束停止
  | 'repeat-all'    // 按顺序播放，列表循环
  | 'repeat-one'    // 重复当前歌曲
  | 'shuffle'       // 随机播放，列表循环
  | 'shuffle-one'   // 随机播放，重复当前歌曲
```

**状态**：
- 移除: `isShuffle`, `repeatMode`
- 新增: `playMode: PlayMode`
- 新增: `shuffledQueue?: (Track | Favorite)[]` 缓存打乱后的队列

### 2. 队列管理模块

**职责**：
- 初始化队列（从搜索结果、收藏列表、单首歌曲）
- 队列导航（下一首/上一首）
- 队列打乱和恢复
- 处理播放模式下的行为

**核心方法**：
```typescript
// 队列初始化 - 设置播放上下文
setQueue: (queue: Track[], startIndex: number) => void

// 队列导航
nextTrack: () => void
prevTrack: () => void

// 播放模式切换
togglePlayMode: () => void

// 播放结束处理
handleTrackEnd: () => void

// 队列工具
getQueueIndex: (track: Track | Favorite) => number
```

### 3. 播放流程

```
用户搜索 → 搜索结果显示
    ↓
点击播放 → setQueue(results, clickedIndex)
    ↓
当前队列设置 → currentTrack = queue[queueIndex]
    ↓
音频播放中 → 监听 onEnded 事件
    ↓
歌曲结束 → handleTrackEnd() 
    ↓
根据 playMode 决策：
  - normal: 播放下一首，或列表末尾停止
  - repeat-all: 播放下一首，回到开始循环
  - repeat-one: 重复当前歌曲
  - shuffle: 从打乱队列中随机选择
  - shuffle-one: 重复当前歌曲
```

---

## 实现步骤

### Phase 1: 状态系统重构
**文件**: `src/store/usePlayerStore.ts`

1. 修改 PlayState 接口
   - 移除 `isShuffle`, `repeatMode`
   - 新增 `playMode: PlayMode`
   - 新增 `queueIndex: number` 追踪队列位置
   - 新增 `shuffledQueue?: (Track | Favorite)[]`
   - 新增 `displayQueue?: (Track | Favorite)[]` 用于UI展示

2. 实现队列管理方法
   ```typescript
   setQueue(queue, startIndex)       // 初始化队列
   nextTrack()                        // 队列导航+模式处理
   prevTrack()                        // 队列导航
   togglePlayMode()                   // 三态循环 + 打乱队列
   handleTrackEnd()                   // 歌曲结束逻辑
   ```

### Phase 2: UI 适配
**文件**: `src/features/player/PlayerOverlay.tsx`

1. 更新按钮逻辑
   - Shuffle 按钮 → 集成到 togglePlayMode()
   - Repeat 按钮 → 集成到 togglePlayMode()
   - 统一使用 `playMode` 状态驱动UI

2. 更新按钮显示逻辑
   ```typescript
   isShuffle = ['shuffle', 'shuffle-one'].includes(playMode)
   repeatMode = playMode.includes('repeat') ? 
     (playMode === 'repeat-one' ? 'one' : 'all') : 'off'
   ```

3. 监听音频事件
   ```typescript
   <audio onEnded={() => usePlayerStore.getState().handleTrackEnd()} />
   ```

### Phase 3: 集合点处理
**文件**: `src/features/search/SearchPage.tsx`

1. 搜索结果点击播放
   ```typescript
   onClick={() => {
     usePlayerStore.getState().setQueue(results, index)
   }}
   ```

2. 收藏列表点击播放
   ```typescript
   // FavoritesDrawer.tsx
   onClick={() => {
     usePlayerStore.getState().setQueue(favorites, index)
   }}
   ```

### Phase 4: 测试和优化
- 测试各个 PlayMode 场景
- 验证队列边界情况
- 性能优化（shuffle 缓存）

---

## 最佳实践应用

| 实践 | 应用方式 |
|------|--------|
| **单一职责** | 队列管理 ≠ 播放状态，分离到 store 中 |
| **可测试性** | 纯函数实现队列逻辑，易于单测 |
| **易维护性** | 枚举类型 PlayMode，避免字符串比对错误 |
| **状态设计** | 最小化状态（playMode 一个变量替代两个） |
| **事件驱动** | 音频 onEnded 触发 handleTrackEnd |
| **解耦** | 队列逻辑独立于UI，UI 仅消费状态 |

---

## 关键算法

### Shuffle 实现
```typescript
// Fisher-Yates 洗牌算法
function shuffleQueue(queue) {
  const shuffled = [...queue]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 保存原始队列便于恢复
originalQueue = queue
shuffledQueue = shuffleQueue(queue)
```

### Next/Prev 实现
```typescript
nextTrack: () => {
  const currentQueue = isShuffle ? shuffledQueue : queue
  const nextIndex = (queueIndex + 1) % currentQueue.length
  playTrack(currentQueue[nextIndex])
}

prevTrack: () => {
  const currentQueue = isShuffle ? shuffledQueue : queue
  const prevIndex = (queueIndex - 1 + currentQueue.length) % currentQueue.length
  playTrack(currentQueue[prevIndex])
}
```

---

## 状态转移图

```
initial: playMode = 'normal'

togglePlayMode() 循环：
  normal → repeat-all → repeat-one → shuffle → shuffle-one → normal

当前播放队列选择：
  - shuffle/shuffle-one: 使用 shuffledQueue
  - 其他: 使用 originalQueue

歌曲结束 (handleTrackEnd)：
  - normal: nextTrack() → 到列表末尾时停止
  - repeat-all: nextTrack() → 循环
  - repeat-one: playTrack(currentTrack)
  - shuffle: nextTrack() 从 shuffledQueue
  - shuffle-one: playTrack(currentTrack)
```

---

## 边界情况处理

| 场景 | 处理方案 |
|------|--------|
| 队列为空 | 禁用 next/prev/play |
| 只有一首歌 | next 和 prev 指向同一首 |
| 列表末尾点 next | 根据 playMode：normal(停止) / repeat-all(回到开始) |
| Shuffle 时改变播放模式 | 重新计算 shuffledQueue |
| 播放过程中更新队列 | 重置 queueIndex，保持 currentTrack |

---

## 代码文件修改清单

```
src/store/usePlayerStore.ts
├── 修改: PlayerState 接口
├── 新增: PlayMode 类型
├── 新增: 队列管理方法
└── 修改: 初始化状态

src/features/player/PlayerOverlay.tsx
├── 修改: 按钮点击处理
├── 修改: 按钮状态显示逻辑
└── 新增: onEnded 事件监听

src/features/search/SearchPage.tsx
├── 修改: 搜索结果播放逻辑
└── 新增: setQueue 调用

src/features/favorites/FavoritesDrawer.tsx
├── 修改: 收藏列表播放逻辑
└── 新增: setQueue 调用
```

---

## 实现顺序

1. ✅ Phase 1: 完成 store 重构（状态 + 算法）
2. ✅ Phase 2: 更新 PlayerOverlay（UI 适配）
3. ✅ Phase 3: 更新 SearchPage / FavoritesDrawer
4. ✅ Phase 4: 测试和调试
