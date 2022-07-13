import { pointInside, rectFromCentroid, scatter } from "@thi.ng/geom";
import { probability, RND } from "@thi.ng/random-fxhash";
import { repeatedly } from "@thi.ng/transducers";
import {
    add2,
    mixN2,
    normalize,
    randMinMax2,
    randNorm2,
    sub2,
    Vec,
} from "@thi.ng/vectors";

// predefined bounding rectangle in normalized coordinate space i.e. in order to
// keep the overall project adaptive to different screen resolutions &
// resolution changes, all coordinates are defined within the [0,0] .. [1,1]
// space and then only scaled for rendering (in the main loop)
// the actual bounding rect here is only covering the central 70% to keep
// particles more in the center of each cell
const BOUNDS = rectFromCentroid([0.5, 0.5], 0.7);

/**
 * In general, this file & class has nothing to do with the project template as
 * such, it's merely used for the default content/animation provided and
 * demonstrates some basic usage patterns of some more thi.ng/umbrella
 * packages...
 *
 * ALL OPTIONAL! DELETE THIS FILE IF NOT NEEDED!
 */
export class Particle {
    pos: Vec;
    tail: Vec[];
    dir: Vec;
    targetDir: Vec;

    constructor(
        public color: string,
        public speed: number,
        public smooth: number,
        public thick: number,
        tailLength: number
    ) {
        // random start position
        // IMPORTANT: for reproducibility, always pass `RND`, the fxhash PRNG wrapper
        this.pos = randMinMax2([], [0, 0], [1, 1], RND);
        // random start directions/normals (again using RND)
        this.dir = randNorm2([], speed, RND);
        this.targetDir = randNorm2([], speed, RND);
        // initialize tail (using N copies of start position)
        this.tail = [...repeatedly(() => [...this.pos], tailLength)];
    }

    update() {
        const { pos, dir, targetDir, speed, smooth, tail } = this;
        // force new target direction if position outside bounds (or with a
        // small random chance, could also be parameterized)
        if (probability(0.005) || !pointInside(BOUNDS, pos)) {
            // new target dir is direction from curr pos to a new valid point
            // inside the bounds
            normalize(
                null,
                sub2(targetDir, scatter(BOUNDS, 1, RND)![0], pos),
                speed
            );
        }
        // update tail by interpolating each vertex to its predecessor
        mixN2(null, tail[0], pos, smooth);
        for (let i = 1; i < tail.length; i++) {
            mixN2(null, tail[i], tail[i - 1], smooth);
        }
        // interpolate direction and keep normalized to configured speed
        normalize(null, mixN2(null, dir, targetDir, 0.1), speed);
        // update position
        add2(null, pos, dir);
    }
}
