import { Blockchain } from './blockchain';
import { ContractControl } from './contract';
import { CryptoUtils, ZilliqaUtils } from './crypto';
import { HTTPProvider } from './provider';
import { FlutterStream } from './stream';
import { Subject } from './stream/subject';
import { TransactionFactory } from './transaction';
import { Wallet } from './wallet';

export class ZilPay {
  public utils = ZilliqaUtils;
  public crypto = CryptoUtils;

  public provider: HTTPProvider;
  public blockchain: Blockchain;
  public wallet: Wallet;
  public transactions: TransactionFactory;
  public contracts: ContractControl;

  constructor(stream: FlutterStream, subject: Subject) {
    this.provider = new HTTPProvider(stream, subject);
    this.wallet = new Wallet(stream, subject);

    this.blockchain = new Blockchain(this.provider, this.wallet);
    this.transactions = new TransactionFactory(this.provider, this.wallet);
    this.contracts = new ContractControl(this.transactions);
  }
}
