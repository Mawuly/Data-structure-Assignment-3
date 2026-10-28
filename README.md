# Undo / Redo Editor: Stack Data Structure Demo

An animated web application that shows how a **stack (LIFO)** works, using the undo and redo feature of a text editor.

**Live demo:** `https://YOUR-USERNAME.github.io/stack-undo-redo-editor/`

## Features
- Every edit is pushed onto the undo stack
- Undo pops the top edit and pushes it onto the redo stack; Redo does the reverse
- A new edit empties the redo stack
- Peek shows the top of the stack without removing it
- Animated cards, live statistics, operation log, toasts, keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- Array-based stack with O(1) push, pop and peek

## Structure
```
stack-undo-redo-editor/
  index.html
  css/style.css
  js/stack.js   (Stack data structure)
  js/app.js     (editor and interface logic)
```

## Run locally
Open `index.html` in a browser.

## Deploy on GitHub Pages
1. Create a public repository named `stack-undo-redo-editor`.
2. Upload the contents of this folder (keep the `css` and `js` folders), then commit.
3. Go to **Settings > Pages**, choose branch `main` and folder `/ (root)`, then **Save**.
4. After about a minute the site is live at the URL above.
