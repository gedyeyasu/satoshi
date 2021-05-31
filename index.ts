import * as crypto from 'crypto';

 
class Transaction {
    constructor(
    public amount: number,
    public payer: string, //public key
    public payee: string, //public key
    ){}

    toString(){
        return JSON.stringify(this);
    }
}

class Block {

    public nonce = Math.round(Math.random() * 9999999999)

    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now() 
    ){}

    get hash(){
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

class Chain {

    public static instance = new Chain();

    chain: Block[];

    constructor() {
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    mine(nonce: number){
        let solution = 1;
        console.log(' ... mining crypto ....')

        while(true){

            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if(attempt.substr(0,4) === '0000'){
                console.log(`solved: ${solution}`);
                return solution;
            }

            solution += 1;
        }
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer){
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if(isValid){

            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.chain.push(newBlock)
        }
    }
}

class Wallet {

    public publickey: string;
    public privatekey: string;

    constructor(){
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem'},
            privateKeyEncoding: { type: 'pkcs8', format: 'pem'},
        });

        this.privatekey = keypair.privateKey;
        this.publickey = keypair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publickey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privatekey);
        Chain.instance.addBlock(transaction, this.publickey, signature);

    }


}


/// Example usage

const satoshi = new Wallet();
const gedeon = new Wallet();
const alice = new Wallet();

satoshi.sendMoney(50, gedeon.publickey);
gedeon.sendMoney(23, alice.publickey);
alice.sendMoney(5, gedeon.publickey);

console.log(Chain.instance)