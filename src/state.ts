import { adaptDPI } from "@thi.ng/adapt-dpi";
import { canvas2d, CanvasContext } from "@thi.ng/pixel";
import { pick, probability, RND, weightedKey } from "@thi.ng/random-fxhash";
import { resolve } from "@thi.ng/resolve-map";
import { repeatedly } from "@thi.ng/transducers";
import type { BaseState, State, ThemeID } from "./api";
import { Particle } from "./particle";
import { THEMES } from "./themes";

/**
 * Initialize ALL non-responsive params & subsystems, in order of their stated
 * dependencies, i.e. we treat the various object properties as nodes in a
 * Direct Acyclic Graph (DAG) and their lexical order (in the source code) is
 * irrelevant. This greatly reduces the cognitive overhead when managing more
 * complex state initialization once there's a decent amount of interrelated
 * params & state values in your project:
 *
 * Just add new params/state values (in any order) and, if needed, specify their
 * dependencies (on other state params) as destructured function arguments (see
 * examples below)
 *
 * You should ONLY initialize params/components here which are NOT dependent on
 * dynamic external factors like window size/resolution etc. (which we call
 * "responsive" here). Only non-responsive (static) base config is initialized
 * here and rest handled via {@link resolveState} further below...
 *
 * NOTE: ALL THE PARAMS & TYPES LISTED HERE ARE FOR THE STUB CONTENT/SKETCH
 * ONLY. EDIT AS YOU SEE FIT!
 */
const BASE = resolve<BaseState>(
    {
        // some static constants/params
        margin: 10,
        minMaxSpeed: [0.002, 0.004],
        minMaxSmooth: [1 / 10, 1 / 3],
        minMaxTail: [10, 20],

        // pick random color theme ID based on given weights
        // e.g. "mono" is more likely to be picked than "hot" or "cold":
        // 4 / (4+2+1) = 4/7 = 57%
        // 2 / 7 = 29%
        // 1 / 7 = 14%
        themeId: weightedKey<Record<ThemeID, number>>({
            mono: 4,
            hot: 2,
            cold: 1,
        }),

        // pre-lookup theme for later use
        // we keep it separate from `themeId` because we'll expose the ID
        // as part of $fxhashFeatures traits later (YMMV!)
        theme: ({ themeId }: BaseState) => THEMES[themeId],

        // maybe we want this param being dependent on color theme too...
        strokeWeight: ({ themeId }: BaseState) =>
            ({ mono: 20, hot: 40, cold: 10 }[themeId]),

        // conditional choice for selecting number of particles using various PRNG
        // helpers provided by the thi.ng/random-fxhash package (see pkg readme/docs for more details)
        // 80% chance for 50, 100 or 200
        // 20% chance for a more sparse random amount
        numParticles: probability(0.8)
            ? pick([50, 100, 200])
            : RND.minmaxInt(25, 50),

        // initialize all particles using various other parameters
        // see src/particle.ts for further defails
        particles: ({
            numParticles,
            minMaxSpeed,
            minMaxSmooth,
            minMaxTail,
            strokeWeight: strokeWidth,
            theme,
        }: BaseState) => [
            ...repeatedly(
                () =>
                    new Particle(
                        pick(theme.fg),
                        RND.minmax(...minMaxSpeed),
                        RND.minmax(...minMaxSmooth),
                        RND.minmax(0.5, 1) ** 1.5 * strokeWidth,
                        RND.minmaxInt(...minMaxTail)
                    ),
                numParticles
            ),
        ],

        // initialize any other params & subsystems which are independent from
        // window size (don't forget to declare them in BaseConfig [api.ts]
        // first!)
        // ...
    },
    { onlyFnRefs: true }
);

/**
 * Merges given partial state/config with existing base config and additional
 * "responsive" state values definined in this function. Then initializes &
 * resolves all state values in order of their stated transitive dependencies,
 * i.e. it treats the various object properties as nodes in a Direct Acyclic
 * Graph (DAG) and their lexical order is made irrelevant, which greatly reduces
 * the cognitive overhead for managing state initialization once there's a
 * decent amount of params & state values in your project:
 *
 * Just add new params/state values and specify their dependencies (on other
 * state values) as destructured function arguments (see examples below)
 *
 * @param config
 */
export const resolveState = (
    config: Partial<State> & Pick<State, "width" | "height">
) =>
    resolve<State>(
        {
            ...BASE,
            ...(<State>config),

            // DPR might have changed if browser window was moved to new
            // screen/monitor with a diff pixel density...
            dpr: window.devicePixelRatio || 1,

            // compute canvas size with applied margins
            width: ({ margin }: State) => config.width - 2 * margin,
            height: ({ margin }: State) => config.height - 2 * margin,
            // compute scaled canvas size (using display DPR)
            scaledSize: ({ width, height, dpr }: State) => [
                width * dpr,
                height * dpr,
            ],
            // canvas aspect ratio
            aspect: ({ width, height }: State) => width / height,

            // create (or re-adjust) canvas element & drawing context
            canvas: ({ width, height }: State) => {
                let canvas: CanvasContext;
                const el = <HTMLCanvasElement>document.getElementById("main");
                if (!el) {
                    // create canvas as child of #app
                    // this ensures it's centered in the window/viewport
                    canvas = canvas2d(
                        width,
                        height,
                        document.getElementById("app")!
                    );
                    canvas.canvas.setAttribute("id", "main");
                } else {
                    canvas = { canvas: el, ctx: el.getContext("2d")! };
                }
                // adjust canvas size (incl. setup for HDPI displays)
                adaptDPI(canvas.canvas, width, height);
                return canvas;
            },
        },
        { onlyFnRefs: true }
    );
