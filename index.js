const { 
    Client, 
    PrivateKey,
    AccountCreateTransaction,
    TokenCreateTransaction,
    TokenAssociateTransaction,
    TokenGrantKycTransaction,
    AccountBalanceQuery,
    AccountDeleteTransaction,
    TransferTransaction,
    AccountInfoQuery,
    Hbar,
    TokenInfoQuery,
    TransactionId,
    AccountId,
    TokenDeleteTransaction,
    TokenWipeTransaction,
    FileContentsQuery,
    FileCreateTransaction,
    FileId,
    TopicCreateTransaction,
    TopicMessageQuery,
    TopicMessageSubmitTransaction,
    ContractCreateTransaction,
    ContractFunctionParameters,
    ContractCallQuery,
    ContractExecuteTransaction
} = require("@hashgraph/sdk");
const Web3 = require("web3")
const BigNumber = require('bignumber.js');

// console.log(Web3.utils)

const solidityTypes = {
    STRING: "String",
    STRING_ARRAY: "StringArray", 
    BYTES: "Bytes",
    BYTES32:"Bytes32",
    BYTES_ARRAY: "BytesArray",
    BYTES32_ARRAY: "Bytes32Array",
    BOOL:"Bool",
    INT8: "Int8",
    INT32:"Int32",
    INT64: "Int64",
    INT256:"Int256",
    INT8_ARRAY:"Int8Array",
    INT32_ARRAY: "Int32Array",
    INT64_ARRAY:"Int64Array",
    INT256_ARRAY:"Int256Array",
    UINT8: "Uint8",
    UINT32:"Uint32",
    UINT64:"Uint64",
    UINT256:"Uint256",
    UINT8_ARRAY:"Uint8Array",
    UINT32_ARRAY:"Uint32Array",
    UINT64_ARRAY:"Uint64Array",
    UINT256_ARRAY:"Uint256Array",
    ADDRESS:"Address",
    ADDRESS_ARRAY: "AddressArray"
}

require("dotenv").config();

const storageJSON = {
	"generatedSources": [],
	"linkReferences": {},
	"object": "608060405234801561001057600080fd5b5060ac8061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460375780636057361d14604f575b600080fd5b603d606b565b60408051918252519081900360200190f35b606960048036036020811015606357600080fd5b50356071565b005b60005490565b60005556fea264697066735822122061f7ec339554b6b242211198b11f2698c04d3d1f5bb9b777d7f5edb8e90b985164736f6c63430007050033",
	"opcodes": "PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0xAC DUP1 PUSH2 0x1F PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH1 0xF JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x4 CALLDATASIZE LT PUSH1 0x32 JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x2E64CEC1 EQ PUSH1 0x37 JUMPI DUP1 PUSH4 0x6057361D EQ PUSH1 0x4F JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x3D PUSH1 0x6B JUMP JUMPDEST PUSH1 0x40 DUP1 MLOAD SWAP2 DUP3 MSTORE MLOAD SWAP1 DUP2 SWAP1 SUB PUSH1 0x20 ADD SWAP1 RETURN JUMPDEST PUSH1 0x69 PUSH1 0x4 DUP1 CALLDATASIZE SUB PUSH1 0x20 DUP2 LT ISZERO PUSH1 0x63 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP CALLDATALOAD PUSH1 0x71 JUMP JUMPDEST STOP JUMPDEST PUSH1 0x0 SLOAD SWAP1 JUMP JUMPDEST PUSH1 0x0 SSTORE JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 PUSH2 0xF7EC CALLER SWAP6 SLOAD 0xB6 0xB2 TIMESTAMP 0x21 GT SWAP9 0xB1 0x1F 0x26 SWAP9 0xC0 0x4D RETURNDATASIZE 0x1F JUMPDEST 0xB9 0xB7 PUSH24 0xD7F5EDB8E90B985164736F6C634300070500330000000000 ",
	"sourceMap": "134:439:0:-:0;;;;;;;;;;;;;;;;;;;"
}
const storageObject = storageJSON.object

//TODO: anyone can be client for a given transaction
// allow key pair arguments for client initiation
async function makeConnection() {
    //Grab your Hedera testnet account ID and private key from your .env file
    const operatorAccount = process.env.HADERA_ACCOUNT_ID;
    const operatorPrivateKey = process.env.HADERA_PRIVATE_KEY;
    // If we weren't able to grab it, we should throw a new error
    if (operatorAccount == null ||
        operatorPrivateKey == null ) {
        throw new Error("Environment variables operatorAccount and operatorPrivateKey must be present");
    }
    const client = Client.forTestnet();
    client.setOperator(operatorAccount, operatorPrivateKey);
    return await client
}

function Account({publicKey, privateKey, accountID, tokenManager }){
    this.publicKey = publicKey
    this.accountID = accountID
    this.tokens;
    this.associatedToken;
    const _privateKey = privateKey;
    const _tokenManager = tokenManager

    this.sendTokens = sendTokens.bind(this)
    this.associateToken = associateToken.bind(this)
    this.grantKYC = grantKYC.bind(this)
    this.linkToken = linkToken.bind(this)
    this.wipe = wipe.bind(this)
    this.balance = balance.bind(this)
    async function associateToken({nodeID, tokenID}){
        this.associatedToken = await _tokenManager.associateAccount({
            nodeID,
            accountID: this.accountID,
            tokenID,
            singer: _privateKey
        })
        return this
    }
    async function sendTokens({to, amount, tokenID}){
        await _tokenManager.transfer({
            from: this.accountID, 
            to,
            amount,
            signer: _privateKey,
            tokenID
        })
        return this
    }
    async function grantKYC({nodeID, tokenID}){
        await _tokenManager.grantKYC({
            nodeID, 
            accountID: this.accountID, 
            tokenID
        })
        return this
    }
    async function linkToken({nodeID, tokenID}){
        await (
            await this.associateToken({nodeID,tokenID})
        ).grantKYC({nodeID,tokenID})
        console.log(`account ${this.accountID} linked to token ${tokenID}`)
        return this
    }
    async function wipe({nodeID, tokenID, amount}){
        await _tokenManager.wipe({
            nodeID, 
            accountID:this.accountID, 
            tokenID, 
            amount
        })
        return this
    }
    async function balance({tokenID}){
        const {balance} = await _tokenManager.balance({
            accountID: this.accountID,
            tokenID
        })
        this.tokens = balance
        return this
    }
    function deleteAccount(){}
}

async function AccountManager({client}){
    const tokenManager = await TokenManager({client})
    const topicManager = await TopicManager({client}) //TODO: use topic manager for pub/sub to events
    async function generateKeys(){
        const newAccountPrivateKey = PrivateKey.generate(); 
        const newAccountPublicKey = newAccountPrivateKey.publicKey;
        return Promise.resolve({
            publicKey: newAccountPublicKey,
            privateKey: newAccountPrivateKey
        })
    }
    async function getAccountInfo(accountID){
        try {
            const query = await new AccountInfoQuery()
                .setAccountId(accountID)
                .setQueryPayment(new Hbar(1))
                .execute(client);
            return query
        } catch (error) {
            console.error(error)
        }
    }
    async function checkBalance(accountID){
        try {
            const accountBalance = await new AccountBalanceQuery()
                .setAccountId(accountID)
                .execute(client);
            console.log("The new account balance is: " +accountBalance.hbars +" tinybar.");
            return Promise.resolve(accountBalance)
        } catch (error) {
            console.error(
                "AccountManager >",
                "checkBalance >",
                error
            )
        }
    }
    async function createAccount(){
        //Create a new account with 1,000 tinybar starting balance
        const {privateKey, publicKey } = await generateKeys()
        const creationTransaction = await new AccountCreateTransaction()
            .setInitialBalance(new Hbar(10))
            .setKey(publicKey)
            .execute(client);
        const getReceipt = await creationTransaction.getReceipt(client);
        const newAccountId = getReceipt.accountId;
        console.log("The new account ID is: " +newAccountId);
        return Promise.resolve({
            accountID: newAccountId, 
            privateKey, 
            publicKey,
            creationTransaction
        })
    }
    async function deleteAccount(account, sendTo=null){
        //Create the transaction to delete an account
        sendTo = !sendTo ? client.operatorAccountId : sendTo
        const {accountID, privateKey, publicKey} = account
        const nodeIDs = client._network.nodes.map(({accountId}) => accountId)
        const transaction = await new AccountDeleteTransaction()
                .setAccountId(accountID)
                .setTransferAccountId(client.operatorAccountId)
                .freezeWith(client)
                .sign(privateKey)
        try {
            const receipt = await transaction.execute(client);
            console.log("account deleted in this transaction is " + accountID)
            return receipt.getReceipt(client)
        } catch (error) {
            console.error(error)
        }
    }
    async function transferTokens({tokenID, from, to, amount, signer}){
        try {
            await tokenManager.transfer({ 
                from,
                to,
                amount,
                tokenID,
                signer
            })
        }
        catch(e){
            console.log(e)
            return Promise.reject(new Error('Something Wrong',e))
        }
    }   
    return {
        checkBalance,
        createAccount,
        deleteAccount,
        transferTokens,
        getAccountInfo
    }
}
async function TokenManager({client}){
    const nodeIDs = client._network.nodes.map(({accountId}) => accountId)
    async function balance({
        accountID,
        tokenID
    }){
        try {
            const query = new AccountBalanceQuery()
                .setAccountId(accountID);
            const tokenBalance = await query.execute(client);
            const tokens =JSON.parse(tokenBalance.tokens)[tokenID]
            console.log(`The token balance(s) for the account ${accountID}:  ${tokens}`);
            return Promise.resolve({balance: Number(tokens)})
        } catch (error) {
            return Promise.reject(error)
        }     
    }
    async function createToken({
        name,
        symbol,
        initialSupply
    }){
        try {
            const transaction = await new TokenCreateTransaction()
                .setNodeAccountIds(nodeIDs)
                .setTokenName(name)
                .setTokenSymbol(symbol)
                .setDecimals(3)
                .setInitialSupply(initialSupply)
                .setTreasuryAccountId(client.operatorAccountId)
                .setAdminKey(client.operatorPublicKey)
                .setFreezeKey(client.operatorPublicKey)
                .setWipeKey(client.operatorPublicKey)
                .setKycKey(client.operatorPublicKey)
                .setSupplyKey(client.operatorPublicKey)
                .setFreezeDefault(false)
                .setMaxTransactionFee(new Hbar(100))
                .execute(client);
            const tokenId = (await transaction.getReceipt(client)).tokenId;
            console.log("The new token ID is " +tokenId);
            return Promise.resolve({
                tokenId,
                transaction
            })
        } catch (error) {
            console.log(error)
        }
    }
    async function associateAccount({nodeID, accountID, tokenID, singer}){
        try {
            const receipt = await (await (await new TokenAssociateTransaction()
                        .setNodeAccountIds([nodeID])
                        .setAccountId(accountID)
                        .setTokenIds([tokenID])
                        .freezeWith(client)
                        .sign(singer)
                    )
                    .execute(client)
            )
            .getReceipt(client);
            console.log(`Associated account ${accountID} with token ${tokenID}`);
            return Promise.resolve(receipt)
        }
        catch(e){
            return Promise.reject(e)
        }
    }
    async function grantKYC({nodeID, accountID, tokenID}){
        try {
            const receipt = await (await new TokenGrantKycTransaction()
            .setNodeAccountIds([nodeID])
            .setAccountId(accountID)
            .setTokenId(tokenID)
            .execute(client))
            .getReceipt(client);
            console.log(`Granted KYC for account ${accountID} on token ${tokenID}`);
            return Promise.resolve(receipt)
        } catch (error) {
            Promise.reject(error)
        }
    }
    async function wipe({nodeID, accountID, tokenID, amount}){
        try {
            const receipt = await (await new TokenWipeTransaction()
                .setNodeAccountIds([nodeID])
                .setTokenId(tokenID)
                .setAccountId(accountID)
                .setAmount(Math.abs(amount))
                .execute(client))
                .getReceipt(client);
            console.log(`Wiped balance of account ${accountID}`);
            return Promise.resolve(receipt)
        } catch (error) {
            return Promise.reject(error)
        }
    }
    async function deleteToken({tokenID}){
        try {
            const receipt = await (await new TokenDeleteTransaction()
                .setNodeAccountIds(nodeIDs)
                .setTokenId(tokenID)
                .execute(client))
                .getReceipt(client);
    
            console.log(`Deleted token ${tokenID}`);
            return Promise.resolve(receipt)
        } catch (error) {
            return Promise.reject(error)
        }
    }
    async function transfer({from, to, amount, tokenID, signer}){
        try {
            const nodeIDs = client._network.nodes.map(({accountId}) => accountId)
            let transaction = await new TransferTransaction()
                // .setNodeAccountIds(nodeIDs)
                    .addTokenTransfer(tokenID, from, -Math.abs(amount))
                    .addTokenTransfer(tokenID, to.accountID, Math.abs(amount))
                    .freezeWith(client)
            if(signer){
                transaction = await transaction.sign(signer)
            }
            const receipt =  await (await transaction.execute(client))
                .getReceipt(client);
            console.log(`Sent ${Math.abs(amount)} tokens from account ${from} to account ${to.accountID} on token ${tokenID}`);
            return Promise.resolve(receipt)
        }
        catch(e){
            console.warn(e)
            return Promise.reject(new Error('Something Wrong',e))
        }
    }
    return {
        associateAccount,
        wipe,
        grantKYC,
        create: createToken,
        delete: deleteToken,
        transfer,
        balance
    }
}
async function TopicManager({client}){
    const nodeIDs = client._network.nodes.map(({accountId}) => accountId)
    async function createTopic({accounts=null}){
        const [_adminKey, _submitKey] = await Promise.all(
            [PrivateKey.generate(), PrivateKey.generate()]
        )
        const query = await new TopicCreateTransaction()
            .setAdminKey(_adminKey)
            .setSubmitKey(_submitKey)
            .freezeWith(client)
            .sign(_adminKey)
        const createResponse = await query.execute(client);
        const createReceipt = await createResponse.getReceipt(client);
        console.log(`topic id = ${createReceipt.topicId}`);
        return {
            ...createReceipt, 
            submitKey: _submitKey,
            adminKey: _adminKey
        }
    }
    async function sendMessage({message, topicID, submitKey}){
        const query = await new TopicMessageSubmitTransaction({
                topicId: topicID,
                message,
            })
            .freezeWith(client)
            .sign(submitKey)
        const sendResponse = await query.execute(client);
        const sendReceipt = await sendResponse.getReceipt(client);    
        console.log(`topic sequence number = ${sendReceipt.topicSequenceNumber}`);
        return sendReceipt
    }
    async function subscribe({topicId}){
        return new TopicMessageQuery()
            .setTopicId(topicId)
            .setStartTime(0)
            .subscribe(
                client,
                (message) => {
                    // send notifications here
                    console.log(
                        Buffer.from(message.contents, "utf8").toString()
                    )
                }
            );
    }
    return {
        createTopic,
        sendMessage,
        subscribe
    }
}
async function SmartContractManager({client}){
    async function createSmartContract({bytecodeFileId, adminKey}){
        //Create the transaction
        const transaction = new ContractCreateTransaction()
        .setGas(500)
        .setBytecodeFileId(bytecodeFileId)
        // .setAdminKey(adminKey);
        //Modify the default max transaction fee (1 hbar)
        const modifyTransactionFee = transaction.setMaxTransactionFee(new Hbar(16));
        //Sign the transaction with the client operator key and submit to a Hedera network
        const txResponse = await modifyTransactionFee.execute(client);
        //Get the receipt of the transaction
        const receipt = await txResponse.getReceipt(client);
        //Get the new contract ID
        const newContractId = receipt.contractId;
        console.log("The new contract ID is " +newContractId);
        return Promise.resolve(receipt)
    }
    async function query({contractId, func, params}){
        //Contract call query
        const query = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(600)
        // .setMaxQueryPayment(new Hbar(100))
        if(!params){
            query.setFunction(func)
        }else{
            params = !params ? null : await new ContractFunctionParameters()
                .addUint256(new BigNumber(12))
            // console.log(params)
            query.setFunction(func, params);
        }
        const contractFunctionResult = await query.execute(client);
        // console.log(contractFunctionResult)
        // console.log((await contractFunctionResult.getRecord(client)).contractFunctionResult.gasUsed.toString())
        console.log(Buffer.from(contractFunctionResult.bytes, "utf8").toString());
        return contractFunctionResult
    }

    //execute({contractID, func, params:[{value, type}]})
    async function execute({contractID, func, params=null, gas}){
        const _transaction = new ContractExecuteTransaction()
            .setContractId(contractID)
            .setGas(gas)
        if (!params || params.length < 1){
            _transaction.setFunction(func)
        }
        else{
            const _params = await _addParams(params)
            _transaction.setFunction(func, _params)
        }
        const contractFunctionResult = await _transaction.execute(client);
        console.log((await contractFunctionResult.getRecord(client)).contractFunctionResult.gasUsed.toString())
        // console.log(Buffer.from(contractFunctionResult.bytes, "utf8").toString());
        return contractFunctionResult
    }

    async function _addParams(_params){
        const params = new ContractFunctionParameters()
        for (_param of _params){
            switch(_param.type){
                case solidityTypes.STRING: params.addString(_param.value); break;
                case solidityTypes.STRING_ARRAY: params.addStringArray(_param.value); break;
                case solidityTypes.BYTES: params.addBytes(_param.value); break;
                case solidityTypes.BYTES32: params.addBytes32(_param.value); break;
                case solidityTypes.BYTES_ARRAY: params.addBytesArray(_param.value); break;
                case solidityTypes.BYTES32_ARRAY: params.addBytes32Array(_param.value); break;
                case solidityTypes.BOOL: params.addBool(_param.value); break;
                case solidityTypes.INT8: params.addInt8(_param.value); break;
                case solidityTypes.INT32: params.addInt32(_param.value); break;
                case solidityTypes.INT64: params.addInt64(_param.value); break;
                case solidityTypes.INT256: params.addInt256(_param.value); break;
                case solidityTypes.INT8_ARRAY: params.addInt8Array(_param.value); break;
                case solidityTypes.INT32_ARRAY: params.addInt32Array(_param.value); break;
                case solidityTypes.INT64_ARRAY: params.addInt64Array(_param.value); break;
                case solidityTypes.INT256_ARRAY: params.addInt256Array(_param.value); break;
                case solidityTypes.UINT8: params.addUint8(_param.value); break;
                case solidityTypes.UINT32: params.addUint32(_param.value); break;
                case solidityTypes.UINT64: params.addUint64(_param.value); break;
                case solidityTypes.UINT256: params.addUint256(_param.value); break;
                case solidityTypes.UINT8_ARRAY: params.addUint8Array(_param.value); break;
                case solidityTypes.UINT32_ARRAY: params.addUint32Array(_param.value); break;
                case solidityTypes.UINT64_ARRAY: params.addUint64Array(_param.value); break;
                case solidityTypes.UINT256_ARRAY: params.addUint256Array(_param.value); break;
                case solidityTypes.ADDRESS: params.addAddress(_param.value); break; 
                case solidityTypes.ADDRESS_ARRAY: params.addAddressArray(_param.value); break;
                default: throw new Error("parameter type not provided");
            }
        }
        return params
    }
    return {createSmartContract, query, execute}
}
async function main(){
    const client = await makeConnection()
    const fileKey = await PrivateKey.generate()
    const fileTransaction = new FileCreateTransaction()
        .setKeys([fileKey.publicKey]) //A different key than the client operator key
        .setContents(storageObject)
        .setMaxTransactionFee(new Hbar(20))
        .freezeWith(client);
    //Sign with the file private key
    const signTx = await fileTransaction.sign(fileKey);
    //Sign with the client operator private key and submit to a Hedera network
    const submitTx = await fileTransaction.execute(client);
    //Request the receipt
    const receipt = await submitTx.getReceipt(client);
    //Get the file ID
    const newFileId = receipt.fileId;
    console.log("The new file ID is: " + newFileId);
    // console.log(contents.toString())
    // console.clear()
    //initiate managers
    console.warn("Client initiates managers")
    console.group()
    const [accountManager, tokenManager, topicManager] = await Promise.all([
        AccountManager({client}),
        TokenManager({client}),
        TopicManager({client})
    ])
    const smartContractManager = await SmartContractManager({client})
    console.groupEnd()
    
    const {contractId} = await smartContractManager.createSmartContract({bytecodeFileId:newFileId})
    // await smartContractManager.query({contractId,func:"store",params: {name:12}})
    await smartContractManager.execute({
        contractID: contractId,
        func:"store",
        gas:600,
        params: [{value:12, type: solidityTypes.UINT256}]
    })
    await smartContractManager.query({contractId, func:"retrieve", params: null})
    //get main account balance and info
    console.warn("AccountManager checks treasury account's balance and info")
    console.group()
    const [balance, info] = await Promise.all([
        accountManager.checkBalance(client.operatorAccountId),
        accountManager.getAccountInfo(client.operatorAccountId)
    ])
    console.groupEnd()

    //create accounts
    console.warn("AccountManager creates accounts")
    console.group()
    const [account1, account2] = await Promise.all([
        (await accountManager.createAccount()), 
        (await accountManager.createAccount())
    ])
    const account = new Account({...account1, tokenManager})
    console.groupEnd()

    const topic = await topicManager.createTopic({})
    // console.log(topic)

    await topicManager.subscribe({topicId: topic.topicId})
    await topicManager.sendMessage({
        topicID: topic.topicId,
        submitKey: topic.submitKey,
        message:JSON.stringify({say:"I will send some tokens"})
    })
    
    // create a token
    console.warn("TokenManager creates token")
    console.group()
    const {transaction:resp, tokenId} = await tokenManager.create({
        name:"Pablo", 
        symbol:"P", 
        initialSupply:1000
    })

    // token balance of main account
    await tokenManager.balance({
        accountID:client.operatorAccountId,
        tokenID: tokenId
    })
    console.groupEnd()

    //associate accounts with token
    console.warn("Link accounts token")
    console.group()
    console.warn("Account instance does the job")
    console.group()
    await account.linkToken({nodeID: resp.nodeId, tokenID:tokenId})
    console.groupEnd()
    
    console.log("TokenManger does the job")
    console.group()
    await tokenManager.associateAccount({
        nodeID: resp.nodeId, 
        accountID: account2.accountID, 
        tokenID: tokenId,
        singer: account2.privateKey
    })
    await tokenManager.grantKYC({
        nodeID: resp.nodeId, 
        accountID: account2.accountID, 
        tokenID: tokenId, 
    })
    console.groupEnd()
    console.groupEnd()
        
    console.warn("Transfer some tokens")
    //transfer tokens using tokenManager
    console.group()
    await tokenManager.transfer({ 
        from: client.operatorAccountId,
        to: account1, 
        amount: 7, 
        tokenID: tokenId
    })

    //trasnfer token using account instance then (chaining) check balance
    await (
        await ( 
            await account.sendTokens({
                to: account2,
                amount: Number(4),
                tokenID: tokenId
            })
        ).sendTokens({
            to: {accountID: client.operatorAccountId},
            amount: Number(2),
            tokenID: tokenId
        })
    ).balance({tokenID:tokenId})
    
    console.log("check balance")
    console.group()
    // transfer tokens using accountManager
    const token = await accountManager.transferTokens({
        from: client.operatorAccountId, 
        to:account2,
        amount:7,
        tokenID: tokenId
    })
    
    //check balance with token manager
    await tokenManager.balance({
        accountID:client.operatorAccountId,
        tokenID: tokenId
    })
    const {balance:tokens} = await tokenManager.balance({
        
        accountID:account2.accountID,
        tokenID: tokenId
    })
    console.groupEnd()
    console.groupEnd()
    // wipe tokens using Account() instance
    await account.wipe({
        nodeID: resp.nodeId,
        tokenID: tokenId,
        amount: Number(account.tokens)
    })
    // wipe tokens using tokenManager
    await tokenManager.wipe({
        nodeID: resp.nodeId, 
        accountID: account2.accountID, 
        tokenID: tokenId,
        amount: Number(tokens)
    })

    // tokenManager checks balance even more
    await Promise.all([
        tokenManager.balance({
            accountID:client.operatorAccountId,
            tokenID: tokenId
        }),
        tokenManager.balance({
            accountID:account2.accountID,
            tokenID: tokenId
        })
    ])

    // TokenManager deletes token
    await tokenManager.delete({
        tokenID:tokenId
    })

    // AccountManager Deletes accounts
    await Promise.all([
        accountManager.deleteAccount(account1),
        accountManager.deleteAccount(account2)
    ])
}

// main()

function Person(name, age){
    this.setName = setName.bind(this)
    this.setAge = setAge.bind(this)
    this.setName(name)
    this.setAge(age)
    function setName(name) {
        this.name = name
        return this
    }
    function setAge(age) {
        this.age = age
        return this
    }
}

function Car(name, owner){
    this.setName = setName.bind(this)
    this.setOwner = setOwner.bind(this)
    this.info = info.bind(this)
    
    this.setName(name)
    this.setOwner(owner)
    
    function setName(name) {
        this.name = name
        return this
    }
    function setOwner(owner) {
        this.owner = owner
        return this
    }
    function info(){
        const {age, name} = this.owner
        return {
            car: this.name,
            owner: {
                age, name
            }
        }
    }
}

const PubSub = {
    events: {},
    subscribe: function(evName, fn) {
        console.log(`PUBSUB: someone just subscribed to know about ${evName}`);
        //add an event with a name as new or to existing list
        this.events[evName] = this.events[evName] || [];
        this.events[evName].push(fn);
        console.log(this.e)
    },
    unsubscribe: function(evName, fn) {
        console.log(`PUBSUB: someone just UNsubscribed from ${evName}`);
        //remove an event function by name
        if (this.events[evName]) {
            this.events[evName] = this.events[evName].filter(f => f !== fn);
        }
    },
    publish: function(evName, data) {
        console.log(`PUBSUB: Making an broadcast about ${evName} with ${JSON.stringify(data)}`);
        //emit|publish|announce the event to anyone who is subscribed
        if (this.events[evName]) {
        this.events[evName].forEach(f => {
            f(data);
        });
    }
  }
}

PubSub.subscribe("OwnerUpdate", owner => console.log(owner))
const client = new Person("Paul", 24)
const car = new Car("Tesk", client)

console.log(client, car)

client.setAge(23)
PubSub.publish("OwnerUpdate", client)

console.log(car.info())