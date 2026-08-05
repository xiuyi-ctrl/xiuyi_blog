# Live2D 看板娘模型行为说明

本博客右下角 Live2D 看板娘由 `l2d-widget` 库驱动，共包含 7 个 Cubism 2 模型，支持模型切换、点击互动、摸头、隐藏/唤醒、拖拽。

## 通用行为（所有模型共用）

### 默认行为（自动）
- 入场显示欢迎语（按时间段问候 + 随机欢迎语），随后循环播放 idle 动作
- 每 8 秒循环显示一条提示气泡（duration 4s，打字动画，嘴型同步 `PARAM_MOUTH_OPEN_Y`）
- 空闲时播放 idle 组动作、眨眼、视线上移跟随鼠标
- 身体会随鼠标在页面移动而轻微转动（视口追踪）
- 加载前显示加载动画，入场/退场为 fade 过渡（800ms）

### 点击行为（鼠标点击模型本体）
- 点击命中模型上的 **hit area** 区域时，触发对应区域的 `tap_*` / `flick_head` / `shake` 动作（由库分发 `live2d:tapbody` 事件，按命中区域名称播放）
- hit area 区域：head（头部）、face（脸）、breast（胸）、belly（腹）、leg（腿）
- 点击命中区域时附带随机文字提示（"嘿嘿，干嘛戳我～"等）
- 特殊映射：仅 BYC 模型的 face 区域点击触发 `shake`（摇头），其余模型 face 仍为 `tap_face`
- **无 hit area 的模型**（l_234400412 / l_234500311 / l_154500211 / l_234200211）：任意位置点击均触发 `idle_click` 动作组（随机播放其中 1 个动作），实现见 `onPointerEnd` 兜底逻辑

### 摸头行为（菜单"摸头"按钮）
菜单项 `摸头` 点击逻辑（`VirtualPet.tsx`）：
1. 获取模型所有动作组
2. 优先筛选交互类动作组，正则匹配：`touch|tap|flick|shake|pat|pet|head|face|breast|belly|leg`
3. 若命中则从这些交互组中随机播放一个；否则退化为非 idle 组随机播放
4. 若仍无匹配则从全部动作组随机播放

### 拖拽行为
- 支持指针拖拽移动模型位置（按下、移动、抬起）
- 位移 < 4px 视为点击而非拖拽
- 位置可移动到窗口任意位置（带边界钳制）

### 缩放行为（菜单"缩放"按钮）
- 点击弹出**拖动条滑块**（range），吸附固定档位 0.5 / 0.75 / 1 / 1.25 / 1.5 / 2，实时调节并显示当前倍率
- **canvas 物理尺寸随倍率放大**：模型渲染在 WebGL buffer 内，超出部分会在光栅化阶段被裁剪（CSS transform 无法找回），因此 canvas 尺寸 = 基准尺寸（桌面 300 / 移动 260）× 倍率，`ResizeObserver` + `l2d.resize()` 按新尺寸重建 buffer，模型始终完整显示、无裁剪
- 模型视觉大小随画布同步缩放（方形画布下 fitScale 不变，模型占画布比例恒定）；缩放倍率由画布尺寸承载，`setScale` 只保持各模型基准 scale
- 放大时保持右下锚点，画布向上/左扩展（最大 2.0 = 桌面 600×600 / 移动 520×520）
- 模型切换后缩放倍率保留（`switchTo` 内重新应用 `applyCanvasSize`）
- 拖拽边界、休息状态条、选择面板位置均按实际画布尺寸动态计算
- 不持久化：刷新页面后重置为用户倍率 1（即恢复基准画布尺寸 300/260）
- 滑块面板显示在画布右侧、紧贴功能按钮（垂直居中）；再次点击"缩放"按钮或点击面板外区域关闭

### 快捷切换指定模型（菜单"选择模型"按钮）
- 点击弹出选择面板（显示在画布右侧、紧贴功能按钮，垂直居中），列出全部 7 个模型名称（当前模型高亮）
- 点击某模型直接切换，并触发该模型 `login` 动作（若有）；切换后面板自动关闭
- 点击面板外区域或再次点击"选择模型"可关闭面板

### 隐藏/唤醒
- 菜单"隐藏"：模型入睡，显示休息状态条，写入 `localStorage[pet_hidden]=1`
- 小游戏面板"显示宠物"按钮：唤醒模型，写入 `localStorage[pet_hidden]=0`
- 刷新页面后若 `pet_hidden=1` 则保持隐藏状态

---

## 1. BYC 模型（byc/model.json）

- **文件**：`client/public/live2d/byc/model.json`（BCY.moc）
- **特效配置**：`offset: [0, 0.6]`（垂直上移，腿部完整显示）
- **纹理**：BCY.2048/texture_00.png
- **布局**：image_height 750, image_center_y -0.25

### 默认行为
- idle 动作组包含 4 个随机动作：`idle.mtn`、`laugh.mtn`（×2）、`joke.mtn`
- 定时动作组（冷却时间较长）：morning / afternoon / evening / activity（各 3600s）、friend / mail（各 18000s）
- born 入场动作（60s 冷却）
- 空闲动作冷却 20s

### 点击行为
点击命中不同 hit area 播放对应动作（均无音效）：
| hit area | 动作组 | 动作文件 | 冷却 |
|---|---|---|---|
| face | shake | confused.mtn | 60s |
| breast | tap_breast | happy.mtn | 10s |
| belly | tap_belly | happy.mtn | 10s |
| leg | tap_leg | happy.mtn | 10s |
| head | flick_head | happy.mtn | 20s |
| - | shake | confused.mtn | 60s |

> 注：仅 BYC 的 face 区域点击触发 `shake`（摇头动画），head 区域触发 `flick_head`，其余区域触发对应 `tap_*`；点击带文字提示但无音效。

### 摸头行为
匹配交互正则后命中的动作组：`shake`、`flick_head`、`tap_face`、`tap_breast`、`tap_belly`、`tap_leg`，随机播放其一。

---

## 2. ninifashengri 模型（ninifashengri/model.json）

- **文件**：`client/public/live2d/ninifashengri/model.json`（Lead_00.moc）
- **特效配置**：`scale: 1.2`（放大 20%，其余未动）
- **纹理**：textures/texture_00.png、textures/texture_01.png
- **无 layout、无音效**
- **hit_areas**：已配置，drawable ID 从 moc 提取 —— head→B_FACE_07、face→B_FACE_083、breast→B_BODY_123、belly→B_BODY_153、leg→B_BODY_243

### 默认行为
- idle 动作组仅 1 个动作：`idle.mtn`
- stay 动作组：`stay_01.mtn`（场景待机）
- 交互动作组复用既有动画：`flick_head`/`tap_face`/`shake` → touch_01_1.mtn，`tap_breast`/`tap_belly`/`tap_leg` → touch_99.mtn

### 点击行为
点击命中不同 hit area 播放对应动作（均无音效）：
| hit area | 动作组 | 动作文件 |
|---|---|---|
| head | flick_head | touch_01_1.mtn |
| face | tap_face | touch_01_1.mtn |
| breast | tap_breast | touch_99.mtn |
| belly | tap_belly | touch_99.mtn |
| leg | tap_leg | touch_99.mtn |

> 注：face 区域触发 `tap_face`（非 BYC，无 shake 特殊映射）；点击带文字提示但无音效。

### 摸头行为
匹配交互正则命中的动作组：`flick_head`、`tap_face`、`tap_breast`、`tap_belly`、`tap_leg`、`shake`、`touch_01_1`、`touch_99`，随机播放其一。

---

## 3. Kiro 模型（kiro/model.json）

- **文件**：`client/public/live2d/kiro/model.json`（kiro.moc）
- **特效配置**：无（默认）
- **纹理**：kiro.2048/texture_00.png
- **布局**：image_height 1150, image_center_y 0.52

### 默认行为
- idle 动作组包含 3 个随机动作：`3.mtn`、`4.mtn`、`idle.mtn`（均无音效）
- 定时动作组：morning / afternoon / evening / activity（各 3600s）、friend / mail（各 18000s）——均指向 idle.mtn
- born 入场动作（60s 冷却）
- 空闲动作冷却 20s

### 点击行为
点击命中不同 hit area 播放对应动作（均无音效）：
| hit area | 动作组 | 动作文件 | 冷却 |
|---|---|---|---|
| face | tap_face | 2.mtn | 10s |
| breast | tap_breast | 2.mtn | 10s |
| belly | tap_belly | 1.mtn | 10s |
| leg | tap_leg | 1.mtn | 10s |
| head | flick_head | 1.mtn | 20s |
| - | shake | 5.mtn | 60s |

> 注：head 区域触发 `flick_head`（1.mtn），face/breast 触发 `tap_face`/`tap_breast`（2.mtn），belly/leg 触发 `tap_belly`/`tap_leg`（1.mtn）；点击带文字提示但无音效。

### 摸头行为
匹配交互正则命中的动作组：`shake`、`flick_head`、`tap_face`、`tap_breast`、`tap_belly`、`tap_leg`，随机播放其一。

---

## 新增模型总览（l_234400412 / l_234500311 / l_154500211 / l_234200211）

四个模型来自同一素材包（`D:\BaiduNetdiskDownload\models`），结构与行为完全一致：

| 项目 | 说明 |
|---|---|
| 类型 | Cubism 2（model.moc），本地托管 |
| 纹理 | l_234400412：3 张（texture_00~02）；l_234500211：2 张（texture_00~01）；l_154500211：2 张（texture_00~01）；l_234200211：3 张（texture_00~02） |
| 动作组 | `idle`（1 动作 idle.mtn）、`idle_click`（11 动作 002~012.mtn）、`login`（020.mtn，切换到该模型时触发） |
| 点击 | 无 hit_areas（moc 为 ArtMesh/PARTS 无语义命名），任意位置点击触发 `idle_click` 随机动作 |
| 音效/layout | 无音效、无 layout、无特效配置 |
| 原 JSON 问题 | 含尾随逗号与无效字段（`trigger`/`cv_id`），已清理为合法 JSON |
| 体积 | l_234400412：11.37MB；l_234500311：9.23MB；l_154500211：6.47MB；l_234200211：11.12MB |

---

## 4. l_234400412 模型（l_234400412/model.json）

- **文件**：`client/public/live2d/l_234400412/model.json`（model.moc）
- **特效配置**：无（默认）
- **纹理**：textures/texture_00.png、texture_01.png、texture_02.png
- **无 layout、无音效、无 hit_areas**（moc drawable 为 ArtMesh/PARTS 无语义化命名，无法提取部位区域）
- **原始 model.json 含尾随逗号与无效字段**（`trigger`、`cv_id`），已清理为合法 JSON

### 默认行为
- idle 动作组仅 1 个动作：`idle.mtn`
- idle_click 动作组：11 个动作（002.mtn ~ 012.mtn）
- login 动作组：`020.mtn`（切换到该模型时触发）

### 点击行为
任意位置点击随机播放 `idle_click` 组动作（`onPointerEnd` 兜底，见 VirtualPet.tsx），带文字提示但无音效。

### 摸头行为
交互正则匹配命中的动作组：`idle_click`（含 click 关键字），随机播放其一。

---

## 5. l_234500311 模型（l_234500311/model.json）

- **文件**：`client/public/live2d/l_234500311/model.json`（model.moc）
- **特效配置**：无（默认）
- **纹理**：textures/texture_00.png、texture_01.png
- **无 layout、无音效、无 hit_areas**（moc drawable 为 ArtMesh/PARTS 无语义化命名，无法提取部位区域）
- **原始 model.json 含尾随逗号与无效字段**（`trigger`、`cv_id`），已清理为合法 JSON

### 默认行为
- idle 动作组仅 1 个动作：`idle.mtn`
- idle_click 动作组：11 个动作（002.mtn ~ 012.mtn）
- login 动作组：`020.mtn`（切换到该模型时触发）

### 点击行为
任意位置点击随机播放 `idle_click` 组动作（`onPointerEnd` 兜底，见 VirtualPet.tsx），带文字提示但无音效。

### 摸头行为
交互正则匹配命中的动作组：`idle_click`（含 click 关键字），随机播放其一。

---

## 6. l_154500211 模型（l_154500211/model.json）

- **文件**：`client/public/live2d/l_154500211/model.json`（model.moc）
- **特效配置**：无（默认）
- **纹理**：textures/texture_00.png、texture_01.png
- **无 layout、无音效、无 hit_areas**（moc drawable 为 ArtMesh/PARTS 无语义化命名，无法提取部位区域）
- **内置装饰部件**：`beijing`（背景）、`san`（伞）、`R_denglong`/`L_denglong`（红灯笼）
- **白遮修复**：全部 13 个动作文件（`020.mtn` login、`idle.mtn`、`002.mtn`~`012.mtn` idle_click）原含 `VISIBLE:beijing=1`，登场或点击时显示整块白色背景遮盖；已全部改为 `VISIBLE:beijing=0` 强制隐藏背景，保留伞/灯笼装饰
- **原始 model.json 含尾随逗号与无效字段**（`trigger`、`cv_id`），已清理为合法 JSON

### 默认行为
- idle 动作组仅 1 个动作：`idle.mtn`
- idle_click 动作组：11 个动作（002.mtn ~ 012.mtn）
- login 动作组：`020.mtn`（切换到该模型时触发）

### 点击行为
任意位置点击随机播放 `idle_click` 组动作（`onPointerEnd` 兜底，见 VirtualPet.tsx），带文字提示但无音效。

### 摸头行为
交互正则匹配命中的动作组：`idle_click`（含 click 关键字），随机播放其一。

---

## 7. l_234200211 模型（l_234200211/model.json）

- **文件**：`client/public/live2d/l_234200211/model.json`（model.moc）
- **特效配置**：无（默认）
- **纹理**：textures/texture_00.png、texture_01.png、texture_02.png
- **无 layout、无音效、无 hit_areas**（moc drawable 为 ArtMesh/PARTS 无语义化命名，无法提取部位区域）
- **原始 model.json 含尾随逗号与无效字段**（`trigger`、`cv_id`），已清理为合法 JSON

### 默认行为
- idle 动作组仅 1 个动作：`idle.mtn`
- idle_click 动作组：11 个动作（002.mtn ~ 012.mtn）
- login 动作组：`020.mtn`（切换到该模型时触发）

### 点击行为
任意位置点击随机播放 `idle_click` 组动作（`onPointerEnd` 兜底，见 VirtualPet.tsx），带文字提示但无音效。

### 摸头行为
交互正则匹配命中的动作组：`idle_click`（含 click 关键字），随机播放其一。

---

## 相关代码文件

- `client/src/components/VirtualPet.tsx`：widget 创建、菜单、摸头/切换/隐藏逻辑、拖拽
- `client/src/lib/petMessages.ts`：欢迎语、idle/click/pat 提示文案
- `client/src/lib/petStore.ts`：隐藏状态与唤醒控制器
- `client/src/components/FloatingActions.tsx`：小游戏面板"显示宠物"唤醒入口
