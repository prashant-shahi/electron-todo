const dgraph = require("dgraph-js-http");

function setSchema(dgraphClient) {
    const schema = `
        title: string @index(exact) .

        type Todo {
            title
        }
    `;
    return dgraphClient.alter({ schema: schema });

}

function queryTodo(dgraphClient) {
    const query = `query {
        all(func: type(Todo)) {
            uid
            title
        }
    }`;
    return dgraphClient.newTxn().query(query).then((res) => {
        const todos = res.data;
        // Print results.
        console.log(`All todos: ${todos.all.length}`);
        for (let i = 0; i < todos.all.length; i++) {
            console.log(todos.all[i]);
        }
        return todos.all;
    });
}

function mutateTodo(dgraphClient, mutationJson) {
    const txn = dgraphClient.newTxn();
    let response;
    let err;
    return txn.mutate(mutationJson).then((res) => {
        response = res;

        // Commit transaction.
        return txn.commit();
    }).then(() => {
        console.log("All todo (map from blank node names to uids):");
        console.log(response.data)
        for (let key in response.data.uids) {
            if (Object.hasOwnProperty(response.data.uids, key)) {
                console.log(`${key}: ${response.data.uids[key]}`);
            }
        }
        console.log();
    }).catch((e) => {
        err = e;
        console.error(e);
    }).then(() => {
        return txn.discard();
    }).then(() => {
        if (err != null) {
            throw err;
        }
    });
}

class DataStore extends dgraph.DgraphClient {
    constructor (settings) {
        const clientStub = new dgraph.DgraphClientStub(
            // addr: optional, default: "localhost:9080"
            settings.url,
        )
        super(clientStub)
        setSchema(this)
        .then(() => {
            console.log("\nSchema set!")
        }).catch((e) => {
            console.log("ERROR at setSchema: ", e)
        })

        queryTodo(this)
        .then((todos) => {
            this.todos = todos
        }).catch((e) => {
            console.log("ERROR at queryTodo: ", e)
        })
    }

    getTodo () {
        return queryTodo(this).then((todos) => {
            this.todos = todos
            return this
        }).catch((e) => {
            console.log("ERROR getTodo: ", e)
            return this
        })
    }

    addTodo(todo) {
        console.log(todo)
        const todoJson = {
            title: todo,
            "dgraph.type": "Todo",
        }
        return mutateTodo(this, {
            setJson: todoJson
        }).then(() => {
            this.todos = [...this.todos, todoJson]
            return this
        }).catch((e) => {
            console.log("ERROR addTodo: ", e)
            return this
        })
    }

    deleteTodo (todoID) {
        return mutateTodo(this, {
            deleteJson: {
                uid: todoID,
            }
        }).then((res) => {
            // filter out the target todo
            this.todos = this.todos.filter(t => t.uid !== todoID)
            return this
        }).catch((e) => {
            console.log("ERROR deleteTodo: ", e)
            return this
        })
    }
}

module.exports = DataStore
