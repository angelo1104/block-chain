import crypto from "crypto";
import express from "express";

import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

interface BlockInterface {
  index: string;
  previousHash: string;
  nonce: string;
  timestamp: string;
  data: string;
}

interface Database {
  chain: BlockInterface[];
}

const adapter = new FileSync<Database>("db.json");

const db = low(adapter);

db.defaults({ chain: [] }).write();

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
      data: JSON.stringify(data),
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
        console.log("mined...");
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

  checkValidity(): boolean {
    const hash = this.getHash();
    const zeroesArray = [];

    for (let i = 0; i < this.difficulty; i++) {
      zeroesArray.push("0");
    }

    if (hash.substr(0, this.difficulty) === zeroesArray.join("0")) return true;

    return false;
  }

  proofOfWork(block: Block): string {
    // do all the complex logic here.
    return this.hash(block);
  }
}

class Blockchain {
  public chain: Block[];
  private readonly difficulty: number;

  constructor(difficulty: number) {
    this.chain = db
      .get("chain")
      .value()
      .map(
        (block: BlockInterface, index: number) =>
          new Block(
            block.data,
            index.toString(),
            block.previousHash,
            difficulty
          )
      );

    const zeroesArray = [];

    for (let i = 0; i < 64; i++) {
      zeroesArray.push("0");
    }

    if (!this.chain[0]) {
      const block = new Block(
        {
          hello: "dragon",
        },
        "0",
        zeroesArray.join(""),
        difficulty
      );

      this.createBlock(block);
    }

    this.difficulty = difficulty;
  }

  createBlock(block: Block): Block {
    block.mine();
    if (block.checkValidity()) {
      db.get("chain").push(block.block).write();
      this.chain.push(block);
    }
    return block;
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  getChain() {
    return this.chain.map((block) => {
      return {
        ...block.block,
        data: JSON.parse(block.block.data),
      };
    });
  }

  addBlock(data: any): Block {
    const block = new Block(
      JSON.stringify(data),
      (this.chain.length - 1).toString(),
      this.chain[this.chain.length - 1].getHash(),
      this.difficulty
    );

    return this.createBlock(block);
  }

  checkValid(): boolean {
    let valid = true;

    this.chain.forEach((block, index) => {
      if (index !== 0) {
        // this is not genesis block
        const previousBlock = this.chain[index - 1];

        if (previousBlock.getHash() !== block.block.previousHash) {
          valid = false;
        }
      }
    });

    return valid;
  }
}

const blockChain = new Blockchain(1);

const app = express();

app.use(express.json());

app.get("/mine", (req, res) => {
  const block: Block = blockChain.addBlock(req.body);
  res.json(block);
});

app.get("/chain", (req, res) => {
  res.json(blockChain.getChain());
});

app.get("/check-validity", (req, res) => {
  res.json({
    valid: blockChain.checkValid(),
  });
});

app.listen(3000, () => console.log("Server is up on http://localhost:3000"));
