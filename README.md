# 🌌 Ultimate Mandelbulb Visualizer - Three.js Ray Marching

## Project Overview
- **Name**: Ultimate Mandelbulb Visualizer
- **Goal**: 最先端のGPUレイマーチング技術で量子フラクタルの世界を表現
- **Features**: 
  - リアルタイムレイマーチングによる3D Mandelbulbレンダリング
  - インタラクティブなパラメータ調整
  - 複数のビジュアルプリセット
  - 高性能GPU処理

## 🚀 Live Demo
- **Production**: https://3000-i9ol75pf5jooei0lrot7p-6532622b.e2b.dev/threejs-mandelbulb.html
- **GitHub**: https://github.com/TF03161/genspark-mandel

## 📁 File Structure
```
webapp/
├── threejs-mandelbulb.html    # メインのThree.js実装（スタンドアロン）
├── AI_DEVELOPER_GUIDE.md      # AI Developer編集ガイド
├── ecosystem.config.cjs       # PM2設定
└── README.md                  # このファイル
```

## 🎨 Features

### Currently Implemented
- ✅ GPU加速レイマーチングシェーダー
- ✅ リアルタイムパラメータ調整（Power, Iterations, Glow）
- ✅ Ambient Occlusion & Soft Shadows
- ✅ OrbitControlsによる3Dカメラ操作
- ✅ 4種類のビジュアルプリセット（Classic/Organic/Crystal/Quantum）
- ✅ FPSモニター
- ✅ レスポンシブデザイン

### Functional Entry Points
- `/threejs-mandelbulb.html` - メインビジュアライザー
  - マウス操作: 左ドラッグで回転、右ドラッグでパン、スクロールでズーム
  - スペースキー: 自動回転トグル
  - GUI: 右上のコントロールパネルで全パラメータ調整可能

### Not Yet Implemented
- ⏳ オーディオリアクティブ機能（マイク入力対応）
- ⏳ 4D/5D高次元投影
- ⏳ VRモード対応
- ⏳ 動的テクスチャマッピング
- ⏳ マルチフラクタル合成

## 🔧 Technical Stack
- **Three.js r160**: 3Dレンダリングエンジン
- **GLSL**: カスタムシェーダー（レイマーチング実装）
- **WebGL2**: ハードウェアアクセラレーション
- **dat.GUI**: リアルタイムパラメータ調整
- **OrbitControls**: 3Dカメラ制御

## 📊 Data Architecture
- **Rendering**: GPU-based ray marching with distance fields
- **Uniforms**: Real-time shader parameters
- **Geometry**: Procedural generation (no mesh data)
- **Performance**: 60+ FPS on modern GPUs

## 👤 User Guide

### 基本操作
1. ページを開くと自動的にMandelbulbが表示されます
2. マウスでドラッグして視点を変更
3. 右上のコントロールパネルでパラメータ調整
4. プリセットボタンで異なるスタイルに切り替え

### パラメータ説明
- **Power**: フラクタルの複雑度（8.0-20.0）
- **Iterations**: 計算精度（10-30）
- **Glow Intensity**: 発光効果の強さ
- **AO Intensity**: 影の深さ
- **Shadow Softness**: 影の柔らかさ

## 🚀 Deployment
- **Platform**: HTTP Server (PM2管理)
- **Status**: ✅ Active
- **Tech Stack**: Three.js + GLSL + Pure JavaScript
- **Last Updated**: 2025-08-17

## 💡 Recommended Next Steps
1. **オーディオビジュアライゼーション追加**
   - Web Audio APIでマイク入力を取得
   - 音量/周波数をシェーダーパラメータに反映

2. **高次元フラクタル実装**
   - 4D/5D座標系の追加
   - クォータニオン/オクトニオン演算

3. **パフォーマンス最適化**
   - 適応的解像度調整
   - フラスタムカリング実装

4. **エフェクト拡張**
   - ブルームポストプロセッシング
   - モーションブラー追加

---

Created by MizuGame - 「最先端AIで無駄をしまくる」精神で量子フラクタルの境界を探求