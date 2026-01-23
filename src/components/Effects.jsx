import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
  ToneMapping,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export const Effects = () => {
  return (
    <EffectComposer disableNormalPass>
      {/* 
        Bloom (輝き):
        星の輝きや発光感を強調します。
        - luminanceThreshold: 輝度の閾値。1.0に近いほど、非常に明るい部分（星など）のみが発光し、背景は暗いまま保たれます。
        - mipmapBlur: trueにすると、光がより滑らかに拡散し、柔らかいハロー効果（光暈）が生まれます。
        - intensity: 発光の強さ。値を大きくすると、星がより強く輝きます。
      */}
      <Bloom
        luminanceThreshold={0.2}
        mipmapBlur={true}
        intensity={1.5}
      />

      {/* 
        Noise (ノイズ/粒子感):
        画面全体に微細な粒子を加え、デジタル特有の「プラスチック感」を消し、
        フィルムのような質感や、夜気の密度感を表現します。
        - opacity: ノイズの不透明度。低い値（0.05〜0.1）で隠し味程度に入れるのがコツです。
      */}
      <Noise
        opacity={0.05}
        premultiply // アルファ合成の前にノイズを乗算するか（通常はtrueで馴染みが良くなる）
      />

      {/* 
        Vignette (周辺減光):
        画面の四隅を暗くし、視線を中央（日記や星空の主要部）に誘導します。
        また、レンズを通して見ているような映画的な没入感を与えます。
        - offset: 減光が始まる位置。値が小さいほど、より広い範囲が暗くなります。
        - darkness: 暗さの強度。値を上げると四隅が真っ黒に近づきます。
      */}
      <Vignette
        offset={0.35}
        darkness={0.3}
        eskil={false} // trueにするとEskil合成を使用し、より自然な減光になりますが、今回は標準的な効果で十分です。
      />

      {/* 
        ToneMapping (トーンマッピング):
        ハイダイナミックレンジ（HDR）の光情報を、画面に表示可能な範囲に圧縮・補正します。
        ACESFilmicは映画業界標準のトーンマップで、高輝度部分（星の光）が白飛びせず、
        自然な色味とコントラストを維持します。
      */}
      <ToneMapping
        blendFunction={BlendFunction.NORMAL} // 通常の合成モード
        adaptive={true} // 画面の平均輝度に応じて露出を自動調整するか
        resolution={256} // 輝度計算の解像度
        middleGrey={0.6} // 中間グレーの基準値。上げると全体が明るく、下げると暗くなります。
        maxLuminance={16.0} // 表現可能な最大輝度。星のダイナミックレンジを確保するために高めに設定。
        averageLuminance={1.0} // 平均輝度の初期値
        adaptationRate={1.0} // 露出調整の速度
      />
    </EffectComposer>
  );
};
