const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const Web3 = require('web3');
const truffle_connect = require('./connection/app.js');
const bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use('/', express.static('public_static'));

const SHA256 = require('crypto-js/sha256');

/*
Blockchain Program
*/

class Transaction {
    constructor(index, fromAddress, toAddress, amount, journeyType, start, exit) {
        this.index = index;
        this.journeyType = journeyType,
            this.start = start,
            this.exit = exit,
            this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }
}

//Block class for our chain
class Block {
    constructor(timestamp, transactions, previousHash) {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    //Proof of Work
    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined: " + this.hash);
    }
}

//Chain class to store blocks
class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 3;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock() {
        return new Block(Date.now(), "Genesis block", "0", "0", "0", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    getBlock(index) {
        return this.chain[index];
    }

    getChain() {
        return this.chain;
    }

    minePendingTransactions(miningRewardAddress) {
        this.pendingTransactions.push(new Transaction(null, null, miningRewardAddress, this.miningReward, null, null, null));

        let block = new Block(Date.now(), this.pendingTransactions, this.chain[this.chain.length - 1].hash);
        block.mineBlock(this.difficulty);

        console.log('Block mined!');
        this.chain.push(block);

        this.pendingTransactions = [];
    }

    createTransaction(transaction) {
        this.pendingTransactions.push(transaction);
    }

    changeTransaction(index, value) {
        this.chain[index].transactions = value;
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }

                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }
        return balance;
    }

    isChainValid() {
        //scans all values 
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.log("current hash: " + currentBlock.hash + " current block calculated: " + currentBlock.calculateHash());
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                console.log("prev hash: " + currentBlock.previousHash + " prev block calculated: " + previousBlock.Hash);
                return false;
            }
        }

        return true;
    }
}


var index = 2;
var testCoin = new Blockchain();
testCoin.createTransaction(new Transaction(1, '-1', '0', 100, null, null, null));
testCoin.createTransaction(new Transaction(2, '-1', '1', 100, null, null, null));
testCoin.minePendingTransactions('miners-address');
testCoin.pendingtransactions = [];
console.log(testCoin.getChain());


app.post('/basics', function (request, response) {

    if (request.body.key === "getBalance") {
        var money = testCoin.getBalanceOfAddress(request.body.userID);
        console.log(money);
        response.json(money);
    }

    if (request.body.key === "bookTicket") {
        index++
        testCoin.createTransaction(new Transaction(index, request.body.userID, '-1', 10, "Tube", request.body.entryInput, request.body.exitInput));
        response.send("success");
        // console.log(testCoin.getLatestBlock());
    }

    if (request.body.key === "getExistingData") {
        var result = [];
        var date = [];

        for (var i = 1; i < testCoin.chain.length; i++) {
            for (var j = 0; j < testCoin.chain[i].transactions.length; j++) {
                if (testCoin.chain[i].transactions[j].fromAddress == request.body.userID) {
                    result.push(testCoin.chain[i].transactions[j]);
                    date.push(testCoin.chain[i].timestamp);
                    console.log(testCoin.chain[i].transactions[j]);
                    console.log(testCoin.chain[i].timestamp);
                }
            }
        }

        response.json(appendToDataTable(result, date));
    }

    if (request.body.key === "mineData") {
        testCoin.minePendingTransactions('miners-address');
        response.send("Success");
    }

    if (request.body.key === "checkData") {
        response.send(testCoin.isChainValid());
    }

    if (request.body.key === "edit") {
        //console.log("editing: " + request.body.ticketID);
        for (var i = 1; i < testCoin.chain.length; i++) {
            for (var j = 0; j < testCoin.chain[i].transactions.length; j++) {
                if (testCoin.chain[i].transactions[j].index == request.body.ticketID) {
                    console.log("found");
                    var result = {
                        journeyType: testCoin.chain[i].transactions[j].journeyType,
                        timestamp: testCoin.chain[i].timestamp,
                        start: testCoin.chain[i].transactions[j].start,
                        exit: testCoin.chain[i].transactions[j].exit,
                        amount: testCoin.chain[i].transactions[j].amount
                    }
                    console.log(result);
                    response.send(result);
                }
            }
        }
    }

    if(request.body.key === "save") { 
        for (var i = 1; i < testCoin.chain.length; i++) {
            for (var j = 0; j < testCoin.chain[i].transactions.length; j++) {
                if (testCoin.chain[i].transactions[j].index == request.body.ticketID) {
                    console.log("found");

                        testCoin.chain[i].transactions[j].journeyType = request.body.journeyType;
                        testCoin.chain[i].timestamp = parseInt(request.body.timestamp);
                        testCoin.chain[i].transactions[j].start = request.body.start;
                        testCoin.chain[i].transactions[j].exit = request.body.exit;
                        testCoin.chain[i].transactions[j].amount = parseInt(request.body.payment);
                    response.send("Success");
                }
            }
        }
    }

    function appendToDataTable(result) {
        for (var i = 0; i < result.length; i++) {
            var htmlresult;
            //appending html format
            htmlresult += '<tr id="row' + result[i].index + '"><td>' + result[i].index + '</td>';
            htmlresult += '<td id=journey' + result[i].index + '>' + result[i].journeyType + '</td>';
            htmlresult += '<td id=timestamp' + result[i].index + '>' + date[i] + '</td>';
            htmlresult += '<td id=startingStation' + result[i].index + '>' + result[i].start + '</td>';
            htmlresult += '<td id=exitStation' + result[i].index + '>' + result[i].exit + '</td>';
            htmlresult += '<td id=Payment' + result[i].index + '>' + result[i].amount + '</td>';
            htmlresult += '<td><input type="button" onclick="edit(' + result[i].index + ')" value="Edit" class="btn btn-primary btn-sm"></td>';
            htmlresult += '</tr>'
        }

        return htmlresult;
    }
});


app.get('/getAccounts', (req, response) => {
    console.log("**** GET /getAccounts ****");
    truffle_connect.start(function (answer) {
        response.send(answer);
    })


});

app.post('/getLastHash', (req, res) => {
    truffle_connect.getlastHash((hash) => {
        console.log(hash);
        res.send(hash);
    })
});

app.post('/getBalance', (req, res) => {
    console.log("**** GET /getBalance ****");
    console.log(req.body.account);
    let currentAcount = req.body.account;

    truffle_connect.refreshBalance(currentAcount, (answer) => {
        let account_balance = answer;
        truffle_connect.start(function (answer) {
            // get list of all accounts and send it along with the response
            let all_accounts = answer;
            response = [account_balance, all_accounts]
            res.send(response);
        });
    });
});

app.post('/sendCoin', (req, res) => {
    console.log("**** GET /sendCoin ****");
    console.log(req.body);

    let amount = req.body.amount;
    let sender = req.body.sender;
    let receiver = req.body.receiver;

    truffle_connect.sendCoin(amount, sender, receiver, (balance) => {
        res.send(balance);
    });

});

app.post('/sql', function (request, response) {
    console.log("got it from /sql");
    console.log(request.body);      // your JSON

    var mysql = require('mysql');

    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "210497",
        database: "smart rail ticketing"
    });

    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    });

    if (request.body.key === "getExistingData") {
        console.log(request.body.userID);
        var sql = mysql.format("SELECT * FROM journeys WHERE UserID = '" + request.body.userID + "' LIMIT " + request.body.start + ", " + request.body.limit);
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            //console.log(result);
            if (result.length > 0) {
                var htmlresult = "";
                htmlresult = appendToDataTable(result);
                response.json(htmlresult);
            } else {
                response.send("reachedMax");
            }
        });
    }

    if (request.body.key === "getUsers") {
        console.log(request.body.ID);
        var sql = mysql.format("SELECT * FROM users");
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            response.json(result);
        });
    }

    if (request.body.key === "enterBarrier") {
        //Check if last transaction is pending
        var sql = mysql.format("SELECT * FROM journeys WHERE UserID = '" + request.body.userID + "' ORDER BY TicketID DESC LIMIT 1");
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            if (result.length == 0 || result[0].Payment != "Pending") {
                //if last transaction isnt pending let the guy enter
                var sql2 = mysql.format("INSERT INTO journeys (UserID, JourneyType, StartDate, StartTime, StartingStation, Payment) VALUES (" + request.body.userID + ",'Tube', CURDATE(), CURTIME(), '" + request.body.entryInput + "', 'Pending')");
                con.query(sql2, function (err, result, fields) {
                    if (err) throw err;
                    //console.log(result);
                    console.log("Barrier entry added to sql");
                });

                //grab new result
                con.query(sql, function (err, result, fields) {
                    if (err) throw err;
                    //console.log(result);
                    var htmlresults = appendToDataTable(result);
                    response.send(htmlresults);
                });
            } else if (result[0].Payment == "Pending") {
                response.send("Transaction still pending");
            }

        });
    }

    if (request.body.key === "exitBarrier") {
        var sql = mysql.format("SELECT * FROM journeys WHERE UserID = '" + request.body.userID + "' ORDER BY TicketID DESC LIMIT 1");
        var sql2 = mysql.format("UPDATE journeys SET Payment = '5', EndDate = CURDATE(), EndTime = CURTIME(), ExitStation = '" + request.body.exitInput + "' WHERE UserID = '" + request.body.userID + "' AND Payment = 'Pending'")
        sql3 = mysql.format("UPDATE users SET Balance = " + request.body.money + "WHERE UserID = " + request.body.userID);
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            if (result.length != 0 && result[0].Payment == "Pending") {
                con.query(sql2, function (err, result, fields) {
                    console.log(result);
                    if (err) throw err;
                    con.query(sql3, function (err, result, fields) { });
                    con.query(sql, function (err, result, fields) {
                        var htmlresults = appendToDataTable(result);
                        response.send(htmlresults);
                    });
                });
            } else {
                response.send("You never entered an entry barrier");
            }
        });
    }

    if (request.body.key === "bookTicket") {

        var date = request.body.date.substring(0, 10);
        //Check if last transaction is pending
        var sql = mysql.format("SELECT * FROM journeys WHERE UserID = '" + request.body.userID + "' ORDER BY TicketID DESC LIMIT 1");
        var sql2 = mysql.format("INSERT INTO journeys (UserID, JourneyType, StartDate, StartTime, EndDate, EndTime, StartingStation, ExitStation, Payment) VALUES (" + request.body.userID + ",'Rail', '" + date + "', CURTIME(), '" + date + "', CURTIME()+20000, '" + request.body.entryInput + "', '" + request.body.exitInput + "', '10')");
        var sql3 = mysql.format("UPDATE users SET Balance = " + request.body.money + "WHERE UserID = " + request.body.userID);
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            if (result.length == 0 || result[0].Payment != "Pending") {
                //if last transaction isnt pending let the guy enter
                con.query(sql2, function (err, result, fields) {
                    if (err) throw err;
                    //console.log(result);
                    console.log("book entry added to sql");
                });

                //grab new result
                con.query(sql, function (err, result, fields) {
                    if (err) throw err;
                    //console.log(result);
                    con.query(sql3, function (err, result, fields) { });
                    var htmlresults = appendToDataTable(result);
                    response.send(htmlresults);
                });
            } else if (result[0].Payment == "Pending") {
                console.log(result);
                response.send("Transaction still pending");
            }
        });
    }

    if (request.body.key === "addMoney") {
        var sql = mysql.format("UPDATE users SET Balance = " + request.body.money + "WHERE UserID = " + request.body.userID);
        con.query(sql, function (err, result, fields) {
            console.log(result);
            if (err) throw err;
            response.send(result)
        });
    }

});

function dateConversion(date) {
    if (date === null) return null;
    var temp = date.toString();
    var temp1 = temp.split(" ")
    return temp1[2] + " " + temp1[1] + " " + temp1[3];
}

function appendToDataTable(result) {
    for (var i = 0; i < result.length; i++) {
        //nodejs issue of date conversion
        var startDate = dateConversion(result[i].StartDate);
        var endDate = dateConversion(result[i].EndDate);
        var htmlresult;
        //appending html format
        htmlresult += '<tr id="row' + result[i].TicketID + '"><td>' + result[i].TicketID + '</td>';
        htmlresult += '<td id=journey' + result[i].TicketID + '>' + result[i].JourneyType + '</td>';
        htmlresult += '<td id=startDate' + result[i].TicketID + '>' + startDate + '</td>';
        htmlresult += '<td id=startTime' + result[i].TicketID + '>' + result[i].StartTime + '</td>';
        htmlresult += '<td id=endDate' + result[i].TicketID + '>' + endDate + '</td>';
        htmlresult += '<td id=endTime' + result[i].TicketID + '>' + result[i].EndTime + '</td>';
        htmlresult += '<td id=startingStation' + result[i].TicketID + '>' + result[i].StartingStation + '</td>';
        htmlresult += '<td id=exitStation' + result[i].TicketID + '>' + result[i].ExitStation + '</td>';
        htmlresult += '<td id=Payment' + result[i].TicketID + '>' + result[i].Payment + '</td>';
        htmlresult += '</tr>'
    }

    return htmlresult;
}

app.post('/sql2', function (request, response) {
    console.log("got it from /sql2");
    console.log(request.body);      // your JSON

    var mysql = require('mysql');

    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "210497",
        database: "smart rail ticketing"
    });

    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    });

    if (request.body.key === "getExistingData") {
        var sql = mysql.format("SELECT * FROM journeysether WHERE Address = '" + request.body.userID + "' LIMIT " + request.body.start + ", " + request.body.limit);
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            if (result.length > 0) {
                var htmlresult = "";
                htmlresult = appendToDataTable(result);
                response.json(htmlresult);
            } else {
                response.send("reachedMax");
            }
        });
    }

    if (request.body.key === "enterBarrier") {
        //Check if last transaction is pending
        var sql = mysql.format("SELECT * FROM journeysether WHERE Address = '" + request.body.userID + "' ORDER BY TicketID DESC LIMIT 1");
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            if (result.length == 0 || result[0].Payment != "Pending") {
                //if last transaction isnt pending let the guy enter
                var sql2 = mysql.format("INSERT INTO journeysether (Address, JourneyType, Date, StartingStation, Payment) VALUES ('" + request.body.userID + "','Tube', CURDATE(), '" + request.body.entryInput + "', 'Pending')");
                con.query(sql2, function (err, result, fields) {
                    if (err) throw err;
                    //console.log(result);
                    console.log("Barrier entry added to sql2");
                });

                //grab new result
                con.query(sql, function (err, result, fields) {
                    if (err) throw err;
                    console.log(result);
                    var htmlresults = appendToDataTable(result);
                    response.send(htmlresults);
                });
            } else if (result[0].Payment == "Pending") {
                response.send("Transaction still pending");
            }

        });
    }

    if (request.body.key === "exitBarrier") {
        //get latesttx hash
        truffle_connect.getlastHash((hash) => {
            var sql = mysql.format("SELECT * FROM journeysether WHERE Address = '" + request.body.userID + "' ORDER BY TicketID DESC LIMIT 1");
            var sql2 = mysql.format("UPDATE journeysether SET TxHash = '" + hash + "', Payment = '5', Date = CURDATE(), ExitStation = '" + request.body.exitInput + "' WHERE Address = '" + request.body.userID + "' AND Payment = 'Pending'");
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                if (result.length != 0 && result[0].Payment == "Pending") {
                    con.query(sql2, function (err, result, fields) {
                        console.log(result);
                        if (err) throw err;
                        con.query(sql, function (err, result, fields) {
                            var htmlresults = appendToDataTable(result);
                            response.send(htmlresults);
                        });
                    });
                } else {
                    response.send("You never entered an entry barrier");
                }
            });
        });

    }

    if (request.body.key === "bookTicket") {
        truffle_connect.getlastHash((hash) => {
            var date = request.body.date.substring(0, 10);
            //Check if last transaction is pending
            var sql = mysql.format("SELECT * FROM journeysether WHERE Address = '" + request.body.userID + "' ORDER BY TicketID DESC LIMIT 1");
            var sql2 = mysql.format("INSERT INTO journeysether (Address, TxHash, JourneyType, Date, StartingStation, ExitStation, Payment) VALUES ('" + request.body.userID + "', '" + hash + "', 'Rail', '" + date + "', '" + request.body.entryInput + "', '" + request.body.exitInput + "', '10')");
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                console.log(result);
                if (result.length == 0 || result[0].Payment != "Pending") {
                    //if last transaction isnt pending let the guy enter
                    con.query(sql2, function (err, result, fields) {
                        if (err) throw err;
                        //console.log(result);
                        console.log("book entry added to sql");
                    });

                    //grab new result
                    con.query(sql, function (err, result, fields) {
                        if (err) throw err;
                        //console.log(result);
                        var htmlresults = appendToDataTable(result);
                        response.send(htmlresults);
                    });
                } else if (result[0].Payment == "Pending") {
                    console.log(result);
                    response.send("Transaction still pending");
                }
            });
        });
    }

    function dateConversion(date) {
        if (date === null) return null;
        var temp = date.toString();
        var temp1 = temp.split(" ")
        return temp1[2] + " " + temp1[1] + " " + temp1[3];
    }

    function appendToDataTable(result) {
        for (var i = 0; i < result.length; i++) {
            //nodejs issue of date conversion
            var date = dateConversion(result[i].Date);
            var htmlresult;
            //appending html format
            htmlresult += '<tr id="row' + result[i].TicketID + '"><td>' + result[i].TicketID + '</td>';
            htmlresult += '<td id=txHash' + result[i].TicketID + '>' + result[i].TxHash + '</td>';
            htmlresult += '<td id=journey' + result[i].TicketID + '>' + result[i].JourneyType + '</td>';
            htmlresult += '<td id=date' + result[i].TicketID + '>' + date + '</td>';
            htmlresult += '<td id=startingStation' + result[i].TicketID + '>' + result[i].StartingStation + '</td>';
            htmlresult += '<td id=exitStation' + result[i].TicketID + '>' + result[i].ExitStation + '</td>';
            htmlresult += '<td id=Payment' + result[i].TicketID + '>' + result[i].Payment + '</td>';
            htmlresult += '</tr>'
        }

        return htmlresult;
    }
});

app.listen(port, () => {

    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    truffle_connect.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));

    console.log("Express Listening at http://localhost:" + port);

});
