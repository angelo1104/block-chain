import { createHash } from "crypto";
import * as express from "express";

const app = express();

interface Block {
  index: number;
  timestamp: string;
  data: any;
  hash: string;
  prevHash: string;
  proof: number;
}

class Blockchain {
  public chain: Block[];

  constructor() {
    this.chain = [];
    this.createBlock(1, "0");
  }

  createBlock(proof: number, previousHash: string): Block {
    const block: Block = {
      index: this.chain.length + 1,
      timestamp: new Date().toString(),
      data: "hello",
      hash: "jp",
      prevHash: previousHash,
      proof: proof,
    };

    this.chain.push(block);

    return block;
  }

  getLastBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  proofOfWork(prevProof: number) {
    let newProof = 1;

    while (true) {
      const hashOperation = this.hash(
        ((newProof ^ 2) - (prevProof ^ 2)).toString()
      );

      if (hashOperation.substr(0, 3) === "0000") {
        return newProof;
      } else {
        newProof++;
      }
    }
  }

  hash(data: any) {
    const order = (object: any) => {
      return Object.keys(object)
        .sort()
        .reduce((obj: any, key: any) => {
          obj[key] = object[key];
          return obj;
        }, {});
    };

    const jsonData = JSON.stringify(order(data));

    return createHash("sha256").update(jsonData).digest("hex");
  }

  isChainValid() {
    this.chain.forEach((block, index) => {
      const previousBlock = this.chain[index - 1];

      if (block.prevHash !== this.hash(previousBlock)) return false;

      const hash = this.hash(
        ((block.proof ^ 2) - (previousBlock.proof ^ 2)).toString()
      );

      if (hash.substr(0, 3) !== "0000") return false;

      return true;
    });
  }
}

const blockChain = new Blockchain();
