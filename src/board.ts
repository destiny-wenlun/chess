/**棋盘类 */
class Board {

	private static COL_COUNT = 9;
	private static ROW_COUNT = 10;
	private _canvas!: HTMLCanvasElement;
	private options!: Option;
	/**棋盘起点坐标，即左上角坐标 */
	private boardStartPoint!: Point;
	/**棋盘单元格的宽高 */
	private _cellSize!: number;

	constructor(options: Option) {
		this._canvas = document.createElement("canvas");
		let { width, height, padding } = options;
		this._canvas.width = width!;
		this._canvas.height = height!;

		//计算宽和高，取最小的那个作为单元格的宽高
		this._cellSize = Math.min((width! - 2 * padding!) / (Board.COL_COUNT - 1), (height! - 2 * padding!) / (Board.ROW_COUNT - 1));
		this.boardStartPoint = { x: (width! - 8 * this._cellSize) * 0.5, y: (height! - 9 * this._cellSize) * 0.5 };
		this.draw();
	}

	private draw() {
		let { cellSize, boardStartPoint } = this;
		let ctx = this._canvas.getContext("2d")!;

		ctx.beginPath();
		//绘制行
		let xStart = boardStartPoint.x;
		let xEnd = this.pos2point(0, 8).x;
		let y = boardStartPoint.y;
		for (let row = 0; row < Board.ROW_COUNT; row++) {
			ctx.moveTo(xStart, y);
			ctx.lineTo(xEnd, y);
			y += cellSize;
		}

		//绘制列
		let yAboveStart = boardStartPoint.y;//上半部分
		let yAboveEnd = this.pos2point(4, 0).y;//上半部分
		let yBelowStart = this.pos2point(5, 0).y;//下半部分
		let yBelowEnd = this.pos2point(9, 0).y;//下半部分
		let x = boardStartPoint.x;
		for (let col = 0; col < Board.COL_COUNT; col++) {
			if (col == 0 || col == Board.COL_COUNT - 1) {
				//绘制最外面的两列
				ctx.moveTo(x, yAboveStart);
				ctx.lineTo(x, yBelowEnd);
			} else {
				//绘制里面的列
				ctx.moveTo(x, yAboveStart);
				ctx.lineTo(x, yAboveEnd);
				ctx.moveTo(x, yBelowStart);
				ctx.lineTo(x, yBelowEnd);
			}
			x += cellSize;
		}

		//绘制米字格
		ctx.drawLine(this.pos2point(0, 3), this.pos2point(2, 5));
		ctx.drawLine(this.pos2point(2, 3), this.pos2point(0, 5));
		ctx.drawLine(this.pos2point(7, 3), this.pos2point(9, 5));
		ctx.drawLine(this.pos2point(9, 3), this.pos2point(7, 5));

		ctx.stroke();

		//绘制兵、炮位置函数
		let draw = (point: Point) => {
			let padding = 5;
			let len = this.cellSize / 5;
			ctx.beginPath();
			ctx.save();
			ctx.lineWidth = 2;
			if (point.x != this.boardStartPoint.x) {//最左边不画左边部分
				//左上
				let leftTop = { x: point.x - padding, y: point.y - padding };
				ctx.drawLine(leftTop, { x: leftTop.x, y: leftTop.y - len });
				ctx.drawLine(leftTop, { x: leftTop.x - len, y: leftTop.y });
				//左下
				let leftBottom = { x: point.x - padding, y: point.y + padding };
				ctx.drawLine(leftBottom, { x: leftBottom.x, y: leftBottom.y + len });
				ctx.drawLine(leftBottom, { x: leftBottom.x - len, y: leftBottom.y });
			}
			if (point.x != this.pos2point(0, 8).x) {//最右边不画右边部分
				//右上
				let rightTop = { x: point.x + padding, y: point.y - padding };
				ctx.drawLine(rightTop, { x: rightTop.x, y: rightTop.y - len });
				ctx.drawLine(rightTop, { x: rightTop.x + len, y: rightTop.y });
				//右下
				let rightBottom = { x: point.x + padding, y: point.y + padding };
				ctx.drawLine(rightBottom, { x: rightBottom.x, y: rightBottom.y + len });
				ctx.drawLine(rightBottom, { x: rightBottom.x + len, y: rightBottom.y });
			}
			ctx.stroke();
			ctx.restore();

		}
		//炮位置
		draw(this.pos2point(2, 1));
		draw(this.pos2point(2, 7));
		draw(this.pos2point(7, 1));
		draw(this.pos2point(7, 7));
		//兵、卒位置
		draw(this.pos2point(3, 0));
		draw(this.pos2point(3, 2));
		draw(this.pos2point(3, 4));
		draw(this.pos2point(3, 6));
		draw(this.pos2point(3, 8));
		draw(this.pos2point(6, 0));
		draw(this.pos2point(6, 2));
		draw(this.pos2point(6, 4));
		draw(this.pos2point(6, 6));
		draw(this.pos2point(6, 8));

		//绘制棋盘边框
		ctx.beginPath();
		ctx.lineWidth = 3;
		let borderPadding = 5;
		x = boardStartPoint.x - borderPadding;
		y = boardStartPoint.y - 5;
		let w = this.pos2point(0, 8).x + borderPadding - x;
		let h = this.pos2point(9, 0).y + borderPadding - y;
		ctx.rect(x, y, w, h);
		ctx.stroke();
	}

	/**从左上角开始，获取指定行、列序号的坐标位置，序号从0开始 */
	public pos2point(row: number, col: number): Point {
		let { x, y } = this.boardStartPoint!;
		return { x: x + col * this.cellSize, y: y + row * this.cellSize };
	}

	/**根据点击的像素坐标，返回点击的行列，可能会返回null */
	public point2pos(p: Point): Pos | null {
		//指定单元格长度的0.3倍作为判断范围
		let range = this.cellSize * 0.3;
		for (let row = 0; row < Board.ROW_COUNT; row++) {
			for (let col = 0; col < Board.COL_COUNT; col++) {
				let { x, y } = this.pos2point(row, col);
				if (p.x > x - range && p.x < x + range && p.y > y - range && p.y < y + range) {
					return { row, col };
				}
			}
		}
		return null;
	}

	public get canvas() {
		return this._canvas;
	}

	public get cellSize() {
		return this._cellSize;
	}

}

export { Board }