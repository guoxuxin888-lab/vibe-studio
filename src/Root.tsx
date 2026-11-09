import React from 'react';
import {Composition, Still} from 'remotion';
import {FILMS} from '../films';
import {StylePreview} from './StylePreview';
import {STYLES} from './styles';

export const Root: React.FC = () => (
  <>
    {FILMS.map(f => <Composition key={f.meta.id} id={f.meta.id} component={f.Film} durationInFrames={f.meta.timeline.frames} fps={f.meta.timeline.fps} width={1920} height={1080} />)}
    {STYLES.map(s => <Still key={s.id} id={`style-${s.id}`} component={StylePreview} defaultProps={{id: s.id}} width={1280} height={720} />)}
  </>
);
