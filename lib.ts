export const vertex = `
attribute vec4 a_pos;

varying vec4 v_color;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float vertexCount;
uniform sampler2D sound;
uniform vec4 background;
uniform sampler2D touch;

#define vertexId a_pos[0]

{USER_VERTEX}
`;

export const fragment = `
precision mediump float;
varying vec4 v_color;

void main() {
  gl_FragColor = v_color;
}
`;

export interface iSub {
  name(): string;
  key(): string;
  main(): HTMLCanvasElement;
  userVertex(): string;
  sort?(): number;
  defaultType?(): number;
}
