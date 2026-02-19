import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
  ToneMapping,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useControls } from "leva";

export const Effects = () => {
  const bloomProps = useControls('Effects.Bloom', {
    luminanceThreshold: { value: 0.12, min: 0, max: 1, label: '輝度しきい値' },
    intensity: { value: 1.1, min: 0, max: 10, label: '強度' },
    mipmapBlur: { value: true, label: 'ミップマップブラー' }
  }, { collapsed: true });

  const noiseProps = useControls('Effects.Noise', {
    opacity: { value: 0.05, min: 0, max: 1, step: 0.01, label: '不透明度' }
  }, { collapsed: true });

  const vignetteProps = useControls('Effects.Vignette', {
    offset: { value: 0.48, min: 0, max: 1, label: 'オフセット' },
    darkness: { value: 0.48, min: 0, max: 1, label: '暗さ' }
  }, { collapsed: true });

  const toneMappingProps = useControls('Effects.ToneMapping', {
    middleGrey: { value: 0.42, min: 0, max: 1, label: 'ミドルグレー' },
    maxLuminance: { value: 19.6, min: 0, max: 32, label: '最大輝度' },
    averageLuminance: { value: 1.45, min: 0, max: 5, label: '平均輝度' },
    adaptationRate: { value: 2.90, min: 0, max: 5, label: '適応速度' }
  }, { collapsed: true });

  return (
    <EffectComposer disableNormalPass>
      {/* 
        Bloom (輝き):
        星の輝きや発光感を強調します。
      */}
      <Bloom
        luminanceThreshold={bloomProps.luminanceThreshold}
        mipmapBlur={bloomProps.mipmapBlur}
        intensity={bloomProps.intensity}
      />

      {/* 
        Noise (ノイズ/粒子感):
        画面全体に微細な粒子を加え、デジタル特有の「プラスチック感」を消します。
      */}
      <Noise
        opacity={noiseProps.opacity}
        premultiply
      />

      {/* 
        Vignette (周辺減光):
        画面の四隅を暗くし、視線を中央に誘導します。
      */}
      <Vignette
        offset={vignetteProps.offset}
        darkness={vignetteProps.darkness}
        eskil={false}
      />

      {/* 
        ToneMapping (トーンマッピング):
        HDRの光情報を、画面に表示可能な範囲に圧縮・補正します。
      */}
      <ToneMapping
        blendFunction={BlendFunction.NORMAL}
        adaptive={true}
        resolution={128}
        middleGrey={toneMappingProps.middleGrey}
        maxLuminance={toneMappingProps.maxLuminance}
        averageLuminance={toneMappingProps.averageLuminance}
        adaptationRate={toneMappingProps.adaptationRate}
      />
    </EffectComposer>
  );
};
