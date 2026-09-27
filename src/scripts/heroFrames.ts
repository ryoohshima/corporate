import * as T from "three";

const root = document.querySelector<HTMLElement>("[data-hero-frames]");
const canvas = root?.querySelector("canvas");
const button = root?.querySelector("button");
if (root && canvas && button) {
  let renderer: T.WebGLRenderer | undefined;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const gl = renderer;
    gl.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new T.Scene(),
      group = new T.Group();
    scene.add(group);
    const camera = new T.PerspectiveCamera(32, 1, 0.1, 40);
    const material = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { ink: { value: new T.Color(0x68655c) } },
      vertexShader: `varying float vDepth; void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vDepth=p.z;gl_Position=projectionMatrix*p;}`,
      fragmentShader: `uniform vec3 ink; varying float vDepth;
        void main(){float a=clamp(0.72+(vDepth+9.0)*0.13,0.24,0.88);gl_FragColor=vec4(ink,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
    });
    const geometry = new T.BufferGeometry().setFromPoints([
      new T.Vector3(-1.48, -0.95, 0),
      new T.Vector3(1.48, -0.95, 0),
      new T.Vector3(1.48, 0.95, 0),
      new T.Vector3(-1.48, 0.95, 0),
    ]);
    const frames = Array.from({ length: 11 }, (_, i) => {
      const frame = new T.LineLoop(geometry, material);
      frame.position.z = (i - 5) * 0.15;
      group.add(frame);
      return frame;
    });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let elapsed = 12 * 0.17,
      last = 0,
      visible = false,
      paused = false,
      disposed = false;
    const render = () => {
      const phase = ((elapsed / 12) % 1) * Math.PI * 2;
      const spread = (1 - Math.cos(phase)) * 0.5;
      frames.forEach((frame, i) => {
        const offset = (i - 5) / 5;
        frame.rotation.set(
          spread * offset * 0.72,
          spread * offset,
          spread * offset * 0.32,
        );
        frame.position.x = spread * offset * 0.22;
        frame.position.y = spread * offset * 0.15;
      });
      group.rotation.set(0.12 * Math.sin(phase), 0.18 * Math.sin(phase), 0);
      gl.render(scene, camera);
    };
    const motion = () => {
      gl.setAnimationLoop(null);
      last = 0;
      if (disposed || !visible || document.hidden) return;
      render();
      if (paused || reduced.matches) return;
      gl.setAnimationLoop((now) => {
        if (last) elapsed += Math.min((now - last) / 1000, 0.05);
        last = now;
        render();
      });
    };
    const resize = new ResizeObserver(() => {
      if (!canvas.clientWidth || !canvas.clientHeight || disposed) return;
      gl.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.position.z = Math.max(
        7.3,
        2.25 / (Math.tan((16 * Math.PI) / 180) * camera.aspect),
      );
      camera.updateProjectionMatrix();
      render();
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      motion();
    });
    observer.observe(canvas);
    const toggle = () => {
      paused = !paused;
      button.setAttribute("aria-pressed", String(paused));
      button.textContent = paused ? "動きを再開" : "動きを止める";
      button.setAttribute(
        "aria-label",
        `ヒーローアニメーションを${paused ? "再開" : "停止"}`,
      );
      motion();
    };
    const motionPreference = () => {
      button.hidden = reduced.matches;
      motion();
    };
    button.hidden = reduced.matches;
    button.addEventListener("click", toggle);
    reduced.addEventListener("change", motionPreference);
    document.addEventListener("visibilitychange", motion);
    const dispose = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      disposed = true;
      gl.setAnimationLoop(null);
      resize.disconnect();
      observer.disconnect();
      button.removeEventListener("click", toggle);
      reduced.removeEventListener("change", motionPreference);
      document.removeEventListener("visibilitychange", motion);
      geometry.dispose();
      material.dispose();
      gl.dispose();
      window.removeEventListener("pagehide", dispose);
    };
    window.addEventListener("pagehide", dispose);
  } catch (error) {
    renderer?.dispose();
    root.hidden = true;
    console.warn("Hero animation unavailable", error);
  }
}
