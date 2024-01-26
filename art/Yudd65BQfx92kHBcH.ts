import { iSub } from '../lib';
import { createCanvas } from '../webgl-utils';

const vertex = `
/* 🌳🌲🎄🎋🌴
*/

#define PI radians(180.0)

vec3 hsv2rgb(vec3 c) {
  c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

mat4 rotX(float angleInRadians) {
    float s = sin(angleInRadians);
    float c = cos(angleInRadians);
  	
    return mat4( 
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1);  
}

mat4 rotY(float angleInRadians) {
    float s = sin(angleInRadians);
    float c = cos(angleInRadians);
  	
    return mat4( 
      c, 0,-s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1);  
}

mat4 rotZ(float angleInRadians) {
    float s = sin(angleInRadians);
    float c = cos(angleInRadians);
  	
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

// times 2 minus 1
float t2m1(float v) {
  return v * 2. - 1.;
}

// times .5 plus .5
float t5p5(float v) {
  return v * 0.5 + 0.5;
}

float inv(float v) {
  return 1. - v;
}

void getCirclePoint(const float numEdgePointsPerCircle, const float id, const float inner, const float start, const float end, out vec3 pos) {
  float outId = id - floor(id / 3.) * 2. - 1.;   // 0 1 2 3 4 5 6 7 8 .. 0 1 2, 1 2 3, 2 3 4
  float ux = floor(id / 6.) + mod(id, 2.);
  float vy = mod(floor(id / 2.) + floor(id / 3.), 2.); // change that 3. for cool fx
  float u = ux / numEdgePointsPerCircle;
  float v = mix(inner, 1., vy);
  float a = mix(start, end, u) * PI * 2. + PI * 0.0;
  float s = sin(a);
  float c = cos(a);
  float x = c * v;
  float y = s * v;
  float z = 0.;
  pos = vec3(x, y, z);  
}


#define CUBE_POINTS_PER_FACE 6.
#define FACES_PER_CUBE 6.
#define POINTS_PER_CUBE (CUBE_POINTS_PER_FACE * FACES_PER_CUBE)
void getCubePoint(const float id, out vec3 position, out vec3 normal) {
  float quadId = floor(mod(id, POINTS_PER_CUBE) / CUBE_POINTS_PER_FACE);
  float sideId = mod(quadId, 3.);
  float flip   = mix(1., -1., step(2.5, quadId));
  // 0 1 2  1 2 3
  float facePointId = mod(id, CUBE_POINTS_PER_FACE);
  float pointId = mod(facePointId - floor(facePointId / 3.0), 6.0);
  float a = pointId * PI * 2. / 4. + PI * 0.25;
  vec3 p = vec3(cos(a), 0.707106781, sin(a)) * flip;
  vec3 n = vec3(0, 1, 0) * flip;
  float lr = mod(sideId, 2.);
  float ud = step(2., sideId);
  mat4 mat = rotX(lr * PI * 0.5);
  mat *= rotZ(ud * PI * 0.5);
  position = (mat * vec4(p, 1)).xyz;
  normal = (mat * vec4(n, 0)).xyz;
}

float Hash( vec2 p) {
     vec3 p2 = vec3(p.xy,1.0);
    return fract(sin(dot(p2,vec3(37.1,61.7, 12.4)))*3758.5453123);
}

float noise(in vec2 p) {
    vec2 i = floor(p);
     vec2 f = fract(p);
     f *= f * (3.0-2.0*f);

    return mix(mix(Hash(i + vec2(0.,0.)), Hash(i + vec2(1.,0.)),f.x),
               mix(Hash(i + vec2(0.,1.)), Hash(i + vec2(1.,1.)),f.x),
               f.y);
}

float fbm(vec2 p) {
     float v = 0.0;
     v += noise(p*1.0)*.5;
     v += noise(p*2.)*.25;
     v += noise(p*4.)*.125;
     return v;
}

float crv(float v) {
  return fbm(vec2(v, v * 1.23));
  //float o = sin(v) + sin(v * 2.1) + sin(v * 4.2) + sin(v * 8.9); 
  //return o / 4.;
}

// meh: would prefer a forumla
void branchInfo(float branchId, out float used, out float branch) {
  if (branchId <  0.5) { used = 1.; branch =  0.; return; }
  if (branchId <  1.5) { used = 2.; branch =  0.; return; }
  if (branchId <  2.5) { used = 3.; branch =  0.; return; }
  if (branchId <  3.5) { used = 4.; branch =  0.; return; }
  if (branchId <  4.5) { used = 4.; branch =  8.; return; }
  if (branchId <  5.5) { used = 3.; branch =  4.; return; }
  if (branchId <  6.5) { used = 4.; branch =  4.; return; }
  if (branchId <  7.5) { used = 4.; branch = 12.; return; }
  if (branchId <  8.5) { used = 2.; branch =  2.; return; }
  if (branchId <  9.5) { used = 3.; branch =  2.; return; }
  if (branchId < 10.5) { used = 4.; branch =  2.; return; }
  if (branchId < 11.5) { used = 4.; branch = 10.; return; }
  if (branchId < 12.5) { used = 3.; branch =  6.; return; }
  if (branchId < 13.5) { used = 4.; branch =  6.; return; }
                         used = 4.; branch = 14.; return;
}

void main() {
  vec3 pos;
  vec3 normal;
  getCubePoint(vertexId, pos, normal);
  float numCubes = floor(vertexCount / POINTS_PER_CUBE);
  float cubeId = floor(vertexId / POINTS_PER_CUBE);
  float cubeV = cubeId / numCubes;
  
  
  float cubesPerTree = 15.0;
  float cubesPerTreePair = cubesPerTree * 2.0;
  float treeId = floor(cubeId / cubesPerTreePair);
  float numTrees = floor(numCubes / cubesPerTreePair);
  float treeV = treeId / numTrees;
  
  float branchId = mod(cubeId, cubesPerTree);
  float branchV = branchId / cubesPerTree;
  
  /*
   a        0      1       0-7
   a a      1      3       0-3-2-1
   a a a    2      7       0-1
   a a a a  3      15      0

   a a a b  4      15      1
   a a b    5      7       2-3
   a a b a  6      15      2
   a a b b  7      15      3

   a b      8      3       4-5-6-7
   a b a    9      7       4-5
   a b a a  10     15      4
   a b a b  11     15      5
   a b b    12     7       6-7
   a b b a  13     15      6
   a b b b  14     15      7

  */
  
  float used;
  float branch;
  branchInfo(branchId, used, branch);

  float s = texture2D(sound, vec2(mix(0.01, 0.25, hash(cubeV)), 0)).a;
 

  mat4 tree = ident();
  const int depth = 4;
  for (int d = 0; d < depth; ++d) {
    float df = float(d);
    if (df <= used - 1.0) {
      float b = mod(branch / pow(2.0, df), 2.0) * 2.0 - 1.0;
      float cd = (df / float(depth)) + b * 0.15;
      tree *= trans(vec3(0, 1, 0));
      //tree *= rotX(mix(0.2, -0.2, b));
      //tree *= rotY(0.2);
      tree *= rotX(hash(cd * 0.741) * b * 0.6 + sin(time + treeV * 0.1) * 0.05);
      tree *= rotY(hash(cd * 0.357) * b * 0.4 + sin(time + treeV * PI) * 0.1);
      if (df > 2.5) {
        float scx = mix(15., 8., hash(cd * 0.277));
        float scy = mix(.8, 1.5, hash(cd * 0.727));
        tree *= scale(vec3(scx + pow(s, 5.) * 20., scy + pow(s, 5.) * .5, 0.1));
      }
    }
  }
  
  float leaf = step(3.5, used);
  float shadow = mod(floor(cubeId / cubesPerTree), 2.0);

  float tm = time * 0.1;
  mat4 pvmat = persp(radians(60.0), resolution.x / resolution.y, 0.1, 1000.0);
  float r = 10.;
  vec3 eye = vec3(
    cos(tm) * r,
    mix(0.5, 2.0, t5p5(sin(tm * 0.77))),
    sin(tm) * r);
  //vec3 target = vec3(0, 0, 0);
  tm += 0.5;
  vec3 target = vec3(
    cos(tm) * r,
    mix(1.0, 3.0, t5p5(sin(tm * 0.77))),
    sin(tm) * r);
  vec3 up = vec3(0,1,0);
  
  pvmat *= cameraLookAt(eye, target, up);
  
  mat4 mat = trans((vec3(
    hash(treeV * 0.219),
    mix(0.5, 0.496 - treeV * 0.000, shadow),
    hash(treeV * 0.691)) * 2.0 - 1.0) * 20.0);
  mat *= rotY(hash(treeV * 0.597) * PI * 2.0);
  mat *= scale(mix(vec3(1), vec3(2, 0.02, 1), shadow));
  mat *= uniformScale(mix(0.6, 1.5, hash(treeV * 0.371)));
  mat *= trans(vec3(0, -1, 0));
  mat *= tree;
  mat *= scale(vec3(0.1, 0.8, 0.1));
  mat *= trans(vec3(0, 0.56, 0));

  float ground = step(vertexCount - 6.5, vertexId);
  if (ground > 0.5) {
    mat = ident();
    float ux = mod(vertexId, 2.);
  	float vy = mod(floor(vertexId / 2.) + floor(vertexId / 3.), 2.);
    pos = (vec3(ux, 0.49, vy) * 2.0 - 1.0) * 1000.0;
  }

  
  gl_Position = pvmat * mat * vec4(pos, 1);
  vec3 n = normalize((mat * vec4(normal, 0)).xyz);
  
  vec3 lightDir = normalize(vec3(0.3, 0.4, -1));

  
  float hue = mix(0.1, 0.3 + pow(s + 0.2, 5.) * 0.5, leaf);
  float sat = mix(0.8, 0., shadow);
  float val = mix(1.0, 0., shadow);
  vec3 color = hsv2rgb(vec3(hue, sat, val));
  color = mix(color, vec3(0.3, 0.15, 0), ground);
  float light = dot(n, lightDir) * 0.5 + 0.5;
  v_color = vec4(color * mix(light, 1., shadow), 1);
  //v_color.a = mix(1.0, 0.5, shadow);
  v_color.rgb *= v_color.a;
}

`;

export default class implements iSub {
  name() {
    return 'run🌳🌲🎄🎋🌴';
  }
  key() {
    return 'Yudd65BQfx92kHBcH';
  }
  sort() {
    return 4;
  }
  main() {
    return createCanvas({ bg: 'black' });
  }
  userVertex() {
    return vertex;
  }
  defaultType() {
    return WebGLRenderingContext.LINES;
  }
}
