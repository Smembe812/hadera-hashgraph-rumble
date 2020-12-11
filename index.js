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
    FileId,
    TopicCreateTransaction,
    TopicMessageQuery,
    TopicMessageSubmitTransaction
} = require("@hashgraph/sdk");

require("dotenv").config();

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
    const topicManager = await TopicManager({client})
    // const operator = 
    async function generateKeys(){
        const newAccountPrivateKey = PrivateKey.generate(); 
        // console.log(newAccountPrivateKey)
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
async function main(){
    const client = await makeConnection()

    const fileQuery = new FileContentsQuery()
     .setFileId(FileId.fromString("102"));

    //Sign with the operator private key and submit to a Hedera network
    const contents = await fileQuery.execute(client);

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
    console.groupEnd()
    
    
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
        message:"I will send some tokens"
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

main()