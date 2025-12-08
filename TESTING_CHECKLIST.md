# 播放控制功能测试清单

## Phase 4 测试场景

### 1. 基础功能测试

#### 1.1 搜索并播放
- [ ] 搜索歌曲返回结果
- [ ] 点击搜索结果的播放按钮
  - [ ] 队列初始化成功
  - [ ] 歌曲开始播放
  - [ ] 播放器展开（isExpanded = true）
  - [ ] 歌曲信息显示正确

#### 1.2 Next/Prev 按钮
- [ ] 在 'normal' 模式下
  - [ ] 点击 Next 播放下一首
  - [ ] 点击 Prev 播放上一首
  - [ ] 到列表末尾点 Next 时停止播放
  - [ ] 在第一首点 Prev 时播放最后一首

#### 1.3 Play/Pause 按钮
- [ ] 点击暂停，音频暂停
- [ ] 点击播放，音频继续
- [ ] 按钮图标正确反馈（play_arrow ↔ pause）

---

### 2. PlayMode 转换测试

#### 2.1 PlayMode 循环路径
按 Shuffle 或 Repeat 按钮循环，验证顺序：
```
normal → repeat-all → repeat-one → shuffle → shuffle-one → normal
```

- [ ] 从 normal 切换到 repeat-all（按任意按钮）
- [ ] 从 repeat-all 切换到 repeat-one（按任意按钮）
- [ ] 从 repeat-one 切换到 shuffle（按任意按钮）
- [ ] 从 shuffle 切换到 shuffle-one（按任意按钮）
- [ ] 从 shuffle-one 切换到 normal（按任意按钮）

#### 2.2 UI 按钮状态反馈
**Shuffle 按钮**：
- [ ] normal, repeat-all, repeat-one 时：灰色（text-slate-500）
- [ ] shuffle, shuffle-one 时：primary蓝色（text-primary）

**Repeat 按钮**：
- [ ] normal, shuffle 时：灰色（text-slate-500）
- [ ] repeat-all, repeat-one, shuffle-one 时：primary蓝色（text-primary）
- [ ] repeat-one 时：显示"1"标记
- [ ] repeat-all 时：无"1"标记

#### 2.3 Hover 效果
- [ ] 按钮 hover 时显示 title（PlayMode 名称）
  - 例：title="Play Mode: repeat-one"

---

### 3. 各 PlayMode 行为测试

#### 3.1 normal 模式
- [ ] 队列顺序播放
- [ ] 列表末尾自动停止（不循环）
- [ ] Next 到末尾时停止，UI 显示暂停状态

#### 3.2 repeat-all 模式
- [ ] 队列顺序播放
- [ ] 列表末尾自动跳回开始继续播放
- [ ] 可无限循环

#### 3.3 repeat-one 模式
- [ ] 当前歌曲重复播放
- [ ] Next/Prev 无效（始终播放同一首）
- [ ] 歌曲结束时重新开始当前歌曲

#### 3.4 shuffle 模式
- [ ] 进入 shuffle 时，队列被打乱（shuffledQueue）
- [ ] 按 Next 时从打乱的队列中顺序播放
- [ ] 列表末尾自动循环回开始
- [ ] Prev 也从打乱的队列中倒序播放

#### 3.5 shuffle-one 模式
- [ ] 进入 shuffle-one 时，队列被打乱
- [ ] 当前歌曲重复播放（不跳到打乱队列中的下一首）
- [ ] Next/Prev 无效

---

### 4. 边界情况测试

#### 4.1 单首歌曲
- [ ] 只有一首歌时，Next 和 Prev 都指向该歌曲
- [ ] 歌曲结束后的行为正确

#### 4.2 空队列
- [ ] 队列为空时，Next/Prev/Play 禁用
- [ ] 无错误消息出现

#### 4.3 中途改变 PlayMode
- [ ] 播放中途改变 PlayMode，currentTrack 保持不变
- [ ] 当前播放位置（进度）保持不变

#### 4.4 中途改变队列
- [ ] 选择新的歌曲时，旧队列被替换
- [ ] currentTrack 更新为新歌曲
- [ ] queueIndex 重置为新队列的位置

---

### 5. 音频事件测试

#### 5.1 onEnded 事件
- [ ] 歌曲自然播放结束时触发
- [ ] 根据 playMode 执行相应逻辑
- [ ] 不产生多次触发

#### 5.2 进度条拖动
- [ ] 拖动进度条不会被 timeupdate 事件打断
- [ ] 拖动结束后继续自动更新时间

#### 5.3 收藏列表播放
- [ ] 从收藏列表点击播放
- [ ] 队列初始化为收藏列表
- [ ] 可正常使用 Next/Prev 在收藏列表中导航
- [ ] 关闭收藏抽屉

---

### 6. UI/UX 测试

#### 6.1 按钮反馈
- [ ] 所有按钮有 aria-label
- [ ] 按钮禁用状态显示正确（loading 或无 URL）
- [ ] 按钮点击响应迅速

#### 6.2 信息显示
- [ ] 当前播放歌曲名和艺术家显示正确
- [ ] 进度条时间显示正确格式（mm:ss）
- [ ] 总时长显示正确

#### 6.3 响应式设计
- [ ] 桌面端按钮布局正确
- [ ] 手机端触摸操作正确（onTouchStart/End）

---

### 7. 性能测试

#### 7.1 队列操作
- [ ] 大队列（100+ 歌曲）Next/Prev 不卡顿
- [ ] Shuffle 打乱算法高效

#### 7.2 内存泄漏
- [ ] 重复切换 PlayMode 不导致内存溢出
- [ ] 多次更换队列不泄漏

---

## 测试方法

### 自动化测试（可选）
```typescript
// store 逻辑测试示例
test('togglePlayMode cycles correctly', () => {
  const store = usePlayerStore.getState()
  
  expect(store.playMode).toBe('normal')
  store.togglePlayMode()
  expect(store.playMode).toBe('repeat-all')
  // ... 继续验证循环
})

test('handleTrackEnd respects playMode', () => {
  const store = usePlayerStore.getState()
  store.queue = [track1, track2]
  store.queueIndex = 1
  store.playMode = 'normal'
  
  store.handleTrackEnd()
  expect(store.isPlaying).toBe(false) // 到列表末尾停止
  
  store.playMode = 'repeat-all'
  store.handleTrackEnd()
  expect(store.currentTrack).toBe(track1) // 循环回开始
})
```

### 手动测试（必需）
在浏览器中实际操作，验证以上所有场景。

---

## 测试完成标准

✅ **全部通过** 当：
- [ ] 所有基础功能正常
- [ ] 所有 PlayMode 行为正确
- [ ] 所有边界情况处理得当
- [ ] 所有 UI 反馈清晰
- [ ] 无控制台错误或警告

---

## 已知问题/待办

- [ ] 网络延迟下的队列切换稳定性
- [ ] 更复杂的播放列表管理（如收藏内搜索）
- [ ] 播放历史记录
- [ ] 队列持久化
