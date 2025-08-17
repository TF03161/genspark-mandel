# 🌌 Three.js Mandelbulb - AI Developer編集ガイド

## 📁 メインファイル
**`/home/user/webapp/threejs-mandelbulb.html`**
- 完全なスタンドアロンHTMLファイル（外部依存なし）
- Three.js、OrbitControls、dat.GUIをCDNから読み込み
- GLSLシェーダーコードを含む

## 🎨 主要な編集ポイント

### 1. **シェーダーパラメータ（行番号: 約250-300）**
```javascript
const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() },
    power: { value: 8.0 },        // Mandelbulbのべき乗
    iterations: { value: 15 },    // レイマーチング反復回数
    glowIntensity: { value: 1.5 }, // グロー効果の強度
    aoIntensity: { value: 0.3 },   // アンビエントオクルージョン
    shadowSoftness: { value: 2.0 }, // 影の柔らかさ
    colorShift: { value: 0.0 }     // 色相シフト
};
```

### 2. **フラクタル数式（GLSLシェーダー内、行番号: 約150-200）**
```glsl
// Mandelbulb SDF関数
float mandelbulbSDF(vec3 pos) {
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    
    for (int i = 0; i < iterations; i++) {
        r = length(z);
        if (r > 2.0) break;
        
        // 球面座標変換
        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);
        
        // Mandelbulb公式
        float zr = pow(r, power);
        theta = theta * power;
        phi = phi * power;
        
        // 新しい位置計算
        z = zr * vec3(
            sin(theta) * cos(phi),
            sin(phi) * sin(theta),
            cos(theta)
        );
        z += pos;
    }
    return 0.5 * log(r) * r / dr;
}
```

### 3. **視覚効果の追加場所**

#### **新しいエフェクト追加（行番号: 約350-400）**
```glsl
// カスタムエフェクトの追加例
vec3 applyPsychedelicEffect(vec3 color, float time) {
    // 虹色グラデーション
    float hue = fract(time * 0.1 + length(color) * 0.5);
    return hsl2rgb(vec3(hue, 0.8, 0.5)) * color;
}
```

#### **パーティクルエフェクト（行番号: 約450-500）**
```javascript
// Three.jsシーン内にパーティクル追加
const particleGeometry = new THREE.BufferGeometry();
const particleCount = 10000;
const positions = new Float32Array(particleCount * 3);
// パーティクル位置の設定
```

### 4. **インタラクティブ機能（行番号: 約500-600）**

#### **オーディオリアクティブ機能の追加位置**
```javascript
// Web Audio API統合
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;

// マイク入力の取得
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        // uniforms.audioLevel に音量を反映
    });
```

### 5. **プリセット設定（行番号: 約600-650）**
```javascript
const presets = {
    classic: {
        power: 8.0,
        iterations: 15,
        glowIntensity: 1.5,
        aoIntensity: 0.3
    },
    quantum: {
        power: 12.0,
        iterations: 20,
        glowIntensity: 3.0,
        aoIntensity: 0.5
    },
    // 新しいプリセットを追加
    psychedelic: {
        power: 16.0,
        iterations: 25,
        glowIntensity: 5.0,
        aoIntensity: 0.1,
        colorShift: 1.0
    }
};
```

## 🔧 編集のコツ

### **パフォーマンス改善**
1. `iterations`を減らす（10-15が推奨）
2. 解像度を動的に調整
3. レイマーチングステップ数を最適化

### **ビジュアル強化**
1. 新しいカラーグラデーション追加
2. ポストプロセッシングエフェクト
3. ブルームエフェクトの実装

### **インタラクティブ性向上**
1. キーボードショートカット追加
2. タッチジェスチャー対応
3. VRモード実装

## 🚀 デプロイ済みURL
**現在の動作確認URL:**
https://3000-i9ol75pf5jooei0lrot7p-6532622b.e2b.dev/threejs-mandelbulb.html

## 📝 重要な変数・関数名

- `mandelbulbSDF()`: メインのフラクタル距離関数
- `rayMarch()`: レイマーチング処理
- `calculateNormal()`: 法線計算
- `calculateAO()`: アンビエントオクルージョン
- `uniforms`: シェーダーパラメータ
- `gui`: dat.GUIコントロールパネル

## 💡 AI Developer向けプロンプト例

```
"threejs-mandelbulb.htmlのMandelbulb距離関数を修正して、
より複雑なフラクタル形状を生成するようにしてください。
特にpower値を動的に変化させる機能を追加してください。"
```

```
"オーディオ入力に反応してフラクタルが変形する機能を
500行目付近に追加してください。Web Audio APIを使用して
マイクからの音量をuniformsに反映させてください。"
```

```
"新しいプリセット'cyberpunk'を追加して、
ネオンカラーと高コントラストな見た目にしてください。"
```

## 🎨 カスタマイズアイデア

1. **4D/5D拡張**: 高次元投影の実装
2. **物理シミュレーション**: 重力や流体の追加
3. **AI生成テクスチャ**: 動的なテクスチャマッピング
4. **マルチフラクタル**: 複数のフラクタルを合成
5. **時間進化**: フラクタルの成長アニメーション

---

MizuGameさんの創造的な実験に最適化された編集ガイドです。
「最先端AIで無駄をしまくる」精神で、限界を超えた表現を実現してください！