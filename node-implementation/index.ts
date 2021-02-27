import * as crypto from "crypto";
import * as clipboardy from "clipboardy";
import * as fs from "fs";

interface BlockInterface {
  index: string;
  previousHash: string;
  nonce: string;
  timestamp: string;
  data: string;
}

class Block {
  public block: BlockInterface;
  public difficulty: number;

  constructor(
    data: any,
    index: string,
    previousHash: string,
    difficulty: number
  ) {
    this.block = {
      index: index,
      data: data,
      timestamp: Date.now().toString(),
      nonce: "1",
      previousHash: previousHash,
    };

    this.difficulty = difficulty;
  }

  mine() {
    let nonce: string = "1";

    let hashed: boolean = false;

    console.log("mining...");

    const zeroesArray = [];

    for (let i = 0; i < this.difficulty; i++) {
      zeroesArray.push("0");
    }

    while (!hashed) {
      const hash = this.hash({ ...this.block, nonce: nonce });

      if (hash.substr(0, this.difficulty) === zeroesArray.join("")) {
        // she cracked the puzzle
        hashed = true;
        this.block.nonce = nonce;
      }

      // she was not able yet hot!
      nonce = (parseInt(nonce) + 1).toString();
    }
  }

  hash(data: any): string {
    const order = (object: any) => {
      return Object.keys(object)
        .sort()
        .reduce((obj: any, key: any) => {
          obj[key] = object[key];
          return obj;
        }, {});
    };

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(order(data)))
      .digest("hex");

    return hash;
  }

  getHash() {
    return this.hash(this.block);
  }
}

const block = new Block(
  {
    hello: "dragon",
  },
  "1",
  "abcd",
  6
);

block.mine();

console.log(block.block);

console.log(block.getHash());
