# AI 全能识字助手 (AI Omnipotent Literacy Assistant)

这是一个基于 AI (Google Gemini) 的全能儿童识字与听写助手。专为学龄前及低年级儿童设计，通过趣味互动、AI 讲解、语音识别等技术，让孩子快乐地学习汉字。

## ✨ 核心功能

### 🎴 识字卡片模式 (Literacy Cards)
- **田字格展示**：标准的田字格汉字展示，帮助孩子掌握结构。
- **笔顺动画**：使用 `Hanzi Writer` 展示汉字笔画顺序，支持“写一写”描红练习。
- **AI 趣味讲解**：
  - **智能解释**：AI 扮演语文老师，用适合 5 岁孩子的语言解释字义和组词。
  - **易混字辨析**：AI 自动找出形近字或音近字，教孩子如何区分。
  - **创意绘本**：利用当前学习的生字，AI 即时生成有趣的短篇童话故事。
  - **角色扮演聊天**：孩子可以和“汉字”对话，AI 会扮演该汉字与孩子互动。
- **拍照加字**：拍书本或卡片，AI 自动识别其中的汉字并加入生字本。
- **真人/AI 发音**：支持多种语音引擎（Siri、Google、Ting-Ting 等）朗读发音。

### 📝 听写练习模式 (Dictation Practice)
- **自动报词**：自动朗读词语，支持循环播放（读 3 遍）。
- **语音控制**：无需动手，喊出“下一个”、“重读”、“看一眼”即可控制流程（需浏览器支持）。
- **智能批改**：听写完成后，拍照上传，AI 老师帮忙检查对错并给出点评。
- **防作弊模式**：平时隐藏文字，支持“看一眼”功能（限时 1 秒或 3 秒）。
- **拍照导入词库**：拍课本生字表，一键导入听写列表。

## 🛠️ 技术栈

本项目是一个**单文件 (Single File)** 应用，无需复杂的构建流程，直接在浏览器运行。

- **核心框架**: React + ReactDOM (浏览器端编译)
- **编译器**: Babel (Standalone)
- **UI 样式**: Tailwind CSS (CDN)
- **汉字笔顺**: Hanzi Writer
- **AI 模型**: Google Gemini API (支持 Flash/Pro 模型及自定义模型)
- **语音技术**: Web Speech API (SpeechSynthesis & webkitSpeechRecognition) + ResponsiveVoice
- **本地存储**: LocalStorage (保存学习进度、设置和词库)

## 🚀 如何使用

### 1. 获取代码
直接克隆本仓库或下载 ZIP 包。

```bash
git clone https://github.com/your-username/your-repo-name.git
```

### 2. 运行项目
由于使用了 ES6 模块和 Babel 浏览器端编译，**建议通过本地服务器运行**以避免跨域问题（CORS）。

你可以使用 VS Code 的 "Live Server" 插件，或者 Python 快速启动：

```bash
# Python 3
python -m http.server 8000
```
然后访问 `http://localhost:8000`。

### 3. 配置 AI
首次打开时，点击右上角的 **设置 (⚙️)** 图标：
1. 输入你的 **Google Gemini API Key** (可在 [Google AI Studio](https://aistudio.google.com/) 免费申请)。
2. 选择 AI 模型（推荐 `gemini-2.0-flash-exp` 或 `gemini-1.5-flash` 以获得更快的响应速度）。
3. (可选) 选择喜欢的朗读语音。

## ⚠️ 浏览器兼容性

- **推荐浏览器**: Chrome (桌面版/Android) 或 Edge。
- **iOS Safari**: 支持大部分功能，但“语音控制”功能可能受限于 iOS 策略（需点击屏幕唤醒）。
- **语音识别**: 依赖 `webkitSpeechRecognition` API，目前在 Chrome 内核浏览器上体验最佳。

## 📱 移动端适配
本项目完美适配移动端（手机/平板），支持“屏幕常亮”功能，防止学习过程中自动锁屏。

## 📄 许可证
MIT License
