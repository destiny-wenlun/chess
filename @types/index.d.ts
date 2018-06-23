interface Option {
	width?: number
	height?: number
	padding?: number
}

interface Point {
	x: number
	y: number
}

/**位置 */
interface Pos {
	row: number
	col: number
}

interface CanvasRenderingContext2D {
	drawLine(start: Point, end: Point): any
}

interface Window {
	[i: string]: any
}
