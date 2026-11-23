(() => {
  "use strict";

  const fragmentSource = `
precision highp float;
uniform vec2 size;
uniform float angle;
uniform float zoom;
uniform float redLight;
uniform float portraitMix;
uniform sampler2D portrait;
float ellipsoid(vec3 p, vec3 r) {
  return (length(p/r)-1.)*min(r.x,min(r.y,r.z));
}
float blend(float a,float b,float k) {
  float h=clamp(.5+.5*(b-a)/k,0.,1.);
  return mix(b,a,h)-k*h*(1.-h);
}
float almond(vec3 p,vec3 r) {
  vec3 q=p/r;
  float outline=length(vec3(q.x,abs(q.y)*.61+.36,q.z));
  return (outline-1.)*min(r.x,min(.61*r.y,r.z));
}
vec2 model(vec3 p) {
  p.y*=1.08;
  float skull=ellipsoid(p-vec3(0.,.285,-.085),vec3(.715,.81,.637));
  vec3 lower=p-vec3(0.,-.325,.055);
  float jawWidth=.375+.29*smoothstep(-.72,.62,lower.y);
  float face=ellipsoid(lower,vec3(jawWidth,.64,.505));
  float chin=ellipsoid(p-vec3(0.,-.755,.126),vec3(.215,.205,.294));
  float head=blend(blend(skull,face,.24),chin,.19);
  vec3 socket=vec3(abs(p.x),p.y,p.z)-vec3(.333,-.198,.454);
  socket.xy=mat2(.846,-.533,.533,.846)*socket.xy;
  socket.xz=mat2(.952,.306,-.306,.952)*socket.xz;
  float surround=almond(socket+vec3(.01,0.,.079),vec3(.345,.213,.205));
  head=blend(head,surround,.062);
  head=-blend(-head,almond(socket-vec3(0.,0.,.064),vec3(.343,.210,.188)),.018);
  float eye=almond(socket-vec3(.001,.001,-.018),vec3(.322,.195,.147));
  vec3 nostril=vec3(abs(p.x)-.039,p.y+.515,p.z-.538);
  float nostrils=ellipsoid(nostril,vec3(.023,.021,.049));
  float nostrilShade=1.-smoothstep(.0,.014,nostrils);
  vec3 lip=p-vec3(0.,-.706,.466);
  lip.y+=.66*lip.x*lip.x;
  head=max(head,-ellipsoid(lip,vec3(.113,.010,.050)));
  return head<eye?vec2(head,nostrilShade*.8):vec2(eye,1.);
}
vec3 normalAt(vec3 p) {
  vec2 e=vec2(.0027,0.);
  return normalize(vec3(model(p+e.xyy).x-model(p-e.xyy).x,
    model(p+e.yxy).x-model(p-e.yxy).x,model(p+e.yyx).x-model(p-e.yyx).x));
}
vec3 rotateY(vec3 p,float a) {
  return vec3(cos(a)*p.x+sin(a)*p.z,p.y,-sin(a)*p.x+cos(a)*p.z);
}
float softbox(vec3 r,vec3 xyz,vec2 extent,float softness) {
  vec3 aim=normalize(xyz);
  vec3 right=normalize(cross(vec3(0.,1.,0.),aim));
  vec3 up=cross(aim,right);
  vec2 distanceToEdge=abs(vec2(dot(r,right),dot(r,up)))-extent;
  return (1.-smoothstep(-softness,softness,max(distanceToEdge.x,distanceToEdge.y)))
    *smoothstep(.25,.45,dot(r,aim));
}
void main() {
  vec2 uv=(gl_FragCoord.xy-.5*size)/size.y;
  uv=(uv-vec2(0.,.025))/zoom;
  vec3 origin=rotateY(vec3(0.,.09,4.15),angle);
  vec3 ray=rotateY(normalize(vec3(uv*2.15,-3.4)),angle);
  vec3 offset=origin-vec3(0.,.05,0.);
  float middle=-dot(offset,ray);
  float intersection=middle*middle-dot(offset,offset)+1.55;
  if(intersection<0.){gl_FragColor=vec4(0.);return;}
  float radius=sqrt(intersection);
  float travel=max(2.80,middle-radius);
  float limit=min(5.55,middle+radius);
  vec2 hit=vec2(1.,0.);
  vec3 p=origin;
  for(int i=0;i<112;i++){
    p=origin+ray*travel;
    hit=model(p);
    if(hit.x<.0019||travel>limit) break;
    travel+=hit.x*.92;
  }
  if(travel>limit||hit.x>.0038){gl_FragColor=vec4(0.);return;}
  vec3 n=rotateY(normalAt(p),-angle);
  vec3 eyeDir=rotateY(-ray,-angle);
  vec3 reflected=reflect(-eyeDir,n);
  float key=softbox(reflected,vec3(-.66,.68,.77),vec2(.43,.29),.12);
  float strip=softbox(reflected,vec3(.89,.08,.19),vec2(.104,.72),.085);
  float rim=softbox(reflected,vec3(-.90,.21,-.56),vec2(.21,.65),.13);
  float floorBounce=1.-smoothstep(-.93,-.11,reflected.y);
  float horizon=1.-smoothstep(.018,.27,abs(reflected.y+.22));
  float skylight=smoothstep(-.10,.75,reflected.y);
  float diffuse=max(dot(n,normalize(vec3(-.6,.65,.52))),0.);
  float brightness=.115+.23*skylight+.16*floorBounce+.25*horizon
    +.70*key+.70*strip+.56*rim+.09*diffuse;
  float spill=softbox(reflected,vec3(.93,.05,.25),vec2(.49,.68),.26);
  float redEdge=max(dot(n,normalize(vec3(.88,.02,-.38))),0.);
  vec3 metal=vec3(.92,.966,1.)*brightness;
  metal=mix(metal,metal*vec3(1.08,.57,.43)+vec3(.75,.085,.028)*spill,redLight*(.23+.77*spill));
  metal+=vec3(.32,.033,.011)*pow(redEdge,2.)*redLight;
  vec3 lens=vec3(.009,.012,.016)+vec3(.20,.215,.235)*(key*.92+strip*.95+rim*.5)
    +vec3(.026,.029,.034)*horizon;
  vec2 photoUV=vec2(.52+(.31-abs(p.x))*1.44,.50+(p.y+.177)*1.31);
  vec3 reflection=texture2D(portrait,clamp(photoUV,0.,1.)).rgb;
  float mirror=portraitMix*smoothstep(.05,.80,dot(n,eyeDir));
  lens=mix(lens,lens*.48+reflection*vec3(.91,.68,.48),mirror);
  lens+=vec3(.27,.025,.009)*spill*redLight;
  gl_FragColor=vec4(min(vec3(1.),mix(metal,lens,hit.y)),1.);
}
`;

  function createRenderer(canvas) {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: false,
    });
    if (!gl) return null;

    function compile(type, source) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    }

    const vertex = compile(gl.VERTEX_SHADER, "attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}");
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const size = gl.getUniformLocation(program, "size");
    const angle = gl.getUniformLocation(program, "angle");
    const zoom = gl.getUniformLocation(program, "zoom");
    const redLight = gl.getUniformLocation(program, "redLight");
    const portraitMix = gl.getUniformLocation(program, "portraitMix");

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let portraitReady = false;
    const portrait = new Image();
    portrait.onload = () => {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, portrait);
      portraitReady = true;
    };
    portrait.src = "/assets/chrome-intro-reflection.jpg";

    return {
      resize(width, height) {
        const pixelScale = Math.min(1, Math.sqrt(225000 / (width * height)));
        canvas.width = Math.max(1, Math.round(width * pixelScale));
        canvas.height = Math.max(1, Math.round(height * pixelScale));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(size, canvas.width, canvas.height);
      },
      draw(rotation, distance, red, reflection) {
        gl.uniform1f(angle, rotation);
        gl.uniform1f(zoom, distance);
        gl.uniform1f(redLight, red);
        gl.uniform1f(portraitMix, portraitReady ? reflection : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      dispose() {
        portrait.onload = null;
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        canvas.width = canvas.height = 1;
      },
    };
  }

  const dialog = document.querySelector("[data-chrome-intro]");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let siteReducedMotion = false;
  try {
    siteReducedMotion = localStorage.getItem("yfa-access-reduce") === "1";
  } catch {}
  if (!dialog?.showModal || reducedMotion.matches || siteReducedMotion) return;

  const canvas = dialog.querySelector("canvas");
  const light = dialog.querySelector(".yfa-chrome-intro__light");
  const orbit = dialog.querySelector(".yfa-chrome-intro__orbit");
  const logo = dialog.querySelector(".yfa-chrome-intro__logo");
  const hint = dialog.querySelector(".yfa-chrome-intro__hint");
  const skip = dialog.querySelector("button");
  const listeners = new AbortController();
  let renderer;
  try {
    renderer = createRenderer(canvas);
  } catch {
    renderer = null;
  }

  const logoFull = .72;
  const exitPoint = .82;
  const logoHoldMs = 520;
  const autoDurationMs = 6500;
  const smooth = (start, end, value) => {
    const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return t * t * (3 - 2 * t);
  };

  let progress = renderer ? 0 : logoFull;
  let frame;
  let lastFrame = performance.now();
  let autoResume = lastFrame + 280;
  let logoSince;
  let viewportScale = 1;
  let leaving = false;
  let pointerId;
  let touchY;

  function resize() {
    const width = dialog.clientWidth;
    const height = dialog.clientHeight;
    if (!width || !height) return;
    renderer?.resize(width, height);
    viewportScale = Math.min(1, width / height / .98);
  }

  function render() {
    const pullback = smooth(0, .45, progress);
    const flash = smooth(.29, .50, progress) * (1 - smooth(.55, .63, progress));
    const head = renderer ? 1 - smooth(.55, .64, progress) : 0;
    canvas.style.opacity = head;
    canvas.style.transform = `translateX(${12 * (1 - pullback) * viewportScale}%)`;
    light.style.opacity = (.61 + .31 * flash) * head;
    orbit.style.opacity = (.19 + .55 * smooth(.07, .31, progress)) * head;
    logo.style.opacity = smooth(.64, logoFull, progress);
    hint.style.opacity = .8 * head;
    if (head > 0) {
      const rotation = -1.13 + (2 * Math.PI + 1.13) * smooth(0, .57, progress);
      renderer.draw(rotation, (1.46 - .57 * pullback) * viewportScale, .57 + .38 * flash, flash * .92);
    }
  }

  function finish(instant = false) {
    if (leaving) return;
    leaving = true;
    listeners.abort();
    cancelAnimationFrame(frame);
    dialog.classList.add("is-leaving");

    function close() {
      dialog.close();
      renderer?.dispose();
      document.body.classList.remove("is-intro-open");
      document.getElementById("main")?.focus({ preventScroll: true });
    }

    if (instant) close();
    else setTimeout(close, 650);
  }

  function tick(now) {
    const elapsed = now - lastFrame;
    if (elapsed < 32) {
      frame = requestAnimationFrame(tick);
      return;
    }
    lastFrame = now;
    if (now >= autoResume && pointerId === undefined) {
      progress = Math.min(exitPoint, progress + elapsed * exitPoint / autoDurationMs);
    }
    if (progress >= logoFull) logoSince ??= now;
    else logoSince = undefined;
    render();
    if (progress >= exitPoint && now - logoSince >= logoHoldMs) finish();
    else frame = requestAnimationFrame(tick);
  }

  function scrub(pixels) {
    const delta = Math.max(-.09, Math.min(.09, pixels / 1100));
    autoResume = performance.now() + 620;
    progress = Math.max(renderer ? 0 : logoFull, Math.min(exitPoint, progress + delta));
  }

  logo.src = logo.dataset.logoSrc;
  dialog.showModal();
  document.body.classList.add("is-intro-open");
  const { signal } = listeners;
  window.addEventListener("resize", resize, { signal });
  document.addEventListener("visibilitychange", () => {
    lastFrame = performance.now();
  }, { signal });
  reducedMotion.addEventListener("change", event => {
    if (event.matches) finish(true);
  }, { signal });
  canvas.addEventListener("webglcontextlost", () => {
    renderer?.dispose();
    renderer = null;
    progress = Math.max(progress, logoFull);
  }, { signal });
  skip.addEventListener("click", () => finish(), { signal });
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    finish();
  }, { signal });
  dialog.addEventListener("wheel", event => {
    if (event.ctrlKey) return;
    event.preventDefault();
    const distance = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    scrub(distance * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 250 : 1));
  }, { passive: false, signal });
  dialog.addEventListener("keydown", event => {
    const forward = ["ArrowDown", "ArrowRight", "PageDown"];
    const backward = ["ArrowUp", "ArrowLeft", "PageUp"];
    if (!forward.includes(event.key) && !backward.includes(event.key)) return;
    event.preventDefault();
    scrub(forward.includes(event.key) ? 100 : -100);
  }, { signal });
  dialog.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.pointerType === "mouse" || event.target === skip) return;
    pointerId = event.pointerId;
    touchY = event.clientY;
    dialog.setPointerCapture(pointerId);
  }, { signal });
  dialog.addEventListener("pointermove", event => {
    if (event.pointerId !== pointerId) return;
    scrub((touchY - event.clientY) * 2.4);
    touchY = event.clientY;
  }, { signal });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    dialog.addEventListener(type, event => {
      if (event.pointerId === pointerId) pointerId = undefined;
    }, { signal });
  }
  resize();
  render();
  frame = requestAnimationFrame(tick);
})();
