import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Video, TOTAL_FRAMES } from './Video.jsx';

const Root = () => (
  <Composition id="Virasat" component={Video} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
);

registerRoot(Root);
