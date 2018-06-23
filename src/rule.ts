import { CampType, PieceType } from './enum'
import { Board } from './board'
import { Piece } from './piece'

/**规则类 */
class Rule {

	/**棋盘 */
	private board!: Board;
	/**棋子（32颗） */
	private _pieces!: Array<Piece>;

	constructor(pieces: Array<Piece>, board: Board) {
		this.board = board;
		this._pieces = pieces;
	}

	/**只要非死亡的棋子 */
	private get pieces() {
		return this._pieces.filter(p => !p.die);
	}

	/**判断某个点是否落在某颗棋子上，若有落在某颗棋子上，则返回该棋子 */
	public pointInPieces(p: Point): Piece | null {
		for (let piece of this.pieces) {
			if (!piece.self) continue;
			let { x, y } = this.board.pos2point(piece.pos.row, piece.pos.col);
			let halfSize = piece.size * 0.5;
			if (p.x > x - halfSize && p.x < x + halfSize && p.y > y - halfSize && p.y < y + halfSize) {
				return piece;
			}
		}
		return null;
	}

	/**检查某颗棋子距离某个位置隔了几颗棋子,仅在横竖方向有效，斜方向返回-1 */
	public pieceDistancePos(piece: Piece, pos: Pos): number {
		let { row, col } = piece.pos;
		if (row == pos.row) {//说明是在横方向上
			let path: Array<Pos> = [];
			let start = col > pos.col ? pos.col + 1 : col + 1;
			let end = col > pos.col ? col : pos.col;
			for (let i = start; i < end; i++) {
				path.push({ row, col: i });
			}
			return this.pieces.filter(p => {
				for (let pos of path) {
					if (p.pos.row == pos.row && p.pos.col == pos.col) return true;
				}
				return false;
			}).length;
		} else if (col == pos.col) {//说明是在竖方向上
			let path: Array<Pos> = [];
			let start = row > pos.row ? pos.row + 1 : row + 1;
			let end = row > pos.row ? row : pos.row;
			for (let i = start; i < end; i++) {
				path.push({ col, row: i });
			}
			return this.pieces.filter(p => {
				for (let pos of path) {
					if (p.pos.row == pos.row && p.pos.col == pos.col) return true;
				}
				return false;
			}).length;
		}
		return -1;
	}

	/**
	 * 检查某颗棋子是否可以移动到某个位置,
	 * 若返回true或Piece对象，表示可以移动，
	 * 其中返回Piece对象表示移动到该位置并且可吃掉该敌方棋子 
	 * */
	public checkPieceMove(piece: Piece, pos: Pos): boolean | Piece {
		let { row, col } = piece.pos;
		let pieceOfPos = this.pieces.find(p => p.pos.col == pos.col && p.pos.row == pos.row);
		//若要移动的地方有棋子，并且该棋子的正营与要移动的棋子正营一样，则不用验证了，肯定是不能移动
		if (pieceOfPos && pieceOfPos.campType == piece.campType) return false;
		let res = false;
		//检查棋子距离终点隔的棋子数，仅横竖方向,斜方向返回-1
		let count = this.pieceDistancePos(piece, pos);
		let rowDiff = pos.row - row;
		let colDiff = pos.col - col;
		switch (piece.pieceType) {
			case PieceType.JU://車
				//说明该棋子是在横竖方向移动，并且移动的终点距离棋子间没有其他棋子
				if (count == 0) res = true;
				break;
			case PieceType.PAO://炮
				//若终点和棋子间隔了一个棋子，并且终点又是敌方棋子，或终点没有任何棋子并且中间也没有任何棋子阻拦
				if (pieceOfPos && count == 1 || !pieceOfPos && count == 0) res = true;
				break;
			case PieceType.MA://馬行日
				//马在某一个点最多可走8个位置,检查要移动的地方距离棋子的横、竖距离是否构成一个“日”字
				if (Math.abs(rowDiff) == 1 && Math.abs(colDiff) == 2 || Math.abs(rowDiff) == 2 && Math.abs(colDiff) == 1) {
					//寻找马的别脚点（要移动方向的别脚点）
					let stopRow = row, stopCol = col;
					Math.abs(rowDiff) > Math.abs(colDiff) ? stopRow += (rowDiff > 0 ? 1 : -1) : stopCol += (colDiff > 0 ? 1 : -1);
					//只有别脚点没有棋子，马才能移动
					if (!this.pieces.find(p => p.pos.row == stopRow && p.pos.col == stopCol)) res = true;
				}
				break;
			case PieceType.BXIANG://相
			case PieceType.RXIANG://象行田 不能越界
				//判断象要移动的位置是否越界。（自己的棋子阵营永远在下方）
				if (piece.self && pos.row < 5 || !piece.self && pos.row > 4) break;
				//象在某一个点最多可走4个位置,检查要移动的地方距离棋子的横、竖距离是否构成一个“田”字
				if (Math.abs(rowDiff) == 2 && Math.abs(colDiff) == 2) {
					//寻找象心（要移动方向的象心）
					let stopRow = row + (rowDiff > 0 ? 1 : -1);
					let stopCol = col + (colDiff > 0 ? 1 : -1);
					//只有象心没有棋子，才能移动
					if (!this.pieces.find(p => p.pos.row == stopRow && p.pos.col == stopCol)) res = true;
				}
				break;
			case PieceType.RSHI://仕
			case PieceType.BSHI://士
				//判断士要移动的位置是否会超出九宫格(要注意敌方棋子还是我方棋子)
				if (pos.col < 3 || pos.col > 5 || piece.self && pos.row < 7 || !piece.self && pos.row > 2) break;
				if (Math.abs(rowDiff) == 1 && Math.abs(colDiff) == 1) res = true;
				break;
			case PieceType.BING://兵
			case PieceType.ZU://卒 只能前进，不可后退，且过河才能左右移动，每次只能移动一格
				//若不满足只走一格，肯定不对，直接结束吧
				if (!(Math.abs(rowDiff) == 1 && Math.abs(colDiff) == 0 || Math.abs(rowDiff) == 0 && Math.abs(colDiff) == 1)) break;
				if (piece.self && rowDiff <= 0) {//我方棋子向上走
					//过了河才能左右走
					if (Math.abs(colDiff) > 0 && piece.pos.row <= 4 || rowDiff < 0) res = true;
				} else if (!piece.self && rowDiff >= 0) {//敌方棋子向下走
					if (Math.abs(colDiff) > 0 && piece.pos.row >= 5 || rowDiff > 0) res = true;
				}
				break;
			case PieceType.JIANG://將
			case PieceType.SHUAI://帥
				//判断將或帅是否会移出九宫格
				if (pos.col < 3 || pos.col > 5 || piece.self && pos.row < 7 || !piece.self && pos.row > 2) break;
				//只要是走的1格，就是对的
				if (Math.abs(rowDiff) == 1 && Math.abs(colDiff) == 0 || Math.abs(rowDiff) == 0 && Math.abs(colDiff) == 1) res = true;
				break;
		}
		return res ? pieceOfPos || res : res;
	}
}

export { Rule }