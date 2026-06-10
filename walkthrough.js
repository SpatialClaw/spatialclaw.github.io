/* ===== Auto-playing benchmark walkthrough carousel ===== */
(function () {
  const root = document.getElementById('watch-solve');
  if (!root) return;
  const wt = root.querySelector('#wtCard');
  const wtTop = root.querySelector('#wtTop');
  const screen = root.querySelector('#wtScreen');
  const wtProg = root.querySelector('#wtProg');
  const playBtn = root.querySelector('.wt-play');
  const playIcon = playBtn.querySelector('i');
  const restartBtn = root.querySelector('.wt-restart');
  const stepLabel = root.querySelector('.wt-steplabel');
  const stepCount = root.querySelector('.wt-stepcount');
  const dotsWrap = root.querySelector('#wtDots');
  const ccount = root.querySelector('#wtCcount');
  const prevBtn = root.querySelector('.wt-nav.prev');
  const nextBtn = root.querySelector('.wt-nav.next');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SAMPLES = [
    {
      cat: { cls: 'mv', label: 'Multi-view' }, bench: 'MMSI', model: 'Gemma 4-31B · sample 76',
      href: 'samples/datasets/mmsi/samples/76__gemma3vl.html', base: 'samples/assets/mmsi/gemma3vl/76/',
      q: 'Assuming that in <strong>Figure 4</strong> the wall holding the sink faces <strong>east</strong> (outward = east), in <strong>Figure 1</strong> what is the position of the <strong>door</strong> relative to the <strong>sink</strong>?',
      opts: [{ label: 'A · Northeast', correct: true }, { label: 'B · Southwest' }, { label: 'C · Southeast' }, { label: 'D · Northwest' }],
      answerLine: 'SpatialClaw answered <strong>A · Northeast</strong>, matching the ground truth.',
      frames: [['00', 'Fig 1'], ['01', 'Fig 2'], ['02', 'Fig 3'], ['03', 'Fig 4']],
      steps: [
        { t: 'plan', tick: 'Plan', text: "Resolve the custom frame: <b>East</b> = outward normal of the sink's wall, <b>North</b> = Up × East. Segment the sink (Fig 4) and the door (Fig 1), reconstruct in 3D, then project the door→sink vector onto the axes to read off the quadrant." },
        { t: 'code', tick: 'Segment', who: 'Step 1 · code', sub: 'locate + segment', code: `# Locate, then segment the sink (Fig 4) and the door (Fig 1)
sink_box = vlm.locate(InputImages[3], "the sink")
door_box = vlm.locate(InputImages[0], "the wooden door")
seg_sink = tools.SAM3.segment_image_by_box(InputImages[3], sink_box, "sink")
seg_door = tools.SAM3.segment_image_by_box(InputImages[0], door_box, "door")
show([seg_sink.visualize(), seg_door.visualize()])   # inspect the masks` },
        { t: 'fb', tick: 'Inspect', who: 'Feedback · show()', icon: 'image', ok: true, body: "<b>show_0001</b> rendered: both mask areas are non-empty, so no empty masks. Segmentation visually verified.", masks: [['show_0001_img_1.jpg', 'SAM 3 · sink mask (Fig 4)'], ['show_0001_img_3.jpg', 'SAM 3 · door mask (Fig 1)']] },
        { t: 'code', tick: 'Reconstruct', who: 'Step 2 · code', sub: 'reconstruct + custom basis', code: `# Reconstruct 3D, then build a custom East/North basis
recon    = tools.Reconstruct(InputImages)        # depth · pose · points
sink_pos = seg_sink.get_centroid_3d(recon, frame=3)
door_pos = seg_door.get_centroid_3d(recon, frame=0)
# East = outward normal of the sink's wall (RANSAC plane fit)
normal, _ = tools.Geometry.fit_plane_ransac(wall_pts, conf)
v_east  = normal / np.linalg.norm(normal)
v_north = np.cross([0, 1, 0], v_east)        # North = Up × East` },
        { t: 'fb', tick: 'Kernel state', who: 'Feedback · kernel state', icon: 'cube', body: "Status: <b>Success</b> · 180.3s\nsink_pos = <b>[ 5.16,  0.55,  0.80]</b>\ndoor_pos = <b>[-1.07,  1.49, -2.56]</b>\nnew vars: v_east, v_north   (custom basis ✓)" },
        { t: 'code', tick: 'Project', who: 'Step 3 · code', sub: 'project onto the basis', code: `# Project the door→sink vector onto the custom basis
v_rel   = door_pos - sink_pos
d_east  = np.dot(v_rel, v_east)     # → +5.61   (East)
d_north = np.dot(v_rel, v_north)    # → +4.33   (North)
# +East and +North  ⇒  North-East quadrant
ReturnAnswer("A")                   # A · Northeast` },
        { t: 'answer', tick: 'Answer', vt: 'A · Northeast', vs: "East proj <b>+5.61</b>, North proj <b>+4.33</b>: both positive, the North-East quadrant. <b>Matches ground truth ✓</b>" }
      ]
    },
    {
      cat: { cls: 'si', label: 'Single-image' }, bench: 'Omni3D', model: 'Gemma 4-31B · sample 146',
      href: 'samples/datasets/omni3d/samples/146__gemma3vl.html', base: 'samples/assets/omni3d/gemma3vl/146/',
      q: 'If the right-most <strong>chair</strong> is <strong>0.2 m</strong> wide, how tall is the wooden <strong>cabinet</strong>?',
      metricNote: 'Numeric answer, in metres',
      answerLine: 'SpatialClaw answered <strong>≈ 0.35 m</strong>, within ~1 cm of the ground truth (0.344 m).',
      frames: [['00', 'Input']],
      steps: [
        { t: 'plan', tick: 'Plan', text: "The chair sets the scale: its 0.2 m width fixes real-world units. Segment the right-most chair and the cabinet, reconstruct in 3D, measure both in the same units, then convert the cabinet's height with that scale." },
        { t: 'code', tick: 'Segment', who: 'Step 1 · code', sub: 'locate + segment', code: `# Segment the reference chair and the target cabinet
seg_chair   = tools.SAM3.segment_image_by_box(InputImages[0], vlm.locate(InputImages[0], "the right-most chair"), "chair")
seg_cabinet = tools.SAM3.segment_image_by_box(InputImages[0], vlm.locate(InputImages[0], "the wooden cabinet"), "cabinet")
show([seg_chair.visualize(), seg_cabinet.visualize()])` },
        { t: 'fb', tick: 'Inspect', who: 'Feedback · show()', icon: 'image', ok: true, body: "Both masks are clean and non-empty. The chair and the cabinet are isolated for measurement.", masks: [['show_0001_img_0.jpg', 'SAM 3 · chair mask'], ['show_0001_img_1.jpg', 'SAM 3 · cabinet mask']] },
        { t: 'code', tick: 'Reconstruct', who: 'Step 2 · code', sub: 'reconstruct + scale', code: `# Reconstruct, then measure both objects in the same 3D units
recon     = tools.Reconstruct(InputImages)
chair_pts = seg_chair.get_points_3d(recon)
cab_pts   = seg_cabinet.get_points_3d(recon)
chair_w   = tools.Geometry.extent(chair_pts, axis="x")    # chair width, recon units
cab_h     = tools.Geometry.extent(cab_pts,   axis="y")    # cabinet height, recon units
scale     = 0.2 / chair_w                                 # metres per unit, from the 0.2 m chair` },
        { t: 'fb', tick: 'Scale', who: 'Feedback · result', icon: 'cube', body: "Scale fixed from the chair's 0.2 m width.\ncabinet height = cab_h × scale\nResult: ≈ 0.35 m" },
        { t: 'code', tick: 'Convert', who: 'Step 3 · code', sub: 'convert + answer', code: `# Convert the cabinet height into metres
height_m = cab_h * scale
ReturnAnswer(f"{height_m:.2f}")    # → 0.35` },
        { t: 'answer', tick: 'Answer', vt: '≈ 0.35 m', vs: "Cabinet height recovered from the chair scale. Ground truth 0.344 m, within ~1 cm. <b>Correct ✓</b>" }
      ]
    },
    {
      cat: { cls: 'vid', label: 'Video & 4D' }, bench: 'VSI-Bench-U', model: 'Gemma 4-31B · sample 930',
      href: 'samples/datasets/vsibench_unbiased/samples/930__gemma3vl.html', base: 'samples/assets/vsibench_unbiased/gemma3vl/930/',
      q: 'Measuring from the closest point of each object, what is the distance between the <strong>stool</strong> and the <strong>washer</strong> (in metres)?',
      metricNote: 'Numeric answer, in metres',
      answerLine: 'SpatialClaw answered <strong>≈ 1.16 m</strong>, within ~4 cm of the ground truth (1.2 m).',
      frames: [['00', 'Frame 1'], ['01', 'Frame 2'], ['02', 'Frame 3'], ['03', 'Frame 4']],
      steps: [
        { t: 'plan', tick: 'Plan', text: "Find the stool and the washer in the clearest frames and segment both, reconstruct a metric point cloud of the room, then measure the smallest distance between the two object point sets (closest point, not centroid)." },
        { t: 'code', tick: 'Segment', who: 'Step 1 · code', sub: 'locate + segment', code: `# Locate and segment the stool and the washer in their clearest frames
seg_stool  = tools.SAM3.segment_image_by_box(InputImages[2], vlm.locate(InputImages[2], "the stool"), "stool")
seg_washer = tools.SAM3.segment_image_by_box(InputImages[5], vlm.locate(InputImages[5], "the washing machine"), "washer")
show([seg_stool.visualize(), seg_washer.visualize()])` },
        { t: 'fb', tick: 'Inspect', who: 'Feedback · show()', icon: 'image', ok: true, body: "Masks are non-empty in their key frames. Both objects are ready to lift into 3D.", masks: [['show_0001_img_0.jpg', 'SAM 3 · stool mask'], ['show_0001_img_1.jpg', 'SAM 3 · washer mask']] },
        { t: 'code', tick: 'Reconstruct', who: 'Step 2 · code', sub: 'reconstruct + closest point', code: `# Reconstruct the video to a metric cloud, then measure closest points
recon      = tools.Reconstruct(InputImages)
stool_pts  = seg_stool.get_points_3d(recon, frame=2)
washer_pts = seg_washer.get_points_3d(recon, frame=5)
from scipy.spatial import cKDTree
d_min      = cKDTree(stool_pts).query(washer_pts)[0].min()` },
        { t: 'fb', tick: 'Distance', who: 'Feedback · result', icon: 'cube', body: "Closest-point distance between the stool and washer point sets:\nd_min ≈ 1.16 m" },
        { t: 'code', tick: 'Solve', who: 'Step 3 · code', sub: 'answer', code: `ReturnAnswer(f"{d_min:.2f}")     # → 1.16` },
        { t: 'answer', tick: 'Answer', vt: '≈ 1.16 m', vs: "Closest-point distance from the reconstructed cloud. Ground truth 1.2 m, within ~4 cm. <b>Correct ✓</b>" }
      ]
    },
    {
      cat: { cls: 'si', label: 'Single-image' }, bench: 'SPBench', model: 'Gemma 4-31B · sample MV_246',
      href: 'samples/datasets/spbench/samples/MV_246__gemma3vl.html', base: 'samples/assets/spbench/gemma3vl/MV_246/',
      q: 'Standing by the <strong>laptop</strong> and facing the <strong>chair</strong>, is the <strong>monitor</strong> to my left-front, left-back, right-front, or right-back?',
      opts: [{ label: 'A · left-front' }, { label: 'B · left-back' }, { label: 'C · right-front', correct: true }, { label: 'D · right-back' }],
      answerLine: 'SpatialClaw answered <strong>C · right-front</strong>, matching the ground truth.',
      frames: [['00', 'View 1'], ['01', 'View 2'], ['02', 'View 3'], ['03', 'View 4']],
      steps: [
        { t: 'plan', tick: 'Plan', text: "Stand at the laptop and face the chair: that fixes a viewer frame (forward = chair − laptop, right = forward × up). Segment the laptop, chair, and monitor, reconstruct in 3D, then read off where the monitor falls." },
        { t: 'code', tick: 'Segment', who: 'Step 1 · code', sub: 'locate + segment', code: `# Segment the viewer anchors: laptop, chair, monitor
seg_laptop  = tools.SAM3.segment_image_by_box(InputImages[0], vlm.locate(InputImages[0], "the laptop"),  "laptop")
seg_chair   = tools.SAM3.segment_image_by_box(InputImages[0], vlm.locate(InputImages[0], "the chair"),   "chair")
seg_monitor = tools.SAM3.segment_image_by_box(InputImages[0], vlm.locate(InputImages[0], "the monitor"), "monitor")
show([seg_laptop.visualize(), seg_chair.visualize(), seg_monitor.visualize()])` },
        { t: 'fb', tick: 'Inspect', who: 'Feedback · show()', icon: 'image', ok: true, body: "All three masks are clean. The viewer's anchors are localized.", masks: [['show_0001_img_0.jpg', 'SAM 3 · laptop + chair'], ['show_0001_img_1.jpg', 'SAM 3 · monitor mask']] },
        { t: 'code', tick: 'Frame', who: 'Step 2 · code', sub: 'reconstruct + viewer frame', code: `# Build the viewer frame (at the laptop, facing the chair), then plot a top-down view
recon   = tools.Reconstruct(InputImages)
laptop  = seg_laptop.get_centroid_3d(recon)
chair   = seg_chair.get_centroid_3d(recon)
monitor = seg_monitor.get_centroid_3d(recon)
forward = normalize(chair - laptop)        # facing the chair
right   = np.cross(forward, up)            # the viewer's right
plt.scatter(*bev([laptop, chair, monitor])); plt.show()` },
        { t: 'fb', tick: 'Frame', who: 'Feedback · result', icon: 'cube', body: "Viewer basis built and the top-down view rendered. The monitor sits ahead of and to the right of the laptop.", masks: [['show_0002_img_0.jpg', 'matplotlib · top-down view']] },
        { t: 'code', tick: 'Project', who: 'Step 3 · code', sub: 'project + answer', code: `v = monitor - laptop
f = np.dot(v, forward)     # → +  : in front
r = np.dot(v, right)       # → +  : to the right
# +front and +right  ⇒  right-front
ReturnAnswer("C")          # C · right-front` },
        { t: 'answer', tick: 'Answer', vt: 'C · right-front', vs: "Monitor projects to +front and +right in the viewer frame. <b>Matches ground truth ✓</b>" }
      ]
    },
    {
      cat: { cls: 'gs', label: 'General spatial' }, bench: 'ViewSpatial', model: 'Gemma 4-31B · sample 5449',
      href: 'samples/datasets/viewspatial/samples/5449__gemma3vl.html', base: 'samples/assets/viewspatial/gemma3vl/5449/',
      q: 'Imagine standing at the <strong>desk</strong> looking towards the <strong>television</strong>. Where is the <strong>toilet</strong>?',
      opts: [{ label: 'A · back-left' }, { label: 'B · back-right' }, { label: 'C · front', correct: true }, { label: 'D · back' }],
      answerLine: 'SpatialClaw answered <strong>C · front</strong>, matching the ground truth.',
      frames: [['00', 'View 1'], ['01', 'View 2'], ['02', 'View 3'], ['03', 'View 4']],
      steps: [
        { t: 'plan', tick: 'Plan', text: "Stand at the desk and look toward the television: forward = television − desk. Segment the desk, television, and toilet, reconstruct in 3D, build the viewer's facing axes, then classify where the toilet lies." },
        { t: 'code', tick: 'Segment', who: 'Step 1 · code', sub: 'locate + segment', code: `# Segment the viewer anchors: desk, television, toilet
seg_desk = tools.SAM3.segment_image_by_box(InputImages[0], vlm.locate(InputImages[0], "the desk"), "desk")
seg_tv   = tools.SAM3.segment_image_by_box(InputImages[1], vlm.locate(InputImages[1], "the television"), "tv")
seg_toil = tools.SAM3.segment_image_by_box(InputImages[3], vlm.locate(InputImages[3], "the toilet"), "toilet")
show([seg_desk.visualize(), seg_tv.visualize(), seg_toil.visualize()])` },
        { t: 'fb', tick: 'Inspect', who: 'Feedback · show()', icon: 'image', ok: true, body: "Masks verified for the desk, television, and toilet across their frames.", masks: [['show_0001_img_0.jpg', 'SAM 3 · desk mask'], ['show_0001_img_1.jpg', 'SAM 3 · TV mask']] },
        { t: 'code', tick: 'Axis', who: 'Step 2 · code', sub: 'reconstruct + viewer axis', code: `# Reconstruct, build the desk-to-TV viewing axis, visualize
recon   = tools.Reconstruct(InputImages)
desk    = seg_desk.get_centroid_3d(recon, frame=0)
tv      = seg_tv.get_centroid_3d(recon, frame=1)
toilet  = seg_toil.get_centroid_3d(recon, frame=3)
forward = normalize(tv - desk)             # look toward the TV
right   = np.cross(up, forward)
plt.quiver(desk, forward); plt.show()      # sanity-check the axis` },
        { t: 'fb', tick: 'Axis', who: 'Feedback · result', icon: 'cube', body: "Forward axis runs from the desk to the TV. The toilet's offset is dominated by +forward: it lies ahead of the viewer.", masks: [['show_0002_img_0.jpg', 'matplotlib · viewing axis']] },
        { t: 'code', tick: 'Classify', who: 'Step 3 · code', sub: 'classify + answer', code: `v = toilet - desk
print(np.dot(v, forward), np.dot(v, right))   # forward component dominates, positive
# ahead of the viewer  ⇒  front
ReturnAnswer("C")                              # C · front` },
        { t: 'answer', tick: 'Answer', vt: 'C · front', vs: "The toilet lies ahead of the desk-to-TV viewing direction. <b>Matches ground truth ✓</b>" }
      ]
    }
  ];

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function hl(code) {
    return esc(code).split('\n').map(function (line) {
      var codePart = line, comPart = '';
      var m = line.match(/(^|[^"'])(#.*)$/);
      if (m) { var idx = line.indexOf(m[2]); codePart = line.slice(0, idx); comPart = line.slice(idx); }
      codePart = codePart.replace(/("[^"]*")/g, '<span class="s">$1</span>');
      codePart = codePart.replace(/\b(\d+\.?\d*)\b/g, '<span class="m">$1</span>');
      codePart = codePart.replace(/\b([A-Za-z_]\w*)(\s*\()/g, '<span class="f">$1</span>$2');
      return comPart ? codePart + '<span class="c">' + comPart + '</span>' : codePart;
    }).join('\n');
  }

  function renderTop(s) {
    var pills = '<span class="wt-pill ' + s.cat.cls + '">' + s.cat.label + '</span>'
      + '<span class="wt-bench">' + s.bench + '</span>'
      + '<span class="wt-model">· ' + s.model + '</span>'
      + '<a class="wt-src" href="' + s.href + '" target="_blank" rel="noopener">Open full trajectory ↗</a>';
    var opts = (s.opts && s.opts.length)
      ? '<div class="wt-opts">' + s.opts.map(function (o) { return '<span class="wt-opt' + (o.correct ? ' wt-correct' : '') + '">' + o.label + '</span>'; }).join('') + '</div>'
      : '<div class="wt-metricnote">' + (s.metricNote || 'Numeric answer') + '</div>';
    var frames = '<div class="wt-frames">' + s.frames.map(function (f) {
      return '<div class="wt-fr"><img loading="lazy" src="' + s.base + 'kf_input_' + f[0] + '.jpg" alt="' + f[1] + '"><span>' + f[1] + '</span></div>';
    }).join('') + '</div>';
    return '<div class="wt-pills">' + pills + '</div>'
      + '<div class="wt-qlabel">Benchmark question</div>'
      + '<div class="wt-q">' + s.q + '</div>'
      + opts
      + '<div class="wt-final"><i class="fas fa-check-circle"></i> <span>' + s.answerLine + '</span></div>'
      + frames;
  }
  function renderStep(st, base) {
    if (st.t === 'plan') return '<div class="wt-step"><div class="wt-who plan"><i class="fas fa-clipboard-list"></i> Plan</div><div class="wt-text">' + st.text + '</div></div>';
    if (st.t === 'code') return '<div class="wt-step"><div class="wt-who agent"><i class="fas fa-terminal"></i> ' + st.who + (st.sub ? ' <span class="muted">' + st.sub + '</span>' : '') + '</div><pre class="wt-code">' + hl(st.code) + '</pre></div>';
    if (st.t === 'fb') {
      var masks = st.masks ? '<div class="wt-masks' + (st.masks.length === 1 ? ' one' : '') + '">' + st.masks.map(function (mm) { return '<figure class="wt-mask"><img loading="lazy" src="' + base + mm[0] + '" alt=""><figcaption>' + mm[1] + '</figcaption></figure>'; }).join('') + '</div>' : '';
      return '<div class="wt-step"><div class="wt-who fb"><i class="fas fa-' + (st.icon || 'cube') + '"></i> ' + st.who + '</div><div class="wt-fb' + (st.ok ? ' ok' : '') + '">' + st.body + '</div>' + masks + '</div>';
    }
    if (st.t === 'answer') return '<div class="wt-step"><div class="wt-who agent"><i class="fas fa-flag-checkered"></i> Answer</div><div class="wt-verdict"><i class="fas fa-check-circle"></i><div><div class="vt">' + st.vt + '</div><div class="vs">' + st.vs + '</div></div></div></div>';
    return '';
  }
  function durFor(st) { return st.t === 'code' ? 3500 : st.t === 'answer' ? 3200 : st.t === 'fb' ? (st.masks ? 3400 : 3000) : 2400; }

  let steps = [], segs = [], fills = [], DURS = [], N = 0, optCorrect = null, finalLine = null;
  let current = -1, elapsed = 0, playing = false, finished = false, started = false, autoPaused = false, rafId = null, lastTs = 0;
  let idx = 0;
  const setIcon = n => { playIcon.className = 'fas fa-' + n; };

  function render(i) {
    const s = SAMPLES[i];
    wtTop.innerHTML = renderTop(s);
    screen.innerHTML = s.steps.map(function (st) { return renderStep(st, s.base); }).join('');
    wtProg.innerHTML = s.steps.map(function (st) { return '<div class="wt-seg" title="' + st.tick + '"><i></i></div>'; }).join('');
    steps = Array.from(screen.querySelectorAll('.wt-step'));
    segs = Array.from(wtProg.querySelectorAll('.wt-seg'));
    fills = segs.map(function (x) { return x.querySelector('i'); });
    DURS = s.steps.map(durFor);
    N = steps.length;
    optCorrect = wtTop.querySelector('.wt-opt.wt-correct');
    finalLine = wtTop.querySelector('.wt-final');
    segs.forEach(function (seg, j) { seg.addEventListener('click', function () { jumpTo(j); }); });
  }
  function buildDots() {
    dotsWrap.innerHTML = SAMPLES.map(function (s, i) { return '<button class="wt-dot" type="button" aria-label="Sample ' + (i + 1) + ': ' + s.bench + '"></button>'; }).join('');
    Array.from(dotsWrap.querySelectorAll('.wt-dot')).forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
  }
  function updateDots() {
    Array.from(dotsWrap.querySelectorAll('.wt-dot')).forEach(function (d, i) { d.classList.toggle('on', i === idx); });
    if (ccount) ccount.textContent = (idx + 1) + ' / ' + SAMPLES.length + ' · ' + SAMPLES[idx].bench + ' · ' + SAMPLES[idx].cat.label;
  }
  function updateMeta(i) {
    const st = SAMPLES[idx].steps[Math.min(i, N - 1)];
    stepLabel.textContent = (st && st.tick) || 'Ready';
    stepCount.textContent = Math.min(i + 1, N) + ' / ' + N;
  }
  function revealStep(i) {
    const s = steps[i];
    if (!s) return;
    s.classList.add('show');
    screen.scrollTo({ top: Math.max(0, s.offsetTop - 14), behavior: reduce ? 'auto' : 'smooth' });
    if (i === N - 1) { if (optCorrect) optCorrect.classList.add('win'); if (finalLine) finalLine.classList.add('show'); }
    updateMeta(i);
  }
  function updateProgress() {
    segs.forEach(function (seg, j) {
      if (j < current) fills[j].style.width = '100%';
      else if (j === current) fills[j].style.width = Math.min(100, (elapsed / DURS[current]) * 100) + '%';
      else fills[j].style.width = '0%';
    });
  }
  function frame(ts) {
    if (!playing) return;
    if (!lastTs) lastTs = ts;
    elapsed += ts - lastTs; lastTs = ts;
    if (elapsed >= DURS[current]) {
      elapsed = 0; current++;
      if (current >= N) { finish(); return; }
      revealStep(current);
    }
    updateProgress();
    rafId = requestAnimationFrame(frame);
  }
  function play() {
    if (finished || current < 0) { start(); return; }
    if (playing) return;
    playing = true; autoPaused = false; lastTs = 0; setIcon('pause');
    rafId = requestAnimationFrame(frame);
  }
  function pause(auto) { playing = false; autoPaused = !!auto; if (rafId) cancelAnimationFrame(rafId); rafId = null; setIcon('play'); }
  function finish() {
    playing = false; finished = true; if (rafId) cancelAnimationFrame(rafId); rafId = null; current = N;
    fills.forEach(function (f) { f.style.width = '100%'; });
    stepLabel.textContent = 'Solved ✓'; stepCount.textContent = N + ' / ' + N; setIcon('redo');
    restartBtn.style.display = 'none';
  }
  function start() {
    if (rafId) cancelAnimationFrame(rafId);
    finished = false; autoPaused = false; restartBtn.style.display = '';
    steps.forEach(function (s) { s.classList.remove('show'); });
    if (optCorrect) optCorrect.classList.remove('win');
    if (finalLine) finalLine.classList.remove('show');
    screen.scrollTo({ top: 0, behavior: 'auto' });
    current = 0; elapsed = 0; revealStep(0); updateProgress();
    if (reduce) { steps.forEach(function (s) { s.classList.add('show'); }); if (optCorrect) optCorrect.classList.add('win'); if (finalLine) finalLine.classList.add('show'); finish(); return; }
    started = true; playing = true; lastTs = 0; setIcon('pause');
    rafId = requestAnimationFrame(frame);
  }
  function jumpTo(j) {
    if (rafId) cancelAnimationFrame(rafId);
    finished = false; restartBtn.style.display = '';
    steps.forEach(function (s, i) { s.classList.toggle('show', i <= j); });
    if (optCorrect) optCorrect.classList.toggle('win', j >= N - 1);
    if (finalLine) finalLine.classList.toggle('show', j >= N - 1);
    current = j; elapsed = 0; revealStep(j); updateProgress();
    started = true; playing = true; autoPaused = false; lastTs = 0; setIcon('pause');
    rafId = requestAnimationFrame(frame);
  }
  function prepare(i) {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    idx = (i + SAMPLES.length) % SAMPLES.length;
    render(idx); updateDots();
    wt.classList.add('wt-on');
    current = -1; elapsed = 0; playing = false; finished = false; autoPaused = false;
    steps.forEach(function (s) { s.classList.remove('show'); });
    fills.forEach(function (f) { f.style.width = '0%'; });
    stepLabel.textContent = 'Ready'; stepCount.textContent = '0 / ' + N; setIcon('play');
  }
  function go(i) {
    prepare(i);
    if (reduce) { steps.forEach(function (s) { s.classList.add('show'); }); if (optCorrect) optCorrect.classList.add('win'); if (finalLine) finalLine.classList.add('show'); finish(); }
    else { start(); }
  }

  playBtn.addEventListener('click', function () { playing ? pause(false) : play(); });
  restartBtn.addEventListener('click', start);
  prevBtn.addEventListener('click', function () { go(idx - 1); });
  nextBtn.addEventListener('click', function () { go(idx + 1); });

  let tx = 0, ty = 0;
  wt.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
  wt.addEventListener('touchend', function (e) {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? idx + 1 : idx - 1);
  }, { passive: true });

  buildDots();
  prepare(0);
  if (reduce) {
    steps.forEach(function (s) { s.classList.add('show'); });
    if (optCorrect) optCorrect.classList.add('win'); if (finalLine) finalLine.classList.add('show'); finish();
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { if (!started) start(); else if (autoPaused && !finished) play(); }
        else if (playing) { pause(true); }
      });
    }, { threshold: 0.35 });
    io.observe(wt);
  } else { start(); }
})();
