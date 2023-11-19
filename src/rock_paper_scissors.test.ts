import { RockPaperScissors } from './rock_paper_scissors';
import {
  Field,
  Bool,
  PrivateKey,
  PublicKey,
  Mina,
  AccountUpdate,
  Signature,
} from 'o1js';

describe('RockPaperScissors', () => {
  let player1: PublicKey,
    player1Key: PrivateKey,
    player2: PublicKey,
    player2Key: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey;

  beforeEach(async () => {
    let Local = Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);
    [{ publicKey: player1, privateKey: player1Key }, { publicKey: player2, privateKey: player2Key }] =
      Local.testAccounts;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
  });

  it('generates and deploys RockPaperScissors', async () => {
    const zkApp = new RockPaperScissors(zkAppAddress);
    const txn = await Mina.transaction(player1, () => {
      AccountUpdate.fundNewAccount(player1);
      zkApp.deploy();
      zkApp.joinGame(player1);
      zkApp.joinGame(player2);
    });
    await txn.prove();
    await txn.sign([zkAppPrivateKey, player1Key, player2Key]).send();
    const gameActive = zkApp.gameActive.get();
    expect(gameActive).toEqual(Bool(true));
  });

  it('accepts a correct move from both players and determines the winner', async () => {
    const zkApp = new RockPaperScissors(zkAppAddress);

    // deploy and join game
    let txn = await Mina.transaction(player1, () => {
      AccountUpdate.fundNewAccount(player1);
      zkApp.deploy();
      zkApp.joinGame(player1);
      zkApp.joinGame(player2);
    });
    await txn.prove();
    await txn.sign([zkAppPrivateKey, player1Key, player2Key]).send();

    // move for both players
    const movePlayer1 = Field(0); // Player 1 chooses 'Rock'
    const movePlayer2 = Field(2); // Player 2 chooses 'Scissors'
    txn = await Mina.transaction(player1, async () => {
      zkApp.makeMove(player1, movePlayer1);
    });
    await txn.prove();
    await txn.sign([player1Key]).send();

    txn = await Mina.transaction(player2, async () => {
      zkApp.makeMove(player2, movePlayer2);
    });
    await txn.prove();
    await txn.sign([player2Key]).send();

    // determine winner
    txn = await Mina.transaction(player1, async () => {
      zkApp.determineWinner();
    });
    await txn.prove();
    await txn.sign([player1Key]).send();

    // check game is finished and player 1 won (Rock beats Scissors)
    const gameActive = zkApp.gameActive.get();
    expect(gameActive).toEqual(Bool(false));
    // Additional checks can be added here to verify the winner
  });
});
