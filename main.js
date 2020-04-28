'use strict'

const path = require('path')
const { app, ipcMain } = require('electron')

const Window = require('./Window')
const DataStore = require('./DataStore')

require('electron-reload')(__dirname)

// create a new todo store name "Todos Main"
const todosData = new DataStore({ url: 'http://localhost:8080' })

function main () {
  // todo list window
  let mainWindow = new Window({
    file: path.join('renderer', 'index.html')
  })

  // add todo window
  let addTodoWin

  // TODO: put these events into their own file

  // initialize with todos
  mainWindow.once('show', async () => {
    const todos = await todosData.todos;
    mainWindow.webContents.send('todos', todos)
  })

  // create add todo window
  ipcMain.on('add-todo-window', () => {
    // if addTodoWin does not already exist
    if (!addTodoWin) {
      // create a new add todo window
      addTodoWin = new Window({
        file: path.join('renderer', 'add.html'),
        width: 400,
        height: 400,
        // close with the main window
        parent: mainWindow
      })

      // cleanup
      addTodoWin.on('closed', () => {
        addTodoWin = null
      })
    }
  })

  // add-todo from add todo window
  ipcMain.on('add-todo', async (event, todo) => {
    await todosData.addTodo(todo)
    const updatedTodos = await todosData.getTodo()

    mainWindow.send('todos', updatedTodos.todos)
  })

  // delete-todo from todo list window
  ipcMain.on('delete-todo', async (event, todo) => {
    await todosData.deleteTodo(todo)
    const updatedTodos = await todosData.getTodo()

    mainWindow.send('todos', updatedTodos.todos)
  })
}

app.on('ready', main)

app.on('window-all-closed', function () {
  app.quit()
})
