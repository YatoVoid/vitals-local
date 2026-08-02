/* BodyMap, four views, region-level detail, mirrored geometry.
 *
 * Views: front, back, left, right. Front and back share one silhouette,
 * left and right share a profile. Each view draws its centre-line shapes
 * once and its side shapes twice, the second pass through an SVG mirror
 * transform, so a limb is authored one time and stays symmetric for free.
 *
 * Side is anatomical, never positional: a front-facing figure has its left
 * on the viewer's right, and that inverts in the back view. Recording this
 * backwards files a complaint against the wrong side of a body, so the
 * mapping lives in one table with a test asserting it.
 */

const W = 240, H = 560;

/* The authoring space. Marks are stored against this, never against a crop. */
export const BODY_W = W, BODY_H = H;

/* ---- Front and back: shapes on the centre line ----
 * Centre is x=120. Vertical bands never overlap: chest 108-180, upper
 * abdomen 180-222, lower abdomen 222-270, pelvis 270-304, leg 304-536.
 */
const CENTRE = [
  { key: 'head',    d: 'M120 12c19 0 33 16 33 37 0 22-14 39-33 39s-33-17-33-39c0-21 14-37 33-37Z' },
  { key: 'neck',    d: 'M106 82h28v26h-28Z' },
  { key: 'midriff', d: 'M90 180h60v42H90Z' },
  { key: 'pelvis',  d: 'M92 270h56v34H92Z' },
];

/* ---- Front and back: shapes mirrored across the centre line ----
 * The torso half occupies x 90..119, so every limb stays left of x=90.
 * A limb wider than that lands on top of the torso once the mirror pass
 * runs, which is what turns a figure into a pile of boxes.
 */
const SIDES = [
  { key: 'shoulder', d: 'M118 106 66 118l-4 28 48-8Z' },
  { key: 'ribs',     d: 'M90 108h29v72l-27-3Z' },
  { key: 'flank',    d: 'M90 222h29v48l-27-2Z' },
  { key: 'upperarm', d: 'M62 146l26-4-3 72-27 3Z' },
  { key: 'elbow',    d: 'M58 221l27-3v28l-27 3Z' },
  { key: 'forearm',  d: 'M58 249l27-3-4 60-27 3Z' },
  { key: 'hand',     d: 'M52 309h30v44H50Z' },
  { key: 'thigh',    d: 'M92 304h27l-3 82H90Z' },
  { key: 'knee',     d: 'M90 386h28v28H90Z' },
  { key: 'shin',     d: 'M90 414h28l-2 78H92Z' },
  { key: 'foot',     d: 'M92 492h26v42H80Z' },
];

/* ---- Profile: the body seen edge on, facing low x ----
 * The torso and legs hold one column at x 88..122. The arm hangs just
 * behind it at x 118..148, where an arm falls on a figure seen side on. The
 * foot is the only shape that breaks the column, since a foot points forward.
 */
const PROFILE = [
  { key: 'head',      d: 'M120 12c19 0 33 16 33 37 0 22-14 39-33 39-18 0-30-17-30-39 0-21 12-37 30-37Z' },
  { key: 'neck',      d: 'M104 82h28v26h-28Z' },
  { key: 'shoulder',  d: 'M98 106l44 12 2 28-46-8Z' },
  { key: 'chestside', d: 'M88 108h34v72l-32-3Z' },
  { key: 'flankside', d: 'M88 180h34v42H88Z' },
  { key: 'hipside',   d: 'M88 222h36v50H88Z' },
  { key: 'upperarm',  d: 'M122 146l24-2-3 72-25 2Z' },
  { key: 'elbow',     d: 'M118 220l25-2v28l-25 2Z' },
  { key: 'forearm',   d: 'M118 248l25-2-4 60-25 2Z' },
  { key: 'hand',      d: 'M114 308h28v44h-30Z' },
  { key: 'thigh',     d: 'M88 272h36l-2 82H88Z' },
  { key: 'knee',      d: 'M88 354h34v28H88Z' },
  { key: 'calf',      d: 'M88 382h34l-2 78H90Z' },
  { key: 'foot',      d: 'M90 460h30v44H70Z' },
];

/* Screen side to anatomical side. `n` is the shape as authored, which
   renders on the viewer's left; `m` is its mirror. */
const SIDE_MAP = {
  front: { n: 'right', m: 'left' },
  back:  { n: 'left',  m: 'right' },
};

const IDS = {
  front: {
    head: 'head.face', neck: 'neck.front', midriff: 'abdomen.upper', pelvis: 'pelvis',
    shoulder: 'shoulder', ribs: 'chest', flank: 'abdomen.lower',
    upperarm: 'arm.upper', elbow: 'elbow', forearm: 'arm.fore', hand: 'hand',
    thigh: 'thigh', knee: 'knee', shin: 'shin', foot: 'foot',
  },
  back: {
    head: 'head.back', neck: 'neck.back', midriff: 'back.mid', pelvis: 'pelvis.back',
    shoulder: 'shoulder.blade', ribs: 'back.upper', flank: 'back.lower',
    upperarm: 'arm.upper', elbow: 'elbow', forearm: 'arm.fore', hand: 'hand',
    thigh: 'hamstring', knee: 'knee.back', shin: 'calf', foot: 'heel',
  },
  profile: {
    head: 'head.side', neck: 'neck.side', shoulder: 'shoulder', chestside: 'chest.side',
    flankside: 'flank', hipside: 'hip', upperarm: 'arm.upper', elbow: 'elbow',
    forearm: 'arm.fore', hand: 'hand', thigh: 'thigh', knee: 'knee',
    calf: 'calf', foot: 'foot',
  },
};

/* Regions that exist once on the body and take no side suffix. */
const UNSIDED = new Set([
  'head.face', 'head.back', 'neck.front', 'neck.back',
  'abdomen.upper', 'back.mid', 'pelvis', 'pelvis.back',
]);

/** Region id for one shape in one view. */
export function regionIdFor(shape, view, mirrored = false) {
  if (view === 'left' || view === 'right') {
    const base = IDS.profile[shape.key];
    return UNSIDED.has(base) ? base : `${base}.${view}`;
  }
  const base = IDS[view][shape.key];
  if (UNSIDED.has(base)) return base;
  return `${base}.${mirrored ? SIDE_MAP[view].m : SIDE_MAP[view].n}`;
}

export const VIEWS = ['front', 'back', 'left', 'right'];

/* ---- Zoom areas ----
 *
 * A whole body is tall and thin; the space a phone gives it is nearly square,
 * so the figure is height-bound and the limb zones come out around 30px on
 * their short axis. Cropping the viewBox to one area spends the width that
 * was going to waste and lifts every zone in that area well past 44px.
 *
 * These are crops of the same artwork, so no shape, id, or label changes and
 * a zoomed tap is the same tap.
 *
 * `box` is [x, y, width, height] in the 240 x 560 authoring space.
 */
export const ZOOMS = [
  { id: 'all',   label: 'Whole body', box: [0, 0, 240, 560] },
  { id: 'head',  label: 'Head',       box: [58, 0, 124, 124] },
  { id: 'torso', label: 'Torso',      box: [44, 96, 152, 220] },
  { id: 'arms',  label: 'Arms',       box: [36, 96, 168, 270] },
  { id: 'legs',  label: 'Legs',       box: [64, 294, 112, 252] },
];

export function zoomById(id) {
  return ZOOMS.find(z => z.id === id) ?? ZOOMS[0];
}

/** Every region id a view can produce, in draw order. */
export function regionsIn(view) {
  if (view === 'left' || view === 'right') {
    return PROFILE.map(s => regionIdFor(s, view));
  }
  return [
    ...CENTRE.map(s => regionIdFor(s, view)),
    ...SIDES.map(s => regionIdFor(s, view, false)),
    ...SIDES.map(s => regionIdFor(s, view, true)),
  ];
}

const NS = 'http://www.w3.org/2000/svg';

function zonePath(d, id, label) {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d);
  p.setAttribute('class', 'zone');
  p.dataset.region = id;
  p.setAttribute('role', 'button');
  p.setAttribute('tabindex', '0');
  p.setAttribute('aria-label', label);
  p.setAttribute('aria-pressed', 'false');
  return p;
}

/**
 * Draw one view.
 * @param {'front'|'back'|'left'|'right'} view
 * @param {(id: string) => string} labelFor
 * @param {string} [zoomId] one of ZOOMS, defaults to the whole body
 * @returns {SVGSVGElement}
 */
export function renderBody(view, labelFor, zoomId = 'all') {
  const zoom = zoomById(zoomId);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', zoom.box.join(' '));
  svg.setAttribute('class', 'bodymap__svg');
  svg.dataset.zoom = zoom.id;
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', zoom.id === 'all'
    ? `Body, ${view} view`
    : `${zoom.label}, ${view} view`);

  /* The outline must live inside the group it traces. Outside it, the mirror
     transform is not inherited and the trace lands twice on one half. */
  const traceFor = shapes => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('class', 'bodymap__trace');
    p.setAttribute('d', shapes.map(x => x.d).join(' '));
    p.setAttribute('aria-hidden', 'true');
    return p;
  };

  const group = (shapes, mirrored) => {
    const g = document.createElementNS(NS, 'g');
    if (mirrored) g.setAttribute('transform', `translate(${W},0) scale(-1,1)`);
    shapes.forEach(shape => {
      const id = regionIdFor(shape, view, mirrored);
      g.appendChild(zonePath(shape.d, id, labelFor(id)));
    });
    g.appendChild(traceFor(shapes));
    return g;
  };

  if (view === 'left' || view === 'right') {
    // The profile is authored facing one way; the other view turns it round.
    svg.appendChild(group(PROFILE, view === 'right'));
  } else {
    svg.append(
      group(CENTRE, false),
      group(SIDES, false),
      group(SIDES, true),
    );
  }

  return svg;
}
