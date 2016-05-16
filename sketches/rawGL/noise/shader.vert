precision mediump float;

attribute vec2 points;
varying vec2 vUv;

void main() {
    vUv = (points * vec2(1, -1) + 1.0) / 2.0;
    gl_Position = vec4(points, 0.0, 1.0);
}
