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
    luminanceThreshold: { value: 0.2, min: 0, max: 1, label: 'Threshold' },
    intensity: { value: 1.5, min: 0, max: 10, label: 'Intensity' },
    mipmapBlur: { value: true, label: 'Mipmap Blur' }
  }, { collapsed: true });

  const noiseProps = useControls('Effects.Noise', {
    opacity: { value: 0.05, min: 0, max: 1, step: 0.01, label: 'Opacity' }
  }, { collapsed: true });

  const vignetteProps = useControls('Effects.Vignette', {
    offset: { value: 0.35, min: 0, max: 1, label: 'Offset' },
    darkness: { value: 0.3, min: 0, max: 1, label: 'Darkness' }
  }, { collapsed: true });

  const toneMappingProps = useControls('Effects.ToneMapping', {
    middleGrey: { value: 0.6, min: 0, max: 1, label: 'Middle Grey' },
    maxLuminance: { value: 16.0, min: 0, max: 32, label: 'Max Luminance' },
    averageLuminance: { value: 1.0, min: 0, max: 5, label: 'Avg Luminance' },
    adaptationRate: { value: 1.0, min: 0, max: 5, label: 'Adaptation Rate' }
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
        resolution={256}
        middleGrey={toneMappingProps.middleGrey}
        maxLuminance={toneMappingProps.maxLuminance}
        averageLuminance={toneMappingProps.averageLuminance}
        adaptationRate={toneMappingProps.adaptationRate}
      />
    </EffectComposer>
  );
};
