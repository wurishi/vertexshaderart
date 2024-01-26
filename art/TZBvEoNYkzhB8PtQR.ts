import { iSub } from '../lib';
import { createCanvas } from '../webgl-utils';

const vertex = `
#define PI radians(180.0)

vec3 hsv2rgb(vec3 c) {
  c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

mat4 rotY( float angle ) {
    float s = sin( angle );
    float c = cos( angle );
  	
    return mat4( 
      c, 0,-s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1);  
}


mat4 rotZ( float angle ) {
    float s = sin( angle );
    float c = cos( angle );
  	
    return mat4( 
      c,-s, 0, 0, 
      s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1); 
}

mat4 trans(vec3 trans) {
  return mat4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    trans, 1);
}

mat4 ident() {
  return mat4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
}

mat4 scale(vec3 s) {
  return mat4(
    s[0], 0, 0, 0,
    0, s[1], 0, 0,
    0, 0, s[2], 0,
    0, 0, 0, 1);
}

mat4 uniformScale(float s) {
  return mat4(
    s, 0, 0, 0,
    0, s, 0, 0,
    0, 0, s, 0,
    0, 0, 0, 1);
}


mat4 persp(float fov, float aspect, float zNear, float zFar) {
  float f = tan(PI * 0.5 - 0.5 * fov);
  float rangeInv = 1.0 / (zNear - zFar);

  return mat4(
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (zNear + zFar) * rangeInv, -1,
    0, 0, zNear * zFar * rangeInv * 2., 0);
}

mat4 trInv(mat4 m) {
  mat3 i = mat3(
    m[0][0], m[1][0], m[2][0], 
    m[0][1], m[1][1], m[2][1], 
    m[0][2], m[1][2], m[2][2]);
  vec3 t = -i * m[3].xyz;
    
  return mat4(
    i[0], t[0], 
    i[1], t[1],
    i[2], t[2],
    0, 0, 0, 1);
}

mat4 transpose(mat4 m) {
  return mat4(
    m[0][0], m[1][0], m[2][0], m[3][0], 
    m[0][1], m[1][1], m[2][1], m[3][1],
    m[0][2], m[1][2], m[2][2], m[3][2],
    m[0][3], m[1][3], m[2][3], m[3][3]);
}

mat4 lookAt(vec3 eye, vec3 target, vec3 up) {
  vec3 zAxis = normalize(eye - target);
  vec3 xAxis = normalize(cross(up, zAxis));
  vec3 yAxis = cross(zAxis, xAxis);

  return mat4(
    xAxis, 0,
    yAxis, 0,
    zAxis, 0,
    eye, 1);
}

mat4 inverse(mat4 m) {
  float
      a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
      a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
      a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
      a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

      b00 = a00 * a11 - a01 * a10,
      b01 = a00 * a12 - a02 * a10,
      b02 = a00 * a13 - a03 * a10,
      b03 = a01 * a12 - a02 * a11,
      b04 = a01 * a13 - a03 * a11,
      b05 = a02 * a13 - a03 * a12,
      b06 = a20 * a31 - a21 * a30,
      b07 = a20 * a32 - a22 * a30,
      b08 = a20 * a33 - a23 * a30,
      b09 = a21 * a32 - a22 * a31,
      b10 = a21 * a33 - a23 * a31,
      b11 = a22 * a33 - a23 * a32,

      det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return mat4(
      a11 * b11 - a12 * b10 + a13 * b09,
      a02 * b10 - a01 * b11 - a03 * b09,
      a31 * b05 - a32 * b04 + a33 * b03,
      a22 * b04 - a21 * b05 - a23 * b03,
      a12 * b08 - a10 * b11 - a13 * b07,
      a00 * b11 - a02 * b08 + a03 * b07,
      a32 * b02 - a30 * b05 - a33 * b01,
      a20 * b05 - a22 * b02 + a23 * b01,
      a10 * b10 - a11 * b08 + a13 * b06,
      a01 * b08 - a00 * b10 - a03 * b06,
      a30 * b04 - a31 * b02 + a33 * b00,
      a21 * b02 - a20 * b04 - a23 * b00,
      a11 * b07 - a10 * b09 - a12 * b06,
      a00 * b09 - a01 * b07 + a02 * b06,
      a31 * b01 - a30 * b03 - a32 * b00,
      a20 * b03 - a21 * b01 + a22 * b00) / det;
}

mat4 cameraLookAt(vec3 eye, vec3 target, vec3 up) {
  #if 1
  return inverse(lookAt(eye, target, up));
  #else
  vec3 zAxis = normalize(target - eye);
  vec3 xAxis = normalize(cross(up, zAxis));
  vec3 yAxis = cross(zAxis, xAxis);

  return mat4(
    xAxis, 0,
    yAxis, 0,
    zAxis, 0,
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1);  
  #endif
  
}



float hash(float p) {
	vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
    p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
	return fract(p2.x * p2.y * 95.4337);
}

float m1p1(float v) {
  return v * 2. - 1.;
}

float p1m1(float v) {
  return v * 0.5 + 0.5;
}

float inv(float v) {
  return 1. - v;
}

#define NUM_EDGE_POINTS_PER_CIRCLE 6.
#define NUM_POINTS_PER_CIRCLE (NUM_EDGE_POINTS_PER_CIRCLE * 6.) 
#define NUM_CIRCLES_PER_GROUP 1.
void getCirclePoint(const float id, const float inner, const float start, const float end, out vec3 pos) {
  float outId = id - floor(id / 3.) * 2. - 1.;   // 0 1 2 3 4 5 6 7 8 .. 0 1 2, 1 2 3, 2 3 4
  float ux = floor(id / 6.) + mod(id, 2.);
  float vy = mod(floor(id / 2.) + floor(id / 3.), 2.); // change that 3. for cool fx
  float u = ux / NUM_EDGE_POINTS_PER_CIRCLE;
  float v = mix(inner, 1., vy);
  float a = mix(start, end, u) * PI * 2. + PI * 0.0;
  float s = sin(a);
  float c = cos(a);
  float x = c * v;
  float y = s * v;
  float z = 0.;
  pos = vec3(x, y, z);  
}

float goop(float t) {
  return sin(t) + sin(t * 0.27) + sin(t * 0.13) + sin(t * 0.73);
}

float easeInOutSine(float t) {
  return (-0.5 * (cos(PI * t) - 1.));
}

float mixer(float t, float timeOff, float duration) {
  t = mod(t, duration * 2.0);
  t = t - timeOff;
  if (t > duration) {
    t = duration + 1. - t;
  }
  return easeInOutSine(clamp(t, 0., 1.));
}

void main() {
  float circleId = floor(vertexId / NUM_POINTS_PER_CIRCLE);
  float groupId = floor(circleId / NUM_CIRCLES_PER_GROUP);
  float pointId = mod(vertexId, NUM_POINTS_PER_CIRCLE);
  float sliceId = mod(floor(vertexId / 6.), 2.);
  float side = mix(-1., 1., step(0.5, mod(circleId, 2.)));
  float numCircles = floor(vertexCount / NUM_POINTS_PER_CIRCLE);
  float numGroups = floor(numCircles / NUM_CIRCLES_PER_GROUP); 
  float cu = circleId / numCircles;
  float gv = groupId / numGroups;
  float cgId = mod(circleId, NUM_CIRCLES_PER_GROUP);
  float cgv = cgId / NUM_CIRCLES_PER_GROUP;
  float ncgv = 1. - cgv;
  
  
  //snd = pow(snd, mix(2., 0.5, su));
  
  
  
//  float historyX = mix(0.01, 0.14, u);
//  snd = pow(snd, mix(2., 0.5, u));
  
  

  // ----
  float gAcross = 64.;
  float gDown = floor(numGroups / gAcross);
  float gx = mod(groupId, gAcross);
  float gy = floor(groupId / gAcross);
  vec3 offset = vec3(
    gx - (gAcross - 1.) / 2. + mod(gy, 2.) * 0.5,
    gy - (gDown - 1.) / 2.,
    0) * 0.17;

  float tm = time - cgv * 0.2;
  float su = hash(groupId);
  float snd2 = texture2D(sound, vec2(mix(0.001, 0.021, abs(atan(offset.x, offset.y) / PI )), length(offset) * 0.1)).a;
  float snd = texture2D(sound, vec2(
    mix(0.205, 0.001, gy / gDown), 
    abs(gx / gAcross - 0.5) * 2. * 0.2)).a;
  

  vec3 pos;
  float inner = pow(snd2, 6.);//pow(snd,2.);//mix(0.0, 1. - pow(snd, 4.), cgId);
  float start = 0.;//fract(hash(sideId * 0.33) + sin(time * 0.1 + sideId) * 1.1);
  float end   = 1.; //start + hash(sideId + 1.);
  getCirclePoint(pointId, inner, start, end, pos); 
  pos.z = cgv;
  
    
//  vec3 offset = vec3(hash(groupId) * 0.8, m1p1(hash(groupId * 0.37)), cgv);
//  offset.x += m1p1(pow(snd, 5.0) + goop(groupId + time * 0.) * 0.1);
//  offset.y += goop(groupId + time * 0.) * 0.1;
  vec3 aspect = vec3(1, resolution.x / resolution.y, 1);

  vec3 eye = vec3(sin(time * 0.19) * 0.25, sin(time * 0.21) * 0.25, 4.5);
  vec3 target = vec3(sin(time * 0.17), sin(time * 0.13), -10);
  vec3 up = vec3(sin(time * 0.3) * 0.2, 1, 0);
  
  mat4 mat = persp(120. * PI / 180., resolution.x / resolution.y, 0.1, 100.); 
  mat *= cameraLookAt(eye, target, up);
//  mat *= ident();
//  mat *= scale(aspect * (0.4 + sin(time) * 0.0));
  mat *= rotZ(time * 0.0 * mix(-1., 1., mod(circleId, 2.)) + gy * 0.0 * sin(time * 0.1));//sign(offset.x));
//  mat *= trans(offset);
  float sp = pow(snd, 5.0);

  mat *= rotZ(time * 0.01 * gy * 0. + PI * 0.5);
  mat *= trans(vec3(0, 0, gy * 0.1 + mod(circleId, 2.0) * 0.05));
  mat *= rotZ(gx / gAcross * PI * 2.);
  mat *= rotY(PI * 0.5);
  mat *= trans(vec3(0, 0, 1. - (1. - gy / gDown) * .4));//pow(snd, 0.5) * -6. * sign(offset.x));
  mat *= uniformScale(0.05);// * sp);// + -sin((time + 0.5) * 6.) * 0.01);
  mat *= rotZ(PI * 0.66 * 0.25);
  mat *= uniformScale(
    mix(1.,
        mix(snd, snd2, mod(time * 60., 2.)) + sliceId * sin(time) * 0.5,
        easeInOutSine(time * 0.1))
  );
  gl_Position = mat * vec4(pos, 1);
  gl_PointSize = 4.;

  float hue = hash(mod(abs(gx - gAcross / 2.), 3.)) + time * 0.1;//tm * 0.0 + mix(0., .02, length(offset));
  float sat = pow(snd + 1.- gy / gDown, 5.);
  float val = pow(snd2, 4.);//pow(snd + pow(gy / gDown, 0.3), 15.);//step(0.90, snd); //0.;//mix(hash(groupId), 1.0, step(0.99, snd));//ncgv;//1.;//mix(0.0, 0.0, fract(circleId * 0.79)) + sliceId * .65;
  v_color = vec4(hsv2rgb(vec3(hue, sat, val)), 1);
  v_color.rgb *= v_color.a;
}
`;

export default class implements iSub {
  name() {
    return 'h-t';
  }
  key() {
    return 'TZBvEoNYkzhB8PtQR';
  }
  sort() {
    return 15;
  }
  main() {
    return createCanvas({ bg: 'black' });
  }
  userVertex() {
    return vertex;
  }
  defaultType() {
    return WebGLRenderingContext.TRIANGLE_STRIP;
  }
}
