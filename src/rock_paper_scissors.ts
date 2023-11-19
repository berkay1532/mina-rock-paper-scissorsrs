import {
  Field,
  State,
  PublicKey,
  SmartContract,
  state,
  method,
    Bool,
  Circuit,
  Provable,
  Signature,
  Struct,
} from 'o1js';

export class RockPaperScissors extends SmartContract {
  @state(PublicKey) player1 = State<PublicKey>();
  @state(PublicKey) player2 = State<PublicKey>();
  @state(Field) movePlayer1 = State<Field>(); // 0: Taş, 1: Kağıt, 2: Makas
  @state(Field) movePlayer2 = State<Field>();
  @state(Bool) gameActive = State<Bool>();

    init() {
    // Oyun başlangıçta aktif değil
    this.gameActive.set(Bool(false));

    // Oyuncu 1 ve Oyuncu 2'nin başlangıçta kayıtlı olmadığını belirt
    this.player1.set(PublicKey.empty());
    this.player2.set(PublicKey.empty());

    // Oyuncu hamlelerini başlangıçta boş olarak ayarla
    this.movePlayer1.set(Field(0)); // Önceden belirlenen bir değer, burada 0 sadece bir yer tutucu
    this.movePlayer2.set(Field(0)); // Aynı şekilde, 0 sadece bir yer tutucu
    }





    @method makeMove(player: PublicKey, move: Field) {
    // Oyun aktif değilse hamle yapmayı reddet
    this.gameActive.get().assertEquals(Bool(true));

    // Sadece kayıtlı oyuncular hamle yapabilir
    const isPlayer1 = player.equals(this.player1.get());
    const isPlayer2 = player.equals(this.player2.get());
    Bool.or(isPlayer1, isPlayer2).assertTrue();

    // Hamlenin geçerli olduğunu kontrol et (0: Taş, 1: Kağıt, 2: Makas)
    move.equals(Field(0))
        .or(move.equals(Field(1)))
        .or(move.equals(Field(2)))
        .assertTrue();

    // Oyuncu 1 hamle yaparsa
    if (isPlayer1) {
        // Oyuncu 1'in daha önce hamle yapıp yapmadığını kontrol et
        this.movePlayer1.get().assertEquals(Field(0));
        this.movePlayer1.set(move);
    }

    // Oyuncu 2 hamle yaparsa
    if (isPlayer2) {
        // Oyuncu 2'nin daha önce hamle yapıp yapmadığını kontrol et
        this.movePlayer2.get().assertEquals(Field(0));
        this.movePlayer2.set(move);
    }
    }


   @method determineWinner() {
  // Oyunun aktif olup olmadığını kontrol et
  this.gameActive.get().assertEquals(Bool(true));

  // Her iki oyuncunun da hamle yapmış olması gerekiyor
  this.movePlayer1.get().assertNotEquals(Field(0));
  this.movePlayer2.get().assertNotEquals(Field(0));

  // Oyuncuların hamlelerini al
  const move1 = this.movePlayer1.get();
  const move2 = this.movePlayer2.get();

  // Kazananı hesapla ve oyun durumunu güncelle
  Circuit.if(move1.equals(move2), () => {
    // Beraberlik durumunda oyunu sıfırla
    this.resetGame();
  }, () => {
    let winnerIsPlayer1 = Circuit.or(
      move1.equals(Field(0)).and(move2.equals(Field(2))), // Taş > Makas
      move1.equals(Field(1)).and(move2.equals(Field(0))), // Kağıt > Taş
      move1.equals(Field(2)).and(move2.equals(Field(1)))  // Makas > Kağıt
    );

    Circuit.if(winnerIsPlayer1, () => {
      // Oyuncu 1'in kazandığını işle
    }, () => {
      // Oyuncu 2'nin kazandığını işle
    });
  });
}

@method resetGame() {
  // Oyunun aktif olmadığını kontrol et (oyun bitmiş olmalı)
  this.gameActive.get().assertEquals(Bool(false));

  // Oyuncuların ve hamlelerin durumunu sıfırla
  this.player1.set(PublicKey.empty());
  this.player2.set(PublicKey.empty());
  this.movePlayer1.set(Field(0)); // 0, hamle yapılmadığını gösterir
  this.movePlayer2.set(Field(0)); // Aynı şekilde

  // Oyunu tekrar başlatmaya hazır hale getir
  this.gameActive.set(Bool(false));
}


}
