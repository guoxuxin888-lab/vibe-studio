import velvetStage from '../../libraries/styles/velvet-stage.json';
import inkWash from '../../libraries/styles/ink-wash.json';
import vaseFigure from '../../libraries/styles/vase-figure.json';
import blueprint from '../../libraries/styles/blueprint.json';
import shadowPuppet from '../../libraries/styles/shadow-puppet.json';
import quietNight from '../../libraries/styles/quiet-night.json';
import paperCollage from '../../libraries/styles/paper-collage.json';
import cinnabar from '../../libraries/styles/cinnabar-line.json';
import songPaperCoast from '../../libraries/styles/song-paper-coast.json';
import songHandscroll from '../../libraries/styles/song-handscroll.json';
import shadowTheatre from '../../libraries/styles/shadow-theatre.json';
import hanFlat from '../../libraries/styles/han-flat.json';
import geoFlat from '../../libraries/styles/geo-flat.json';

export type Style = {
  id: string; name: string; fits: string; palette: {bg: string; bg2: string; ink: string; muted: string; accent: string; accent2: string};
  texture: 'grain' | 'paper' | 'grid' | 'wash' | 'hatch' | 'none'; figure: string; font: 'serif' | 'sans';
  light: string; motion: string; music: string; imagePrompt: string; avoid: string;
};

export const STYLES = [velvetStage, inkWash, vaseFigure, blueprint, shadowPuppet, quietNight, paperCollage, cinnabar, songPaperCoast, songHandscroll, shadowTheatre, hanFlat, geoFlat] as Style[];
export const getStyle = (id: string): Style => {
  const s = STYLES.find(x => x.id === id);
  if (!s) throw new Error(`Unknown style: ${id}`);
  return s;
};
// Open fonts first. Nothing is bundled, so install Noto Serif SC or Noto Sans SC for identical results.
export const FONT = {serif: '"Noto Serif SC","Source Han Serif SC","Songti SC","SimSun",serif', sans: '"Noto Sans SC","Source Han Sans SC","PingFang SC","Microsoft YaHei",sans-serif'};
