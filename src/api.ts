import type { Rect } from "@thi.ng/geom";
import type { CanvasContext } from "@thi.ng/pixel";
import type { Particle } from "./particle";
import type { THEMES } from "./themes";

// this file should only contain shared type definitions and constants! Btw. If
// you're unfamiliar with TypeScript, these types & interfaces are only used
// during authoring & compile time and can greatly accelerate workflow and
// reduce cognitive load & fear of breaking thing, esp. during creative
// development... just try it! :)

export type ThemeID = keyof typeof THEMES;

export interface Theme {
	/**
	 * Background color (CSS color string)
	 */
	bg: string;
	/**
	 * Choice of foreground colors (CSS color strings)
	 */
	fg: string[];
}

/**
 * This interface should define the types of all parameters and components which
 * are only defined once at application start. Any dynamic / responsive state
 * variables should be defined further below in {@link State}.
 *
 * NOTE: ALL THE PARAMS & TYPES LISTED HERE ARE FOR THE STUB CONTENT/SKETCH ONLY.
 * EDIT AS YOU SEE FIT!
 *
 * See further information in src/state.ts
 */
export interface BaseState {
	/**
	 * Color theme ID
	 */
	themeId: ThemeID;
	/**
	 * Actually instantiated color theme.
	 */
	theme: Theme;
	/**
	 * Canvas margin (in pixels)
	 */
	margin: number;
	/**
	 * Max stroke weight (in pixels)
	 */
	strokeWeight: number;
	/**
	 * Particle config
	 */
	minMaxSpeed: [number, number];
	/**
	 * Particle config
	 */
	minMaxSmooth: [number, number];
	/**
	 * Particle config
	 */
	minMaxTail: [number, number];
	/**
	 * Max recursion depth for grid subdivision
	 */
	maxDepth: number;
	/**
	 * Binary (bitshift) scale factor for number of particles per grid cell
	 * E.g. a shift by 1 bit = multiplication (or division) by 2
	 */
	clusterScale: number;
	/**
	 * Instantiated particles (see src/particle.ts).
	 */
	particles: Particle[];
	/**
	 * Subdivided grid cells (used as containers for groups of particles)
	 */
	cells: Rect[];
}

/**
 * Extended version of {@link BaseState}, including other state params & values
 * which are dependent on dynamically chaning window size/screen res and/or
 * other factors.
 *
 * See src/state.ts for further details!
 *
 * NOTE: MOST OF THE PARAMS & TYPES LISTED HERE ARE FOR THE STUB CONTENT/SKETCH
 * ONLY. EDIT AS YOU SEE FIT!
 */
export interface State extends BaseState {
	/**
	 * Current canvas width (in CSS pixels, without {@link State.dpr} applied)
	 */
	width: number;
	/**
	 * Current canvas height (in CSS pixels, without {@link State.dpr} applied)
	 */
	height: number;
	/**
	 * Canvas size scaled by {@link State.dpr}
	 */
	scaledSize: [number, number];
	/**
	 * Window device pixel ratio
	 */
	dpr: number;
	/**
	 * Canvas aspect ratio
	 */
	aspect: number;
	/**
	 * Canvas element & drawing context container
	 */
	canvas: CanvasContext;
}
