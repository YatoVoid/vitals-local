/* Display vocabulary for the symptom console.
 *
 * Region ids are hierarchical and view-independent: the body map returns an
 * id and nothing downstream needs to know which way the figure was facing.
 * `.left` and `.right` are always the person's own.
 *
 * Clinical logic lives in src/triage/. This file holds labels only.
 */

/* ---- Body regions ----
 * Ids are hierarchical and view-independent. The map hands back an id; the
 * engine never needs to know which way the figure was facing. `.left` and
 * `.right` are always the person's own left and right.
 */
export const REGIONS = {
  'head.face':            { label: 'Face' },
  'head.back':            { label: 'Back of head' },
  'head.side.left':       { label: 'Left side of head' },
  'head.side.right':      { label: 'Right side of head' },
  'neck.front':           { label: 'Front of neck' },
  'neck.back':            { label: 'Back of neck' },
  'neck.side.left':       { label: 'Left side of neck' },
  'neck.side.right':      { label: 'Right side of neck' },

  'chest.left':           { label: 'Left chest' },
  'chest.right':          { label: 'Right chest' },
  'chest.side.left':      { label: 'Left ribs' },
  'chest.side.right':     { label: 'Right ribs' },
  'abdomen.upper':        { label: 'Upper abdomen' },
  'abdomen.lower.left':   { label: 'Lower left abdomen' },
  'abdomen.lower.right':  { label: 'Lower right abdomen' },
  'flank.left':           { label: 'Left flank' },
  'flank.right':          { label: 'Right flank' },
  'pelvis':               { label: 'Pelvis' },
  'pelvis.back':          { label: 'Tailbone' },

  'back.upper.left':      { label: 'Upper left back' },
  'back.upper.right':     { label: 'Upper right back' },
  'back.mid':             { label: 'Mid back' },
  'back.lower.left':      { label: 'Lower left back' },
  'back.lower.right':     { label: 'Lower right back' },
  'shoulder.blade.left':  { label: 'Left shoulder blade' },
  'shoulder.blade.right': { label: 'Right shoulder blade' },

  'shoulder.left':        { label: 'Left shoulder' },
  'shoulder.right':       { label: 'Right shoulder' },
  'arm.upper.left':       { label: 'Left upper arm' },
  'arm.upper.right':      { label: 'Right upper arm' },
  'elbow.left':           { label: 'Left elbow' },
  'elbow.right':          { label: 'Right elbow' },
  'arm.fore.left':        { label: 'Left forearm' },
  'arm.fore.right':       { label: 'Right forearm' },
  'hand.left':            { label: 'Left hand' },
  'hand.right':           { label: 'Right hand' },

  'hip.left':             { label: 'Left hip' },
  'hip.right':            { label: 'Right hip' },
  'thigh.left':           { label: 'Left thigh' },
  'thigh.right':          { label: 'Right thigh' },
  'hamstring.left':       { label: 'Left hamstring' },
  'hamstring.right':      { label: 'Right hamstring' },
  'knee.left':            { label: 'Left knee' },
  'knee.right':           { label: 'Right knee' },
  'knee.back.left':       { label: 'Back of left knee' },
  'knee.back.right':      { label: 'Back of right knee' },
  'shin.left':            { label: 'Left shin' },
  'shin.right':           { label: 'Right shin' },
  'calf.left':            { label: 'Left calf' },
  'calf.right':           { label: 'Right calf' },
  'foot.left':            { label: 'Left foot' },
  'foot.right':           { label: 'Right foot' },
  'heel.left':            { label: 'Left heel' },
  'heel.right':           { label: 'Right heel' },
};

/* ---- Pain types ----
 * Labels are one or two words. The glyph is the non-colour cue that marks a
 * selected tile, so selection reads without relying on the accent hue.
 */
export const PAIN_TYPES = [
  { id: 'pain.sharp',       label: 'Sharp',        glyph: '▲', family: 'somatic' },
  { id: 'pain.dull',        label: 'Dull',         glyph: '●', family: 'somatic' },
  { id: 'pain.burning',     label: 'Burning',      glyph: '≈', family: 'neuropathic' },
  { id: 'pain.cramping',    label: 'Cramping',     glyph: '◣', family: 'visceral' },
  { id: 'pain.pressure',    label: 'Pressure',     glyph: '▼', family: 'visceral' },
  { id: 'pain.stabbing',    label: 'Stabbing',     glyph: '✦', family: 'somatic' },
  { id: 'pain.aching',      label: 'Aching',       glyph: '◐', family: 'somatic' },
  { id: 'pain.pulling',     label: 'Pulling',      glyph: '⟩',  family: 'mechanical' },
  // Revealed by "More types" so the first view stays at eight tiles.
  { id: 'pain.tingling',    label: 'Tingling',     glyph: '⁘', family: 'neuropathic', extra: true },
  { id: 'pain.numbness',    label: 'Numb',         glyph: '○', family: 'neuropathic', extra: true },
  { id: 'pain.cramp_waves', label: 'Waves',        glyph: '∿', family: 'visceral',    extra: true },
  // "Cramping in waves" and "burning after exertion" in the tree vocabulary.
  // A wedge on the dial holds about nine characters before it runs into its
  // neighbour, so the screen gets the short name and the id keeps the term.
  { id: 'pain.burn_effort', label: 'Effort',        glyph: '⇡', family: 'vascular',  extra: true },
];
