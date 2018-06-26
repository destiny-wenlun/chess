import { Piece } from './piece'
import { PieceType } from './enum';

class Ai {

	/**棋子（32颗） */
	private _pieces!: Array<Piece>;

	/**只要非死亡的棋子 */
	private get pieces() {
		return this._pieces.filter(p => !p.die);
	}

	constructor(pieces: Array<Piece>) {
		this._pieces = pieces;
	}

	/**自动生成电脑要下的棋子，及该棋子要移动的位置，eatPiece可能为null,若有值表示将要吃掉的对方棋子 */
	public generate(): { piece: Piece, pos: Pos, eatPiece?: Piece } {
		let piece = this.pieces.find(p => !p.self && p.pieceType == PieceType.ZU)!;
		let pos: Pos = { row: piece.pos.row + 1, col: piece.pos.col };
		let eatPiece = this.pieces.find(p => p.pos.row == pos.row && p.pos.col == pos.col);
		return { piece, pos, eatPiece };
	}
}

export { Ai }