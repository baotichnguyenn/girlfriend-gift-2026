// Floor plan. One unit is about 0.75 m: she stands about 2.1 units tall.
// The museum runs toward -z: the Great Hall, five galleries joined by arches, then the doors to the garden.
// Plain numbers only, so this module loads anywhere.

export const HALF_W = 12;          // side walls at x = ±HALF_W
export const CEIL = 10;            // ceiling height
export const FRONT_Z = 54;         // the entrance wall behind the plinth
export const PLINTH_Z = 47;
export const GALLERY_LEN = 17;
export const WALL_T = 0.8;         // thickness of the walls between galleries
export const ARCH_W = 4;           // half-width of each arch. Its apex is ARCH_SPRING + ARCH_W.
export const ARCH_SPRING = 5;
export const FABRIC_TOP = 6.8;     // fabric runs from the skirting to the picture rail; limestone above

// PARTITION_Z[i] is the arch into gallery i. DOOR_Z is the end wall with the garden doors.
export const PARTITION_Z = [0, 1, 2, 3, 4].map((i) => 36 - i * GALLERY_LEN);
export const DOOR_Z = 36 - 5 * GALLERY_LEN;
export const STATION_Z = PARTITION_Z.map((z) => z - GALLERY_LEN / 2);
export const STATION_SIDE = [-1, 1, -1, 1, -1]; // which way the path swings at each letter (-1 is her left)
export const STATION_X = 3.5;

// A chandelier in the middle of each room: the Great Hall's is larger. y is the centre of its body.
export const CHANDELIERS = [{ z: (FRONT_Z + PARTITION_Z[0]) / 2, y: 7.05, s: 1.3 }, ...STATION_Z.map((z) => ({ z, y: 7.35, s: 1 }))];

// Fabric wall colour for each gallery, like the painting galleries of a great museum.
export const GALLERY_COLORS = [0x7a2b31, 0x40594b, 0x34495f, 0x5a3048, 0x8a5236];

// The garden beyond the doors: a clifftop terrace, GARDEN_W either side of the middle, ending at CLIFF_Z.
// The path ends at END_Z; her portrait stands under the flower arch at ARCH_Z, with the mountains behind.
export const END_Z = DOOR_Z - 25;
export const ARCH_Z = END_Z - 3.9;
export const CLIFF_Z = ARCH_Z - 9;
export const GARDEN_W = 26;

// Across the room from each letter, where room I keeps its bench: II a whale skeleton, III a marble statue,
// IV and V flower sculptures. KEEP_OUT holds cylinders { x, z, r, y0, y1 } the camera mustn't enter.
export const DISPLAY_X = STATION_Z.map((z, i) => -STATION_SIDE[i] * 7.4);
export const KEEP_OUT = [
  ...[4.5, 1.5, -1.5, -4.5].map((dz) => ({ x: DISPLAY_X[1], z: STATION_Z[1] + dz, r: 1.7, y0: 4.4, y1: CEIL })),
  { x: DISPLAY_X[2], z: STATION_Z[2], r: 1.2, y0: 0, y1: 5.4 },
  { x: DISPLAY_X[3], z: STATION_Z[3], r: 2, y0: 0, y1: 6.2 },
  { x: DISPLAY_X[4], z: STATION_Z[4], r: 2.1, y0: 0, y1: 5.6 }
];
