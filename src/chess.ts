import './extend'
import { CampType, PieceType } from './enum'
import { Board } from './board'
import { Piece } from './piece'
import { Rule } from './rule';
import { Ai } from './ai';

/**象棋类 */
class Chess {

	private static COL_COUNT = 9;
	private static ROW_COUNT = 10;
	private defaults!: Option;
	private options: Option;
	private canvas: HTMLCanvasElement;
	/**棋盘 */
	private board!: Board;
	/**棋子（32颗） */
	private _pieces!: Array<Piece>;
	/**规则 */
	private rule!: Rule;
	private ai!: Ai;
	/**是否该自己走 */
	private active: boolean = true;
	/**记录上次被选中的棋子 */
	private lastSelectedPiece: Piece | null = null;
	/**记录敌方上一次选中的棋子 */
	private enemyLastSelectedPiece: Piece | null = null;
	private _onerror?: (msg: Error) => any;

	constructor(canvas: HTMLCanvasElement, options?: Option) {
		if (!canvas || canvas.tagName.toLowerCase() != "canvas") {
			throw new Error("请在构造函数中传入HTMLCanvasElement对象！");
		}
		this.initDefaults();
		this.canvas = canvas;
		this.options = { ...this.defaults, ...options };
		this.board = new Board(this.options);
		this.initCanvas();
		this.initPieces();
		this.listener();
		this.invalidate();
		this.rule = new Rule(this._pieces, this.board);
		this.ai = new Ai(this._pieces);
	}

	/**初始化默认参数 */
	private initDefaults() {
		this.defaults = {
			width: 540,
			height: 600,
			padding: 40,
		};
	}

	/**初始化canvas参数 */
	private initCanvas() {

		let { width, height, padding } = this.options;
		this.canvas.width = width!;
		this.canvas.height = height!;
		this.canvas.style.width = `${width}px`;
		this.canvas.style.height = `${height}px`;
		this.canvas.style.border = "1px solid #ddd";
	}

	/**只要非死亡的棋子 */
	private get pieces() {
		return this._pieces.filter(p => !p.die);
	}

	/**初始化棋子 */
	private initPieces() {
		let size = this.board.cellSize;
		this._pieces = [
			//红方
			new Piece(CampType.RED, PieceType.BING, size, { row: 6, col: 0 }, true),
			new Piece(CampType.RED, PieceType.BING, size, { row: 6, col: 2 }, true),
			new Piece(CampType.RED, PieceType.BING, size, { row: 6, col: 4 }, true),
			new Piece(CampType.RED, PieceType.BING, size, { row: 6, col: 6 }, true),
			new Piece(CampType.RED, PieceType.BING, size, { row: 6, col: 8 }, true),
			new Piece(CampType.RED, PieceType.PAO, size, { row: 7, col: 1 }, true),
			new Piece(CampType.RED, PieceType.PAO, size, { row: 7, col: 7 }, true),
			new Piece(CampType.RED, PieceType.JU, size, { row: 9, col: 0 }, true),
			new Piece(CampType.RED, PieceType.JU, size, { row: 9, col: 8 }, true),
			new Piece(CampType.RED, PieceType.MA, size, { row: 9, col: 1 }, true),
			new Piece(CampType.RED, PieceType.MA, size, { row: 9, col: 7 }, true),
			new Piece(CampType.RED, PieceType.RXIANG, size, { row: 9, col: 2 }, true),
			new Piece(CampType.RED, PieceType.RXIANG, size, { row: 9, col: 6 }, true),
			new Piece(CampType.RED, PieceType.RSHI, size, { row: 9, col: 3 }, true),
			new Piece(CampType.RED, PieceType.RSHI, size, { row: 9, col: 5 }, true),
			new Piece(CampType.RED, PieceType.SHUAI, size, { row: 9, col: 4 }, true),
			//黑方
			new Piece(CampType.BLACK, PieceType.ZU, size, { row: 3, col: 0 }),
			new Piece(CampType.BLACK, PieceType.ZU, size, { row: 3, col: 2 }),
			new Piece(CampType.BLACK, PieceType.ZU, size, { row: 3, col: 4 }),
			new Piece(CampType.BLACK, PieceType.ZU, size, { row: 3, col: 6 }),
			new Piece(CampType.BLACK, PieceType.ZU, size, { row: 3, col: 8 }),
			new Piece(CampType.BLACK, PieceType.PAO, size, { row: 2, col: 1 }),
			new Piece(CampType.BLACK, PieceType.PAO, size, { row: 2, col: 7 }),
			new Piece(CampType.BLACK, PieceType.JU, size, { row: 0, col: 0 }),
			new Piece(CampType.BLACK, PieceType.JU, size, { row: 0, col: 8 }),
			new Piece(CampType.BLACK, PieceType.MA, size, { row: 0, col: 1 }),
			new Piece(CampType.BLACK, PieceType.MA, size, { row: 0, col: 7 }),
			new Piece(CampType.BLACK, PieceType.BXIANG, size, { row: 0, col: 2 }),
			new Piece(CampType.BLACK, PieceType.BXIANG, size, { row: 0, col: 6 }),
			new Piece(CampType.BLACK, PieceType.BSHI, size, { row: 0, col: 3 }),
			new Piece(CampType.BLACK, PieceType.BSHI, size, { row: 0, col: 5 }),
			new Piece(CampType.BLACK, PieceType.JIANG, size, { row: 0, col: 4 }),
		];
	}

	/**摆放棋子 */
	private putPiece(ctx: CanvasRenderingContext2D) {

		for (let piece of this.pieces) {
			let point = this.board.pos2point(piece.pos.row, piece.pos.col);
			let halfSize = piece.size * 0.5;
			ctx.drawImage(piece.canvas, point.x - halfSize, point.y - halfSize);
		}
	}

	/**切换该谁落子 */
	private switch() {
		if (this.active) {
			//轮到电脑走了
			this.active = false;
			let { piece, pos, eatPiece } = this.ai.generate();
			this.board.markPos(piece.pos);//在棋盘上标记还未移动时的位置
			piece.selected = true;
			piece.pos = pos;
			this.enemyLastSelectedPiece = piece;
			if (eatPiece) eatPiece.die = true;
			this.invalidate();
			this.switch();
		} else {
			this.active = true;
		}
	}

	/**事件监听 */
	private listener() {
		this.canvas.addEventListener("mousemove", ({ offsetX, offsetY }) => {
			if (!this.active) {
				this.canvas.style.cursor = "";
				return;
			};
			if (this.rule.pointInPieces({ x: offsetX, y: offsetY })) {
				this.canvas.style.cursor = "pointer";
			} else {
				this.canvas.style.cursor = "";
			}
		});
		this.canvas.addEventListener("mousedown", ({ offsetX, offsetY }) => {
			//若此时还没轮到自己下，就不能做任何操作
			if (!this.active) return;

			let point = { x: offsetX, y: offsetY };
			let piece = this.rule.pointInPieces(point);
			if (piece) {//点到了棋子
				if (this.lastSelectedPiece) this.lastSelectedPiece.selected = false;
				if (this.enemyLastSelectedPiece) this.enemyLastSelectedPiece.selected = false;
				piece.selected = true;
				this.lastSelectedPiece = piece;
				this.board.markPos();//清除标记
				this.invalidate();
			} else {//没有点到棋子，再看是否点到了某行某列
				let pos = this.board.point2pos(point);
				if (pos && this.lastSelectedPiece) {
					let res = this.rule.checkPieceMove(this.lastSelectedPiece, pos);
					if (res) {
						//若res是Piece对象，那么就要将die赋值为true，表示吃掉了该棋子
						if (res instanceof Piece) res.die = true;
						this.lastSelectedPiece.pos = pos;
						this.lastSelectedPiece.selected = false;
						this.lastSelectedPiece = null;
						this.switch();
						this.invalidate();
					} else {
						let err = new Error("不能移动到该位置！");
						if (this._onerror instanceof Function) this._onerror(err);
						throw err;
					}
				}
			}
		});
	}

	public onError(onerror: (msg: Error) => any) {
		this._onerror = onerror;
	}

	/**刷新界面 */
	public invalidate() {
		let ctx = this.canvas.getContext("2d")!;
		let { width, height } = this.options;
		ctx.clearRect(0, 0, width!, height!);
		ctx.drawImage(this.board.canvas, 0, 0);
		this.putPiece(this.canvas.getContext("2d")!);
	}
}

export { Chess }